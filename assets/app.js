/* ============================================================================
 * app.js — 单页 app-shell 路由器（Lab Notebook 设计语言）
 *   顶栏=一级(任务) · 左侧栏=二级组/三级实验 · 主区按 hash 平滑注入
 * 路由：#/  |  #/<task>  |  #/<task>/<exp>  |  #/<task>/roadmap
 * ==========================================================================*/
(function () {
  "use strict";
  var T = window.RL_TREE || { tasks: [] };
  var C = window.RL_CONTENT || {};
  var tasks = T.tasks || [];
  var byId = {}; tasks.forEach(function (t) { byId[t.id] = t; });
  var STATUS = { active: "进行中", planned: "规划中", done: "已训练", running: "训练中" };
  /* route key → 中文 label（单一真相源=manifest.routesLegend）；全站 chip 一律显示 label */
  var ROUTE_LABELS = {};
  (T.routesLegend || []).forEach(function (r) { ROUTE_LABELS[r.key] = r.label; });
  function routeLabel(key) { return ROUTE_LABELS[key] || key; }

  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === "class") e.className = attrs[k]; else if (k === "html") e.innerHTML = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function el(id) { return document.getElementById(id); }
  function allExps(t) { return (t.groups || []).reduce(function (a, g) { return a.concat(g.items || []); }, (t.experiments || []).slice()); }
  function liveCount(t) { return allExps(t).filter(function (e) { return e.status === "done" || e.status === "running"; }).length; }
  function esc(s) { return String(s == null ? "" : s); }

  /* ---------- 顶栏 ---------- */
  function buildTopnav() {
    var nav = el("topnav"); nav.innerHTML = "";
    tasks.forEach(function (t) { nav.appendChild(h("a", { href: "#/" + t.id, "data-task": t.id }, [t.title.split(" ")[0]])); });
  }

  /* ---------- 侧栏 ---------- */
  function buildSidebar(active) {
    var sb = el("sidebar"); sb.innerHTML = "";
    var mk = function (label, href, on, run) {
      var kids = []; if (run) kids.push(h("span", { class: "rn" })); kids.push(document.createTextNode(label));
      var a = href ? h("a", { href: href }, kids) : h("a", { class: "mut" }, kids);
      if (on) a.className = "on"; return a;
    };
    if (!active.taskId) return;
    var t = byId[active.taskId]; if (!t) return;
    sb.appendChild(h("div", { class: "h" }, [t.title]));
    (t.groups || []).forEach(function (grp) {
      sb.appendChild(h("div", { class: "g" }, [grp.title]));
      (grp.items || []).forEach(function (e) {
        var linkable = e.status === "done" || e.status === "running";
        sb.appendChild(mk(e.title, linkable ? "#/" + t.id + "/" + e.id : null, active.key === t.id + "/" + e.id, e.status === "running"));
      });
    });
    if ((t.roadmap || []).length) {
      sb.appendChild(h("div", { class: "g" }, ["后续环节"]));
      (t.roadmap || []).forEach(function (r) { sb.appendChild(mk(r.title, "#/" + t.id + "/roadmap", active.key === t.id + "/roadmap")); });
    }
    if (!(t.groups || []).length && !(t.roadmap || []).length) sb.appendChild(mk("敬请期待", null, false));
  }

  /* ---------- 视图片段 ---------- */
  function crumb(parts) {
    return '<nav class="breadcrumb">' + parts.map(function (p, i) {
      return (i ? '<span class="sep">›</span>' : "") + (p.href ? '<a href="' + p.href + '">' + p.label + "</a>" : "<span>" + p.label + "</span>");
    }).join("") + "</nav>";
  }
  function stepHtml(t, e) {
    var linkable = e.status === "done" || e.status === "running";
    var inner = '<div class="step-top"><h4>' + e.title + '</h4><span class="badge ' + e.status + '">' + STATUS[e.status] + "</span></div>" +
      '<p class="blurb">' + esc(e.blurb) + "</p>" +
      '<div class="card-foot" style="margin-top:10px"><span class="chip">' + e.robot + '</span><span class="chip route">' + routeLabel(e.route) + "</span></div>";
    return linkable ? '<a class="step" href="#/' + t.id + "/" + e.id + '">' + inner + "</a>" : '<div class="step is-planned">' + inner + "</div>";
  }
  function homeView() {
    var totalExp = tasks.reduce(function (n, t) { return n + allExps(t).length; }, 0);
    var liveExp = tasks.reduce(function (n, t) { return n + liveCount(t); }, 0);
    var legend = (T.routesLegend || []).map(function (r) { return '<span class="chip route" title="' + r.desc + '">' + r.label + "</span>"; }).join("");
    var stats = '<div class="stat"><div class="v">' + tasks.length + '</div><div class="k">任务</div></div>' +
      '<div class="stat"><div class="v">' + liveExp + " / " + totalExp + '</div><div class="k">实验（进行中 / 总）</div></div>' +
      '<div class="stat"><div class="v">' + (T.routesLegend || []).length + '</div><div class="k">技术路线</div></div>';
    var cards = tasks.map(function (t) {
      var foot = (t.robots || []).map(function (r) { return '<span class="chip">' + r + "</span>"; }).join("") +
        (t.routes || []).map(function (r) { return '<span class="chip route">' + routeLabel(r) + "</span>"; }).join("") +
        '<span class="count">' + (t.status === "active" ? (liveCount(t) + " / " + allExps(t).length + " 实验") : "敬请期待") + "</span>";
      return '<a class="card' + (t.status === "planned" ? " is-planned" : "") + '" href="#/' + t.id + '">' +
        '<div class="card-head"><h3>' + t.title + "</h3><span class=\"badge " + t.status + "\">" + STATUS[t.status] + "</span></div>" +
        '<p class="blurb">' + esc(t.blurb) + "</p><div class=\"card-foot\">" + foot + "</div></a>";
    }).join("");
    return '<div class="kicker">Robot Learning</div><h1 class="page-h1">' + T.site.title + "</h1>" +
      '<p class="dek">' + esc(T.site.tagline) + "</p><div class=\"legend\">" + legend + "</div>" +
      '<div class="stat-row">' + stats + '</div><h2 class="section-title">任务</h2><div class="grid">' + cards + "</div>";
  }
  function roadmapList(t) {
    return '<div class="roadmap">' + (t.roadmap || []).map(function (r) {
      return '<div class="rm-item"><div><h4>' + r.title + '</h4><p class="note-t">' + esc(r.note) + "</p></div>" +
        '<div class="rm-meta"><span class="badge planned">规划中</span><span class="chip route">' + routeLabel(r.route) + "</span></div></div>";
    }).join("") + "</div>";
  }
  function taskView(t) {
    var body = crumb([{ label: "任务", href: "#/" }, { label: t.title }]);
    body += '<h1 class="page-h1">' + t.title + '</h1><p class="dek">' + esc(t.blurb) + "</p>";
    if (t.status !== "active") {
      return body + '<div class="placeholder"><div class="big">🚧</div><h1>' + t.title + '</h1><p>' + esc(t.blurb) + '</p>' +
        '<p><span class="badge planned">规划中</span></p><div class="routes">' +
        (t.routes || []).map(function (r) { return '<span class="chip route">' + routeLabel(r) + "</span>"; }).join("") + "</div></div>";
    }
    (t.groups || []).forEach(function (grp) {
      body += '<h2 class="section-title">' + grp.title + "</h2>";
      if (grp.note) body += '<p class="lead" style="margin:-4px 0 12px;font-size:15px">' + esc(grp.note) + "</p>";
      body += '<div class="steps">' + (grp.items || []).map(function (e, i) { return stepHtml(t, e) + (i < grp.items.length - 1 ? '<div class="step-arrow">→</div>' : ""); }).join("") + "</div>";
    });
    if ((t.roadmap || []).length) {
      body += '<h2 class="section-title">后续环节</h2><p class="lead" style="font-size:15px;margin-top:-4px">会走稳之后这条线还要做这几件事 · <a href="#/' + t.id + '/roadmap">查看全部 →</a></p>' + roadmapList(t);
    }
    return body;
  }
  function roadmapView(t) {
    return crumb([{ label: "任务", href: "#/" }, { label: t.title, href: "#/" + t.id }, { label: "后续环节" }]) +
      '<h1 class="page-h1">' + t.title + ' · 后续环节</h1><p class="dek">会走稳之后这条线要做的事，先记在这。都还没开工，状态一律规划中——真做了、有曲线了再各自升成正式实验页。</p>' +
      roadmapList(t) + '<p class="chart-note" style="margin-top:18px">Sim2Sim、师生蒸馏、导航都并入 locomotion 作环节，不单列顶级任务——它们操作的都是同一套行走策略。</p>';
  }
  function expView(t, e) {
    var head = crumb([{ label: "任务", href: "#/" }, { label: t.title, href: "#/" + t.id }, { label: e.title }]);
    var content = C[t.id + "/" + e.id];
    return head + (content || '<h1 class="page-h1">' + e.title + '</h1><div class="placeholder"><div class="big">✍️</div><p>内容建设中。</p></div>');
  }
  /* 实验页标签行：内容里只留空锚点 <div class="meta" data-exp-tags>，标签统一从 manifest 注入 */
  function fillExpTags(view, e) {
    var slot = view.querySelector("[data-exp-tags]");
    if (!slot) return;
    var tags = [];
    if (e.route) tags.push('<span class="tag hot">' + routeLabel(e.route) + "</span>");
    if (e.algo) tags.push('<span class="tag">' + e.algo + "</span>");
    if (e.robot) tags.push('<span class="tag">' + e.robot + "</span>");
    if (e.sim) tags.push('<span class="tag">' + e.sim + "</span>");
    slot.innerHTML = tags.join("");
  }
  /* ---------- 右侧页内目录（TOC）+ scroll-spy ----------
     注意: 站点用 location.hash 做路由, TOC 点击必须走 JS 滚动、绝不能改 hash。 */
  var tocHeads = [];
  function buildToc(view, noSidebar) {
    var toc = el("toc"); if (!toc) return;
    toc.innerHTML = ""; tocHeads = [];
    var tops = view.querySelectorAll("h2.section-title");     // 一级(决定是否显示 TOC)
    var ok = !noSidebar && tops.length >= 2;
    document.body.classList.toggle("has-toc", ok);
    if (!ok) return;
    toc.appendChild(h("div", { class: "t" }, ["本页导航"]));
    var hs = view.querySelectorAll("h2.section-title, h3.section-sub");  // 一二级混排(文档顺序)
    Array.prototype.forEach.call(hs, function (hd, i) {
      if (!hd.id) hd.id = "sec-" + i;
      var isSub = hd.tagName === "H3";
      var label = hd.textContent.replace(/^\s*[\d.]+\s*/, "").trim();    // 去掉前导编号(含小数点)
      var a = h("a", { href: "#" + hd.id, title: label, class: isSub ? "sub" : "" }, [label]);
      a.addEventListener("click", function (ev) {
        ev.preventDefault();               // 防止改写路由 hash
        /* 瞬时跳转而非 smooth：长报告一页可达 2 万 px，平滑滚动的动画途中
           被任何布局变化或用户滚动打断就会中途停下、到不了目标；
           瞬时跳转配合媒体固定占位（img/video 实测宽高），保证一次到位。 */
        hd.scrollIntoView({ block: "start" });
      });
      toc.appendChild(a);
      tocHeads.push({ head: hd, link: a });
    });
    spy();
  }
  function spy() {
    if (!tocHeads.length) return;
    var cur = tocHeads[0];
    tocHeads.forEach(function (x) { if (x.head.getBoundingClientRect().top <= 110) cur = x; });
    tocHeads.forEach(function (x) { x.link.classList.toggle("on", x === cur); });
  }
  window.addEventListener("scroll", function () { spy(); }, { passive: true });

  /* ---------- 路由 ---------- */
  function parse() { return (location.hash || "").replace(/^#\/?/, "").split("/").filter(Boolean); }
  function render() {
    var seg = parse(), view = el("view"), noSidebar = false, active = {};
    if (seg.length === 0) { view.innerHTML = homeView(); noSidebar = true; }
    else {
      var t = byId[seg[0]];
      if (!t) { view.innerHTML = homeView(); noSidebar = true; }
      else if (seg.length === 1) { active = { taskId: t.id, key: "#/" + t.id }; view.innerHTML = taskView(t); }
      else if (seg[1] === "roadmap") { active = { taskId: t.id, key: t.id + "/roadmap" }; view.innerHTML = roadmapView(t); }
      else {
        var e = allExps(t).filter(function (x) { return x.id === seg[1]; })[0];
        if (!e) { active = { taskId: t.id, key: "#/" + t.id }; view.innerHTML = taskView(t); }
        else { active = { taskId: t.id, key: t.id + "/" + e.id }; view.innerHTML = expView(t, e); fillExpTags(view, e); }
      }
    }
    document.body.classList.toggle("no-sidebar", noSidebar);
    document.body.classList.remove("sb-open");
    if (!noSidebar) buildSidebar(active);
    buildToc(view, noSidebar);
    Array.prototype.forEach.call(el("topnav").children, function (a) { a.classList.toggle("on", a.getAttribute("data-task") === active.taskId); });
    Array.prototype.forEach.call(view.querySelectorAll("[data-rl-chart]"), function (m) {
      var key = m.getAttribute("data-rl-chart");
      if (!(window.RL_RUNS || {})[key]) console.warn("[rl-dashboard] data-rl-chart 键未命中 RL_RUNS：" + key);
      if (window.RLCharts && window.RLCharts.render) window.RLCharts.render(m, key);
      else m.innerHTML = '<div class="result">⏳ 训练曲线待导出 · 跑完训练后由 <code>scripts/export_run.py</code> 生成 <code>data/' + key + '-&lt;run&gt;.js</code>，本页自动渲染。</div>';
    });
    Array.prototype.forEach.call(view.querySelectorAll("[data-rl-compare]"), function (m) {
      var key = m.getAttribute("data-rl-compare");
      if (!(window.RL_COMPARE || {})[key]) console.warn("[rl-dashboard] data-rl-compare 键未命中 RL_COMPARE：" + key);
      if (window.RLCharts && window.RLCharts.renderCompare) window.RLCharts.renderCompare(m, key);
    });
    view.style.animation = "none"; void view.offsetWidth; view.style.animation = "";
    window.scrollTo(0, 0);
  }

  /* ---------- 主题 & 移动端 ---------- */
  function initChrome() {
    var saved = null; try { saved = localStorage.getItem("rl-theme"); } catch (e) {}
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    var btn = document.querySelector(".theme-toggle");
    function sync() { var cur = document.documentElement.getAttribute("data-theme"); var dark = cur ? cur === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; if (btn) btn.textContent = dark ? "☀" : "☾"; }
    sync();
    if (btn) btn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme"); var dark = cur ? cur === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
      var next = dark ? "light" : "dark"; document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("rl-theme", next); } catch (e) {} sync();
    });
    var mb = document.querySelector(".menu-btn"); if (mb) mb.addEventListener("click", function () { document.body.classList.toggle("sb-open"); });
  }

  /* ---------- 图放大浮窗（lightbox）----------
     正文 <figure> 直接子级的 SVG（示意图类）点击放大：SVG 矢量无损，正合适。
     选择器必须是 figure > svg（直接子元素）——plotly 曲线图的 svg 嵌在多层 div 里，
     天然被排除；曲线自带悬浮/框选交互，绝不能被 lightbox 劫持点击。
     事件委托绑在 document 上，路由重渲染后依然有效。 */
  function initLightbox() {
    var box = null;
    function close() {
      if (!box) return;
      box.parentNode && box.parentNode.removeChild(box);
      box = null;
      document.body.style.overflow = "";
    }
    document.addEventListener("click", function (ev) {
      if (box) return;                                  // 浮窗打开期间由浮窗自己处理
      var t = ev.target;
      var svg = t && t.closest ? t.closest("figure > svg") : null;
      if (!svg || !svg.closest("#view")) return;        // 只作用于正文示意图
      var fig = svg.closest("figure");
      var cap = fig ? fig.querySelector("figcaption") : null;
      var inner = h("div", { class: "lightbox-inner" }, [svg.cloneNode(true)]);
      if (cap) inner.appendChild(h("div", { class: "lightbox-cap", html: cap.innerHTML }));
      box = h("div", { class: "lightbox", role: "dialog", "aria-label": "放大查看图片" }, [inner]);
      box.addEventListener("click", close);             // 点任意处关闭
      document.body.appendChild(box);
      document.body.style.overflow = "hidden";          // 锁背景滚动
    });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") close(); });
  }

  /* 开发期一致性校验：done/running 实验必须有对应的 RL_CONTENT 内容块，缺失即警告（防改名静默断链） */
  function validateKeys() {
    tasks.forEach(function (t) {
      allExps(t).forEach(function (e) {
        if ((e.status === "done" || e.status === "running") && !C[t.id + "/" + e.id])
          console.warn("[rl-dashboard] 实验缺少内容块 RL_CONTENT[\"" + t.id + "/" + e.id + "\"]");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () { buildTopnav(); initChrome(); initLightbox(); validateKeys(); render(); window.addEventListener("hashchange", render); });
})();
