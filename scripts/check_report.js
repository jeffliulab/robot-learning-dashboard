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
 *   9. 手绘 SVG 文字遮挡：估算每个 <text> 的包围盒，检查 ①不超出 viewBox
 *      ②不与 circle/rect 局部相交（完全落在形状内=有意的内嵌标签，放行）
 *      ③不压住 path 笔画上的采样点。刻意画在形状里且启发式判不了的文字加
 *      data-in 属性可跳过。规则来源见《实验报告模板.md》「手绘 SVG 排版纪律」。
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

/* ---------- [8] SVG 文字遮挡检查的估宽/间距常量 ----------
 * 浏览器不在场，文字宽度只能按字符类别估算（与模板「手绘 SVG 排版纪律」同一套口径）：
 * 一个汉字/全角符号 ≈ 1 个字号宽；拉丁字母/数字 ≈ 0.58 字号（sans 平均值）；
 * 上下标类小字符 ≈ 0.45；空格 ≈ 0.32。竖向按 0.78 升部 / 0.22 降部。
 * CLEARANCE 是"判相撞"的最小间隙：估算有误差，取 4px 只抓真压上去的深度重叠，
 * 不把擦边排版当错误（模板对人的要求是留 20px，机器线放宽到 4px 防误报）。 */
const SVG_TXT = {
  CJK_RATIO: 1.0,
  LATIN_RATIO: 0.58,
  SMALL_RATIO: 0.45,   // 上下标：ᵢ ₓ ᵧ ⁰-⁹ ₀-₉ ′ 等
  SPACE_RATIO: 0.32,
  ASCENT: 0.78,
  DESCENT: 0.22,
  CLEARANCE: 4,
  FONT: { lb: 13, sb: 12, DEFAULT: 12 },  // 对应 app.css 的 .lb / .sb 字号
};

/* ---------- [8] 的几何工具 ---------- */
function estTextWidth(str, fs_) {
  let w = 0;
  for (const ch of str) {
    if (/[⺀-鿿　-〿豈-﫿＀-￯]/.test(ch)) w += fs_ * SVG_TXT.CJK_RATIO;
    else if (/[⁰-₟ᵢ-ᶿ′ʰ-˿]/.test(ch)) w += fs_ * SVG_TXT.SMALL_RATIO;
    else if (ch === " ") w += fs_ * SVG_TXT.SPACE_RATIO;
    else w += fs_ * SVG_TXT.LATIN_RATIO;
  }
  return w;
}
function textBBox(t) {
  const w = estTextWidth(t.str, t.fs);
  const x0 = t.anchor === "middle" ? t.x - w / 2 : t.anchor === "end" ? t.x - w : t.x;
  return { x0, x1: x0 + w, y0: t.y - t.fs * SVG_TXT.ASCENT, y1: t.y + t.fs * SVG_TXT.DESCENT };
}
function bboxExpand(b, m) { return { x0: b.x0 - m, x1: b.x1 + m, y0: b.y0 - m, y1: b.y1 + m }; }
function rectsOverlap(a, b) { return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1; }
function bboxInsideRect(b, r) { return b.x0 >= r.x0 && b.x1 <= r.x1 && b.y0 >= r.y0 && b.y1 <= r.y1; }
function bboxInsideCircle(b, c) {
  return [[b.x0, b.y0], [b.x1, b.y0], [b.x0, b.y1], [b.x1, b.y1]]
    .every(p => Math.hypot(p[0] - c.cx, p[1] - c.cy) <= c.r);
}
function circleHitsBBox(c, b) {
  const nx = Math.max(b.x0, Math.min(c.cx, b.x1));
  const ny = Math.max(b.y0, Math.min(c.cy, b.y1));
  return Math.hypot(c.cx - nx, c.cy - ny) < c.r;
}
/* 解析 path d（绝对命令 M/L/H/V/C/A），输出笔画采样点；A 只取端点（弧腹不采，防误报） */
function samplePathPoints(d) {
  const pts = [];
  const tokens = d.match(/[MLHVCA]|-?\d*\.?\d+/gi) || [];
  let i = 0, cx = 0, cy = 0;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === "M" || cmd === "L") {
      while (i < tokens.length && !/[A-Za-z]/.test(tokens[i])) {
        const px = cx, py = cy; cx = num(); cy = num();
        if (cmd === "L") pts.push([(px + cx) / 2, (py + cy) / 2]);
        pts.push([cx, cy]);
      }
    } else if (cmd === "H") { while (i < tokens.length && !/[A-Za-z]/.test(tokens[i])) { const px = cx; cx = num(); pts.push([(px + cx) / 2, cy], [cx, cy]); } }
    else if (cmd === "V") { while (i < tokens.length && !/[A-Za-z]/.test(tokens[i])) { const py = cy; cy = num(); pts.push([cx, (py + cy) / 2], [cx, cy]); } }
    else if (cmd === "C") {
      while (i < tokens.length && !/[A-Za-z]/.test(tokens[i])) {
        const x0 = cx, y0 = cy, x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
        for (const t of [0.25, 0.5, 0.75, 1]) {
          const u = 1 - t;
          pts.push([u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
                    u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3]);
        }
        cx = x3; cy = y3;
      }
    } else if (cmd === "A") { while (i < tokens.length && !/[A-Za-z]/.test(tokens[i])) { num(); num(); num(); num(); num(); cx = num(); cy = num(); pts.push([cx, cy]); } }
  }
  return pts;
}
function attrOf(attrs, name) { const m = attrs.match(new RegExp(name + '="([^"]*)"')); return m ? m[1] : null; }
/* 对一段渲染后的 HTML 里所有手绘 SVG 做文字遮挡检查，返回问题清单 */
function svgTextCollisions(html) {
  const problems = [];
  const svgRe = /<svg([^>]*)>([\s\S]*?)<\/svg>/g;
  let sm;
  while ((sm = svgRe.exec(html)) !== null) {
    const [_, svgAttrs, rawBody] = sm;
    if (/class="[^"]*\bnet\b/.test(svgAttrs)) continue;                 // RLNet 架构图有自己的排版引擎
    const vb = (attrOf(svgAttrs, "viewBox") || "").split(/\s+/).map(Number);
    if (vb.length !== 4) continue;
    const label = attrOf(svgAttrs, "aria-label") || "(无 aria-label)";
    const body = rawBody.replace(/<defs>[\s\S]*?<\/defs>/g, "");
    /* 收集障碍物 */
    const circles = [...body.matchAll(/<circle([^>]*)>/g)].map(m => ({
      cx: +attrOf(m[1], "cx"), cy: +attrOf(m[1], "cy"), r: +attrOf(m[1], "r"),
    }));
    const rects = [...body.matchAll(/<rect([^>]*)\/?>/g)].map(m => {
      const x = +attrOf(m[1], "x"), y = +attrOf(m[1], "y");
      return { x0: x, y0: y, x1: x + +attrOf(m[1], "width"), y1: y + +attrOf(m[1], "height") };
    });
    const pathPts = [];
    for (const m of body.matchAll(/<path([^>]*)\/?>/g)) {
      const cls = attrOf(m[1], "class") || "";
      if (/\beg\b/.test(cls)) continue;                                 // eg=指向文字的引线，天然贴着文字
      const sw = (m[1].match(/stroke-width:\s*([\d.]+)/) || [, "1.6"])[1];
      const d = attrOf(m[1], "d");
      if (d) samplePathPoints(d).forEach(p => pathPts.push({ x: p[0], y: p[1], sw: +sw }));
    }
    /* 逐条文字检查 */
    for (const m of body.matchAll(/<text([^>]*)>([\s\S]*?)<\/text>/g)) {
      const attrs = m[1];
      if (/\bdata-in\b/.test(attrs)) continue;                          // 显式声明"有意画在形状里"
      const str = m[2].replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      const cls = attrOf(attrs, "class") || "";
      const fs_ = /\blb\b/.test(cls) ? SVG_TXT.FONT.lb : /\bsb\b/.test(cls) ? SVG_TXT.FONT.sb : SVG_TXT.FONT.DEFAULT;
      const t = { x: +attrOf(attrs, "x"), y: +attrOf(attrs, "y"), anchor: attrOf(attrs, "text-anchor") || "start", fs: fs_, str };
      const bb = textBBox(t);
      const short = str.length > 14 ? str.slice(0, 14) + "…" : str;
      if (bb.x0 < vb[0] || bb.x1 > vb[0] + vb[2] || bb.y0 < vb[1] || bb.y1 > vb[1] + vb[3])
        problems.push(`「${label}」文字"${short}"估算越出 viewBox（x ${bb.x0.toFixed(0)}–${bb.x1.toFixed(0)} / 画布宽 ${vb[2]}）`);
      for (const c of circles) {
        if (bboxInsideCircle(bb, c)) continue;
        if (circleHitsBBox({ ...c, r: c.r + SVG_TXT.CLEARANCE }, bb))
          problems.push(`「${label}」文字"${short}"压到圆形 (${c.cx},${c.cy},r${c.r})`);
      }
      for (const r of rects) {
        if (bboxInsideRect(bb, r)) continue;
        if (rectsOverlap(bboxExpand(bb, SVG_TXT.CLEARANCE), r))
          problems.push(`「${label}」文字"${short}"压到矩形 (${r.x0},${r.y0})–(${r.x1},${r.y1})`);
      }
      for (const p of pathPts) {
        const eb = bboxExpand(bb, SVG_TXT.CLEARANCE + p.sw / 2);
        if (p.x > eb.x0 && p.x < eb.x1 && p.y > eb.y0 && p.y < eb.y1) {
          problems.push(`「${label}」文字"${short}"压到笔画（采样点 ${p.x.toFixed(0)},${p.y.toFixed(0)}）`);
          break;
        }
      }
    }
  }
  return problems;
}

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
let runtimeContent = null;   // key → 渲染后的 HTML（[8] 的 SVG 检查要用求值后的图，不能用含 ${...} 的原文）
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
  runtimeContent = ctx.window.RL_CONTENT;
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

  console.log("[8] 手绘 SVG 文字遮挡");
  if (runtimeContent && runtimeContent[key]) {
    const svgProblems = svgTextCollisions(runtimeContent[key]);
    if (svgProblems.length) svgProblems.forEach(p => fail(p));
    else ok("SVG 文字未压住图形，且均在画布内");
  } else {
    fail("拿不到运行时渲染结果，SVG 检查未执行");
  }
}

console.log(fails ? `\n共 ${fails} 处问题` : "\n全部通过");
process.exit(fails ? 1 : 0);
