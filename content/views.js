/* ============================================================================
 * views.js — 富文本视图内容（实验报告），注册到 window.RL_CONTENT[key]。
 * Lab Notebook 设计：模型卡记录 + 图先于字。SVG 靠 CSS 类适配深浅主题。
 * 行文取教科书语域，配图用形式化记号。骨架与写作规则见父仓 `STANDARDS/实验报告/实验报告模板.md`。
 * 标签行是空锚点 <div class="meta" data-exp-tags>，由 app.js 从 manifest 注入。
 * ==========================================================================*/
window.RL_CONTENT = window.RL_CONTENT || {};

/* ---------- SVG：智能体–环境交互回路（图 1；cfg={policy, env, aDim, sDim}）---------- */
function heroLoopSVG(cfg) {
  var mid = "ah_" + cfg.env.replace(/[^a-zA-Z0-9]/g, "");   // marker id 按任务区分，防多块页面串 defs
  return '<svg viewBox="0 0 820 210" role="img" aria-label="智能体与环境的交互回路">' +
    '<defs><marker id="' + mid + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk" d="M0 0L10 5L0 10z"/></marker></defs>' +
    '<rect class="nd" x="80" y="50" rx="6" width="250" height="108"/>' +
    '<text class="lb" x="205" y="96" text-anchor="middle">智能体（Agent）</text>' +
    '<text class="sb" x="205" y="120" text-anchor="middle">' + cfg.policy + "</text>" +
    '<rect class="nd" x="490" y="50" rx="6" width="250" height="108"/>' +
    '<text class="lb" x="615" y="96" text-anchor="middle">环境（Environment）</text>' +
    '<text class="sb" x="615" y="120" text-anchor="middle">' + cfg.env + "</text>" +
    '<path class="ar" d="M330 88 H488" marker-end="url(#' + mid + ')"/>' +
    '<text class="sb" x="410" y="74" text-anchor="middle">动作 a ∈ ℝ' + cfg.aDim + "</text>" +
    '<path class="ar" d="M490 122 H332" marker-end="url(#' + mid + ')"/>' +
    /* 回传标签拆两行居中放进两框之间的空档（框距 330–490 只有 160px，一行放不下） */
    '<text class="sb" x="410" y="146" text-anchor="middle">观测 s′ ∈ ℝ' + cfg.sDim + "</text>" +
    '<text class="sb" x="410" y="168" text-anchor="middle">奖励 r ∈ ℝ</text>' +
    '</svg>';
}
/* ---------- SVG：Cartpole 物理系统示意（图 2）---------- */
function cartpoleSVG() {
  var s = "";
  /* 出界边界（±3 m，虚线）与滑轨 */
  s += '<path class="eg" stroke-dasharray="5 5" d="M110 70 V190"/><path class="eg" stroke-dasharray="5 5" d="M710 70 V190"/>';
  s += '<text class="sb" x="110" y="58" text-anchor="middle">边界 −3 m</text><text class="sb" x="710" y="58" text-anchor="middle">边界 +3 m</text>';
  s += '<path class="vb" d="M110 190 H710"/>';
  s += '<path class="vb" d="M410 185 V195"/><text class="sb" x="410" y="214" text-anchor="middle">0</text>';
  s += '<text class="sb" x="180" y="214" text-anchor="middle">滑轨（水平）</text>';
  /* 小车（joint: slider_to_cart 沿滑轨平移） */
  s += '<rect class="nd io" x="395" y="150" rx="6" width="80" height="40"/>';
  s += '<text class="sb" x="435" y="175" text-anchor="middle">小车</text>';
  /* 杆（joint: cart_to_pole 绕铰点自由转动），画为偏离竖直 θ 的状态 */
  s += '<path class="eg" stroke-dasharray="4 5" d="M435 150 V42"/>';
  s += '<path class="ar" style="stroke-width:5;stroke-linecap:round" d="M435 150 L469 45"/>';
  s += '<circle class="mk" cx="435" cy="150" r="4"/>';
  s += '<path class="eg" d="M435 95 A 55 55 0 0 1 452 98" fill="none"/>';
  s += '<text class="lb" x="449" y="86" text-anchor="middle">θ</text>';
  s += '<text class="sb" x="482" y="52" text-anchor="start">杆（被动）</text>';
  /* 关节名 */
  s += '<text class="sb" x="487" y="147" text-anchor="start">cart_to_pole · 铰接</text>';
  s += '<text class="sb" x="487" y="184" text-anchor="start">slider_to_cart · 平移</text>';
  /* 动作：水平力 F */
  s += '<path class="ar" d="M305 170 H386" marker-end="url(#mkF)"/>';
  s += '<text class="lb" x="345" y="156" text-anchor="middle">水平力 F</text>';
  return '<svg viewBox="0 0 820 230" role="img" aria-label="Cartpole 物理系统示意">' +
    '<defs><marker id="mkF" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk" d="M0 0L10 5L0 10z"/></marker></defs>' +
    s + "</svg>";
}
/* ---------- 网络架构图：统一走 assets/net-diagram.js 的 RLNet.svg(cfg) ----------
 * 本文件只写各实验的网络配置（层序列 + 输出头），排版与参数量计算都在组件里。
 * 注意：Actor 与 Critic 的隐藏层同构，但末层输出维不同（Actor=动作维，Critic=1），
 * 各自的层序列要分开给，参数量才能与正文"实测自检查点"数字吻合。 */
function cartpoleMlpCfg(kind) {
  var actor = kind !== "critic";
  return {
    aria: (actor ? "Actor" : "Critic") + " 网络架构（Cartpole）",
    markerId: actor ? "mkNetCpA" : "mkNetCpC",
    input: { label: "观测 s ∈ ℝ⁴", items: ["小车位置", "杆角度", "小车速度", "杆角速度"] },
    layers: [
      { type: "fc", in: 4, out: 32, act: "ELU" },
      { type: "fc", in: 32, out: 32, act: "ELU" },
      { type: "fc", in: 32, out: 1, act: "线性" }
    ],
    head: actor ? { type: "gaussian", dim: 1 } : { type: "value" }
  };
}
function antMlpCfg(kind) {
  var actor = kind !== "critic";
  return {
    aria: (actor ? "Actor" : "Critic") + " 网络架构（Ant）",
    markerId: actor ? "mkNetAntA" : "mkNetAntC",
    input: { label: "观测 s ∈ ℝ⁶⁰", items: ["躯干状态 ·12", "关节状态 ·16", "足端力 ·24", "上步动作 ·8"] },
    layers: [
      { type: "fc", in: 60, out: 400, act: "ELU" },
      { type: "fc", in: 400, out: 200, act: "ELU" },
      { type: "fc", in: 200, out: 100, act: "ELU" },
      { type: "fc", in: 100, out: actor ? 8 : 1, act: "线性" }
    ],
    head: actor ? { type: "gaussian", dim: 8 } : { type: "value" }
  };
}
/* ---------- SVG：Ant 物理系统示意（俯视）---------- */
function antSVG() {
  var cx = 300, cy = 120, r = 38;
  var dirs = [[1, -1], [1, 1], [-1, -1], [-1, 1]];   // 右前/右后/左前/左后（俯视）
  var s = "";
  /* 四条腿：髋(躯干边缘) → 上段 → 踝 → 下段 → 足端 */
  dirs.forEach(function (d) {
    var ux = d[0] * 0.707, uy = d[1] * 0.707;
    var hx = cx + r * ux, hy = cy + r * uy;
    var ax = cx + 88 * ux, ay = cy + 88 * uy;
    var fx = cx + 128 * ux, fy = cy + 128 * uy;
    s += '<path class="ar" style="stroke-width:5;stroke-linecap:round" d="M' + hx + " " + hy + " L" + ax + " " + ay + '"/>';
    s += '<path class="ar" style="stroke-width:3.5;stroke-linecap:round" d="M' + ax + " " + ay + " L" + fx + " " + fy + '"/>';
    s += '<circle class="mk" cx="' + hx + '" cy="' + hy + '" r="4"/>';
    s += '<circle class="mk" cx="' + ax + '" cy="' + ay + '" r="3.4"/>';
  });
  /* 躯干（盖在腿根上） */
  s += '<circle class="nd io" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>';
  s += '<text class="sb" x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle">躯干</text>';
  /* 关节标注（引线到右前腿的髋与踝） */
  s += '<path class="eg" d="M336 84 L392 56"/><text class="sb" x="398" y="52" text-anchor="start">髋关节 · .*_leg × 4</text>';
  s += '<path class="eg" d="M368 176 L420 196"/><text class="sb" x="426" y="200" text-anchor="start">踝关节 · .*_foot × 4</text>';
  /* 目标方向 */
  s += '<path class="ar" d="M470 120 H700" marker-end="url(#mkAnt)"/>';
  s += '<text class="lb" x="585" y="104" text-anchor="middle">目标方向 +x</text>';
  s += '<text class="sb" x="585" y="140" text-anchor="middle">目标点 (1000, 0, 0)，即持续向前行走</text>';
  /* 失败判据注记 */
  s += '<text class="sb" x="80" y="230" text-anchor="start">俯视示意 · 失败判据（侧视量）：躯干高度 &lt; 0.31 m 即摔倒终止</text>';   /* 下移避开左右后腿足端(≈210) */
  return '<svg viewBox="0 0 820 236" role="img" aria-label="Ant 物理系统示意（俯视）">' +
    '<defs><marker id="mkAnt" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk" d="M0 0L10 5L0 10z"/></marker></defs>' +
    s + "</svg>";
}
/* ---------- SVG：Ant 控制量示意——侧视放大 1 条腿，画出关节力矩（图 3）---------- */
function antLegControlSVG() {
  var s = "";
  /* 地面与足端触地 */
  s += '<path class="vb" d="M60 210 H520"/>';
  s += '<text class="sb" x="100" y="228" text-anchor="middle">地面</text>';
  s += '<text class="sb" x="392" y="228" text-anchor="middle">足端触地</text>';
  /* 躯干（局部，球形）与单腿：髋 → 上段 → 踝 → 下段 → 足端 */
  s += '<circle class="nd io" cx="170" cy="78" r="44"/>';
  s += '<text class="sb" x="170" y="83" text-anchor="middle">躯干</text>';
  s += '<path class="ar" style="stroke-width:5;stroke-linecap:round" d="M196 113 L300 158"/>';
  s += '<path class="ar" style="stroke-width:3.5;stroke-linecap:round" d="M300 158 L352 208"/>';
  s += '<circle class="mk" cx="196" cy="113" r="4"/>';
  s += '<circle class="mk" cx="300" cy="158" r="3.4"/>';
  /* 关节力矩：绕髋、踝各一个弧形箭头（控制量的落点） */
  s += '<path class="ar" d="M222 113 A 26 26 0 1 1 196 87" fill="none" marker-end="url(#mkTau)"/>';
  s += '<text class="lb" x="243" y="92" text-anchor="middle">τ</text>';
  s += '<path class="ar" d="M321 158 A 21 21 0 1 1 300 137" fill="none" marker-end="url(#mkTau)"/>';
  s += '<text class="lb" x="338" y="140" text-anchor="middle">τ</text>';
  /* 关节名（引线） */
  s += '<path class="eg" d="M196 130 L168 176"/><text class="sb" x="162" y="192" text-anchor="end">髋关节 · .*_leg</text>';
  s += '<path class="eg" d="M318 168 L390 182"/><text class="sb" x="396" y="186" text-anchor="start">踝关节 · .*_foot</text>';
  /* 右侧注记：控制量的构成与性质 */
  s += '<text class="lb" x="655" y="78" text-anchor="middle">控制量 = 8 个关节力矩</text>';
  s += '<text class="sb" x="655" y="106" text-anchor="middle">τ ∈ ℝ⁸ ＝ 4 条腿 × 每腿 2 个主动关节（髋 + 踝）</text>';
  s += '<text class="sb" x="655" y="130" text-anchor="middle">策略每个控制步输出 8 个数，缩放后直接作为力矩</text>';
  s += '<text class="sb" x="655" y="154" text-anchor="middle">执行器无内置刚度 / 阻尼，不经 PD 环</text>';
  /* 视角注记 */
  s += '<text class="sb" x="60" y="24" text-anchor="start">侧视示意 · 只画 1 条腿；其余 3 条腿同构，各有同样的 2 个力矩关节</text>';   /* 上移避开躯干圆顶(y≈34) */
  return '<svg viewBox="0 0 820 244" role="img" aria-label="Ant 控制量示意（侧视，放大 1 条腿）">' +
    '<defs><marker id="mkTau" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path class="mk" d="M0 0L10 5L0 10z"/></marker></defs>' +
    s + "</svg>";
}
/* ---------- 参数行：名字 | 值 | 设置理由 ---------- */
function pr(k, v, why) {
  return '<div class="pr"><span class="pk">' + k + '</span><span class="pv">' + v + '</span><span class="pw">' + why + "</span></div>";
}
/* ---------- 名值行：名字 | 值（无理由列）。标准化、跨实验不变的信息(如软硬件环境)用它，不逐条解释。---------- */
function kv(k, v) {
  return '<div class="pr kv"><span class="pk">' + k + '</span><span class="pv">' + v + "</span></div>";
}
function table(inner, label) {
  var aria = label ? ' aria-label="' + String(label).replace(/"/g, "&quot;") + '"' : "";
  return "<table" + aria + ">" + inner + "</table>";
}

/* ============================= Cartpole 平衡实验 ============================= */
window.RL_CONTENT["locomotion/cartpole-balance"] = `
<h1 class="page-h1">Cartpole 平衡实验</h1>
<p class="dek abstract"><strong>摘要：</strong>本实验研究倒立摆（Cartpole）的平衡控制问题：仅对小车施加水平力，使铰接其上的杆保持竖直不倒。方法上采用近端策略优化（PPO），在 Isaac Lab 的 <code>Isaac-Cartpole-v0</code> 环境中以 4096 个并行环境训练一个 4→32→32→1 的 MLP 策略，共 150 次迭代，训练循环耗时约 17 秒。结果表明：策略在第 36 次迭代达到满回合长度，最终平均回报 4.94，为理论上限 5.0 的 98.8%，收敛后无退化；回放显示策略能在约 1 秒内将随机倾斜的杆恢复竖直并保持至回合结束。</p>
<div class="meta" data-exp-tags></div>

<table class="kv-table">
  <caption>表 1 · 实验概要</caption>
  <tbody>
    <tr><td class="k">状态</td><td><strong>已训练 ✓</strong>　<span class="mono" style="font-family:var(--mono);font-size:13px">run 2026-07-06_08-00-30</span></td></tr>
    <tr><td class="k">机器人</td><td>Cartpole（倒立摆小车；2 个关节，滑轨关节主动 effort、杆关节被动）</td></tr>
    <tr><td class="k">技术路线</td><td>强化学习 · PPO</td></tr>
    <tr><td class="k">任务环境</td><td><code>Isaac-Cartpole-v0</code>（Isaac Lab）</td></tr>
    <tr><td class="k">任务配置</td><td>Isaac Lab 官方预设，未作任何修改</td></tr>
    <tr><td class="k">并行环境数</td><td>4096</td></tr>
    <tr><td class="k">训练迭代数</td><td>150（每次迭代学习一批新采集的经验）</td></tr>
    <tr><td class="k">训练耗时</td><td>约 17 秒（采集 11.3 s + 更新 5.3 s，不含仿真器启动）</td></tr>
    <tr><td class="k">观测 / 动作维度</td><td>4 维 → 1 维</td></tr>
    <tr><td class="k">策略网络</td><td>MLP，两个隐藏层 × 32，ELU 激活；Actor 与 Critic 合计 2,499 个参数</td></tr>
    <tr><td class="k">最终平均回报</td><td><strong>4.94</strong>（理论上限 5.0 的 98.8%）</td></tr>
    <tr><td class="k">回合步数</td><td><strong>300 / 300</strong>（满回合，全程不倒）</td></tr>
  </tbody>
</table>

<figure>${heroLoopSVG({ policy: "策略 π · MLP 4→32→32→1", env: "Isaac-Cartpole-v0", aDim: "¹", sDim: "⁴" })}<figcaption>图 1 · 智能体与环境的交互回路。每个时间步，智能体（策略 π）依据当前观测选择动作并作用于环境，环境返回下一时刻的观测与标量奖励；训练目标是调整 π 以最大化累计奖励。</figcaption></figure>

<h2 class="section-title"><span class="hnum">1</span>背景与问题定义</h2>
<p>本任务通过强化学习训练一个策略，使倒立摆（Cartpole）保持平衡不倒。被控系统如图 2 所示。</p>
<figure>${cartpoleSVG()}<figcaption>图 2 · Cartpole 物理系统示意。小车经关节 <code>slider_to_cart</code> 沿水平滑轨平移，杆经被动铰接关节 <code>cart_to_pole</code> 绕小车自由转动；控制输入是施加于小车的水平力 F，θ 为杆偏离竖直方向的角度，小车位置越出 ±3 m 边界则回合失败终止。</figcaption></figure>
<p><strong>机器人</strong>：一辆小车与一根铰接于其上的杆，共两个关节——<code>slider_to_cart</code>（小车沿滑轨水平平移）与 <code>cart_to_pole</code>（杆绕小车自由转动）。其中小车滑轨关节为主动驱动，杆关节为被动铰接。</p>
<p><strong>控制</strong>：策略每个控制步只输出一个水平力，作用在 <code>slider_to_cart</code> 上。水平力改变小车加速度，小车作为杆的支点移动，进而改变杆的角速度与角度；从“推小车”到“保持杆竖直”之间没有手写平衡控制器，全部由策略学出。</p>
<p><strong>目标</strong>：使杆保持竖直不倒，且小车不越出边界。</p>
<p>本任务是一个经典的<strong>欠驱动</strong>问题：无法直接对杆施力，只能推动小车，借助小车的加减速间接维持杆的平衡。</p>
<p>按强化学习的标准框架（马尔可夫决策过程，MDP），问题的各要素定义见表 2：</p>
<table class="kv-table">
  <caption>表 2 · 问题的形式化定义</caption>
  <tbody>
    <tr><td class="k">环境</td><td><code>Isaac-Cartpole-v0</code>，Isaac Lab 提供的 GPU 并行物理仿真环境</td></tr>
    <tr><td class="k">智能体</td><td>控制小车的策略网络 π（结构见第 3.1 节）</td></tr>
    <tr><td class="k">状态 / 观测</td><td>4 维连续向量：小车位置、杆角度、小车速度、杆角速度（第 3.2 节）</td></tr>
    <tr><td class="k">动作</td><td>1 维连续量：施加于小车滑轨的水平力（第 3.2 节）</td></tr>
    <tr><td class="k">奖励</td><td>5 项加权和：存活奖励 + 失败重罚 + 三个小权重塑形罚项（第 3.3 节）</td></tr>
    <tr><td class="k">回合</td><td>5 秒（300 个控制步）到时正常结束；小车出界则提前失败终止（第 3.4 节）</td></tr>
    <tr><td class="k">目标</td><td>最大化折扣累计回报，折扣因子 γ = 0.99</td></tr>
  </tbody>
</table>

<h2 class="section-title"><span class="hnum">2</span>理论基础</h2>
<p>第 1 节将平衡控制表述为一个 MDP：智能体在每个控制步观测系统状态、输出动作、获得标量奖励，目标是最大化折扣累计回报。强化学习不依赖标注数据，而是通过与环境的反复交互，从奖励信号中学习控制策略——这正适合本任务：我们能够写出"什么算好"（杆竖直、不出界），却难以为每个状态标注"该施多大的力"。</p>
<p>强化学习的求解方法大体分为两族。<strong>价值法</strong>（如 Q-learning、DQN）学习每个状态–动作对的价值，再取价值最大的动作，天然适合动作可枚举的离散问题；本任务的动作是连续的水平力，无法枚举，因此采用<strong>策略梯度法</strong>——直接参数化策略并沿提升期望回报的方向更新参数。纯策略梯度的估计方差较大，实践中普遍采用 <strong>Actor-Critic</strong> 架构降低方差：Actor 即策略本身，负责输出动作；Critic 估计状态价值 V(s)，为策略更新提供基准，仅在训练期使用。</p>
<p>更新的方向由<strong>优势</strong>（advantage）决定：<code>A = 实际回报 − V(s)</code>，即某一动作相对 Critic 预期的好坏程度。优势的最小构件是时序差分误差 <code>δ = r + γ·V(s′) − V(s)</code>，多步 δ 经 GAE(λ) 加权聚合为更稳定的优势估计，以在偏差与方差之间取得折中。训练同时优化三项：<strong>策略损失</strong>（记 Loss/surrogate）按优势加权调整各动作的概率；<strong>价值损失</strong>（记 Loss/value）使 Critic 的预测逼近实际回报；<strong>熵正则项</strong>对动作分布的随机性给予小额奖励，防止策略过早收敛到次优解。</p>
<p>策略梯度方法的实用难点在于更新步长：单次过大的更新可能使策略崩溃且难以恢复。<strong>PPO</strong>（Proximal Policy Optimization，近端策略优化）的处理方式是<strong>裁剪</strong>：当新旧策略的概率比越出 [1−ε, 1+ε] 区间时，其对优化目标的贡献被截断，从而失去继续外推的梯度激励，使每次更新仅前进一小步。</p>
<p>本实验选用 PPO 的依据有四：任务动作连续，属于策略梯度法的适用域；本实验采用数千个并行环境采样，与 PPO 这类 on-policy 算法的大批量数据需求恰好匹配；PPO 实现简单、对超参数不敏感，官方默认配置通常无需调整；它也是机器人运动控制领域常用的事实标准算法，并与 RSL-RL 等训练框架有成熟配套。</p>

<h2 class="section-title"><span class="hnum">3</span>实验框架</h2>
<p>本节完整描述本实验的构成：策略由两个神经网络组成（3.1），读入 4 维观测、输出 1 维力（3.2），其行为由一组奖励规则塑造（3.3），回合的起止方式决定了训练所见的状态分布（3.4），PPO 在大量并行环境中迭代优化上述网络（3.5），最后给出运行环境、全部超参数与复现方式（3.6）。</p>

<h3 class="section-sub"><span class="hnum">3.1</span>网络结构</h3>
<p>强化学习训练调整的对象是<strong>神经网络的参数</strong>，而非机器人本身。本实验采用 Actor-Critic 架构，两个网络<strong>结构完全相同</strong>（4→32→32→1 的 MLP、ELU 激活），但承担不同职责、输出不同的量，其架构分别如图 3 与图 4 所示。网络规模很小：Actor 1,250 个参数（含 1 个可学习的动作标准差）、Critic 1,249 个参数，合计 2,499 个（实测自检查点文件）。</p>
<figure>${RLNet.svg(cartpoleMlpCfg("actor"))}<figcaption>图 3 · <strong>Actor（策略网络）</strong>的架构：观测向量经两个 ELU 隐藏层映射为动作均值 <strong>μ</strong>；μ 与独立可学习的 logσ 共同构成高斯策略 <strong>N(μ, σ²)</strong>——训练时从中采样以探索，部署时直接取均值。各层参数量由维度实时计算。最终部署的仅此网络。</figcaption></figure>
<figure>${RLNet.svg(cartpoleMlpCfg("critic"))}<figcaption>图 4 · <strong>Critic（价值网络）</strong>的架构：隐藏层与 Actor 同构，输出改为标量价值 <strong>V(s)</strong>，即从当前状态出发的期望累计回报。仅在训练期为 Actor 提供参照，不参与部署。</figcaption></figure>
<div class="plist">
  ${pr("actor_hidden_dims", "[32, 32]", '输入仅 4 维、任务简单，两层 32 的容量已足以拟合；较小的网络训练更快，且不易过拟合。')}
  ${pr("critic_hidden_dims", "[32, 32]", '与 Actor 同构（对称 Actor-Critic）。本任务状态完全可观，无需为 Critic 提供额外的特权信息。')}
  ${pr("activation", "elu", '负半区平滑且不置零，可避免神经元失活、使输出动作更平滑；这是 legged_gym / RSL-RL 一系的经验性默认选择。')}
  ${pr("init_noise_std", "1.0", '初始探索噪声：实际动作 ~ N(均值, σ²)，σ 初值取 1.0 表示初期进行大范围探索；σ 本身可学习，随训练自动收窄（本次实测 Policy/mean_std 由 1.0 收至 0.083）。')}
  ${pr("obs normalization", "False", '观测不作在线归一化：本任务观测量级小且稳定。规模较大的任务通常启用，用于将不同量纲的观测归一化到同一尺度。')}
</div>

<h3 class="section-sub"><span class="hnum">3.2</span>观测与动作</h3>
<p><strong>观测空间（4 维，两个网络共用）。</strong>按固定顺序拼接为一个 4 维向量，各维均为相对默认姿态的偏差量，构成见表 3：</p>
<table>
  <caption>表 3 · 观测向量构成</caption>
  <thead><tr><th>#</th><th>观测量</th><th>物理含义</th><th>取数函数</th></tr></thead>
  <tbody>
    <tr><td>1</td><td><code>slider_to_cart</code> 位置</td><td>小车偏离中点的距离（m）</td><td rowspan="2"><code>joint_pos_rel</code></td></tr>
    <tr><td>2</td><td><code>cart_to_pole</code> 角度</td><td>杆偏离竖直的角度（rad）</td></tr>
    <tr><td>3</td><td><code>slider_to_cart</code> 速度</td><td>小车的平移速度</td><td rowspan="2"><code>joint_vel_rel</code></td></tr>
    <tr><td>4</td><td><code>cart_to_pole</code> 角速度</td><td>杆的转动角速度</td></tr>
  </tbody>
</table>
<div class="plist">
  ${pr("为何用相对量", "pos − default", '以默认姿态为零点，网络学习的是偏差而非绝对量；更换初始姿态或机器人时，这种表述更具通用性。')}
  ${pr("观测噪声", "无", 'enable_corruption = False，即不对感知施加额外难度。更贴近真机的任务通常会为观测叠加噪声，以模拟真实传感器的不完美。')}
  ${pr("为何无相机", "仅本体量", '4 个标量即可完整描述系统状态（完全可观），无需视觉输入；这也是该任务适合作为首个实验的原因之一。')}
</div>
<p><strong>动作空间（1 维）。</strong>策略在每个控制步输出一个标量：</p>
<div class="plist">
  ${pr("驱动对象", "slider_to_cart", '仅驱动小车滑轨；杆为被动关节（无电机）。以 1 个动作控制 2 个自由度，即欠驱动。')}
  ${pr("控制方式", "JointEffortAction", '直接输出力（effort），不经 PD 环。另一类常见接口是输出关节目标角度，再由 PD 控制器转为力矩。')}
  ${pr("scale", "100.0", '网络输出量级约为 N(0,1)，乘以 100 放大至足以驱动小车的牛顿量级。缩放的作用是使网络始终工作在 ±1 的适宜区间内。')}
  ${pr("offset", "0", '无偏移：静止时无需恒定力（对照：需抵抗重力的关节常配置偏置）。')}
  ${pr("effort_limit", "400", '执行器安全上限，对 100×动作 再作一次限幅，防止极端输出。')}
</div>

<h3 class="section-sub"><span class="hnum">3.3</span>奖励函数</h3>
<p>各项奖励在每个控制步按<strong>权重 × 控制步长（1/60 s）</strong>累加计入回报——权重描述的是"每秒的得分速率"而非单步得分。奖励由 <strong>1 个主要目标（alive）+ 1 个失败重罚（terminating）+ 3 个小权重塑形项</strong>组成——"主目标 + 失败重罚 + 小权重塑形"是奖励设计中十分常见的组合。五项权重的构成如图 5 所示。</p>
<figure>
<div class="rewards">
  <div class="rw"><span class="nm">alive<small>存活奖励</small></span><span class="bar"><i class="p" style="width:44.8%"></i></span><span class="w p">+1.0</span></div>
  <div class="rw"><span class="nm">terminating<small>失败终止惩罚</small></span><span class="bar"><i class="n" style="width:50%"></i></span><span class="w n">−2.0</span></div>
  <div class="rw"><span class="nm">pole_pos<small>杆偏离竖直的惩罚</small></span><span class="bar"><i class="n" style="width:44.8%"></i></span><span class="w n">−1.0</span></div>
  <div class="rw"><span class="nm">cart_vel<small>小车速度惩罚</small></span><span class="bar"><i class="n" style="width:10.2%"></i></span><span class="w n">−0.01</span></div>
  <div class="rw"><span class="nm">pole_vel<small>杆角速度惩罚</small></span><span class="bar"><i class="n" style="width:5%"></i></span><span class="w n">−0.005</span></div>
</div>
<figcaption>图 5 · 奖励各项的权重。中线为零点，向右（绿）为奖励、向左（红）为惩罚；权重跨三个数量级，条长按对数刻度示意本实验内各项的相对量级，精确数值以右列为准。</figcaption>
</figure>
<p>下面逐项说明各项的定义、设计动机，以及移除后的影响：</p>
<div class="plist">
  ${pr("alive · +1.0", "is_alive", '主要收益项：回合未终止的每一步均计入正奖励，将存活时长直接转化为优化目标（满回合 5 秒合计贡献 +5.0）。若移除，策略将失去正向激励，最优解可能退化为尽快出界以提前结束回合。')}
  ${pr("terminating · −2.0", "is_terminated", '对以失败方式（出界）结束的一次性重罚。若移除，出界的代价仅为损失少量存活奖励，边界约束的学习将明显变慢。')}
  ${pr("pole_pos · −1.0", "joint_pos_target_l2(target=0)", '杆角相对竖直方向（0°）的平方误差，经 wrap_to_pi 处理以避免角度回绕带来的计算错误；它是"立直"最直接的梯度来源。若移除，只要不出界，杆处于任何姿态均可获得存活奖励，任务随之退化。')}
  ${pr("cart_vel · −0.01", "joint_vel_l1", '对小车速度绝对值的小额惩罚，用于抑制高速往返一类的投机解。权重刻意设得很小，以免压过主要目标。')}
  ${pr("pole_vel · −0.005", "joint_vel_l1", '对杆角速度的小额惩罚：目标是静态的竖直，而非快速摆动中的"平均竖直"。与上一项同为塑形项，权重同样很小。')}
</div>

<h3 class="section-sub"><span class="hnum">3.4</span>终止与复位</h3>
<div class="plist">
  ${pr("终止 · time_out", "5 s（= 300 步）", '到时正常结束（标记为非失败，不触发 terminating 惩罚）。5 秒足以判断策略是否已稳定。')}
  ${pr("终止 · 出界", "|小车| > 3.0 m", '滑轨长度有限；出界属失败终止，触发 terminating 惩罚。')}
  ${pr("无杆角终止", "（设计选择）", '杆倒下不结束回合，给策略留出自行将其摆回竖直的机会，同时 pole_pos 持续提供梯度。相较经典 Gym CartPole（杆倒即终止），这是更宽容的设定。')}
  ${pr("复位 · 小车位置", "± 1.0 m", '每回合起点随机化：不从同一状态开始，避免策略记忆单一轨迹，迫使其学习通用的平衡能力。')}
  ${pr("复位 · 小车速度", "± 0.5 m/s", '以非零初速度开始，覆盖更大的状态空间。')}
  ${pr("复位 · 杆角度", "± 0.25π（±45°）", '初始时杆已倾斜，策略须先将其恢复竖直、再维持住，从而直接训练抗扰动能力。')}
  ${pr("复位 · 杆角速度", "± 0.25π rad/s", '初始时杆带有角速度，进一步增加起始状态的多样性。')}
</div>

<h3 class="section-sub"><span class="hnum">3.5</span>训练流程</h3>
<p>一次训练迭代包含以下四步，共循环 150 次：</p>
<ol>
  <li><strong>收集经验。</strong>4096 个环境各以当前策略推进 16 步，共采集 65,536 条 (观测, 动作, 奖励, 下一观测) 样本。</li>
  <li><strong>计算优势。</strong>逐步计算时序差分误差 δ，并经 GAE(λ=0.95) 聚合为优势估计（定义见第 2 节）。</li>
  <li><strong>更新网络。</strong>将样本划分为 4 个 16,384 的小批量，重复训练 5 遍；每遍计算策略损失、价值损失与熵正则项（三者的含义见第 2 节），反向传播（梯度范数上限 1.0）、以 Adam 更新，并按 KL 自适应调整学习率。</li>
  <li><strong>返回第 1 步</strong>，循环至第 150 次迭代。</li>
</ol>

<h3 class="section-sub"><span class="hnum">3.6</span>环境与设置</h3>
<p>任务环境 <code>Isaac-Cartpole-v0</code> 来自 Isaac Lab 官方任务包，按其 Manager-based 工作流（<code>ManagerBasedRLEnv</code>）组织：观测、动作、奖励、终止等要素以声明式的配置类组合定义、相互解耦——第 3.2 至 3.4 节描述的各要素即分别对应其中一块配置，本实验未作任何修改。</p>
<p><strong>硬件与软件环境</strong>（标准环境，仅列版本，不逐条解释）</p>
<div class="plist">
  ${kv("GPU", "NVIDIA RTX 5070 Ti · 16 GB")}
  ${kv("操作系统", "Ubuntu 24.04.4 LTS")}
  ${kv("仿真平台", "Isaac Sim 5.1.0 · Isaac Lab 2.3.2")}
  ${kv("训练框架", "rsl_rl 5.0.1")}
  ${kv("深度学习库", "Python 3.11.15 · PyTorch 2.7.0 (CUDA 12.8)")}
</div>
<p><strong>Rollout（经验收集）</strong></p>
<div class="plist">
  ${pr("num_envs", "4096", '并行环境数，处于 GPU 并行仿真的高吞吐区间。环境越多，单次迭代覆盖的状态越广，梯度估计越稳定。')}
  ${pr("num_steps_per_env", "16", '每次迭代中每个环境推进 16 步，即单次迭代 4096×16 = 65,536 条样本。Cartpole 动态较快，16 步已足以估计优势。')}
  ${pr("episode_length_s", "5 s", '回合时长，换算为 300 个控制步（见下两行）。')}
  ${pr("sim.dt", "1/120 s", '物理仿真步长；步长足够小方能保证数值稳定（120 Hz）。')}
  ${pr("decimation", "2", '物理每推进 2 步，策略输出 1 次动作，即控制频率 60 Hz。物理需精细，而控制频率无需同样高。')}
  ${pr("max_iterations", "150", '官方默认值，实际收敛点远早于此（见第 5.1 节），余量用于确认平台期的稳定性。')}
</div>
<p><strong>PPO 算法超参数</strong></p>
<div class="plist">
  ${pr("clip_param", "0.2", 'PPO 的裁剪半径 ε：概率比越出 [0.8, 1.2] 后，其对优化目标的贡献被截断（机制见第 2 节）。为论文默认值，通常无需调整。')}
  ${pr("gamma (γ)", "0.99", '折扣因子决定策略的时间视野：有效视界 ≈ 1/(1−γ) = 100 步 ≈ 1.7 秒，足以覆盖"当前倾斜、数步后倒下"的因果关系。')}
  ${pr("lam (GAE λ)", "0.95", 'GAE 的偏差-方差权衡参数（定义见第 2 节），0.95 为社区通用折中值。')}
  ${pr("entropy_coef", "0.005", '熵正则项系数（作用见第 2 节）：系数过大则动作持续抖动，过小则探索不足。')}
  ${pr("value_loss_coef", "1.0", '价值损失与策略损失等权相加，两个网络由同一优化器一并更新。')}
  ${pr("num_learning_epochs", "5", '同一批数据重复学习 5 遍以提高样本利用率；遍数过多会过拟合这批由旧策略采集的数据。')}
  ${pr("num_mini_batches", "4", '每遍划分为 4 份、每份 16,384 条：小批量的梯度噪声自带正则效果，同时降低显存占用。')}
  ${pr("learning_rate", "1e-3", '初始学习率，仅为起点——实际步长由 adaptive 调度接管。')}
  ${pr("schedule", "adaptive", '按 KL 自动调节学习率：新旧策略相差过大（KL > 2×目标）则减半、过小则放大。结果中 Loss/learning_rate 的锯齿状变化即为其作用的体现。')}
  ${pr("desired_kl", "0.01", '上一行调度的目标：每次更新后新旧策略的 KL 距离 ≈ 0.01，即"小步更新"的量化目标。')}
  ${pr("max_grad_norm", "1.0", '梯度范数裁剪：当梯度范数超过 1.0 时整体缩放至该值，防止梯度爆炸破坏网络参数。')}
  ${pr("optimizer", "Adam", '自适应步长优化器，RSL-RL 默认；配合 adaptive 学习率调度后几乎无需手动调参。')}
  ${pr("seed", "42", '固定随机种子：同机、同配置重跑可复现。')}
</div>
<p><strong>评价指标</strong></p>
<div class="plist">
  ${pr("主指标 · 平均回报", "Train/mean_reward", '衡量策略整体表现的首要指标；本任务具有精确的理论上限 5.0 可供对照（第 5.3 节）。')}
  ${pr("主指标 · 回合长度", "Train/mean_episode_length", '满值 300 步表示全程不倒，是"任务是否完成"的直接判据。')}
  ${pr("辅助 · 终止方式占比", "Episode_Termination/*", '区分回合是以出界失败结束还是到时正常结束，揭示失败模式的演变。')}
  ${pr("辅助 · 探索程度", "Policy/mean_std · Loss/entropy", '反映策略从广泛探索到确定性执行的过渡进程。')}
  ${pr("辅助 · 两项损失", "Loss/value · Loss/surrogate", '价值损失反映 Critic 拟合精度，策略损失反映 Actor 更新幅度，用于监测训练的内部状态。')}
</div>
<p><strong>复现命令</strong></p>
<pre>cd /home/jeff/IsaacLab
./isaaclab.sh -p scripts/reinforcement_learning/rsl_rl/train.py \\
    --task Isaac-Cartpole-v0 --headless \\
    --logger wandb --log_project_name robot-learning-dashboard</pre>
<p class="chart-note">命令未覆盖任何影响训练结果的超参——随机种子、迭代数、并行环境数均取任务注册的默认配置（42 / 150 / 4096），仅设置无渲染运行与日志选项，同机重跑即可复现。曲线同时写入本地 TensorBoard 与 wandb，本地部分由 <code>scripts/export_run.py</code> 导出为本页数据。</p>

<h2 class="section-title"><span class="hnum">4</span>实验结果</h2>
<p>本次训练共 150 次迭代，累计约 983 万步仿真；训练循环总耗时约 17 秒（经验采集 11.3 秒、网络更新 5.3 秒，不含仿真器启动与场景加载），平均吞吐约每秒 60 万步。总体结果：平均回报由初始的 0.13 收敛至 <strong>4.94</strong>；平均回合长度由 12.8 步升至 <strong>300 步满值</strong>（自第 36 次迭代起）；此后不再出现失败终止。全部训练曲线如图 6 所示，逐条解读见第 5 节。</p>
<figure class="chart-fig">
<div data-rl-chart="locomotion/cartpole-balance"></div>
<figcaption>图 6 · 训练全程的全部记录曲线（17 条，按类别分组）。数据由本地 TensorBoard 导出、plotly 渲染，未作平滑或修饰。</figcaption>
</figure>

<h2 class="section-title"><span class="hnum">5</span>实验分析</h2>

<h3 class="section-sub"><span class="hnum">5.1</span>学习过程</h3>
<p>将图 6 中的主曲线（回报、回合长度）与两条终止曲线对照阅读，可以清晰地看到学习过程经历了四个阶段：</p>
<div class="plist">
  ${pr("Ⅰ · 回报先下降", "第 0–7 迭代", '回报由初始的 0.13 下降至 <b>−4.48</b>。这并非异常，而是探索阶段的正常代价：初始策略近乎随机，且探索噪声较大（σ = 1.0），小车动作杂乱，平均不到 13 步即越出边界，每次失败均触发重罚，回报因而降至最低点。此处提示了阅读强化学习曲线的一个要点：<em>训练初期回报下降并不意味着训练失败</em>。')}
  ${pr("Ⅱ · 先学会立杆", "第 7–25 迭代", '最先改善的是回合长度：至第 10 次迭代，平均已能维持约 96 步，表明策略已初步掌握"以小车稳定杆"的方式。值得注意的是，同一时期"出界终止"的占比反而升至 <b>100%</b>——杆虽已立稳，小车却持续漂移，几乎每个回合都以越界告终。两个目标之间的张力在此清晰显现：<em>仅能立杆并不足够，还须使小车留在场地内</em>。')}
  ${pr("Ⅲ · 学会两全", "第 25–36 迭代", '策略开始同时兼顾立杆与守界：出界占比由 100% 迅速降至 0，取而代之的是"到时正常结束"（time_out）占满 100%。回报在第 32 次迭代越过 4.5，回合长度在<b>第 36 次迭代达到 300 步满值</b>。至此，任务已基本完成。')}
  ${pr("Ⅳ · 精修", "第 36–150 迭代", '此后进入精修阶段：策略进一步将杆立得更直、动作更省，回报由约 4.6 缓慢升至 4.94。整个平台期无退化、无震荡，可判定为收敛。')}
</div>

<h3 class="section-sub"><span class="hnum">5.2</span>辅助指标</h3>
<p>以上为行为层面的变化；辅助曲线则反映网络内部的状态，且多条曲线之间可相互印证：</p>
<div class="plist">
  ${pr("Policy/mean_std", "1.0 → 0.083", '策略的探索噪声，最终仅为初值的约十二分之一。这表明策略从大范围试探逐步过渡到高确定性的执行，且其收窄进程与回报进入平台期同步——当探索不再带来增益后，策略便不再保留多余的随机性。')}
  ${pr("Loss/entropy", "1.42 → −1.08", '一维高斯分布的熵 = ln σ + ½ln(2πe) ≈ ln σ + 1.42，是 ln σ 的仿射函数，σ 降至约 0.24 以下时转为负值。本次数据与该式精确吻合：σ = 1.0 时熵恰为常数项 1.42，σ 收至 0.083 时熵 ≈ ln 0.083 + 1.42 ≈ −1.07。熵为负并非异常，恰是动作分布高度集中的佐证，与 mean_std 曲线互为印证。')}
  ${pr("Loss/value", "峰 0.264 → ≈ 0", '价值损失在第 5 次迭代附近达到峰值，之后逐步收敛至接近 0。峰值出现在第一阶段末尾并不意外：该阶段策略变化剧烈，回报分布随之剧变，Critic 难以准确估计；待策略稳定后，Critic 迅速跟上，最终对单回合回报的预测已相当精确。')}
  ${pr("Loss/learning_rate", "0 ~ 0.01 锯齿", '自适应调度的作用体现：每次更新后，依据新旧策略的实际 KL 距离上调或减半学习率，始终将更新幅度钳制在目标值附近。锯齿越密集，表示调节越频繁——这正是无需手动调节学习率的原因。')}
  ${pr("分项奖励终值", "alive 1.0 · pole_pos −0.0072 · terminating 0", 'alive 取满值表明每一步均存活；pole_pos 的扣分收窄至接近 0，表明杆几乎全程竖直；terminating 归零，表明不再发生失败。宏观曲线与分项数据指向一致的结论。')}
</div>

<h3 class="section-sub"><span class="hnum">5.3</span>理论上限</h3>
<p>该任务的回报上限可以精确计算。按第 3.3 节的累加规则，一个满回合 5 秒内 <code>alive</code> 项至多贡献 1.0 × 5 = 5.0，其余四项均为罚项，只会向下扣减，因此理论上限为 5.0。实测值 4.94，与上限相差的 0.06 主要来自 <code>pole_pos</code> 与两项速度惩罚的微小常驻扣分——杆无法在数学意义上做到绝对竖直与绝对静止。可见策略已非常接近该任务的性能上限，继续训练的边际收益趋近于零。</p>

<h3 class="section-sub"><span class="hnum">5.4</span>策略行为</h3>
<p>为直观检验收敛策略的实际行为，以下回放由 <code>play.py</code> 加载最终检查点 <code>model_149.pt</code> 在同一环境中录制（时长 5 秒，即一个完整回合）：</p>
<video width="1280" height="720" controls muted loop playsinline preload="metadata" poster="assets/media/cartpole-balance/frame-early.jpg" style="width:100%;border:1px solid var(--rule);border-radius:8px" src="assets/media/cartpole-balance/play-2026-07-06.mp4"></video>
<figure>
<div class="frames">
  <div><img src="assets/media/cartpole-balance/frame-early.jpg" width="1280" height="320" alt="回合开始：杆带初始倾角"><span class="frame-t">t ≈ 0.1 s · 初始倾斜</span></div>
  <div><img src="assets/media/cartpole-balance/frame-mid.jpg" width="1280" height="320" alt="约 1 秒：杆已恢复竖直"><span class="frame-t">t ≈ 1 s · 恢复竖直</span></div>
  <div><img src="assets/media/cartpole-balance/frame-late.jpg" width="1280" height="320" alt="约 4 秒：持续保持竖直"><span class="frame-t">t ≈ 4 s · 持续保持</span></div>
</div>
<figcaption>图 7 · 收敛策略的行为序列（自回放视频抽帧）。横向黄线为滑轨，蓝色立杆铰接于小车之上。</figcaption>
</figure>
<p>如图 7 所示，回合开始时杆因复位随机化带有明显的初始倾角（左）；策略在约 1 秒内将杆恢复至竖直（中）；此后直至回合结束，杆始终保持竖直，小车仅在滑轨中段小幅平移以维持平衡（右）。整段回放中未出现大幅往返或接近边界的行为，与第 5.2 节分项奖励的量化结论（杆角误差贴近零、速度惩罚极小）一致。</p>
<p><strong>60 秒耐力测试。</strong>训练配置中的回合长度为 5 秒——这是训练阶段的设计选择：5 秒足以判定稳定性，而频繁复位可使策略在更多样的初始状态上训练，因此常规回放至多 5 秒即复位。为检验策略能否长时间维持平衡，另行录制了一段将回合长度覆盖为 60 秒的加时回放（<code>env.episode_length_s=60</code>，仅评估用，训练配置不变）：</p>
<video width="1280" height="720" controls muted loop playsinline preload="metadata" poster="assets/media/cartpole-balance/frame-e35.jpg" style="width:100%;border:1px solid var(--rule);border-radius:8px" src="assets/media/cartpole-balance/play-endurance-60s.mp4"></video>
<figure>
<div class="frames">
  <div><img src="assets/media/cartpole-balance/frame-e10.jpg" width="1280" height="320" alt="第 10 秒：杆竖直"><span class="frame-t">t ≈ 10 s</span></div>
  <div><img src="assets/media/cartpole-balance/frame-e35.jpg" width="1280" height="320" alt="第 35 秒：杆竖直"><span class="frame-t">t ≈ 35 s</span></div>
  <div><img src="assets/media/cartpole-balance/frame-e59.jpg" width="1280" height="320" alt="第 59 秒：杆竖直"><span class="frame-t">t ≈ 59 s</span></div>
</div>
<figcaption>图 8 · 60 秒耐力回放的抽帧。三个时刻杆均保持竖直、小车均位于滑轨中点附近，全程无失败复位。</figcaption>
</figure>
<p>如图 8 所示，整段 60 秒回放中未发生任何失败：杆始终保持竖直，小车始终停留在滑轨中段。这与平衡问题的性质一致——策略一旦将系统稳定在竖直不动点附近，维持 5 秒与维持 60 秒并无本质差别；决定成败的是最初一秒左右的恢复阶段，而非之后的保持阶段。</p>

<h2 class="section-title"><span class="hnum">6</span>局限性</h2>
<p>本报告存在三点局限：</p>
<ul>
  <li><strong>单种子的单次运行。</strong>未运行多个随机种子，因而无法给出方差与置信区间。对首个实验尚可接受，但正式的对比实验（如奖励项消融）至少需 3 个随机种子方具说服力。</li>
  <li><strong>直接读取训练曲线。</strong>未设置独立的评估流程（关闭随机化、固定初始状态、运行 N 个回合作统计）；独立评估管线将在后续实验中建设。</li>
  <li><strong>未测试鲁棒性。</strong>全程无外力扰动、无参数域随机化，抗扰动能力无从评估；鲁棒性将在后续行走任务中重点考察。</li>
</ul>

<h2 class="section-title"><span class="hnum">7</span>结论与未来工作</h2>
<p><strong>结论。</strong>在 4096 个并行环境、150 次迭代（训练循环约 17 秒）内，PPO 策略稳定收敛：最终平均回报 4.94，达到理论上限的 98.8%，自第 36 次迭代起满回合无失败，平台期无退化，回放确认策略能将随机倾斜的杆稳定恢复并保持竖直（60 秒加时回放亦全程无失败），可判定任务完成。方法层面，Isaac Lab 官方默认配置未作任何修改即收敛，表明"主目标 + 失败重罚 + 小权重塑形"的奖励设计与 PPO 默认超参数在该低维任务上已完全够用。</p>
<p><strong>未来工作。</strong>下一个实验为 <em>Ant 四足行走</em>，其观测与动作维度均将提升一个量级，用于检验同一套 PPO 配置在更高维任务上是否依然有效（具体维度以其实验页为准）。独立评估管线与多种子统计将随后续实验逐步建设。</p>

<h2 class="section-title appendix">附录 · 关于本报告</h2>
<p><strong>理论深度。</strong>本报告是一份实验记录，第 2 节的理论仅陈述至读懂本实验所需的程度；完整的推导与讨论请参阅下列文献。</p>
<p><strong>数据来源。</strong>正文全部配置数值取自本机 Isaac Lab 2.3.2 的配置文件；训练曲线由真实 run（<span class="mono" style="font-family:var(--mono);font-size:13px">2026-07-06_08-00-30</span>）的本地 TensorBoard 导出；训练耗时与网络参数量分别实测自该 run 的事件文件与检查点；回放视频与帧由 <code>play.py</code> 加载 <code>model_149.pt</code> 录制。均未作人工修饰。</p>
<p><strong>参考文献。</strong></p>
<ol>
  <li>J. Schulman, F. Wolski, P. Dhariwal, A. Radford, O. Klimov. <em>Proximal Policy Optimization Algorithms</em>. arXiv:1707.06347, 2017.（PPO 原论文）</li>
  <li>J. Schulman, P. Moritz, S. Levine, M. Jordan, P. Abbeel. <em>High-Dimensional Continuous Control Using Generalized Advantage Estimation</em>. arXiv:1506.02438, 2015.（GAE 原论文）</li>
  <li>N. Rudin, D. Hoeller, P. Reist, M. Hutter. <em>Learning to Walk in Minutes Using Massively Parallel Deep Reinforcement Learning</em>. CoRL 2021, arXiv:2109.11978.（其配套开源库 rsl_rl 即本实验的训练框架）</li>
  <li>M. Mittal et al. <em>Orbit: A Unified Simulation Framework for Interactive Robot Learning Environments</em>. IEEE RA-L, 2023, arXiv:2301.04195.（该框架现已更名为 Isaac Lab，本实验环境来自其官方任务包）</li>
  <li>R. S. Sutton, A. G. Barto. <em>Reinforcement Learning: An Introduction</em> (2nd ed.). MIT Press, 2018.（强化学习标准教科书）</li>
</ol>
`;

/* ============================= Ant 四足行走实验 ============================= */
window.RL_CONTENT["locomotion/ant-walk"] = `
<h1 class="page-h1">Ant 四足行走实验</h1>
<p class="dek abstract"><strong>摘要：</strong>本实验研究四足机器人 Ant 的平地行走问题：以 8 个关节力矩为控制量，使机器人朝固定目标方向持续行走且不摔倒。方法上采用近端策略优化（PPO），在 Isaac Lab 的 <code>Isaac-Ant-v0</code> 环境中以 4096 个并行环境训练一个 60→400→200→100→8 的 MLP 策略，共 1000 次迭代（约 1.31 亿步，训练循环耗时约 4.9 分钟）；并以 3 个随机种子 × 3 种配置的消融实验检验能耗惩罚与熵正则的作用。结果表明：策略平均回报由 −0.46 升至 129.9，平均回合长度达 951/960 步；回放显示策略以对角步态持续前进。收敛后仍有约 7% 的回合以摔倒告终，说明该行走任务仍存在残余失败模式。</p>
<div class="meta" data-exp-tags></div>

<table class="kv-table">
  <caption>表 1 · 实验概要</caption>
  <tbody>
    <tr><td class="k">状态</td><td><strong>已训练 ✓</strong>　<span class="mono" style="font-family:var(--mono);font-size:13px">run 2026-07-07_08-19-22_base-s42（另有 8 个消融 run，见第 6 节）</span></td></tr>
    <tr><td class="k">机器人</td><td>Ant（四足；8 个力矩驱动关节，直接 effort 执行器）</td></tr>
    <tr><td class="k">技术路线</td><td>强化学习 · PPO</td></tr>
    <tr><td class="k">任务环境</td><td><code>Isaac-Ant-v0</code>（Isaac Lab）</td></tr>
    <tr><td class="k">任务配置</td><td>Isaac Lab 官方预设；主 run 未修改，消融 run 仅命令行覆盖单个参数（见第 6 节）</td></tr>
    <tr><td class="k">并行环境数</td><td>4096</td></tr>
    <tr><td class="k">训练迭代数</td><td>1000（单迭代 131,072 步，总计约 1.31 亿步）</td></tr>
    <tr><td class="k">训练耗时</td><td>约 4.9 分钟 / run（采集 206 s + 更新 85 s，不含仿真器启动；吞吐约 45 万步/秒）</td></tr>
    <tr><td class="k">观测 / 动作维度</td><td>60 维 → 8 维</td></tr>
    <tr><td class="k">策略网络</td><td>MLP，三个隐藏层 400/200/100，ELU 激活；Actor 与 Critic 合计 250,317 个参数</td></tr>
    <tr><td class="k">最终平均回报</td><td><strong>129.9</strong>（末 100 迭代均值 122.5；本任务无精确理论上限）</td></tr>
    <tr><td class="k">回合步数</td><td><strong>951 / 960</strong>（末 100 迭代均值 908.7；约 7% 回合仍以摔倒终止）</td></tr>
    <tr><td class="k">消融实验</td><td>3 条件 × 3 种子共 9 个 run（能耗惩罚 / 熵正则，见第 6 节）</td></tr>
  </tbody>
</table>

<figure>${heroLoopSVG({ policy: "策略 π · MLP 60→400→200→100→8", env: "Isaac-Ant-v0", aDim: "⁸", sDim: "⁶⁰" })}<figcaption>图 1 · 智能体与环境的交互回路。策略读入 60 维观测并输出 8 维动作，环境返回下一观测与标量奖励；训练目标是最大化累计回报。</figcaption></figure>

<h2 class="section-title"><span class="hnum">1</span>背景与问题定义</h2>
<p>本任务通过强化学习训练一个策略，使四足机器人 Ant 朝固定目标方向持续行走。被控系统如图 2 所示。</p>
<figure>${antSVG()}<figcaption>图 2 · Ant 物理系统示意（俯视）。球形躯干四周对称分布 4 条两段式腿，每腿 2 个关节（髋 <code>.*_leg</code> + 踝 <code>.*_foot</code>），共 8 个可驱动关节；任务目标为朝 +x 方向的远处目标点 (1000, 0, 0) 行走，躯干高度低于 0.31 m 判定摔倒、回合失败终止。</figcaption></figure>
<p><strong>机器人</strong>：躯干 + 4 条腿共 8 个力矩驱动关节——4 个髋关节（<code>.*_leg</code>）与 4 个踝关节（<code>.*_foot</code>，初始角 ±45°）；执行器无内置刚度与阻尼，策略输出即关节力矩。</p>
<p><strong>控制</strong>：策略每个控制步能做的唯一一件事，是给这 8 个关节各输出一个力矩，如图 3 所示。力矩驱动腿绕关节摆动，四条腿的摆动配合成周期性步态，机器人由此前进——从"出力矩"到"会走路"之间没有任何手写的控制器，全部由策略学出。</p>
<figure>${antLegControlSVG()}<figcaption>图 3 · 控制量示意（侧视，放大 1 条腿）。每条腿两个主动关节——髋（<code>.*_leg</code>）与踝（<code>.*_foot</code>）——各受一个力矩 τ 驱动（弧形箭头）；4 条腿共 8 个力矩，即策略的全部输出。执行器无内置刚度与阻尼，网络输出经缩放后直接作为关节力矩（细节见第 3.2 节）。</figcaption></figure>
<p><strong>目标</strong>：朝 +x 方向的目标点 (1000, 0, 0) 持续行走——目标足够远，等价于"一直往前走"；同时保持躯干直立不摔倒。</p>
<p>本任务的主要难点在于高维连续控制与接触动力学：策略须协调 4 条腿形成周期性步态；足端离地、触地与摩擦带来高度非线性的状态转移；且"走得快"（前进奖励）与"走得稳"（不摔倒）、"走得省"（能耗惩罚）之间存在多目标权衡。</p>
<p>按 MDP 框架，问题的各要素定义见表 2：</p>
<table class="kv-table">
  <caption>表 2 · 问题的形式化定义</caption>
  <tbody>
    <tr><td class="k">环境</td><td><code>Isaac-Ant-v0</code>，Isaac Lab 提供的 GPU 并行物理仿真环境（Manager-based）</td></tr>
    <tr><td class="k">智能体</td><td>控制 8 个关节的策略网络 π（结构见第 3.1 节）</td></tr>
    <tr><td class="k">状态 / 观测</td><td>60 维连续向量：躯干运动状态、关节状态、足端受力、上一步动作（第 3.2 节）</td></tr>
    <tr><td class="k">动作</td><td>8 维连续量：各关节力矩（第 3.2 节）</td></tr>
    <tr><td class="k">奖励</td><td>7 项加权和：前进 + 存活 + 直立/朝向奖励 + 三类正则惩罚（第 3.3 节）</td></tr>
    <tr><td class="k">回合</td><td>16 秒（960 个控制步）到时正常结束；躯干高度 &lt; 0.31 m 则摔倒终止（第 3.4 节）</td></tr>
    <tr><td class="k">目标</td><td>最大化折扣累计回报，折扣因子 γ = 0.99</td></tr>
  </tbody>
</table>

<h2 class="section-title"><span class="hnum">2</span>理论基础</h2>
<p>本实验将任务表述为 MDP，并采用 Actor-Critic 架构与 PPO 算法求解。优势 <code>A = 实际回报 − V(s)</code> 用于评估动作相对 Critic 预期的好坏；GAE(λ) 将多步时序差分误差聚合为更稳定的优势估计；PPO 通过裁剪新旧策略概率比，限制单次更新幅度，降低步态突然崩溃的风险。</p>
<p>PPO 对任务的假设较少：只要动作连续、奖励可计算，复杂性主要由网络容量与交互数据量吸收。本实验采用 400/200/100 的隐藏层宽度，并以约 1.31 亿步交互数据训练策略；这种以大规模并行采样支撑 on-policy 更新的方式，是 PPO 在机器人运动控制中常用的实践路径。</p>
<p>本任务的主奖励是<strong>前进速度</strong>（progress），走得越快回报越高，不存在可解析计算的回报上限。因此第 5 节的分析以多种子间的一致性与消融对照作为收敛质量的定量参照。</p>

<h2 class="section-title"><span class="hnum">3</span>实验框架</h2>
<p>本节完整描述本实验的构成：策略由两个神经网络组成（3.1），读入 60 维观测、输出 8 维关节力矩（3.2），其行为由 7 项奖励塑造（3.3），回合的起止方式见 3.4，PPO 训练流程见 3.5，运行环境与全部超参数见 3.6。</p>

<h3 class="section-sub"><span class="hnum">3.1</span>网络结构</h3>
<p>Actor 与 Critic 仍为同构 MLP（60→400→200→100→输出，ELU 激活），架构分别如图 4 与图 5 所示。网络容量需要匹配 60 维观测与 8 维动作的表达需求：Actor 125,516 个参数（含 8 个可学习的动作标准差）、Critic 124,801 个，合计 250,317 个（实测自检查点文件），属于小型但足够表达该任务策略的 MLP。</p>
<figure>${RLNet.svg(antMlpCfg("actor"))}<figcaption>图 4 · <strong>Actor（策略网络）</strong>的架构：60 维观测经三个 ELU 隐藏层映射为 8 维动作均值 <strong>μ</strong>；μ 与逐维可学习的 logσ 共同构成高斯策略 <strong>N(μ, σ²)</strong>——训练时从中采样以探索，部署时直接取均值。各层参数量由维度实时计算。最终部署的仅此网络。</figcaption></figure>
<figure>${RLNet.svg(antMlpCfg("critic"))}<figcaption>图 5 · <strong>Critic（价值网络）</strong>的架构：隐藏层与 Actor 同构，末层输出改为 1 维的标量价值 <strong>V(s)</strong>。仅在训练期为 Actor 提供参照，不参与部署。</figcaption></figure>
<div class="plist">
  ${pr("actor_hidden_dims", "[400, 200, 100]", '官方为该任务配置的容量：60 维输入、8 维输出，且需在网络内部隐式形成步态协调，32×2 量级的小网络不再够用。金字塔形逐层收窄是常见做法。')}
  ${pr("critic_hidden_dims", "[400, 200, 100]", '与 Actor 同构（对称 Actor-Critic），本任务状态完全可观。')}
  ${pr("activation", "elu", '负半区平滑，可降低神经元长期失活风险，是连续控制 MLP 的常见选择。')}
  ${pr("init_noise_std", "1.0", '初始探索噪声：8 维动作各自带可学习标准差，初值 1.0；本次实测 Policy/mean_std 由 0.99 收至 0.042。')}
  ${pr("obs normalization", "False", '观测不作在线归一化，与官方默认一致；60 维观测中足端力已按 0.1、关节速度已按 0.2 预缩放（见 3.2）。')}
</div>

<h3 class="section-sub"><span class="hnum">3.2</span>观测与动作</h3>
<p><strong>观测空间（60 维，两个网络共用）。</strong>由 11 个观测项按固定顺序拼接而成，构成见表 3。除本体运动状态外，还包含<strong>足端六维力/力矩</strong>（接触信息）与<strong>上一步动作</strong>——前者让策略"感到"脚何时触地，后者为力矩控制提供了动作连续性的参照。</p>
<table>
  <caption>表 3 · 观测向量构成（60 维）</caption>
  <thead><tr><th>#</th><th>观测项</th><th>物理含义</th><th>维度</th></tr></thead>
  <tbody>
    <tr><td>1</td><td><code>base_height</code></td><td>躯干离地高度</td><td>1</td></tr>
    <tr><td>2</td><td><code>base_lin_vel</code></td><td>躯干线速度</td><td>3</td></tr>
    <tr><td>3</td><td><code>base_ang_vel</code></td><td>躯干角速度</td><td>3</td></tr>
    <tr><td>4</td><td><code>base_yaw_roll</code></td><td>躯干偏航与滚转角</td><td>2</td></tr>
    <tr><td>5</td><td><code>base_angle_to_target</code></td><td>朝向与目标方向的夹角</td><td>1</td></tr>
    <tr><td>6</td><td><code>base_up_proj</code></td><td>躯干竖直度（up 向量投影）</td><td>1</td></tr>
    <tr><td>7</td><td><code>base_heading_proj</code></td><td>前进方向对准度（heading 投影）</td><td>1</td></tr>
    <tr><td>8</td><td><code>joint_pos_norm</code></td><td>8 关节位置（按限位归一化）</td><td>8</td></tr>
    <tr><td>9</td><td><code>joint_vel_rel</code></td><td>8 关节速度（×0.2 缩放）</td><td>8</td></tr>
    <tr><td>10</td><td><code>feet_body_forces</code></td><td>4 足端各 6 维力/力矩（×0.1 缩放）</td><td>24</td></tr>
    <tr><td>11</td><td><code>actions</code></td><td>上一控制步的动作</td><td>8</td></tr>
  </tbody>
</table>
<div class="plist">
  ${pr("观测噪声", "无", 'enable_corruption = False：本实验聚焦基础步态学习，不额外加入感知噪声。')}
  ${pr("为何有足端力", "接触信息", '行走的本质是管理与地面的接触；足端六维力让策略直接观测到触地时序与支撑力分布，是步态形成的关键输入。')}
  ${pr("为何有上步动作", "动作连续性", '力矩控制下，策略若能看到自己上一步的输出，更容易学出平滑、周期性的动作序列。')}
</div>
<p><strong>动作空间（8 维）。</strong>策略在每个控制步输出 8 个标量：</p>
<div class="plist">
  ${pr("驱动对象", "全部 8 关节", '4 髋 + 4 踝全部主动驱动；任务难点主要在多腿协调、接触节律与稳定性权衡。')}
  ${pr("控制方式", "JointEffortAction", '直接输出关节力矩，不经 PD 环；执行器 stiffness=0、damping=0，策略需自行学出稳定的力矩序列。')}
  ${pr("scale", "7.5", '网络输出量级约 N(0,1)，×7.5 放大到该机器人关节的合理力矩量级。')}
</div>

<h3 class="section-sub"><span class="hnum">3.3</span>奖励函数</h3>
<p>各项奖励按<strong>权重 × 控制步长（1/60 s）</strong>逐步累加。奖励构成为 <strong>1 个主目标（progress，前进）+ 3 个正向辅助（alive / upright / move_to_target）+ 3 个正则惩罚（action_l2 / energy / joint_pos_limits）</strong>；姿态、朝向与能耗项共同约束步态质量。七项权重的构成如图 6 所示。</p>
<figure>
<div class="rewards">
  <div class="rw"><span class="nm">progress<small>朝目标前进的速度</small></span><span class="bar"><i class="p" style="width:50%"></i></span><span class="w p">+1.0</span></div>
  <div class="rw"><span class="nm">alive<small>存活奖励</small></span><span class="bar"><i class="p" style="width:44.1%"></i></span><span class="w p">+0.5</span></div>
  <div class="rw"><span class="nm">move_to_target<small>朝向目标运动奖励</small></span><span class="bar"><i class="p" style="width:44.1%"></i></span><span class="w p">+0.5</span></div>
  <div class="rw"><span class="nm">upright<small>躯干直立奖励</small></span><span class="bar"><i class="p" style="width:30.5%"></i></span><span class="w p">+0.1</span></div>
  <div class="rw"><span class="nm">joint_pos_limits<small>关节贴限位惩罚</small></span><span class="bar"><i class="n" style="width:30.5%"></i></span><span class="w n">−0.1</span></div>
  <div class="rw"><span class="nm">energy<small>能耗惩罚</small></span><span class="bar"><i class="n" style="width:24.6%"></i></span><span class="w n">−0.05</span></div>
  <div class="rw"><span class="nm">action_l2<small>动作幅值惩罚</small></span><span class="bar"><i class="n" style="width:5%"></i></span><span class="w n">−0.005</span></div>
</div>
<figcaption>图 6 · 奖励各项的权重。中线为零点，向右（绿）为奖励、向左（红）为惩罚；权重跨三个数量级，条长按对数刻度示意本实验内各项的相对量级，精确数值以右列为准。</figcaption>
</figure>
<p>下面逐项说明各项的定义、设计动机，以及移除后的影响（其中 energy 项的"若移除"推断在第 6 节以真实消融实验检验）：</p>
<div class="plist">
  ${pr("progress · +1.0", "progress_reward", '主目标：每步奖励与"朝目标方向的前进量"成正比，走得越快回报越高。若移除，策略失去前进动机，最优解退化为原地维持存活。')}
  ${pr("alive · +0.5", "is_alive", '存活奖励：回合未终止的每步计入。它保证"活着"本身有价值，防止策略为冲刺而无视摔倒风险。')}
  ${pr("move_to_target · +0.5", "move_to_target_bonus", '朝向奖励：速度方向对准目标（阈值 0.8）时给予奖励，引导运动方向与目标一致，抑制斜行与绕行。')}
  ${pr("upright · +0.1", "upright_posture_bonus", '直立奖励：躯干竖直度超过阈值 0.93 时给予小额奖励，塑造抬起躯干的姿态。')}
  ${pr("joint_pos_limits · −0.1", "joint_pos_limits_penalty_ratio", '关节贴近限位（>99%）的惩罚：长期顶着限位的动作既不自然也易损硬件（面向真机的习惯），迫使策略在关节行程中段工作。')}
  ${pr("energy · −0.05", "power_consumption", '能耗惩罚：按功率（力矩×角速度，齿比 15）扣分，抑制高频大力矩的"抽搐"式动作，引导省力步态。若移除的实际影响见第 6 节消融。')}
  ${pr("action_l2 · −0.005", "action_l2", '动作幅值的小额 L2 正则，与 energy 协同使动作平滑，权重刻意最小。')}
</div>

<h3 class="section-sub"><span class="hnum">3.4</span>终止与复位</h3>
<div class="plist">
  ${pr("终止 · time_out", "16 s（= 960 步）", '到时正常结束（非失败）。16 秒足以走出数十米、充分暴露步态质量。')}
  ${pr("终止 · 摔倒", "躯干高度 < 0.31 m", '躯干贴地即判摔倒，失败终止。这是行走任务最直接的失败判据。')}
  ${pr("复位 · 根位姿", "不随机", '每回合从默认位姿（原点、高度 0.5 m）开始；状态多样性主要来自关节噪声与长回合中的接触演化。')}
  ${pr("复位 · 关节位置", "± 0.2 rad", '关节角加均匀噪声，避免策略记忆单一起步动作。')}
  ${pr("复位 · 关节速度", "± 0.1 rad/s", '关节速度加小幅噪声，进一步增加起始多样性。')}
</div>

<h3 class="section-sub"><span class="hnum">3.5</span>训练流程</h3>
<p>一次训练迭代包含以下四步，共循环 1000 次：</p>
<ol>
  <li><strong>收集经验。</strong>4096 个环境各以当前策略推进 32 步，共采集 131,072 条样本。</li>
  <li><strong>计算优势。</strong>逐步计算时序差分误差 δ，并经 GAE(λ=0.95) 聚合为优势估计。</li>
  <li><strong>更新网络。</strong>样本划分为 4 个 32,768 的小批量，重复训练 5 遍；计算策略损失与价值损失（本任务熵正则系数为 0，见 3.6 与第 6 节），反向传播（梯度范数上限 1.0）、Adam 更新、按 KL 自适应调整学习率。</li>
  <li><strong>返回第 1 步</strong>，循环至第 1000 次迭代。</li>
</ol>

<h3 class="section-sub"><span class="hnum">3.6</span>环境与设置</h3>
<p>任务环境 <code>Isaac-Ant-v0</code> 来自 Isaac Lab 官方任务包，按 Manager-based 工作流组织（各要素为声明式配置、相互解耦）。本实验的主 run 未对官方配置作任何修改；消融 run 仅经命令行覆盖单个参数（第 6 节）。</p>
<p><strong>硬件与软件环境</strong>（标准环境，仅列版本）</p>
<div class="plist">
  ${kv("GPU", "NVIDIA RTX 5070 Ti · 16 GB")}
  ${kv("操作系统", "Ubuntu 24.04.4 LTS")}
  ${kv("仿真平台", "Isaac Sim 5.1.0 · Isaac Lab 2.3.2")}
  ${kv("训练框架", "rsl_rl 5.0.1")}
  ${kv("深度学习库", "Python 3.11.15 · PyTorch 2.7.0 (CUDA 12.8)")}
</div>
<p><strong>Rollout（经验收集）</strong></p>
<div class="plist">
  ${pr("num_envs", "4096", '并行环境数；Ant 单步物理开销较高，实测吞吐约 45 万步/秒。')}
  ${pr("num_steps_per_env", "32", '每迭代每环境 32 步；较长片段有利于估计行走任务中的长程优势。')}
  ${pr("episode_length_s", "16 s", '回合时长，换算为 960 个控制步。')}
  ${pr("sim.dt", "1/120 s", '物理步长 120 Hz。')}
  ${pr("decimation", "2", '控制频率 60 Hz。')}
  ${pr("max_iterations", "1000", '官方默认值。本次回报在后半程仍缓慢爬升（见第 5.1 节），1000 迭代取的是"足够好"而非"完全平台化"。')}
</div>
<p><strong>PPO 算法超参数</strong></p>
<div class="plist">
  ${pr("clip_param", "0.2", '裁剪半径，论文默认。')}
  ${pr("gamma (γ)", "0.99", '有效视界 ≈ 100 步 ≈ 1.7 秒，覆盖一个步态周期绰绰有余。')}
  ${pr("lam (GAE λ)", "0.95", '社区通用折中。')}
  ${pr("entropy_coef", "0.0", '官方配置关闭熵正则；第 6 节用消融实验检验该选择对本任务的影响。')}
  ${pr("value_loss_coef", "1.0", '两项损失等权。')}
  ${pr("num_learning_epochs", "5", '同批数据学 5 遍。')}
  ${pr("num_mini_batches", "4", '每份 32,768 条。')}
  ${pr("learning_rate", "5e-4", '初始学习率；实际步长由 adaptive 调度接管。')}
  ${pr("schedule / desired_kl", "adaptive / 0.01", '按 KL 距离自动调节学习率，限制单次策略更新幅度。')}
  ${pr("max_grad_norm", "1.0", '梯度范数裁剪。')}
  ${pr("optimizer", "Adam", 'RSL-RL 默认。')}
  ${pr("seed", "42（主 run）", '消融批次另用 43 / 44，共 3 个种子（第 6 节）。')}
</div>
<p><strong>评价指标</strong></p>
<div class="plist">
  ${pr("主指标 · 平均回报", "Train/mean_reward", '衡量策略整体表现；本任务无精确理论上限，以多种子一致性与消融对照作定量参照（第 5.3 / 6 节）。')}
  ${pr("主指标 · 回合长度", "Train/mean_episode_length", '满值 960 步；不足部分对应摔倒终止的回合。')}
  ${pr("辅助 · 终止方式占比", "Episode_Termination/*", '摔倒（torso_height）与到时（time_out）的占比，直接给出"摔倒率"。')}
  ${pr("辅助 · 探索与损失", "Policy/mean_std · Loss/*", '用于监控动作分布收缩、价值拟合与策略更新稳定性。')}
</div>
<p><strong>复现命令</strong>（主 run；消融 run 的覆盖参数见第 6 节表 4）</p>
<pre>cd /home/jeff/IsaacLab
./isaaclab.sh -p scripts/reinforcement_learning/rsl_rl/train.py \\
    --task Isaac-Ant-v0 --headless --run_name base-s42</pre>
<p class="chart-note">命令未覆盖任何影响训练结果的超参——随机种子、迭代数、并行环境数均取任务注册的默认配置（42 / 1000 / 4096）。曲线写入本地 TensorBoard，由 <code>scripts/export_run.py</code> 导出为本页数据。</p>

<h2 class="section-title"><span class="hnum">4</span>实验结果</h2>
<p>主 run（baseline，种子 42）共 1000 次迭代、约 1.31 亿步仿真；训练循环总耗时约 4.9 分钟（经验采集 206 秒、网络更新 85 秒，不含仿真器启动），平均吞吐约每秒 45 万步。总体结果：平均回报由初始的 −0.46 升至 <strong>129.9</strong>（末 100 迭代均值 122.5）；平均回合长度由 19.7 步升至 <strong>951 步</strong>（上限 960，末 100 迭代均值 908.7）；收敛后仍有约 <strong>7%</strong> 的回合以摔倒终止。全部训练曲线如图 7 所示，逐条解读见第 5 节。</p>
<figure class="chart-fig">
<div data-rl-chart="locomotion/ant-walk"></div>
<figcaption>图 7 · 主 run 训练全程的全部记录曲线（21 条，按类别分组）。数据由本地 TensorBoard 导出、plotly 渲染，未作平滑或修饰。</figcaption>
</figure>

<h2 class="section-title"><span class="hnum">5</span>实验分析</h2>

<h3 class="section-sub"><span class="hnum">5.1</span>学习过程</h3>
<p>将图 7 中的主曲线与终止占比曲线对照阅读，本次学习大致分为三个阶段：</p>
<div class="plist">
  ${pr("Ⅰ · 先学会不摔", "第 0–43 迭代", '回报先降至 <b>−5.73</b>（第 20 迭代）：随机力矩下正则惩罚全额扣分而前进为零。但回合长度以极快速度改善——第 31 迭代平均已超 900 步。值得注意的是摔倒占比在第 50 迭代前后达到峰值约 17%：策略先学会的是"不乱动就不容易摔"，而非行走。回报在第 43 迭代转正过 10。')}
  ${pr("Ⅱ · 学会行走", "第 43–181 迭代", '回报进入快速上升期：第 76 迭代过 50，第 181 迭代过 100。这一阶段 progress 项成为回报主体——策略从"站住"过渡到"向前走"，摔倒占比同步回落至约 10%。')}
  ${pr("Ⅲ · 步态精修", "第 181–1000 迭代", '回报由 100 缓慢爬升至 129.9（第 444 迭代过 120；第 500 → 999 迭代仍有约 +18）。<em>本任务到预算耗尽仍未完全平台化</em>——前进速度没有硬上限，更多训练仍可能换来更快的步态。摔倒占比稳定在 6–7%，未随回报继续下降：更快的行走与残余摔倒风险并存。')}
</div>

<h3 class="section-sub"><span class="hnum">5.2</span>辅助指标</h3>
<div class="plist">
  ${pr("Policy/mean_std", "0.99 → 0.042", '8 维动作的平均探索噪声收窄至初值的约 1/24，节奏与回报增速放缓同步，表明策略逐渐转向确定性执行。')}
  ${pr("Loss/entropy", "11.31 → −18.21", '8 维对角高斯的熵 = Σln σᵢ + 8×½ln(2πe) ≈ Σln σᵢ + 11.35。初始 σᵢ≈1 时熵恰为常数项 11.35（实测 11.31，吻合）；随各维 σ 收窄，熵转深负。仍是"分布高度集中"的佐证。')}
  ${pr("Episode_Reward 分项终值", "progress 8.45 · alive 0.48 · move_to_target 0.48", '分项为"每秒得分速率"：progress 8.45/s 占绝对主体（对应稳定前进速度），alive 与 move_to_target 接近各自权重上限（0.5），upright 0.095 ≈ 上限 0.1——姿态与朝向目标基本被满足。')}
  ${pr("正则项终值", "energy −1.29 · joint_pos_limits −0.34 · action_l2 −0.02", 'energy 是最大的常驻扣分（行走本身耗能，不可能归零）；joint_pos_limits 仍有 −0.34，说明步态中存在贴限位的动作，是后续可优化的信号。')}
  ${pr("Episode_Termination", "torso_height 占比 ~6.6%（末段）", '收敛后每 15 个回合仍约有 1 个以摔倒告终。行走失败模式没有被彻底消除，只是被压低；鲁棒性仍需通过独立评估和域随机化进一步验证。')}
</div>

<h3 class="section-sub"><span class="hnum">5.3</span>多种子稳定性</h3>
<p>本任务没有可解析计算的回报上限，收敛质量以多种子间的一致性作定量参照。基线配置以 3 个随机种子（42 / 43 / 44）独立重复训练，回报曲线如图 8 所示：三条曲线形态一致，末 100 迭代均值分别为 122.5、116.7、122.1，种子间统计为 <strong>120.4 ± 3.2</strong>（标准差仅为均值的 2.7%）；平均回合长度 906.3 ± 2.6 步、摔倒占比 7.0% ± 0.7% 同样高度一致。可以认为主 run 的结论不依赖于特定种子。</p>
<figure class="chart-fig">
<div data-rl-compare="locomotion/ant-walk-seeds"></div>
<figcaption>图 8 · 基线配置 3 个随机种子的回报曲线（Train/mean_reward）。三条曲线以线型区分，形态与终值高度一致。</figcaption>
</figure>

<h3 class="section-sub"><span class="hnum">5.4</span>策略行为</h3>
<p>以下回放由跟随镜头录制（加载主 run 最终检查点 <code>model_999.pt</code>，时长 16 秒即一个完整回合；镜头随机器人移动，地面网格的流动反映实际前进）：</p>
<video width="1280" height="720" controls muted loop playsinline preload="metadata" poster="assets/media/ant-walk/frame-mid.jpg" style="width:100%;border:1px solid var(--rule);border-radius:8px" src="assets/media/ant-walk/play-16s.mp4"></video>
<figure>
<div class="frames">
  <div><img src="assets/media/ant-walk/frame-early.jpg" width="1280" height="480" alt="第 1 秒：起步"><span class="frame-t">t ≈ 1 s</span></div>
  <div><img src="assets/media/ant-walk/frame-mid.jpg" width="1280" height="480" alt="第 8 秒：行进中"><span class="frame-t">t ≈ 8 s</span></div>
  <div><img src="assets/media/ant-walk/frame-late.jpg" width="1280" height="480" alt="第 15 秒：持续行进"><span class="frame-t">t ≈ 15 s</span></div>
</div>
<figcaption>图 9 · 收敛策略的行走序列（自回放视频抽帧，跟随镜头）。三个时刻躯干均保持撑起，四腿处于步态周期的不同相位。</figcaption>
</figure>
<p>如图 9 所示，策略全程保持躯干撑起、四腿交替支撑前进，未出现拖行或翻倒；视频中可见其以近似对角交替的方式协调四腿、朝固定方向持续行走。</p>
<p><strong>60 秒耐力测试。</strong>评估时将回合长度覆盖为 60 秒（<code>env.episode_length_s=60.0</code>，仅评估用）录制加时回放，检验长时间行走的持续性：</p>
<video width="960" height="540" controls muted loop playsinline preload="metadata" poster="assets/media/ant-walk/frame-e35.jpg" style="width:100%;border:1px solid var(--rule);border-radius:8px" src="assets/media/ant-walk/play-endurance-60s.mp4"></video>
<figure>
<div class="frames">
  <div><img src="assets/media/ant-walk/frame-e10.jpg" width="1280" height="480" alt="第 10 秒"><span class="frame-t">t ≈ 10 s</span></div>
  <div><img src="assets/media/ant-walk/frame-e35.jpg" width="1280" height="480" alt="第 35 秒"><span class="frame-t">t ≈ 35 s</span></div>
  <div><img src="assets/media/ant-walk/frame-e58.jpg" width="1280" height="480" alt="第 58 秒"><span class="frame-t">t ≈ 58 s</span></div>
</div>
<figcaption>图 10 · 60 秒耐力回放的抽帧。三个时刻均保持行走姿态，全程未摔倒。</figcaption>
</figure>
<p>如图 10 所示，整段 60 秒回放中机器人持续行走、未发生摔倒。需要说明的是，这是单次回放的结果：训练统计中约 7% 的回合以摔倒终止（第 5.2 节），单次 60 秒不摔并不代表零摔倒率，只说明"持续行走一分钟"在该策略的正常能力范围之内。</p>

<h2 class="section-title"><span class="hnum">6</span>消融与对比实验</h2>
<p>为检验两处设计选择的实际作用，本实验开展了 3 条件 × 3 种子共 9 个 run 的消融：各条件的覆盖参数如表 4 所示，除该单参数外所有 run 配置完全相同，种子取 42 / 43 / 44，统计口径为末 100 迭代均值的种子间均值 ± 标准差（n=3, ddof=1）。</p>
<table>
  <caption>表 4 · 消融实验设计</caption>
  <thead><tr><th>条件</th><th>覆盖参数</th><th>检验目标</th></tr></thead>
  <tbody>
    <tr><td>baseline</td><td>无（官方默认）</td><td>对照组</td></tr>
    <tr><td>no-energy</td><td><code>env.rewards.energy.weight=0</code></td><td>能耗惩罚对步态与稳定性的作用（验证第 3.3 节"若移除"推断）</td></tr>
    <tr><td>entropy</td><td><code>agent.algorithm.entropy_coef=0.005</code></td><td>本任务官方默认关闭熵正则（系数 0），开启后是否有益</td></tr>
  </tbody>
</table>
<p>9 个 run 的回报曲线如图 11 所示，关键指标汇总见表 5：</p>
<figure class="chart-fig">
<div data-rl-compare="locomotion/ant-walk-ablation"></div>
<figcaption>图 11 · 消融实验的回报曲线（Train/mean_reward，9 个 run）。同条件同色、种子以线型区分。注意 no-energy 组的奖励函数与另两组不同（缺少能耗扣分项），其回报数值不能与另两组直接比较，组内种子间对比仍有效。</figcaption>
</figure>
<table>
  <caption>表 5 · 消融结果（末 100 迭代，种子间均值 ± 标准差，n=3）</caption>
  <thead><tr><th>指标</th><th>baseline</th><th>no-energy</th><th>entropy (0.005)</th></tr></thead>
  <tbody>
    <tr><td>平均回报</td><td>120.4 ± 3.2</td><td>200.4 ± 8.0 †</td><td><strong>157.0 ± 4.1</strong></td></tr>
    <tr><td>前进速率（progress，每秒）</td><td>7.83 ± 0.34</td><td><strong>11.82 ± 0.45</strong></td><td>10.44 ± 0.17</td></tr>
    <tr><td>摔倒占比</td><td>7.0% ± 0.7%</td><td>13.9% ± 2.4%</td><td><strong>6.7% ± 0.4%</strong></td></tr>
    <tr><td>动作幅值惩罚（action_l2，每秒）</td><td>−0.018 ± 0.002</td><td>−0.049 ± 0.004</td><td>−0.032 ± 0.003</td></tr>
    <tr><td>末段探索噪声（mean_std）</td><td>0.050 ± 0.020</td><td>0.118 ± 0.006</td><td>0.151 ± 0.037</td></tr>
  </tbody>
</table>
<p class="chart-note">† no-energy 组的奖励函数缺少能耗扣分项，其"平均回报"与另两组不可直接比较；跨组比较请以 progress、摔倒占比等公共指标为准。</p>
<p><strong>能耗惩罚（no-energy vs baseline）。</strong>移除能耗惩罚后，策略的前进速率提升约 51%（11.82 对 7.83），但代价同样明确：摔倒占比由 7.0% 升至 13.9%（约翻倍），动作幅值惩罚扩大至 2.7 倍，末段探索噪声也高于基线——策略学出的是更大力矩、更激进的步态。这验证并细化了第 3.3 节的推断：能耗惩罚并非可有可无的正则项，而是以牺牲部分速度为代价、换取更稳且更省力步态的<strong>显式权衡</strong>。是否保留取决于任务目标：若只追求仿真里的速度指标可以移除，面向真机部署（能耗、电机发热、跌倒风险都是实际成本）则应保留。</p>
<p><strong>熵正则（entropy vs baseline）。</strong>两组奖励函数相同，回报可直接比较：开启 entropy_coef=0.005 后平均回报提升约 30%（157.0 ± 4.1 对 120.4 ± 3.2，种子间误差带不重叠），前进速率提升约 33%，而摔倒占比持平（6.7% 对 7.0%）。机制上可从探索噪声看出：基线的 σ 收缩至 0.050，而熵组维持在 0.151——熵奖励阻止了动作分布过早塌缩，更持久的探索找到了更快的步态，且没有以稳定性为代价。据此，<strong>官方默认的 entropy_coef=0 在本任务、本训练预算下并非最优</strong>；该发现将带入后续 G1 实验验证其普适性。</p>
<p>两点保留：以上结论基于 1000 次迭代的固定预算与 n=3 的小样本，更长训练下基线可能部分追平熵组；消融只覆盖了两个单参数，未做参数扫描与交互作用分析。</p>

<h2 class="section-title"><span class="hnum">7</span>局限性</h2>
<p>本报告存在四点局限：</p>
<ul>
  <li><strong>直接读取训练曲线。</strong>本报告未设置独立评估流程（固定初始状态、关闭探索噪声、多回合统计）；独立评估管线仍待建设。</li>
  <li><strong>无域随机化与外部扰动。</strong>平地、无推搡、无参数随机化，摔倒率 7% 是"温室"条件下的数字；鲁棒性将在 G1 地形任务中用域随机化正面处理。</li>
  <li><strong>消融覆盖有限。</strong>仅两个单参数、单一训练预算、n=3 种子；结论的外推（更长训练、其他任务）需进一步验证。</li>
  <li><strong>定性分析基于单次回放。</strong>60 秒不摔为单样本证据，与训练统计中 7% 的摔倒率并存，不应过度解读。</li>
</ul>
<p>3 种子设计缓解了单次运行偶然性的局限，但样本量仍然较小。</p>

<h2 class="section-title"><span class="hnum">8</span>结论与未来工作</h2>
<p><strong>结论。</strong>PPO 在 1000 次迭代（约 1.31 亿步、单 run 训练循环约 4.9 分钟）内学会了 Ant 的四足行走：平均回报 129.9、回合长度 951/960，跟随镜头回放确认稳定的交替步态，60 秒加时行走未摔倒；3 种子重复实验（120.4 ± 3.2）表明结果稳健。消融给出两条有实证支撑的结论：能耗惩罚是速度与稳定性/能耗之间的显式权衡（移除后速度 +51% 但摔倒率翻倍）；熵正则在本任务显著有益（+30% 回报且不损稳定性），官方默认关闭并非最优。本任务收敛后仍有约 7% 的摔倒率，且回报仍在缓慢爬升；行走问题的难度长尾开始显现。</p>
<p><strong>未来工作。</strong>下一个实验为 <em>G1 人形平地行走</em>：从四足到双足，稳定裕度大幅缩小，并将引入速度指令跟踪（不再是单向冲刺）。熵正则的发现与独立评估管线将在该实验中落实。</p>

<h2 class="section-title appendix">附录 · 关于本报告</h2>
<p><strong>理论深度。</strong>本报告的理论仅陈述至读懂实验所需的程度；PPO、GAE 与连续控制的完整推导参阅下列文献。</p>
<p><strong>数据来源。</strong>全部配置数值取自 Isaac Lab 2.3.2 源码与 run 目录的参数快照；曲线与统计来自 9 个真实 run 的本地 TensorBoard 事件文件（主 run <span class="mono" style="font-family:var(--mono);font-size:13px">2026-07-07_08-19-22_base-s42</span>；消融批次 base-s43/s44、noenergy-s42/43/44、entropy-s42/43/44，均为 2026-07-07 同机连续训练）；训练耗时与参数量分别实测自事件文件与检查点 <code>model_999.pt</code>；回放视频由跟随镜头版 play 脚本录制。均未作人工修饰。</p>
<p><strong>参考文献。</strong></p>
<ol>
  <li>J. Schulman, F. Wolski, P. Dhariwal, A. Radford, O. Klimov. <em>Proximal Policy Optimization Algorithms</em>. arXiv:1707.06347, 2017.（PPO 原论文）</li>
  <li>J. Schulman, P. Moritz, S. Levine, M. Jordan, P. Abbeel. <em>High-Dimensional Continuous Control Using Generalized Advantage Estimation</em>. arXiv:1506.02438, 2015.（GAE 原论文）</li>
  <li>N. Rudin, D. Hoeller, P. Reist, M. Hutter. <em>Learning to Walk in Minutes Using Massively Parallel Deep Reinforcement Learning</em>. CoRL 2021, arXiv:2109.11978.（rsl_rl 训练框架）</li>
  <li>M. Mittal et al. <em>Orbit: A Unified Simulation Framework for Interactive Robot Learning Environments</em>. IEEE RA-L, 2023, arXiv:2301.04195.（Isaac Lab 前身，本实验环境来自其官方任务包）</li>
  <li>R. S. Sutton, A. G. Barto. <em>Reinforcement Learning: An Introduction</em> (2nd ed.). MIT Press, 2018.（强化学习标准教科书）</li>
</ol>
`;

/* ============================= G1 平地行走 ============================= */
function g1MlpCfg(kind) {
  var actor = kind !== "critic";
  return {
    aria: (actor ? "Actor" : "Critic") + " 网络架构（G1 flat）",
    markerId: actor ? "mkNetG1A" : "mkNetG1C",
    input: { label: "观测 s ∈ ℝ¹²³", items: ["躯干速度 ·6", "重力投影 ·3", "速度命令 ·3", "关节位置 ·37", "关节速度 ·37", "上步动作 ·37"] },
    layers: [
      { type: "fc", in: 123, out: 256, act: "ELU" },
      { type: "fc", in: 256, out: 128, act: "ELU" },
      { type: "fc", in: 128, out: 128, act: "ELU" },
      { type: "fc", in: 128, out: actor ? 37 : 1, act: "线性" }
    ],
    head: actor ? { type: "gaussian", dim: 37 } : { type: "value" }
  };
}
function g1HumanoidSVG() {
  var s = "";
  s += '<path class="vb" d="M80 220 H740"/><text class="sb" x="120" y="240" text-anchor="middle">平地 plane</text>';
  s += '<circle class="nd io" cx="305" cy="58" r="20"/><path class="ar" style="stroke-width:7;stroke-linecap:round" d="M305 80 L305 145"/>';
  s += '<path class="ar" style="stroke-width:5;stroke-linecap:round" d="M305 98 L255 132 M305 98 L355 132"/>';
  s += '<path class="ar" style="stroke-width:5;stroke-linecap:round" d="M305 145 L270 215 M305 145 L340 215"/>';
  s += '<circle class="mk" cx="270" cy="215" r="5"/><circle class="mk" cx="340" cy="215" r="5"/>';
  s += '<path class="eg" d="M325 102 L415 86"/><text class="sb" x="424" y="90" text-anchor="start">torso_link：躯干接触即失败终止</text>';
  s += '<path class="ar" d="M430 155 H690" marker-end="url(#mkG1Sys)"/><text class="lb" x="560" y="136" text-anchor="middle">速度命令 c = (vₓ, vᵧ, ωz)</text>';
  s += '<text class="sb" x="560" y="178" text-anchor="middle">训练范围：vₓ∈[0,1] m/s，vᵧ∈[-0.5,0.5] m/s，ωz∈[-1,1] rad/s</text>';
  s += '<text class="sb" x="80" y="26" text-anchor="start">Unitree G1 · 37 个受控关节 · 50 Hz 关节位置目标</text>';   /* 顶部留白带，避开头部圆(305,58,r20) */
  return '<svg viewBox="0 0 820 256" role="img" aria-label="G1 平地速度跟踪任务示意"><defs><marker id="mkG1Sys" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk" d="M0 0L10 5L0 10z"/></marker></defs>' + s + '</svg>';
}
function g1ControlSVG() {
  var s = "";
  s += '<text class="sb" x="36" y="28" text-anchor="start">正视示意 · 圆点 = 受控关节组（如髋部 3 个自由度并作一点），逐侧数量见图内标注</text>';
  /* left: policy action to joint-position targets */
  s += '<rect class="nd" x="42" y="62" rx="7" width="138" height="72"/>';
  s += '<text class="lb" x="111" y="92" text-anchor="middle">Actor π</text><text class="sb" x="111" y="116" text-anchor="middle">a ∈ ℝ³⁷</text>';
  s += '<path class="ar" d="M184 98 H275" marker-end="url(#mkG1Ctl)"/><text class="sb" x="230" y="82" text-anchor="middle">逐关节动作</text>';
  s += '<rect class="nd io" x="282" y="62" rx="7" width="168" height="72"/>';
  s += '<text class="lb" x="366" y="90" text-anchor="middle">关节位置目标</text><text class="sb" x="366" y="114" text-anchor="middle">q* = q₀ + 0.5a</text>';
  s += '<path class="ar" d="M454 98 H590" marker-end="url(#mkG1Ctl)"/><text class="sb" x="497" y="82" text-anchor="middle">qᵢ* 落到各关节</text>';

  /* humanoid skeleton（正视，比例与图 2 一致：臂在上、腿在下；腕/手爪与膝保持水平间隔，避免混读） */
  s += '<circle class="nd io" cx="620" cy="50" r="17"/>';
  s += '<path class="ar" style="stroke-width:7;stroke-linecap:round" d="M620 67 L620 150"/>';                       // 躯干
  s += '<path class="ar" style="stroke-width:5;stroke-linecap:round" d="M620 92 L572 145 L548 205 M620 92 L668 145 L692 205"/>';  // 双臂：肩→肘→腕
  s += '<path class="ar" style="stroke-width:3;stroke-linecap:round" d="M548 205 L536 225 M548 205 L548 227 M548 205 L560 225 M692 205 L680 225 M692 205 L692 227 M692 205 L704 225"/>'; // 手指
  s += '<path class="ar" style="stroke-width:5;stroke-linecap:round" d="M620 150 L590 222 L590 300 M620 150 L650 222 L650 300"/>'; // 双腿：髋→膝→踝

  /* 受控关节组圆点（13 个组位；每点可含多个自由度，逐侧数量见 eg 标注） */
  var pts = [
    [620, 120, 'torso_joint ×1'],
    [606, 108, 'left shoulder ×3'], [634, 108, 'right shoulder ×3'],
    [572, 145, 'left elbow ×2'], [668, 145, 'right elbow ×2'],
    [548, 205, 'left fingers ×7 = 拇指3 + 食指2 + 中指2（三指手）'], [692, 205, 'right fingers ×7 = 拇指3 + 食指2 + 中指2（三指手）'],
    [605, 186, 'left hip ×3'], [635, 186, 'right hip ×3'],
    [590, 222, 'left knee ×1'], [650, 222, 'right knee ×1'],
    [590, 300, 'left ankle ×2'], [650, 300, 'right ankle ×2']
  ];
  pts.forEach(function (p) { s += '<circle class="ctl" cx="' + p[0] + '" cy="' + p[1] + '" r="5"><title>' + p[2] + '</title></circle>'; });

  /* 分组标注（引线指到代表关节；逐侧数量加总 = 6×2+5×2+7×2+1 = 37） */
  s += '<path class="eg" d="M630 122 L698 84"/><text class="sb" x="704" y="86" text-anchor="start">躯干 ×1</text>';
  s += '<path class="eg" d="M572 145 L512 153"/><text class="sb" x="506" y="157" text-anchor="end">臂 ×5/侧</text>';
  s += '<path class="eg" d="M536 225 L500 243"/><text class="sb" x="494" y="247" text-anchor="end">手指 ×7/侧</text>';
  s += '<path class="eg" d="M590 262 L522 278"/><text class="sb" x="516" y="282" text-anchor="end">腿 ×6/侧</text>';

  /* 右侧文字列：最长行约 190px 宽，中心放 845 → 跨约 750–940，
   * 与骨架最右点留足间隙，画布 980 的右边距约 40px */
  s += '<text class="lb" x="845" y="94" text-anchor="middle">控制量</text>';
  s += '<text class="sb" x="845" y="120" text-anchor="middle">37 个 qᵢ* 位置目标</text>';
  s += '<text class="sb" x="845" y="144" text-anchor="middle">腿 12 · 躯干 1 · 臂 10 · 手指 14</text>';
  s += '<text class="sb" x="845" y="176" text-anchor="middle">隐式 PD/电机根据 qᵢ*</text>';
  s += '<text class="sb" x="845" y="198" text-anchor="middle">在物理仿真中产生 τᵢ</text>';

  /* 力矩 = 绕关节的弧形箭头 ⟳（模板红线画法，示例取双肘——远离手/膝拥挤区） */
  s += '<path class="ar" style="stroke-width:1.4" d="M594 145 A 22 22 0 1 1 572 123" fill="none" marker-end="url(#mkTauG1)"/>';
  s += '<text class="sb" x="546" y="116" text-anchor="end">τᵢ</text>';
  s += '<path class="ar" style="stroke-width:1.4" d="M690 145 A 22 22 0 1 1 668 123" fill="none" marker-end="url(#mkTauG1)"/>';
  s += '<text class="sb" x="696" y="116" text-anchor="start">τᵢ</text>';

  s += '<text class="sb" x="490" y="332" text-anchor="middle">策略只给关节位置目标；没有手写步态控制器。站立、摆腿、接触节律与速度跟踪由 PPO 策略和物理闭环共同形成。</text>';
  return '<svg viewBox="0 0 980 350" role="img" aria-label="G1 控制量示意：37 维关节位置目标落到受控关节">' +
    '<defs><marker id="mkG1Ctl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk" d="M0 0L10 5L0 10z"/></marker>' +
    '<marker id="mkTauG1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path class="mk" d="M0 0L10 5L0 10z"/></marker></defs>' +
    '<style>.ctl{fill:var(--accent);stroke:var(--paper);stroke-width:2}</style>' + s + '</svg>';
}
window.RL_CONTENT["locomotion/g1-flat"] = `
<h1 class="page-h1">G1 平地行走</h1>
<p class="dek abstract"><strong>摘要：</strong>本实验研究 Unitree G1 人形机器人在 Isaac Lab 官方 <code>Isaac-Velocity-Flat-G1-v0</code> 任务中的平地速度跟踪。方法上保持官方任务源码不变，以 RSL-RL PPO 训练 2 个条件 × 3 个随机种子：官方默认 <code>entropy_coef=0.008</code> 与命令行覆盖 <code>entropy_coef=0.005</code>。6 个正式 run 均训练 1500 次迭代、每 run 约 1.47 亿步仿真。结果显示，在本训练预算下，较低熵系数的末 100 迭代平均回报为 <strong>30.40 ± 0.60</strong>，高于默认组的 <strong>28.04 ± 0.14</strong>；yaw 速度误差由 <strong>0.464</strong> 降至 <strong>0.392</strong>，但躯干接触终止占比未同步下降。最佳候选策略来自 <code>entropy=0.005</code>、seed 43，已导出 <code>policy.pt</code> 与 <code>policy.onnx</code>，并录制约 10 秒与 60 秒跟随镜头回放。</p>
<div class="meta" data-exp-tags></div>

<table class="kv-table">
  <caption>表 1 · 实验概要</caption>
  <tbody>
    <tr><td class="k">状态</td><td><strong>已训练 ✓</strong>　6 个正式 run</td></tr>
    <tr><td class="k">机器人</td><td>Unitree G1 minimal（37 个受控关节；隐式 PD 关节位置执行器）</td></tr>
    <tr><td class="k">技术路线</td><td>强化学习 · PPO · RSL-RL</td></tr>
    <tr><td class="k">任务环境</td><td><code>Isaac-Velocity-Flat-G1-v0</code>（Isaac Lab 官方 Manager-based 任务）</td></tr>
    <tr><td class="k">任务配置</td><td>baseline：Isaac Lab 官方预设（未修改）；entropy=0.005：官方预设 + 命令行覆盖 <code>agent.algorithm.entropy_coef=0.005</code></td></tr>
    <tr><td class="k">并行环境数</td><td>4096</td></tr>
    <tr><td class="k">迭代 / 步数</td><td>1500 次迭代；每迭代 4096×24 步；单 run 约 147,456,000 步</td></tr>
    <tr><td class="k">真实训练耗时</td><td>6 个正式 run 合计约 8038 秒（2.23 小时）；单 run 约 21.7–23.6 分钟</td></tr>
    <tr><td class="k">观测 / 动作维度</td><td>123 维 → 37 维</td></tr>
    <tr><td class="k">策略网络</td><td>Actor 123→256→128→128→37；Critic 123→256→128→128→1；Actor+Critic 合计 167,243 个参数</td></tr>
    <tr><td class="k">最佳候选</td><td><code>entropy=0.005, seed=43</code>：末 100 迭代回报 30.90，base_contact 0.38%，导出 JIT/ONNX</td></tr>
  </tbody>
</table>

<figure>${heroLoopSVG({ policy: "PPO Actor-Critic · 123→…→37", env: "Isaac-Velocity-Flat-G1-v0", aDim: "³⁷", sDim: "¹²³" })}<figcaption>图 1 · G1 平地速度跟踪任务的智能体–环境交互回路。策略接收本体观测与速度命令，输出 37 维关节位置动作；环境返回下一步观测、奖励与终止信号。</figcaption></figure>

<h2 class="section-title"><span class="hnum">1</span>背景与问题定义</h2>
<p>本任务要求 G1 在平地上跟踪随机采样的底盘速度命令。系统与任务目标如图 2 所示：机器人需要在不让躯干接触地面的前提下，跟踪前进、侧向与 yaw 角速度命令。</p>
<figure>${g1HumanoidSVG()}<figcaption>图 2 · G1 平地速度跟踪任务示意。命令由 <code>base_velocity</code> 生成，平地任务去除了高度扫描与地形 curriculum；躯干 <code>torso_link</code> 发生非法接触时回合失败终止。</figcaption></figure>
<p><strong>机器人</strong>：Unitree G1 minimal 资产，共 37 个受控关节。关节构成为：双腿 12 个（每侧 <code>hip_yaw</code> / <code>hip_roll</code> / <code>hip_pitch</code> / <code>knee</code> / <code>ankle_pitch</code> / <code>ankle_roll</code>），躯干 1 个（<code>torso_joint</code>），双臂 10 个（每侧 <code>shoulder_pitch</code> / <code>shoulder_roll</code> / <code>shoulder_yaw</code> / <code>elbow_pitch</code> / <code>elbow_roll</code>），双手指 14 个——G1 的手是<strong>三指</strong>灵巧手，每侧 7 个关节 = 拇指 3 + 食指 2 + 中指 2（官方资产中的关节名是无语义的 <code>zero</code> 至 <code>six</code>）。训练使用 <code>G1_MINIMAL_CFG</code>，碰撞体比完整视觉模型更简化。</p>
<p><strong>控制</strong>：控制量不是期望速度本身，而是与上述 37 个关节一一对应的关节位置偏移。图 3 所示的链条是：策略输出动作 <code>a</code> → 乘以 0.5 并加到默认关节姿态 <code>q₀</code> → 得到关节位置目标 <code>q*</code> → 由资产执行器在物理仿真中产生力矩 → 形成站立、摆腿与速度跟踪行为。中间没有手写步态控制器。</p>
<figure>${g1ControlSVG()}<figcaption>图 3 · 控制量示意（G1 关节位置目标）。策略输出 37 维动作 <code>a</code>，经 <code>q* = q₀ + 0.5a</code> 转为 37 个关节位置目标；这些目标分别落到双腿、躯干、双臂和手指的受控关节，隐式 PD/电机再在物理仿真中产生关节力矩。</figcaption></figure>
<p><strong>目标</strong>：最大化折扣累计奖励，使机器人在 20 秒训练回合内持续保持直立、减少躯干接触，并尽可能准确跟踪 <code>(vₓ, vᵧ, ωz)</code>。</p>
<p>按 MDP 表述，问题定义见表 2。</p>
<table class="kv-table">
  <caption>表 2 · 问题的形式化定义</caption>
  <tbody>
    <tr><td class="k">环境</td><td>4096 个并行 Isaac Lab GPU 物理环境，平地 plane，控制频率 50 Hz</td></tr>
    <tr><td class="k">智能体</td><td>RSL-RL PPO 的 Actor-Critic 策略</td></tr>
    <tr><td class="k">状态 / 观测</td><td>123 维本体观测与速度命令，构成见表 3</td></tr>
    <tr><td class="k">动作</td><td>37 维关节位置目标偏移，构成见第 3.2 节</td></tr>
    <tr><td class="k">奖励</td><td>16 项加权和，主要由线速度/yaw 速度跟踪、双足步态与稳定性正则构成，见表 4</td></tr>
    <tr><td class="k">回合</td><td>20 秒到时正常结束；躯干接触地面提前终止</td></tr>
    <tr><td class="k">目标</td><td>最大化折扣累计回报，折扣因子 γ = 0.99</td></tr>
  </tbody>
</table>

<h2 class="section-title"><span class="hnum">2</span>理论基础</h2>
<p>本实验沿用 PPO 作为连续控制算法。第 1 节中的 G1 速度跟踪任务具有高维连续动作、长时序稳定性要求和大量并行仿真的特征，适合使用 on-policy Actor-Critic：Actor 产生连续动作分布，Critic 估计状态价值以降低策略梯度方差。</p>
<p>PPO 的核心约束是裁剪新旧策略概率比，避免单次更新过大导致步态崩溃。优势估计使用 GAE(λ)，价值函数通过价值损失拟合回报，策略通过 surrogate loss 提升带正优势的动作概率。熵正则项控制动作分布的随机性：系数越高，训练越鼓励维持探索；系数越低，策略标准差通常收缩更快。本实验的唯一正式对照变量正是 <code>entropy_coef</code>。</p>
<p>选择 PPO 的原因有三点：第一，动作是 37 维连续关节目标，策略梯度法比离散价值法更合适；第二，4096 个并行环境可提供充足 on-policy 样本；第三，G1 官方任务已给出 RSL-RL PPO 配置，本实验的目的不是重写任务，而是先建立官方配置下的可复现实证基线。</p>

<h2 class="section-title"><span class="hnum">3</span>实验框架</h2>
<h3 class="section-sub"><span class="hnum">3.1</span>网络结构</h3>
<p>Actor 与 Critic 的网络结构如图 4 和图 5 所示。两者共享同样的 3 层隐藏层宽度（256、128、128），但输出不同：Actor 输出 37 维动作均值并带 37 个可学习 logσ，Critic 输出标量价值。实测 checkpoint 参数量为：Actor 85,962（含 37 个 logσ）、Critic 81,281，合计 167,243。</p>
<figure>${RLNet.svg(g1MlpCfg("actor"))}<figcaption>图 4 · G1 Actor 网络架构。123 维观测经三层 MLP 映射为 37 维动作均值，配合独立可学习 logσ 构成对角高斯策略。</figcaption></figure>
<figure>${RLNet.svg(g1MlpCfg("critic"))}<figcaption>图 5 · G1 Critic 网络架构。输入与 Actor 相同，输出为状态价值 V(s)，仅训练期使用。</figcaption></figure>

<h3 class="section-sub"><span class="hnum">3.2</span>观测与动作</h3>
<p>G1 flat 去除了 rough 任务中的 height scan，因此观测为 123 维。构成见表 3。</p>
<table>
  <caption>表 3 · 观测向量构成</caption>
  <thead><tr><th>项</th><th>维度</th><th>含义</th><th>训练期噪声</th></tr></thead>
  <tbody>
    <tr><td><code>base_lin_vel</code></td><td>3</td><td>躯干线速度</td><td>Uniform [-0.1, 0.1]</td></tr>
    <tr><td><code>base_ang_vel</code></td><td>3</td><td>躯干角速度</td><td>Uniform [-0.2, 0.2]</td></tr>
    <tr><td><code>projected_gravity</code></td><td>3</td><td>重力方向在机体系中的投影，用于表征姿态</td><td>Uniform [-0.05, 0.05]</td></tr>
    <tr><td><code>velocity_commands</code></td><td>3</td><td>目标 <code>vₓ</code>、<code>vᵧ</code>、<code>ωz</code></td><td>无</td></tr>
    <tr><td><code>joint_pos</code></td><td>37</td><td>关节相对默认位置</td><td>Uniform [-0.01, 0.01]</td></tr>
    <tr><td><code>joint_vel</code></td><td>37</td><td>关节相对速度</td><td>Uniform [-1.5, 1.5]</td></tr>
    <tr><td><code>actions</code></td><td>37</td><td>上一步动作</td><td>无</td></tr>
  </tbody>
</table>
<p>动作项为 <code>joint_pos</code>，维度 37。策略输出经 <code>scale=0.5</code> 缩放，并以默认关节位置为 offset，得到目标关节位置。Play 配置关闭观测 corruption 与随机外力，因此回放视频反映的是无感知噪声、无推搡的策略表现。</p>

<h3 class="section-sub"><span class="hnum">3.3</span>奖励函数</h3>
<p>奖励在每个控制步按权重与控制步长累加。G1 flat 的 16 个活跃奖励项见表 4：主目标是线速度与 yaw 速度跟踪，双足步态项鼓励单支撑和摆脚；其余项限制竖直速度、横滚/俯仰角速度、躯干倾斜、动作变化、脚滑、关节限位以及非必要关节偏离默认姿态。</p>
<table>
  <caption>表 4 · 奖励项与权重</caption>
  <thead><tr><th>奖励项</th><th>权重</th><th>作用</th></tr></thead>
  <tbody>
    <tr><td><code>track_lin_vel_xy_exp</code></td><td>+1.0</td><td>指数核跟踪 xy 线速度命令</td></tr>
    <tr><td><code>track_ang_vel_z_exp</code></td><td>+1.0</td><td>指数核跟踪 yaw 角速度命令</td></tr>
    <tr><td><code>feet_air_time</code></td><td>+0.75</td><td>双足任务中鼓励非零速度命令下的单支撑/摆脚时间</td></tr>
    <tr><td><code>termination_penalty</code></td><td>−200.0</td><td>提前失败终止重罚</td></tr>
    <tr><td><code>flat_orientation_l2</code></td><td>−1.0</td><td>惩罚躯干偏离水平姿态</td></tr>
    <tr><td><code>dof_pos_limits</code></td><td>−1.0</td><td>惩罚踝关节接近位置限位</td></tr>
    <tr><td><code>feet_slide</code></td><td>−0.1</td><td>惩罚触地脚滑动</td></tr>
    <tr><td><code>joint_deviation_hip / arms / fingers / torso</code></td><td>−0.1 / −0.1 / −0.05 / −0.1</td><td>限制髋偏航/滚转、手臂、手指和躯干偏离默认姿态</td></tr>
    <tr><td><code>lin_vel_z_l2</code></td><td>−0.2</td><td>限制竖直方向速度</td></tr>
    <tr><td><code>ang_vel_xy_l2</code></td><td>−0.05</td><td>限制横滚/俯仰角速度</td></tr>
    <tr><td><code>action_rate_l2</code></td><td>−0.005</td><td>惩罚连续动作变化过大</td></tr>
    <tr><td><code>dof_torques_l2 / dof_acc_l2</code></td><td>−2e−6 / −1e−7</td><td>惩罚髋/膝力矩与加速度</td></tr>
  </tbody>
</table>

<h3 class="section-sub"><span class="hnum">3.4</span>终止与复位</h3>
<p>终止条件包含 <code>time_out</code> 与 <code>base_contact</code>。训练回合长度为 20 秒，即 1000 个控制步；<code>base_contact</code> 在 <code>torso_link</code> 接触力超过阈值时触发，表示机器人摔倒或躯干触地。复位时根位姿在 x/y/yaw 范围内随机化，关节以默认姿态复位，训练任务保留启动摩擦设置与 reset 事件；Play 任务关闭随机外力与观测噪声。</p>

<h3 class="section-sub"><span class="hnum">3.5</span>训练流程</h3>
<p>每次迭代中，PPO 先在 4096 个并行环境中收集每环境 24 个控制步，共 98,304 条 transition；随后以 4 个 mini-batch、5 个 learning epoch 更新 Actor-Critic。1500 次迭代对应约 1.47 亿控制步。</p>
<div class="plist">
  ${pr("num_envs", "4096", "官方配置；利用 GPU 并行物理提高采样吞吐。")}
  ${pr("num_steps_per_env", "24", "G1 官方 RSL-RL 配置，单次 rollout 覆盖约 0.48 秒控制时间。")}
  ${pr("max_iterations", "1500", "G1 flat 官方训练预算。")}
  ${pr("save_interval", "50", "每 50 次迭代保存 checkpoint；最终模型为 model_1499.pt。")}
</div>

<h3 class="section-sub"><span class="hnum">3.6</span>环境与超参数</h3>
<div class="plist">
  ${kv("Isaac Lab", "isaaclab 0.54.3 · isaaclab_tasks 0.11.16 · Isaac Sim 5.1")}
  ${kv("RSL-RL / PyTorch", "rsl-rl-lib 5.0.1 · torch 2.7.0+cu128")}
  ${kv("GPU", "NVIDIA GeForce RTX 5070 Ti · driver 580.159.03")}
  ${pr("learning_rate", "1e-3, adaptive", "官方 G1 PPO 配置；按 desired_kl=0.01 自适应调整。")}
  ${pr("clip_param", "0.2", "PPO 标准裁剪半径。")}
  ${pr("gamma / lam", "0.99 / 0.95", "折扣回报与 GAE 的通用设置。")}
  ${pr("entropy_coef", "0.008 vs 0.005", "本实验唯一正式对照变量；0.008 为官方默认，0.005 为命令行覆盖。")}
  ${pr("actor_hidden_dims", "[256, 128, 128]", "G1 flat 官方策略网络宽度。")}
</div>
<p><strong>复现命令。</strong></p>
<pre>cd /home/jeff/IsaacLab
./isaaclab.sh -p scripts/reinforcement_learning/rsl_rl/train.py --task Isaac-Velocity-Flat-G1-v0 --headless --max_iterations 1500 --seed 42 --logger wandb --log_project_name robot-learning-dashboard --run_name g1-flat-baseline-s42
./isaaclab.sh -p scripts/reinforcement_learning/rsl_rl/train.py --task Isaac-Velocity-Flat-G1-v0 --headless --max_iterations 1500 --seed 42 --logger wandb --log_project_name robot-learning-dashboard --run_name g1-flat-entropy005-s42 agent.algorithm.entropy_coef=0.005</pre>

<h2 class="section-title"><span class="hnum">4</span>实验结果</h2>
<p>6 个正式 run 的记录与训练耗时见表 5。所有 run 均完成 1500 次迭代并写出最终 checkpoint。最佳候选策略的完整训练曲线如图 6 所示。</p>
<table>
  <caption>表 5 · 正式 run 清单</caption>
  <thead><tr><th>条件</th><th>seed</th><th>公开标识</th><th>W&B</th><th>real time</th><th>末 100 回报</th></tr></thead>
  <tbody>
    <tr><td>baseline</td><td>42</td><td><code>baseline-s42</code></td><td><a href="https://wandb.ai/jeffliulab/robot-learning-dashboard/runs/jhaw3zp5">jhaw3zp5</a></td><td>1418.51 s</td><td>28.15</td></tr>
    <tr><td>baseline</td><td>43</td><td><code>baseline-s43</code></td><td><a href="https://wandb.ai/jeffliulab/robot-learning-dashboard/runs/laa8wbet">laa8wbet</a></td><td>1301.64 s</td><td>28.09</td></tr>
    <tr><td>baseline</td><td>44</td><td><code>baseline-s44</code></td><td><a href="https://wandb.ai/jeffliulab/robot-learning-dashboard/runs/ewh31ipn">ewh31ipn</a></td><td>1301.69 s</td><td>27.88</td></tr>
    <tr><td>entropy=0.005</td><td>42</td><td><code>entropy005-s42</code></td><td><a href="https://wandb.ai/jeffliulab/robot-learning-dashboard/runs/pg5ing46">pg5ing46</a></td><td>1339.33 s</td><td>29.74</td></tr>
    <tr><td>entropy=0.005</td><td>43</td><td><code>entropy005-s43</code></td><td><a href="https://wandb.ai/jeffliulab/robot-learning-dashboard/runs/vc7x8lc8">vc7x8lc8</a></td><td>1349.75 s</td><td><strong>30.90</strong></td></tr>
    <tr><td>entropy=0.005</td><td>44</td><td><code>entropy005-s44</code></td><td><a href="https://wandb.ai/jeffliulab/robot-learning-dashboard/runs/x0z2w4xa">x0z2w4xa</a></td><td>1326.98 s</td><td>30.56</td></tr>
  </tbody>
</table>
<figure class="chart-fig">
<div data-rl-chart="locomotion/g1-flat"></div>
<figcaption>图 6 · 最佳候选策略（entropy=0.005, seed=43）的全部训练曲线（30 条）。数据由本地 TensorBoard 事件文件导出，未作平滑或修饰。</figcaption>
</figure>
<p>图 6 显示，最佳候选策略在前约 250 次迭代内由负回报进入稳定站立与初步跟踪阶段，之后回报继续缓慢上升；末段 <code>Train/mean_episode_length</code> 接近 1000 步，说明大多数回合以 time_out 正常结束。</p>

<h2 class="section-title"><span class="hnum">5</span>实验分析</h2>
  <h3 class="section-sub"><span class="hnum">5.1</span>学习过程</h3>
  <p>图 6 显示，最佳候选策略在前约 250 次迭代内由负回报进入稳定站立与初步跟踪阶段，随后回报继续缓慢上升。平均回合长度接近 1000 step 后，学习重点转向速度跟踪误差和动作稳定性的精修。这个形态说明，本实验的主要难点不是单次站立，而是高维关节在长时间速度命令下保持协调。</p>

  <h3 class="section-sub"><span class="hnum">5.2</span>辅助指标</h3>
  <p>图 6 中的辅助曲线表明，策略先学会维持回合长度，再逐步降低 x/y/yaw 速度误差。base_contact 终止比例在训练后段维持在 1% 以下，但没有完全消失；这与人形机器人在快速转向命令下偶发躯干触地一致。动作标准差从约 0.99 下降到 0.5 到 0.6 区间，表示 PPO 策略从高度探索逐步收敛到较稳定的关节命令分布。</p>

  <h3 class="section-sub"><span class="hnum">5.3</span>种子一致性</h3>
  <p>正式训练覆盖 2 个熵系数条件和 3 个随机种子。表 5 列出了 6 个 run 的公开标识、W&B 链接、训练耗时和末 100 迭代回报；所有 run 均完成 1500 次迭代并写出最终 checkpoint。默认熵条件的末段回报为 28.04±0.14，低熵条件为 30.40±0.60。该结果不是单一 checkpoint 的偶然现象，但低熵条件的 seed 间方差更大，因此后文只把它解释为当前预算下的稳定收益，而不是全局最优超参数。</p>

  <h3 class="section-sub"><span class="hnum">5.4</span>策略行为</h3>
  <p>视频 1 展示了训练后策略在随机速度命令下的 9.98 秒跟随镜头回放。Isaac Lab 默认固定相机在 locomotion 任务中很快会让机器人走出画面，因此本实验使用跟随镜头回放：相机原点绑定到机器人根部，并给定固定 eye/lookat 偏移，只影响可视化，不改变环境动力学或策略输入。</p>
  <video width="1280" height="720" controls muted loop playsinline preload="metadata" poster="assets/media/g1-flat/frame-mid.jpg" style="width:100%;border:1px solid var(--rule);border-radius:8px" src="assets/media/g1-flat/play-follow-10s.mp4"></video>
  <figure>
    <div class="frames">
      <div><img src="assets/media/g1-flat/frame-early.jpg" width="1280" height="720" alt="第 1.78 秒：G1 起步行走"><span class="frame-t">t ≈ 1.78 s</span></div>
      <div><img src="assets/media/g1-flat/frame-mid.jpg" width="1280" height="720" alt="第 4.98 秒：G1 持续行走"><span class="frame-t">t ≈ 4.98 s</span></div>
      <div><img src="assets/media/g1-flat/frame-late.jpg" width="1280" height="720" alt="第 8.18 秒：G1 继续跟踪速度命令"><span class="frame-t">t ≈ 8.18 s</span></div>
    </div>
    <figcaption>图 7 · 10 秒跟随镜头回放抽帧。三个时刻均来自同一段真实回放视频，视频分辨率与抽帧分辨率均为 1280×720。</figcaption>
  </figure>
  <p>如图 7 所示，机器人能够维持直立、连续迈步，并随命令变化调整前进与转向；但步态仍然机械，转向时上肢与躯干补偿较明显。</p>
  <p><strong>60 秒耐力测试。</strong>视频 2 把同一策略的评估回合长度临时扩展到 60 秒，仅用于耐力观察，不改变训练配置。训练回合设为 20 秒，是因为该窗口已足以暴露站立失败、速度跟踪和躯干接触终止，同时能保持较高采样吞吐；60 秒回放用于检查策略超过训练时长后的连续运行。</p>
  <video width="1280" height="720" controls muted loop playsinline preload="metadata" poster="assets/media/g1-flat/frame-e35.jpg" style="width:100%;border:1px solid var(--rule);border-radius:8px" src="assets/media/g1-flat/play-follow-endurance-60s.mp4"></video>
  <figure>
    <div class="frames">
      <div><img src="assets/media/g1-flat/frame-e10.jpg" width="1280" height="720" alt="第 10 秒：G1 持续行走"><span class="frame-t">t ≈ 10 s</span></div>
      <div><img src="assets/media/g1-flat/frame-e35.jpg" width="1280" height="720" alt="第 35 秒：G1 持续行走"><span class="frame-t">t ≈ 35 s</span></div>
      <div><img src="assets/media/g1-flat/frame-e58.jpg" width="1280" height="720" alt="第 58 秒：G1 持续行走"><span class="frame-t">t ≈ 58 s</span></div>
    </div>
    <figcaption>图 8 · 60 秒耐力回放抽帧。三个时刻均来自同一段 60.0 秒真实回放视频，视频分辨率与抽帧分辨率均为 1280×720。</figcaption>
  </figure>
  <p>如图 8 所示，机器人没有出现立即摔倒或数秒内退化；长期运行主要稳定性来自较保守的步幅和持续姿态修正，而不是接近真实人类的自然步态。</p>

  <h2 class="section-title"><span class="hnum">6</span>消融与对比实验</h2>
  <p>本节补充正式消融实验。实验目标不是寻找全局最优超参数，而是验证在当前训练预算下，熵正则强度是否会显著影响接触型人形 locomotion 的最终策略。官方配置默认 <code>entropy_coef=0.008</code>；本报告只把该值降到 <code>0.005</code>，其余任务配置、训练迭代数、网络结构、并行环境数和随机种子集合均保持不变。设计见表 6。</p>
  ${table(`<caption>表 6 · 熵系数消融设计。除 entropy_coef 外，其余配置保持一致。</caption>
    <thead><tr><th>条件</th><th>entropy_coef</th><th>Seeds</th><th>每个 run 迭代数</th><th>并行环境</th><th>观测/动作/奖励</th></tr></thead>
    <tbody>
      <tr><td>默认熵</td><td>0.008</td><td>42, 43, 44</td><td>1500</td><td>4096</td><td>不变</td></tr>
      <tr><td>低熵</td><td>0.005</td><td>42, 43, 44</td><td>1500</td><td>4096</td><td>不变</td></tr>
    </tbody>`, "表 6 · 熵系数消融设计")}
  <p>结果见表 7。低熵条件把末段平均回报从 28.04 提高到 30.40，约 +8.4%；主要收益来自 yaw 速度误差降低，从 0.464 降到 0.392，约 -15.5%。x/y 线速度误差变化较小，说明该调整并没有全面提升所有跟踪维度。动作标准差从 0.621 降到 0.480，表明策略探索幅度更小、输出更集中。</p>
  ${table(`<caption>表 7 · 熵系数消融结果。数值为 3 seeds 的 mean±std，末段定义为最后 100 次迭代。</caption>
    <thead><tr><th>指标</th><th>默认熵 0.008</th><th>低熵 0.005</th><th>相对变化</th></tr></thead>
    <tbody>
      <tr><td>Episode reward</td><td>28.04 ± 0.14</td><td>30.40 ± 0.60</td><td>+8.4%</td></tr>
      <tr><td>Episode length</td><td>996.1 ± 0.6</td><td>996.5 ± 0.5</td><td>+0.0%</td></tr>
      <tr><td>x 速度误差</td><td>0.120 ± 0.001</td><td>0.120 ± 0.003</td><td>+0.5%</td></tr>
      <tr><td>y 速度误差</td><td>0.067 ± 0.006</td><td>0.060 ± 0.008</td><td>-10.5%</td></tr>
      <tr><td>yaw 速度误差</td><td>0.464 ± 0.008</td><td>0.392 ± 0.031</td><td>-15.5%</td></tr>
      <tr><td>base_contact 终止率</td><td>0.47% ± 0.18%</td><td>0.57% ± 0.14%</td><td>+21.2%</td></tr>
      <tr><td>动作 std</td><td>0.621 ± 0.016</td><td>0.480 ± 0.005</td><td>-22.8%</td></tr>
    </tbody>`, "表 7 · 熵系数消融结果")}
  <figure class="chart-fig">
    <div data-rl-compare="locomotion/g1-flat-ablation"></div>
    <figcaption>图 9 · 熵系数消融的回报曲线（Train/mean_reward，6 个 run）。同条件同色，种子以线型区分；数据来自已导出的交互曲线文件。</figcaption>
  </figure>
  <p>如图 9 所示，低熵条件整体回报更高，但 seed 间差异也更明显。这个消融同时给出反向证据：低熵条件没有改善 base_contact 终止比例，反而从 0.47% 上升到 0.57%；低熵条件的回报标准差也更大。因此，本报告的结论不是“0.005 是最优熵系数”，而是“在当前 G1 flat 训练预算下，把 entropy_coef 从 0.008 降到 0.005 可以稳定提高回报与转向跟踪，但不解决所有稳定性问题”。</p>

  <h2 class="section-title"><span class="hnum">7</span>独立评估</h2>
  <p>第 6 节的消融结论来自训练期日志，回答的是"学习过程好不好"；本节用独立评估管线在训练之外正面回答"训出来的策略到底多可靠"。评估协议借鉴 AGILE 工作流的分层思路（确定性场景做可复现回归基准、随机命令 rollout 测鲁棒性），由四类场景组成，见表 8。全部评估在去随机化的 Play 环境变体中进行（观测噪声与随机推搡关闭），推理为确定性（取动作分布均值、不采样）；6 个策略在每个场景前重设同一评估种子，保证考的是同一套题。每回合 50 个并行环境同时开考，逐回合明细与聚合结果落盘为 CSV 与 JSON，并记录 checkpoint 与场景配置的哈希以便溯源。</p>
  <table>
    <caption>表 8 · 独立评估协议。四类场景合计每策略 1,300 回合、约 3.8 万仿真秒。</caption>
    <thead><tr><th>场景</th><th>命令</th><th>回合 × 时长</th><th>检验什么</th></tr></thead>
    <tbody>
      <tr><td>随机命令</td><td>训练分布随机抽取，每回合恒定</td><td>500 × 20 s</td><td>命令分布下的总体水平</td></tr>
      <tr><td>固定网格</td><td>10 个确定性考点，覆盖训练范围（前进 0–1.0 m/s、横移 ±0.5 m/s、转向 ±1.0 rad/s 及其组合）</td><td>每考点 50 × 20 s</td><td>可复现回归基准，之后每个版本考同一套题</td></tr>
      <tr><td>耐力</td><td>恒定 0.5 m/s 前进</td><td>50 × 60 s</td><td>超过训练回合 3 倍时长的连续运行</td></tr>
      <tr><td>命令切换</td><td>训练分布随机抽取，每 10 s 重采样</td><td>250 × 60 s</td><td>命令切换瞬间的鲁棒性</td></tr>
    </tbody>
  </table>
  <p>指标口径如下。速度跟踪误差与训练日志的 <code>error_vel_xy</code>/<code>error_vel_yaw</code> 同源：基座系下水平速度误差的 L2 范数、偏航角速度误差的绝对值，对有效步取时间平均；同一误差另按均方根（RMSE）口径并行计算并落盘，表 9 以同源均值口径为主、附随机命令场景的线速度 RMSE。每回合剔除起步 1 秒的稳定期与终止边界步，摔倒后自动重置产生的数据全部不计。可靠性主指标是<strong>摔倒回合数与成功率</strong>（摔倒 = 躯干触地终止，即训练中的 base_contact，本任务唯一的非超时终止）；MTBF（平均摔倒间隔 = 总行走秒数 ÷ 摔倒次数）作为衍生指标一并报告——该指标引自可靠性工程、并非 locomotion 学界的标准基准指标，零摔倒时只报删失下界、不做外推。能耗以无量纲运输成本 COT = Σ|τ·q̇|Δt ÷ (mgd) 衡量（绝对值口径的机械功代理，按 50 Hz 控制频率采样，绝对值偏低，仅用于同协议下横向比较）。跟踪与能耗统计只计入未摔倒回合。</p>
  <p>核心结果见表 9：两个条件呈现清晰的取舍。<strong>跟踪精度上低熵条件更好</strong>——随机命令场景的线速度误差 0.072 对 0.088 m/s，与第 6 节训练日志"低熵跟踪更好"的总方向一致，构成训练指标与独立评估的交叉验证；不过收益的通道分布并不相同（训练日志中集中在 yaw，评估中集中在线速度），这与两处环境条件不同有关——训练环境带观测噪声与随机推搡，评估环境全部关闭。<strong>可靠性上默认熵条件全面占优</strong>：三个种子在全部四类场景、合计 31.7 小时仿真行走中零摔倒（MTBF ≥ 114,000 s）；低熵条件共摔倒 62 次（MTBF 1,819 s），且全部集中在 seed 42 一个策略——它在范围角点考点（前进 1.0 + 横移 0.5 + 转向 1.0 同时下达）50 回合全部摔倒（平均约 3.2 秒），在命令切换场景也摔了 12 次。耐人寻味的是，这个最脆的种子恰好是固定网格上跟踪最准的策略（线速度误差 0.066，全体最低）——跟踪越"贴"命令、留给稳定裕度的空间越小。</p>
  <table>
    <caption>表 9 · 独立评估核心结果。数值为 3 个训练种子的 mean±std（ddof=1）；跟踪误差与 COT 只统计未摔倒回合；线速度误差单位 m/s、偏航误差单位 rad/s。</caption>
    <thead><tr><th>场景</th><th>指标</th><th>默认熵 0.008</th><th>低熵 0.005</th></tr></thead>
    <tbody>
      <tr><td rowspan="5">随机命令</td><td>成功率</td><td>1.000 ± 0.000</td><td>1.000 ± 0.000</td></tr>
      <tr><td>线速度误差</td><td>0.088 ± 0.011</td><td><strong>0.072 ± 0.013</strong></td></tr>
      <tr><td>线速度 RMSE</td><td>0.091 ± 0.010</td><td>0.076 ± 0.013</td></tr>
      <tr><td>偏航误差</td><td>0.059 ± 0.004</td><td>0.057 ± 0.003</td></tr>
      <tr><td>COT</td><td>1.084 ± 0.051</td><td>1.196 ± 0.013</td></tr>
      <tr><td rowspan="3">固定网格（10 考点合并）</td><td>成功率</td><td><strong>1.000 ± 0.000</strong></td><td>0.967 ± 0.058</td></tr>
      <tr><td>摔倒数（/1,500 回合）</td><td>0</td><td>50（全部来自 seed 42 的角点考点）</td></tr>
      <tr><td>线速度误差</td><td>0.105 ± 0.011</td><td>0.087 ± 0.019</td></tr>
      <tr><td rowspan="2">耐力 60 s</td><td>成功率</td><td>1.000 ± 0.000</td><td>1.000 ± 0.000</td></tr>
      <tr><td>线速度误差</td><td>0.092 ± 0.011</td><td>0.073 ± 0.018</td></tr>
      <tr><td rowspan="2">命令切换 60 s</td><td>成功率</td><td><strong>1.000 ± 0.000</strong></td><td>0.984 ± 0.028</td></tr>
      <tr><td>摔倒数（/750 回合）</td><td>0</td><td>12（全部来自 seed 42）</td></tr>
      <tr><td rowspan="2">全场景合计</td><td>摔倒数</td><td><strong>0</strong></td><td>62</td></tr>
      <tr><td>MTBF</td><td>≥ 114,000 s（零摔倒，删失下界）</td><td>1,819 s</td></tr>
    </tbody>
  </table>
  <p>逐考点看，范围角点是两个条件共同的最难考题：默认熵条件虽然不摔，线速度误差也升到 0.298 ± 0.033 m/s，是其余考点（≤ 0.12 m/s）的两倍以上——三个命令同时压到训练范围上限时，策略以牺牲跟踪精度换取不摔。运动质量指标（关节加速度 RMS 约 105 rad/s²、动作变化率）在两条件间无显著差异。</p>
  <p>视频 3 展示了最佳候选策略（低熵 seed 43）在固定网格五个代表性考点上的连续表现：0.5 与 1.0 m/s 直行、0.5 m/s 横移、1.0 rad/s 转向、范围角点，每段 8 秒。</p>
  <video width="1280" height="720" controls muted loop playsinline preload="metadata" poster="assets/media/g1-flat/frame-g-walk100.jpg" style="width:100%;border:1px solid var(--rule);border-radius:8px" src="assets/media/g1-flat/eval-grid-medley.mp4"></video>
  <figure>
    <div class="frames">
      <div><img src="assets/media/g1-flat/frame-g-walk100.jpg" width="1280" height="720" alt="1.0 米每秒直行"><span class="frame-t">1.0 m/s 直行</span></div>
      <div><img src="assets/media/g1-flat/frame-g-strafe.jpg" width="1280" height="720" alt="0.5 米每秒横移"><span class="frame-t">0.5 m/s 横移</span></div>
      <div><img src="assets/media/g1-flat/frame-g-turn.jpg" width="1280" height="720" alt="1.0 弧度每秒转向"><span class="frame-t">1.0 rad/s 转向</span></div>
      <div><img src="assets/media/g1-flat/frame-g-corner.jpg" width="1280" height="720" alt="范围角点复合命令"><span class="frame-t">范围角点</span></div>
    </div>
    <figcaption>图 10 · 固定网格集锦（视频 3）抽帧：四个考点下的行走姿态，头顶箭头为环境自带的命令/实际速度可视化标记。视频与抽帧分辨率均为实测 1280×720。</figcaption>
  </figure>
  <p>如图 10 所示，该策略在四个考点均保持直立行走，转向与横移时躯干和手臂有明显补偿动作。视频 4 是命令切换场景的完整 60 秒回放（每 10 秒重采样一次命令）：该策略在多次命令切换间保持行走，未出现摔倒。</p>
  <video width="1280" height="720" controls muted loop playsinline preload="metadata" poster="assets/media/g1-flat/frame-sw-30.jpg" style="width:100%;border:1px solid var(--rule);border-radius:8px" src="assets/media/g1-flat/eval-switching-60s.mp4"></video>
  <p>视频 5 记录了评估发现的失效模式实况：低熵 seed 42 在范围角点命令下的回合。如图 11 的抽帧序列所示，机器人起步后约 2.6 秒身体前倾失稳，约 3 秒时躯干触地、回合终止（画面中机器人随后回到出生点，是评估环境的自动重置）。</p>
  <video width="1280" height="720" controls muted loop playsinline preload="metadata" poster="assets/media/g1-flat/frame-fall-1.jpg" style="width:100%;border:1px solid var(--rule);border-radius:8px" src="assets/media/g1-flat/eval-corner-fall.mp4"></video>
  <figure>
    <div class="frames">
      <div><img src="assets/media/g1-flat/frame-fall-1.jpg" width="1280" height="720" alt="第 1 秒：正常行走"><span class="frame-t">t ≈ 1.0 s</span></div>
      <div><img src="assets/media/g1-flat/frame-fall-26.jpg" width="1280" height="720" alt="第 2.6 秒：身体前倾失稳"><span class="frame-t">t ≈ 2.6 s</span></div>
      <div><img src="assets/media/g1-flat/frame-fall-3.jpg" width="1280" height="720" alt="第 3 秒：躯干触地"><span class="frame-t">t ≈ 3.0 s</span></div>
    </div>
    <figcaption>图 11 · 角点命令下的摔倒过程（视频 5）抽帧：正常行走 → 前倾失稳 → 躯干触地终止。视频与抽帧分辨率均为实测 1280×720。</figcaption>
  </figure>
  <p>独立评估把第 6 节的结论补全了：训练日志里"低熵回报更高"的优势，在评估中只兑现在跟踪精度维度；可靠性维度上默认熵条件严格占优，且训练日志中 base_contact 终止率的微小差异（0.47% 对 0.57%）在评估中放大为 0 摔对 62 摔的差距。单一种子在极限命令下成灾也再次说明：多种子评估不是仪式，是发现这类失效模式的唯一途径。</p>

  <h2 class="section-title"><span class="hnum">8</span>局限性</h2>
  <p>第一，本实验只覆盖仿真中的平地速度跟踪，没有加入外力扰动、地形高度场、传感噪声或 sim-to-real 随机化；独立评估同样未包含扰动场景（列入后续抗扰动专项）。第二，独立评估使用单一评估种子（为保证 6 个策略同卷可比而固定），单种子带来的初始状态分布偏差靠每场景 250–500 回合的样本量摊薄，但未做多评估种子的稳定性检验；COT 为 50 Hz 机械功近似，绝对值不可与文献对标。第三，评估还暴露了一个训练目标未覆盖的行为：零速站立命令下策略存在约 0.05 m/s 的缓慢移动（20 秒累计路径约 1 米；该值为路径长度而非净位移），两个条件都有。第四，当前策略能走，但步态仍然机械，手臂和躯干补偿明显；这说明奖励函数更强调速度跟踪与不摔倒，而不是人类可解释的自然步态。第五，熵系数消融只比较了两个取值，还不能推出最优区间。</p>

  <h2 class="section-title"><span class="hnum">9</span>结论与未来工作</h2>
  <p>本实验完成了 Unitree G1 在 Isaac Lab 平地速度跟踪任务上的可复现实验：使用官方环境配置和 PPO 训练预算，G1 可以在 1500 次迭代内学到稳定平地行走策略。多种子结果显示，降低熵系数可以提高当前预算下的末段回报和 yaw 跟踪质量；独立评估（第 7 节）进一步表明这一收益只兑现在跟踪精度上——默认熵条件在 31.7 小时评估行走中零摔倒，而低熵条件的一个种子在极限命令下系统性摔倒。评估管线已沉淀为可复用的标准工具（固定命令网格、随机命令、耐力与命令切换四类场景），后续的奖励项消融将以它为统一准绳；随后进入粗糙地形、域随机化和抗扰动专项。</p>

  <h2 class="section-title appendix">附录 · 关于本报告</h2>
<p><strong>数据来源。</strong>任务与 PPO 配置读取自 Isaac Lab 官方 G1 flat 配置；曲线与表格统计来自 6 个正式 run 的本地 TensorBoard 事件文件，统计口径为末 100 迭代种子间 mean ± std（ddof=1）；参数量读取自最终 checkpoint；视频与抽帧来自最佳候选策略的跟随镜头 Play 回放。第 7 节的评估数字来自代码仓评估管线的落盘产物（每回合明细 CSV 共 7,800 回合，聚合 JSON 记录 checkpoint 与场景配置的 SHA-256 哈希、Isaac Lab 版本与代码 git 提交号），成功率经"CSV 原始逐行计数"与"聚合脚本"两条独立路径对账一致。</p>
<p><strong>报告产物。</strong>完整训练曲线、对比曲线、回放视频与抽帧均随页面仓库提供；跟随镜头回放脚本为 <code>scripts/play_follow_camera.py</code>，评估管线为代码仓 <code>eval/</code> 目录（场景声明式 YAML + 采集/聚合两段式脚本），评估媒体的实测尺寸记录于 <code>media-info-eval.json</code>。</p>
<p><strong>参考文献。</strong></p>
<ol>
  <li>J. Schulman, F. Wolski, P. Dhariwal, A. Radford, O. Klimov. <em>Proximal Policy Optimization Algorithms</em>. arXiv:1707.06347, 2017.</li>
  <li>J. Schulman, P. Moritz, S. Levine, M. Jordan, P. Abbeel. <em>High-Dimensional Continuous Control Using Generalized Advantage Estimation</em>. arXiv:1506.02438, 2015.</li>
  <li>N. Rudin, D. Hoeller, P. Reist, M. Hutter. <em>Learning to Walk in Minutes Using Massively Parallel Deep Reinforcement Learning</em>. CoRL 2021.</li>
  <li>Isaac Lab Project Developers. <em>Isaac Lab</em>, official manager-based locomotion velocity tasks and Unitree G1 configuration.</li>
  <li><em>AGILE: A Comprehensive Workflow for Humanoid Loco-Manipulation Learning</em>. arXiv:2603.20147, 2026.（独立评估协议的分层思路来源）</li>
  <li>Z. Fu, A. Kumar, J. Malik, D. Pathak. <em>Minimizing Energy Consumption Leads to the Emergence of Gaits in Legged Robots</em>. CoRL 2021, arXiv:2111.01674.（COT 机械功代理口径）</li>
</ol>
`;

