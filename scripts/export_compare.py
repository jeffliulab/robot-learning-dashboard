#!/usr/bin/env python3
"""export_compare.py — 把多个 run 的同一条曲线导出成消融/对比数据文件。

用法（在 isaaclab conda 环境里跑）:
    python scripts/export_compare.py <key> \\
        --run 标签:组名:run_dir [--run 标签:组名:run_dir ...] \\
        [--tag Train/mean_reward] [--tail 100] [-o OUT_ROOT]

    <key>    dashboard 数据键（"任务/实验" 形式），如 locomotion/ant-walk
    --run    一次一个 run：`标签:组名:目录`。组名用于同组配色（如 baseline / no-energy / entropy），
             标签是图例文字（如 baseline·s42）。
    --tag    对比的 scalar tag，默认 Train/mean_reward
    --tail   末段统计窗口（迭代数），默认 100

产物: data/<task>/<exp>-compare.js —— 挂到全局:
    window.RL_COMPARE["<key>"] = { tag, tail, runs:[{label, group, run_id,
        steps, values, tail_mean, tail_std}], groups:[{name, mean, std, n}] }
groups 的 mean/std = 该组各 run 的末段均值 的 组间均值±标准差（种子间方差，ddof=1）。

红线: 全部数字算自真实事件文件；缺文件直接报错退出，不造数。
"""
from __future__ import annotations

import argparse
import json
import statistics
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def read_tag(run_dir: Path, tag: str) -> tuple[list[int], list[float]]:
    from tensorboard.backend.event_processing import event_accumulator

    events = sorted(run_dir.glob("events.out.tfevents.*"))
    if not events:
        sys.exit(f"[export_compare] {run_dir} 下没有事件文件")
    ea = event_accumulator.EventAccumulator(str(events[-1]), size_guidance={"scalars": 0})
    ea.Reload()
    if tag not in ea.Tags().get("scalars", []):
        sys.exit(f"[export_compare] {run_dir.name} 缺少 tag {tag}")
    pts = ea.Scalars(tag)
    return [p.step for p in pts], [round(float(p.value), 6) for p in pts]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("key", help='数据键，"任务/实验" 形式')
    ap.add_argument("--run", action="append", required=True,
                    metavar="LABEL:GROUP:DIR", help="标签:组名:run目录，可多次")
    ap.add_argument("--tag", default="Train/mean_reward")
    ap.add_argument("--tail", type=int, default=100)
    ap.add_argument("-o", "--out-root", type=Path, default=REPO_ROOT / "data")
    args = ap.parse_args()

    task, exp = args.key.split("/", 1)
    runs = []
    for spec in args.run:
        try:
            label, group, d = spec.split(":", 2)
        except ValueError:
            sys.exit(f"[export_compare] --run 需为 标签:组名:目录 形式，收到: {spec}")
        run_dir = Path(d).resolve()
        if not run_dir.is_dir():
            sys.exit(f"[export_compare] run 目录不存在: {run_dir}")
        steps, values = read_tag(run_dir, args.tag)
        tail = values[-args.tail:] if len(values) >= args.tail else values
        runs.append({
            "label": label, "group": group, "run_id": run_dir.name,
            "steps": steps, "values": values,
            "tail_mean": round(statistics.fmean(tail), 4),
            "tail_std": round(statistics.stdev(tail), 4) if len(tail) > 1 else 0.0,
        })

    groups = []
    for g in dict.fromkeys(r["group"] for r in runs):  # 保持出现顺序
        means = [r["tail_mean"] for r in runs if r["group"] == g]
        groups.append({
            "name": g, "n": len(means),
            "mean": round(statistics.fmean(means), 4),
            "std": round(statistics.stdev(means), 4) if len(means) > 1 else 0.0,
        })

    payload = {"tag": args.tag, "tail": args.tail, "runs": runs, "groups": groups}
    out_dir = args.out_root / task
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{exp}-compare.js"
    js = ("// 由 scripts/export_compare.py 生成 · tag=" + args.tag + "\n"
          "window.RL_COMPARE = window.RL_COMPARE || {};\n"
          f"window.RL_COMPARE[{json.dumps(args.key)}] = " + json.dumps(payload, ensure_ascii=False) + ";\n")
    out_file.write_text(js, encoding="utf-8")

    print(f"[export_compare] OK → {out_file}")
    for g in groups:
        print(f"  组 {g['name']}: n={g['n']}  末段均值 {g['mean']} ± {g['std']}（种子间, ddof=1）")
    for r in runs:
        print(f"    - {r['label']} ({r['group']}) {r['run_id']}: tail {r['tail_mean']} ± {r['tail_std']}")


if __name__ == "__main__":
    main()
