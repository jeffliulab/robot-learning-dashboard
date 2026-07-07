#!/usr/bin/env python3
"""export_run.py — 把一次训练 run 的 TensorBoard 曲线导出成 dashboard 可读的 JS 数据文件。

用法（在 isaaclab conda 环境里跑，需要 tensorboard 库）:
    python scripts/export_run.py <run_dir> <key> [-o OUT_ROOT]

    <run_dir>  RSL-RL 的 run 目录，例如:
               /home/jeff/IsaacLab/logs/rsl_rl/cartpole/2026-07-06_08-00-00
    <key>      dashboard 里的数据键，"任务/实验" 形式，例如: locomotion/hello-cartpole
    -o         输出根目录，默认 = 本仓库的 data/（按 key 自动分子目录）

产物: data/<task>/<exp>-<run_ts>.js —— 内容是把曲线挂到全局:
    window.RL_RUNS["<key>"] = { run_id, experiment, source, config, series:{tag:{steps,values}} }
页面用 <script src> 加载它（不是 fetch JSON），这样 file:// 离线双击也能渲染。

设计约束（项目红线）:
  - tag 不写死: 事件文件里有什么 scalar 就导什么。
  - 配置元信息从 run 目录的 params/agent.yaml、params/env.yaml 里摘，不手填。
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def find_event_file(run_dir: Path) -> Path:
    events = sorted(run_dir.glob("events.out.tfevents.*"))
    if not events:
        sys.exit(f"[export_run] 在 {run_dir} 下没找到 events.out.tfevents.* 文件")
    if len(events) > 1:
        print(f"[export_run] 注意: 有 {len(events)} 个事件文件，取最新的 {events[-1].name}")
    return events[-1]


def read_scalars(event_file: Path) -> dict:
    """读事件文件里全部 scalar tag 的完整序列。"""
    from tensorboard.backend.event_processing import event_accumulator

    ea = event_accumulator.EventAccumulator(str(event_file), size_guidance={"scalars": 0})
    ea.Reload()
    series = {}
    for tag in ea.Tags().get("scalars", []):
        pts = ea.Scalars(tag)
        series[tag] = {
            "steps": [p.step for p in pts],
            "values": [round(float(p.value), 6) for p in pts],
        }
    if not series:
        sys.exit("[export_run] 事件文件里没有任何 scalar")
    return series


def read_config(run_dir: Path) -> dict:
    """从 params/agent.yaml + env.yaml 摘关键配置（缺文件则跳过，不造数）。"""
    import yaml

    cfg = {}
    agent_f = run_dir / "params" / "agent.yaml"
    env_f = run_dir / "params" / "env.yaml"
    if agent_f.exists():
        agent = yaml.safe_load(agent_f.read_text()) or {}
        for k in ("seed", "max_iterations", "num_steps_per_env", "experiment_name"):
            if k in agent:
                cfg[k] = agent[k]
        pol = agent.get("policy") or {}
        for k in ("actor_hidden_dims", "critic_hidden_dims", "activation", "init_noise_std"):
            if k in pol:
                cfg[f"policy.{k}"] = pol[k]
        alg = agent.get("algorithm") or {}
        for k in ("learning_rate", "schedule", "gamma", "lam", "clip_param",
                  "entropy_coef", "num_learning_epochs", "num_mini_batches", "desired_kl"):
            if k in alg:
                cfg[f"algo.{k}"] = alg[k]
    if env_f.exists():
        # env.yaml 里常有 !!python/tuple 等自定义标签，safe_load 读不了。
        # 用"未知标签一律当普通节点"的宽容 loader 兜底；再失败就跳过（不造数）。
        class _Tolerant(yaml.SafeLoader):
            pass

        _Tolerant.add_multi_constructor("", lambda loader, suffix, node: (
            loader.construct_sequence(node) if isinstance(node, yaml.SequenceNode)
            else loader.construct_mapping(node) if isinstance(node, yaml.MappingNode)
            else loader.construct_scalar(node)))
        try:
            env = yaml.load(env_f.read_text(), Loader=_Tolerant) or {}
            scene = env.get("scene") or {}
            if "num_envs" in scene:
                cfg["num_envs"] = scene["num_envs"]
            for k in ("decimation", "episode_length_s"):
                if k in env:
                    cfg[k] = env[k]
        except yaml.YAMLError as e:
            print(f"[export_run] 警告: env.yaml 解析失败，跳过其配置摘取（{e.__class__.__name__}）")
    return cfg


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("run_dir", type=Path, help="RSL-RL run 目录（含 events 文件与 params/）")
    ap.add_argument("key", help='数据键，"任务/实验" 形式，如 locomotion/hello-cartpole')
    ap.add_argument("-o", "--out-root", type=Path, default=REPO_ROOT / "data",
                    help="输出根目录（默认: 仓库 data/）")
    args = ap.parse_args()

    run_dir = args.run_dir.resolve()
    if not run_dir.is_dir():
        sys.exit(f"[export_run] run 目录不存在: {run_dir}")
    if "/" not in args.key:
        sys.exit('[export_run] key 需为 "任务/实验" 形式，例如 locomotion/hello-cartpole')

    task, exp = args.key.split("/", 1)
    event_file = find_event_file(run_dir)
    series = read_scalars(event_file)
    config = read_config(run_dir)

    payload = {
        "run_id": run_dir.name,
        "experiment": exp,
        "source": "tensorboard",
        "config": config,
        "series": series,
    }
    out_dir = args.out_root / task
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{exp}-{run_dir.name}.js"
    js = ("// 由 scripts/export_run.py 生成 · 源: " + str(event_file) + "\n"
          "window.RL_RUNS = window.RL_RUNS || {};\n"
          f"window.RL_RUNS[{json.dumps(args.key)}] = " + json.dumps(payload, ensure_ascii=False) + ";\n")
    out_file.write_text(js, encoding="utf-8")

    n_pts = max(len(s["steps"]) for s in series.values())
    print(f"[export_run] OK → {out_file}")
    print(f"  tags={len(series)}  points≤{n_pts}  config_keys={len(config)}")
    for t in sorted(series):
        print(f"    - {t} ({len(series[t]['steps'])})")


if __name__ == "__main__":
    main()
