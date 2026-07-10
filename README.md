# Robot Learning Dashboard

**A structured training record for robot-learning experiments — every network, observation,
action, reward term, hyperparameter and curve, laid out in full.**

![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-WIP-orange)

Live: **https://jeffliulab.github.io/robot-learning-dashboard**

This is a **records-and-showcase** site, not a tutorial. Each experiment page documents *exactly*
how a policy was trained — down to the activation function — and plots its training curves. It
complements the narrative devlogs at [`anima-devlogs`](https://github.com/jeffliulab/anima-devlogs)
(which tell the *story*); here we keep the *data*.

## How it is organized

Two axes, kept separate:

- **Navigation (what) — Task → Experiment.** Top level is the *task* (Locomotion, Fall Recovery,
  Dance, Manipulation, Loco-Manipulation). Under a task sit its *experiments* (individual training
  runs / ablations).
- **Attribute (how) — technical route.** Each experiment carries a *route* tag: RL / transfer /
  distillation / imitation / supervised-BC-VLA. Explained on the *Technical Routes* page.

The inclusion rule is simple: **anything with a training curve belongs here** — reinforcement
learning, imitation / motion-tracking, supervised behavior cloning, teacher-student distillation.
Pure model-based control (no training) and pure motion playback are out.

## What's inside

| Path | What |
|---|---|
| `index.html` | Landing page — task cards |
| `pages/` | task pages, experiment logs, and the two notes pages |
| `assets/` | `app.css` / `app.js` (site), `charts.js` (plotly), vendored `plotly.min.js` |
| `data/` | `manifest.js` (the task→experiment tree) + per-experiment curve data (`*.js`) |
| `scripts/export_run.py` | offline: read a run's TensorBoard events → generate a curve-data `.js` |

## Offline-first

Open `index.html` directly in a browser (`file://`) — it works with no network. All third-party
code (plotly) is vendored locally; there are no CDN links. Curve data is emitted as `.js` files
that assign to a global (not `.json` fetched at runtime) precisely so local file access is not
blocked by the browser.

## Adding an experiment

1. Read `AGENTS.md` and the parent repository template at `../../STANDARDS/实验报告/实验报告模板.md`.
2. Train (Isaac Lab / RSL-RL, etc.) so the run lands in `logs/rsl_rl/<exp>/<timestamp>/`.
3. Run `python scripts/export_run.py <run_dir> <task>/<experiment-id>` to write `data/<task>/<id>.js`.
4. Register the experiment in `data/manifest.js`.
5. Add the report body to `content/views.js` under the matching `window.RL_CONTENT["<task>/<id>"]` key.
6. Run `node scripts/check_report.js` and inspect the report in the parent site.

## License

[MIT](LICENSE) © 2026 Jeff Liu
