# Robot Learning Dashboard Changelog

Robot Learning Dashboard 版本记录。**要点：保持简洁，每版只说重点。**（格式参考 [Keep a Changelog](https://keepachangelog.com)）

## [0.2] — 2026.7.7

Main: 第二篇实验报告「Ant 四足行走实验」，首次全模板覆盖——含 3 条件 × 3 种子共 9 个真实训练 run 的消融实验。
Features:

1. Ant 实验（Isaac-Ant-v0 + PPO，60 维观测 / 8 维力矩，1.31 亿步/run）：完整报告 + 真实回放（镜头跟随）+ 60 秒耐力行走。
2. 消融实验落地：能耗惩罚（去除后走得快 51% 但摔倒率翻倍）与熵正则（+30% 回报、摔倒率持平）两组对照，结论全部来自实测统计（种子间 mean±std）。
3. 数据管线扩展：`scripts/export_compare.py` 多 run 对比导出 + `[data-rl-compare]` 多曲线叠加渲染（同条件同色、种子分线型）。
4. 机制沉淀：SVG 图组件参数化（交互回路/层块网络图配置驱动）、`check_report.js` 按报告块独立校验。

## [0.1] — 2026.7.6

Main: 立起强化学习/机器人学习训练记录展示站（robot-learning-dashboard），作为 locomotion 项目记录纪律的「展示层」。
Features:

1. 定形态：任务为一级、实验为其下；技术路线（RL/迁移/蒸馏/模仿/BC-VLA）做实验标签；收录判据=有训练曲线。
2. 任务地图：五个顶级任务（Locomotion / Fall Recovery / Dance / Manipulation / Loco-Manipulation），Locomotion 有内容页、其余留白；Locomotion 内含后续环节 roadmap（地形/楼梯·Sim2Sim·师生蒸馏·导航）。
3. 全新前端：零构建手写静态站，dashboard 视觉，plotly 本地 vendored，离线可开。
4. 数据管线：离线读本地 TensorBoard events 导出为 JS 喂 plotly。
5. 首条实验「Cartpole 平衡实验」：完整学术报告结构（背景/理论/实验框架/结果/分析/局限/结论/附录），网络/观测/动作/奖励/超参逐项 + 真实曲线 + 真实回放视频（含 60 秒耐力测试）。
6. 报告规范沉淀为《实验报告模板.md》（章节骨架/图表编号引用/术语定名/语域规范），配 `scripts/check_report.js` 一致性校验。
