/* ============================================================================
 * charts.js — 读 window.RL_RUNS[key]，用 vendored plotly 渲染训练曲线。
 *   缩放稳定方案：每个图格子给固定高度(overflow hidden)，plotly 按格子实际
 *   宽高绘制（responsive 关掉）；窗口 resize / 浏览器缩放 / 主题切换时统一
 *   防抖重绘。这样任何缩放级别都不会叠图、崩版。
 * 暴露: window.RLCharts.render(mountEl, key)
 * ==========================================================================*/
(function () {
  "use strict";

  var H_BIG = 320, H_SMALL = 235;           // 图格子固定高度(px)
  var active = [];                           // 当前挂载的 {mount,key}，统一重绘用

  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function theme() {
    return {
      ink: cssVar("--ink"), ink2: cssVar("--ink-2"), ink3: cssVar("--ink-3"),
      rule: cssVar("--rule"), accent: cssVar("--accent"),
      pos: cssVar("--pos"), neg: cssVar("--neg"), link: cssVar("--link"),
      mono: cssVar("--mono") || "monospace"
    };
  }

  /* tag 分组（按前缀归类，不写死具体 tag；未匹配进兜底组并告警）*/
  var GROUPS = [
    { title: "训练主指标", match: /^Train\//, big: true },
    { title: "损失与策略", match: /^(Loss|Policy)\// },
    { title: "分项奖励", match: /^Episode_Reward\// },
    { title: "终止方式", match: /^Episode_Termination\// },
    { title: "任务指标", match: /^Metrics\// },
    { title: "计算性能", match: /^Perf\// }
  ];
  function groupTags(tags) {
    var used = {}, out = [];
    GROUPS.forEach(function (g) {
      var hit = tags.filter(function (tg) { return g.match.test(tg) && !used[tg]; });
      hit.forEach(function (tg) { used[tg] = 1; });
      if (hit.length) out.push({ title: g.title, tags: hit, big: !!g.big });
    });
    var rest = tags.filter(function (tg) { return !used[tg]; });
    if (rest.length) {
      console.warn("[rl-dashboard] 有曲线未命中任何分组，落入兜底组：" + rest.join(", "));
      out.push({ title: "其他指标", tags: rest });
    }
    return out;
  }
  function colorFor(tag, vals, t) {
    if (/mean_reward/.test(tag)) return t.accent;
    if (/^Episode_Reward\//.test(tag)) {
      var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
      return mean >= 0 ? t.pos : t.neg;
    }
    if (/^Loss\//.test(tag)) return t.link;
    return t.ink2;
  }

  function drawOne(cell, run, tag, t, big) {
    var s = run.series[tag];
    var short = tag.replace(/^Episode_Reward\//, "").replace(/^Episode_Termination\//, "term/");
    var w = cell.clientWidth || 320, hgt = cell.clientHeight || (big ? H_BIG : H_SMALL);
    Plotly.newPlot(cell, [{
      x: s.steps, y: s.values, mode: "lines",
      line: { color: colorFor(tag, s.values, t), width: big ? 2.4 : 1.7 },
      hovertemplate: "iter %{x} · %{y:.4f}<extra></extra>"
    }], {
      title: { text: short, font: { size: big ? 15 : 12.5, color: t.ink2, family: t.mono }, x: 0.02, xanchor: "left" },
      paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      width: w, height: hgt, autosize: false,
      margin: { l: 50, r: 12, t: big ? 38 : 32, b: 34 },
      xaxis: { title: { text: "iteration", font: { size: 11, color: t.ink3 } }, gridcolor: t.rule, zeroline: false, tickfont: { size: 10, color: t.ink3 } },
      yaxis: { gridcolor: t.rule, zeroline: false, tickfont: { size: 10, color: t.ink3 } },
      showlegend: false
    }, { displayModeBar: false, responsive: false, staticPlot: false });
  }

  function doRender(mount, key) {
    var run = (window.RL_RUNS || {})[key];
    if (!run) {
      mount.innerHTML = '<div class="result">⏳ 训练曲线待导出 · 跑完训练后由 <code>scripts/export_run.py</code> 生成 <code>data/' +
        key + "-&lt;run&gt;.js</code>，本页自动渲染。</div>";
      return;
    }
    if (typeof Plotly === "undefined") {
      mount.innerHTML = '<div class="result">⚠️ plotly 未加载（assets/vendor/plotly/plotly-basic.min.js）</div>';
      return;
    }
    var t = theme();
    mount.innerHTML = "";
    var note = document.createElement("p");
    note.className = "chart-note";
    note.textContent = "run: " + run.run_id + " · 数据源: 本地 TensorBoard · " + Object.keys(run.series).length + " 条曲线";
    mount.appendChild(note);
    groupTags(Object.keys(run.series)).forEach(function (g) {
      var h = document.createElement("h3");
      h.className = "chart-group";   // 独立类：与 section-sub 同族字体但不进 TOC（buildToc 只收 section-sub）
      h.textContent = g.title;
      mount.appendChild(h);
      var grid = document.createElement("div");
      grid.style.cssText = "display:grid;gap:14px;grid-template-columns:" +
        (g.big ? "1fr;" : "repeat(auto-fit,minmax(300px,1fr));");
      mount.appendChild(grid);
      g.tags.forEach(function (tag) {
        var cell = document.createElement("div");
        cell.style.cssText = "background:var(--card);border:1px solid var(--rule);border-radius:8px;" +
          "height:" + (g.big ? H_BIG : H_SMALL) + "px;overflow:hidden;min-width:0;";
        grid.appendChild(cell);
        drawOne(cell, run, tag, t, g.big);
      });
    });
  }

  /* ---------- 消融/多 run 对比图（读 window.RL_COMPARE[key]） ----------
     同组(条件)同色，组内各种子用实线/虚线/点线区分；固定高度格子 + 统一重绘。 */
  var GROUP_DASH = ["solid", "dash", "dot"];
  function doRenderCompare(mount, key) {
    var cmp = (window.RL_COMPARE || {})[key];
    if (!cmp) {
      mount.innerHTML = '<div class="result">⏳ 对比数据待导出 · 由 <code>scripts/export_compare.py</code> 生成。</div>';
      return;
    }
    if (typeof Plotly === "undefined") { mount.innerHTML = '<div class="result">⚠️ plotly 未加载</div>'; return; }
    var t = theme();
    var palette = [t.accent, t.link, t.pos, t.ink2];
    mount.innerHTML = "";
    var cell = document.createElement("div");
    cell.style.cssText = "background:var(--card);border:1px solid var(--rule);border-radius:8px;" +
      "height:" + (H_BIG + 40) + "px;overflow:hidden;min-width:0;";
    mount.appendChild(cell);
    var groups = cmp.groups.map(function (g) { return g.name; });
    var seen = {};
    var traces = cmp.runs.map(function (r) {
      var gi = groups.indexOf(r.group);
      var si = (seen[r.group] = (seen[r.group] || 0) + 1) - 1;
      return {
        x: r.steps, y: r.values, mode: "lines", name: r.label,
        legendgroup: r.group,
        line: { color: palette[gi % palette.length], width: 1.7, dash: GROUP_DASH[si % GROUP_DASH.length] },
        hovertemplate: r.label + " · iter %{x} · %{y:.2f}<extra></extra>"
      };
    });
    var w = cell.clientWidth || 640;
    Plotly.newPlot(cell, traces, {
      title: { text: cmp.tag, font: { size: 14, color: t.ink2, family: t.mono }, x: 0.02, xanchor: "left" },
      paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      width: w, height: H_BIG + 40, autosize: false,
      margin: { l: 54, r: 12, t: 40, b: 56 },
      xaxis: { title: { text: "iteration", font: { size: 11, color: t.ink3 } }, gridcolor: t.rule, zeroline: false, tickfont: { size: 10, color: t.ink3 } },
      yaxis: { gridcolor: t.rule, zeroline: false, tickfont: { size: 10, color: t.ink3 } },
      showlegend: true,
      legend: { orientation: "h", y: -0.22, font: { size: 11, color: t.ink2 } }
    }, { displayModeBar: false, responsive: false });
  }

  /* 统一重绘：窗口 resize(含浏览器缩放) 与主题切换都走这里（防抖） */
  var timer = null;
  function refreshAll() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      active = active.filter(function (a) { return document.body.contains(a.mount); });
      active.forEach(function (a) { (a.compare ? doRenderCompare : doRender)(a.mount, a.key); });
    }, 180);
  }
  window.addEventListener("resize", refreshAll);
  new MutationObserver(refreshAll).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  function render(mount, key) {
    if (!active.some(function (a) { return a.mount === mount; })) active.push({ mount: mount, key: key });
    doRender(mount, key);
  }
  function renderCompare(mount, key) {
    if (!active.some(function (a) { return a.mount === mount; })) active.push({ mount: mount, key: key, compare: true });
    doRenderCompare(mount, key);
  }
  window.RLCharts = { render: render, renderCompare: renderCompare };
})();
