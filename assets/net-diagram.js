/* ============================================================================
 * net-diagram.js — 神经网络架构图组件（全站复用）
 *   用法：window.RLNet.svg(cfg) → <svg> 字符串（views.js 模板串里 ${RLNet.svg(...)}）
 *   必须在 content/views.js 之前加载（views.js 顶层模板串会立即调用它）。
 *
 * 设计原则：
 *   - 声明式配置——写"网络是什么"，不写"画在哪"；块坐标全部自动计算，
 *     输出头区域固定预留，从结构上杜绝"右侧被画布裁切"一类问题。
 *   - 各层参数量按维度实时计算（禁止写死），合计须与报告正文
 *     "实测自检查点"的数字吻合——对不上就是公式或配置错，禁止改文案凑数。
 *
 * cfg = {
 *   aria:     "Actor 网络架构（Ant）",            // 无障碍标签
 *   markerId: "mkNetAntA",                        // 箭头 marker id（防多图串 defs，逐图唯一）
 *   input:    { label: "观测 s ∈ ℝ⁶⁰",            // 输入向量：方括号 + 分组行（自上而下）
 *               items: ["躯干状态 ·12", ...] },
 *   layers:   [{ type:"fc", in:60, out:400, act:"ELU" }, ...],   // 主干层序列
 *   head:     { type:"gaussian", dim:8 }          // 输出头（三选一）：
 *           | { type:"value" }                    //   高斯策略头（Actor）/ 标量价值头（Critic）
 *           | { type:"plain", main:"y ∈ ℝⁿ", sub:"说明" }        //   通用直出
 * }
 *
 * 扩展新层类型：往 LAYER_TYPES 注册表加一个条目（两行文案 + 参数量公式 +
 * 出入维度取法）即可，排版引擎不用动。块内只写层自身信息（出入维度由箭头携带）。
 * 例（示意，用到再加）：
 *   conv: { l1: l => l.cout + " 通道", l2: l => "卷积 " + l.k + "×" + l.k + " · " + l.act,
 *           params: l => l.k*l.k*l.cin*l.cout + l.cout,
 *           inDim: l => l.cin, outDim: l => l.cout }
 * ==========================================================================*/
(function () {
  "use strict";

  /* 上标数字：400 → ⁴⁰⁰，用于维度记号 ℝⁿ */
  var SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  function sup(n) { return String(n).split("").map(function (c) { return SUP[c] || c; }).join(""); }
  function dimR(n) { return "ℝ" + sup(n); }
  function fmt(n) { return n.toLocaleString("en-US"); }

  /* ---------- 层类型注册表（可扩展的关键） ----------
   * 块内只写"这一层自己是谁"（神经元数 / 类型+激活 / 参数量）；
   * 出入维度不进块——箭头上的 ℝⁿ 维度流已经携带，块里再写就是重复信息。 */
  var LAYER_TYPES = {
    fc: {
      l1: function (l) { return l.out + " 神经元"; },
      l2: function (l) { return "全连接 · " + l.act; },
      params: function (l) { return l.in * l.out + l.out; },   // 权重 in×out + 偏置 out
      inDim: function (l) { return l.in; },
      outDim: function (l) { return l.out; }
    }
  };

  /* ---------- 排版常量（viewBox 坐标系） ---------- */
  var W = 1180;          // 画布宽：主干区 + 固定输出头区，右侧不会再挤爆
  var MIDY = 130;        // 主干轴线 y
  var AR = 44;           // 箭头通道宽（含维度标注）
  var VX = 44, VW = 100; // 输入向量括号的 x 与宽
  var TX0 = VX + VW + 6; // 主干区左界
  var TX1 = 800;         // 主干区右界 = 输出头区左界（actor/critic 两图共用，保证层块对齐）
  var BH = 88;           // 层块高（三行：层 / 激活 / 参数量）

  function node(x, y, w, hgt, main, sub, cls) {
    var cx = x + w / 2;
    return '<rect class="nd ' + (cls === undefined ? "io" : cls) + '" x="' + x + '" y="' + y + '" rx="10" width="' + w + '" height="' + hgt + '"/>' +
      '<text class="lb" x="' + cx + '" y="' + (y + hgt / 2 - 3) + '" text-anchor="middle">' + main + "</text>" +
      (sub ? '<text class="sb" x="' + cx + '" y="' + (y + hgt / 2 + 18) + '" text-anchor="middle">' + sub + "</text>" : "");
  }

  function svg(cfg) {
    var headCfg = cfg.head || { type: "plain", main: "", sub: "" };
    var isG = headCfg.type === "gaussian";
    var H = isG ? 292 : 244;
    var mk = cfg.markerId || "mkNet";
    var s = "";

    /* ---------- 输入向量：方括号 + 分组行 + 记号 ---------- */
    var vTop = MIDY - 78, vBot = MIDY + 66;
    s += '<path class="vb" d="M' + VX + " " + vTop + " h-10 v" + (vBot - vTop) + ' h10"/>';
    s += '<path class="vb" d="M' + (VX + VW) + " " + vTop + " h10 v" + (vBot - vTop) + ' h-10"/>';
    var items = cfg.input.items || [], n = items.length;
    var step = n > 1 ? (vBot - vTop - 44) / (n - 1) : 0;
    items.forEach(function (t, i) {
      s += '<text class="sb" x="' + (VX + VW / 2) + '" y="' + (vTop + 28 + i * step) + '" text-anchor="middle">' + t + "</text>";
    });
    s += '<text class="lb" x="' + (VX + VW / 2) + '" y="' + (vBot + 30) + '" text-anchor="middle">' + cfg.input.label + "</text>";

    /* ---------- 主干层块：等距自动排版 + 箭头上的维度流 ---------- */
    var layers = cfg.layers || [];
    var nb = layers.length;
    var bw = (TX1 - TX0 - AR * (nb + 1)) / nb;
    var totalParams = 0;

    function arrow(x1, x2, label) {
      s += '<path class="ar" d="M' + x1 + " " + MIDY + " H" + (x2 - 5) + '" marker-end="url(#' + mk + ')"/>';
      if (label) s += '<text class="sb" x="' + ((x1 + x2) / 2) + '" y="' + (MIDY - 12) + '" text-anchor="middle">' + label + "</text>";
    }

    layers.forEach(function (l, i) {
      var T = LAYER_TYPES[l.type];
      if (!T) throw new Error("net-diagram: 未注册的层类型 " + l.type);
      var x = TX0 + AR + i * (bw + AR);
      var p = T.params(l);
      totalParams += p;
      arrow(i === 0 ? TX0 : x - AR, x, dimR(i === 0 ? T.inDim(l) : T.inDim(l)));
      s += '<rect class="nd io" x="' + x + '" y="' + (MIDY - BH / 2) + '" rx="10" width="' + bw + '" height="' + BH + '"/>';
      s += '<text class="lb" x="' + (x + bw / 2) + '" y="' + (MIDY - 16) + '" text-anchor="middle">' + T.l1(l) + "</text>";
      s += '<text class="sb" x="' + (x + bw / 2) + '" y="' + (MIDY + 8) + '" text-anchor="middle">' + T.l2(l) + "</text>";
      s += '<text class="sb" x="' + (x + bw / 2) + '" y="' + (MIDY + 30) + '" text-anchor="middle">参数 ' + fmt(p) + "</text>";
      if (i === nb - 1) arrow(x + bw, TX1, dimR(T.outDim(l)));
    });

    /* ---------- 输出头 ---------- */
    var hx = TX1 + 8;
    if (isG) {
      var d = headCfg.dim;
      totalParams += d;   // 逐维可学习的 logσ 也是参数
      /* μ（末层输出）与 logσ（独立可学习参数）→ 高斯策略 N(μ, σ²) → 采样 */
      s += node(hx, MIDY - 26, 98, 52, "μ ∈ " + dimR(d), "动作均值");
      s += node(hx, MIDY + 44, 98, 52, "logσ ∈ " + dimR(d), "可学习参数", "");
      s += '<path class="ar" d="M' + (hx + 98) + " " + MIDY + " L" + (TX1 + 145) + " " + (MIDY + 16) + '" marker-end="url(#' + mk + ')"/>';
      s += '<path class="ar" d="M' + (hx + 98) + " " + (MIDY + 70) + " L" + (TX1 + 145) + " " + (MIDY + 38) + '" marker-end="url(#' + mk + ')"/>';
      s += node(TX1 + 150, MIDY - 2, 118, 56, "N(μ, σ²)", "高斯策略");
      s += '<path class="ar" d="M' + (TX1 + 268) + " " + (MIDY + 26) + " H" + (TX1 + 300) + '" marker-end="url(#' + mk + ')"/>';
      s += '<text class="sb" x="' + (TX1 + 284) + '" y="' + (MIDY + 12) + '" text-anchor="middle">采样</text>';
      s += '<text class="lb" x="' + (TX1 + 342) + '" y="' + (MIDY + 22) + '" text-anchor="middle">a ∈ ' + dimR(d) + "</text>";
      s += '<text class="sb" x="' + (TX1 + 342) + '" y="' + (MIDY + 44) + '" text-anchor="middle">动作</text>';
      s += '<text class="sb" x="' + (TX1 + 190) + '" y="' + (MIDY + 124) + '" text-anchor="middle">训练时从 N(μ, σ²) 采样以探索；推理 / 部署直接取均值 μ</text>';
    } else if (headCfg.type === "value") {
      s += node(hx, MIDY - 28, 112, 56, "V(s) ∈ ℝ", "状态价值");
      s += '<text class="sb" x="' + (hx + 56) + '" y="' + (MIDY + 52) + '" text-anchor="middle">仅训练期为 Actor 提供基准</text>';
    } else {
      s += node(hx, MIDY - 28, 130, 56, headCfg.main, headCfg.sub);
    }

    /* ---------- 合计参数量（实时求和的角注） ---------- */
    var note = "合计 " + fmt(totalParams) + " 个参数（按各层实时求和" + (isG ? "，含 " + headCfg.dim + " 个 logσ" : "") + "）";
    s += '<text class="sb" x="' + (W - 16) + '" y="' + (H - 10) + '" text-anchor="end">' + note + "</text>";

    return '<svg class="net" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + cfg.aria + '">' +
      '<defs><marker id="' + mk + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk" d="M0 0L10 5L0 10z"/></marker></defs>' +
      s + "</svg>";
  }

  window.RLNet = { svg: svg };
})();
