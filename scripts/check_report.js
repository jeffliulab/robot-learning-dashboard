#!/usr/bin/env node
/* ============================================================================
 * check_report.js — 实验报告一致性校验（每轮精修后跑一次）
 *   用法: node scripts/check_report.js
 * 按内容块（window.RL_CONTENT["..."] = `...`）逐块独立校验：
 *   1. 块内 h2 的 hnum 序列连续（1..N；无 hnum 的 h2 = 附录，跳过）
 *   2. h3.section-sub 的 hnum 形如 P.k，P 为其所属 h2 的号、k 从 1 连续递增
 *   3. 每个"第 X 节 / 第 X.Y 节"引用的号存在于本块 hnum 集合
 *      （工具只能查"号是否存在"，重排轮次务必人工过一遍打印出的引用清单——
 *        旧号在新结构下仍合法但语义指错，脚本抓不出来）
 *   4. 图 N 编号连续、各有 figcaption；除豁免名单外正文引用 ≥ 1 次
 *   5. 表 N（<caption>）编号连续；除豁免名单外正文引用 ≥ 1 次
 *   6. img/video/source/poster 指向的本地媒体文件真实存在
 *   7. 运行时执行 views.js，确保内容块能注册到 window.RL_CONTENT
 *   8. 高维机器人报告必须有图 3 控制量示意，且标出控制量记号
 * ==========================================================================*/
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = path.join(__dirname, "..", "content", "views.js");
const full = fs.readFileSync(SRC, "utf8");
/* 豁免"正文至少引用一次"的编号：页头元素（读者开篇即见，无需内联引用） */
const REF_EXEMPT_FIG = [1];
const REF_EXEMPT_TBL = [1];
const ROOT = path.join(__dirname, "..");

let fails = 0;
const fail = (msg) => { fails++; console.error("  ✘ " + msg); };
const ok = (msg) => console.log("  ✔ " + msg);

/* ---------- 切分内容块：window.RL_CONTENT["key"] = `...`; ---------- */
const blocks = [];
const blockRe = /window\.RL_CONTENT\["([^"]+)"\]\s*=\s*`([\s\S]*?)`;/g;
let bm;
while ((bm = blockRe.exec(full)) !== null) blocks.push({ key: bm[1], text: bm[2] });
if (!blocks.length) { console.error("未找到任何内容块"); process.exit(1); }

console.log("===== 运行时加载检查 =====");
try {
  const ctx = { window: {}, console };
  ctx.window.RL_CONTENT = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "assets", "net-diagram.js"), "utf8"), ctx, { filename: "assets/net-diagram.js" });
  ctx.RLNet = ctx.window.RLNet;
  vm.runInContext(full, ctx, { filename: "content/views.js" });
  const runtimeKeys = new Set(Object.keys(ctx.window.RL_CONTENT || {}));
  const missing = blocks.map(b => b.key).filter(k => !runtimeKeys.has(k));
  if (missing.length) fail(`运行时缺少内容块: ${missing.join(", ")}`);
  else ok(`运行时注册 ${runtimeKeys.size} 个内容块`);
} catch (e) {
  fail(`views.js 运行时加载失败: ${e && e.message ? e.message : e}`);
}

for (const { key, text } of blocks) {
  console.log(`\n===== 内容块 ${key} =====`);

  const h2nums = [...text.matchAll(/<h2 class="section-title"><span class="hnum">([\d.]+)<\/span>/g)].map(m => m[1]);
  const h3nums = [...text.matchAll(/<h3 class="section-sub"><span class="hnum">([\d.]+)<\/span>/g)].map(m => m[1]);
  const allNums = new Set([...h2nums, ...h3nums]);

  console.log("[1] h2 编号连续性");
  const expected = h2nums.map((_, i) => String(i + 1));
  if (JSON.stringify(h2nums) === JSON.stringify(expected)) ok(`h2 = ${h2nums.join(", ")}`);
  else fail(`h2 序列 ${h2nums.join(",")} ≠ 期望 ${expected.join(",")}`);

  console.log("[2] h3 子节编号");
  const byParent = {};
  h3nums.forEach(n => {
    const [p, k] = n.split(".");
    (byParent[p] = byParent[p] || []).push(Number(k));
  });
  for (const p of Object.keys(byParent)) {
    const ks = byParent[p];
    const exp = ks.map((_, i) => i + 1);
    if (!h2nums.includes(p)) fail(`子节 ${p}.x 的父章 ${p} 不存在`);
    else if (JSON.stringify(ks) === JSON.stringify(exp)) ok(`${p}.1–${p}.${ks.length} 连续`);
    else fail(`${p}.x 序列 ${ks.join(",")} 不连续`);
  }

  console.log("[3] 章节交叉引用（号存在性 + 人工核对清单）");
  const refs = [...text.matchAll(/第 ([\d.]+) 节/g)].map(m => m[1]);
  const badRefs = refs.filter(r => !allNums.has(r));
  if (badRefs.length) fail(`引用了不存在的节号: ${[...new Set(badRefs)].join(", ")}`);
  else ok(`全部 ${refs.length} 处引用的节号均存在`);
  console.log("     引用清单(人工核对语义): " + [...new Set(refs)].sort().join(" / "));

  console.log("[4] 图编号");
  const figCaps = [...text.matchAll(/<figcaption>图 (\d+) ·/g)].map(m => Number(m[1]));
  const figSorted = [...figCaps].sort((a, b) => a - b);
  if (JSON.stringify(figSorted) !== JSON.stringify(figSorted.map((_, i) => i + 1))) fail(`figcaption 图号 ${figCaps.join(",")} 不连续`);
  else ok(`图 1–${figCaps.length} 题注齐全`);
  figCaps.forEach(n => {
    if (REF_EXEMPT_FIG.includes(n)) return;
    const re = new RegExp(`(如图 ${n}[^0-9]|见图 ${n}[^0-9]|图 ${n} 所示|图 ${n} 展示)`);
    if (!re.test(text)) fail(`图 ${n} 未在正文中被引用`);
  });

  console.log("[5] 表编号");
  const tblCaps = [...text.matchAll(/<caption>表 (\d+) ·/g)].map(m => Number(m[1]));
  const tblSorted = [...tblCaps].sort((a, b) => a - b);
  if (JSON.stringify(tblSorted) !== JSON.stringify(tblSorted.map((_, i) => i + 1))) fail(`表号 ${tblCaps.join(",")} 不连续`);
  else ok(`表 1–${tblCaps.length} 题注齐全`);
  tblCaps.forEach(n => {
    if (REF_EXEMPT_TBL.includes(n)) return;
    const re = new RegExp(`(见表 ${n}[^0-9]|表 ${n} 所示|表 ${n}：)`);
    if (!re.test(text)) fail(`表 ${n} 未在正文中被引用`);
  });

  console.log("[6] 本地媒体文件");
  const mediaRefs = [...text.matchAll(/(?:src|poster)="([^"]+)"/g)]
    .map(m => m[1])
    .filter(u => !/^https?:\/\//.test(u) && !/^data:/.test(u) && !u.startsWith("#"));
  const uniqueMedia = [...new Set(mediaRefs)];
  const missingMedia = uniqueMedia.filter(u => !fs.existsSync(path.join(ROOT, u)));
  if (missingMedia.length) fail(`缺失媒体文件: ${missingMedia.join(", ")}`);
  else ok(uniqueMedia.length ? `${uniqueMedia.length} 个本地媒体引用均存在` : "无本地媒体引用");

  console.log("[7] 模板专项：控制量示意");
  if (["locomotion/ant-walk", "locomotion/g1-flat"].includes(key)) {
    if (!/<figcaption>图 3 · [^<]*控制量示意/.test(text)) fail("高维机器人报告缺少图 3 · 控制量示意");
    else if (key === "locomotion/ant-walk" && !/τ/.test(text)) fail("Ant 控制量示意缺少力矩记号 τ");
    else if (key === "locomotion/g1-flat" && !/(q\*|qᵢ\*)/.test(text)) fail("G1 控制量示意缺少关节位置目标记号 q* / qᵢ*");
    else ok("控制量示意满足模板专项检查");
  } else {
    ok("低维控制图可并入被控对象示意图");
  }
}

console.log(fails ? `\n共 ${fails} 处问题` : "\n全部通过");
process.exit(fails ? 1 : 0);
