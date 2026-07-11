# AGENTS：开放实验内容仓

本仓是 Robot Learning Dashboard 的内容与静态站代码仓。受支持的开发入口是父仓 `PRIVATE_jeffliulab` 工作区；不要单独打开或 clone 本仓后撰写报告，因为创作规范保存在父仓。

## 创作入口

写或改实验报告前，从父仓读取 `../../../STANDARD.md`，按实验报告链路依次阅读通用规范、`STANDARDS/实验报告/实验报告模板.md`，涉及机器人关节图时再读专项指南。本仓不再保存规范副本。

## 报告数据流

- `content/views.js`：报告正文，注册到 `window.RL_CONTENT["task/id"]`。
- `data/manifest.js`：任务树与实验元数据的唯一事实源。
- `data/**/*.js`：由真实 run 通过 `scripts/export_run.py` 或 `export_compare.py` 导出。
- `assets/`：媒体、图表和运行时工具；网络结构图使用 `assets/net-diagram.js`。
- `scripts/check_report.js`：章节、图表、媒体、运行时注册与 SVG 文字碰撞检查。

新增报告时保持正文 key、manifest ID、数据路径与媒体路径一致，完成后运行 `node scripts/check_report.js` 并人工核对引用语义。

## 本地预览（2026-07-11 定）

实验报告的本地测试**一律走主站开发服务器**：在父仓 `PRIVATE_jeffliulab` 工作区跑 `npm run dev`（端口 **4321 是 jeffliulab.com 本地服务器的专属端口**），访问 `http://localhost:4321/robot-learning-dashboard` 验收主站内嵌效果（静态资源经 `public/experiments-app` 符号链接直达本仓工作副本，改文件即生效）。⛔ **不要用本仓单独起 http 服务来做测试**（`file://` 直开 index.html 只可作快速自查，验收以主站内嵌为准）。

## Git 边界

本仓单独提交，只 stage 本次实验文件；父仓随后提交 gitlink。`main` 同时影响主站与 GitHub Pages，未经用户授权不要 push。
