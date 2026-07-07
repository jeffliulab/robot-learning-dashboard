/* ============================================================================
 * manifest.js — 全站分类树（单一真相源）
 * 挂到 window.RL_TREE；app.js 读它渲染顶栏(一级) / 侧栏(二级组+三级实验) / 首页。
 * 改分类、加实验、改状态 —— 只动这一处，别把内容写死进渲染逻辑。
 *
 * 结构：tasks[] (一级) → groups[] (二级，如"平地行走") → items[] (三级实验)
 *       另有 roadmap[] = 更远的后续环节（Sim2Sim/蒸馏/导航）。
 * status：task='active'|'planned'；experiment='done'|'running'|'planned'；roadmap='planned'
 * route 标签：'RL' | '迁移' | '蒸馏' | '模仿' | 'BC/VLA'
 * ==========================================================================*/
window.RL_TREE = {
  site: {
    title: "Robot Learning Dashboard",
    tagline: "机器人学习训练记录 · 每个网络 / 观测 / 动作 / 奖励 / 超参 / 曲线，事无巨细"
  },

  routesLegend: [
    { key: "RL",     label: "强化学习",     desc: "奖励驱动、从零试错" },
    { key: "迁移",   label: "迁移/Sim2Sim", desc: "换引擎/换域仍能用" },
    { key: "蒸馏",   label: "师生蒸馏",     desc: "特权老师→纯感知学生" },
    { key: "模仿",   label: "模仿/动作跟踪", desc: "动捕→重定向→RL跟踪" },
    { key: "BC/VLA", label: "监督模仿/VLA",  desc: "遥操作采数据→监督学习" }
  ],

  tasks: [
    {
      id: "locomotion",
      title: "Locomotion 行走",
      status: "active",
      robots: ["Cartpole", "Ant", "G1"],
      routes: ["RL", "迁移", "蒸馏"],
      blurb: "让机器人按速度命令在平地/地形/楼梯上行走、抗推不倒。会走之后，同一条线里继续做 Sim2Sim 迁移、师生蒸馏、导航对接。",

      groups: [
        {
          title: "平地行走",
          note: "由简到难：先拿倒立摆、四足练手把流程走熟，再上 G1 双足。",
          items: [
            {
              id: "cartpole-balance", title: "Cartpole 平衡实验", robot: "Cartpole", route: "RL",
              algo: "PPO", sim: "Isaac Lab",
              status: "done", date: "2026-07-06",
              blurb: "本系列的第一份完整实验报告、也是 hello world：Isaac-Cartpole-v0 上以 PPO 训练平衡策略。"
            },
            {
              id: "ant-walk", title: "Ant 四足行走实验", robot: "Ant", route: "RL",
              algo: "PPO", sim: "Isaac Lab",
              status: "done", date: "2026-07-07",
              blurb: "从平衡到行走：8 关节四足的步态学习，含 3 条件 × 3 种子的真实消融实验（能耗惩罚 / 熵正则）。"
            },
            {
              id: "g1-flat", title: "G1 平地行走", robot: "G1", route: "RL",
              status: "planned",
              blurb: "人形正主：Isaac-Velocity-Flat-G1-v0，约 1500 迭代收敛，导出可部署策略。"
            }
          ]
        },
        {
          title: "地形行走",
          note: "崎岖地形 + 官方地形课程（斜坡/碎石），加强域随机化。",
          items: [
            {
              id: "g1-rough", title: "G1 崎岖地形", robot: "G1", route: "RL",
              status: "planned",
              blurb: "Isaac-Velocity-Rough-G1-v0：地形 curriculum 由平到陡逐级升，抗扰动成曲线。"
            }
          ]
        },
        {
          title: "楼梯行走",
          note: "楼梯地形逼近真实建筑（踏高 ~0.17m），上下楼成功率达标。",
          items: [
            {
              id: "g1-stairs", title: "G1 上下楼梯", robot: "G1", route: "RL",
              status: "planned",
              blurb: "楼梯专项：踏高/踏面逼近真实建筑楼梯，上下楼稳定通过。"
            }
          ]
        }
      ],

      roadmap: [
        { title: "Sim2Sim 迁移", route: "迁移", status: "planned",
          note: "把行走策略 Isaac(PhysX)→MuJoCo zero-shot 部署，量化迁移成功率 + DR强度↔迁移率消融曲线。" },
        { title: "师生蒸馏", route: "蒸馏", status: "planned",
          note: "特权老师（高度图/全状态）→ 纯本体[+视觉]学生，产出不开挂也能跑的可部署策略。" },
        { title: "导航 + ANIMA", route: "RL", status: "planned",
          note: "waypoint 分层导航，ANIMA 当高层大脑指挥『从 A 房间走到另一层 B 房间』，途中被推倒能爬起续走。" }
      ]
    },

    {
      id: "fall-recovery", title: "Fall Recovery 摔倒爬起", status: "planned",
      robots: ["G1"], routes: ["RL"],
      blurb: "官方没有的新能力、也是求职主打差异化：从随机倒地姿态爬起来 → 站稳 → 续走。参考 HoST（2025，真机 G1 验证）。"
    },
    {
      id: "dance", title: "Dance 表现性动作 / 模仿", status: "planned",
      robots: ["G1"], routes: ["模仿"],
      blurb: "跳舞、打招呼这类拟人动作：人类动捕 → 重定向到机器人 → 训一个 RL 策略在物理里跟踪参考动作（本质仍是 RL）。"
    },
    {
      id: "manipulation", title: "Manipulation 手臂操作", status: "planned",
      robots: ["机械臂"], routes: ["BC/VLA"],
      blurb: "手上的活（抓取、下棋类）：人遥操作采数据 → 监督学习模仿（ACT/Diffusion/VLA）。接下棋 VLA 线。"
    },
    {
      id: "loco-manipulation", title: "Loco-Manipulation 全身操作", status: "planned",
      robots: ["G1"], routes: ["RL", "BC/VLA"],
      blurb: "边走边用手：开门、搬箱这类全身协同，把行走与操作合到一起。"
    }
  ]
};
