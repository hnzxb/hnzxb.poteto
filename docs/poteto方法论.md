
**土豆姐（Lauren Tan / @poteto）的核心开发思路**，核心可概括为：**一切归结于“信任”（Trust）**——通过系统性改造环境，让 AI Agent 默认写出高质量代码，从而从“盯着 1-5 个 Agent 微操”升级到“上百个并行、睡觉时也能合 PR”，实现每月数千 PR 的高置信度产出。[]([https://x.com/Rocwng/status/2117325551090430113](https://x.com/Rocwng/status/2117325551090430113))

她目前在 SpaceX AI 负责 Grok Bot（此前在 Cursor、Meta、Netflix、React Compiler 核心团队），实践成果包括个人每月往生产环境合入约 2000–3000 个 PR、团队更高，回滚率极低。她不喜欢“软件工厂”比喻，更倾向“米其林厨房”：人仍要对最终质量负责，关键是搭好灶台、工具与训练体系。[]([https://redreamality.com/cn/blog/lauren-tan-poteto-trust-before-parallel/](https://redreamality.com/cn/blog/lauren-tan-poteto-trust-before-parallel/))

### 1. 信任倒金字塔（Poteto Pyramid / Inverse Pyramid）

这是她最核心的框架。纠正 Agent 错误时，优先把精力投到更高层（成本更低、更确定、更持久），越往下越依赖判断与人力，越难规模化：[]([https://x.com/shao__meng/status/2111261981735067819](https://x.com/shao__meng/status/2111261981735067819))

1. **代码库与架构（最顶层，投入最多）**
   Agent 会复制现有代码并走最短路径。把“坏写法”从结构上消除（清晰边界、强类型/不变量、API 设计、重构），让“容易的事 = 正确的事”。代码库本身就是 Agent 的长期记忆（好模式与坏模式都会被继承）。
2. **静态分析（Lint / 类型 / 编译器 / 测试 / CI）**
   确定性、低 token 成本。Agent 反复犯同一错就加规则止血，再让 Agent 清理旧债。形式化验证（如 TLA+）也可放在这一层。
3. **验证体系（Verification）**
   给 Agent “手和眼”：能跑代码、采 trace、像用户一样操作、自我 debug。验证 skill 证明“做对了没有”，性能与质量另用专门 skill。
4. **Prose（规则 / Skills / AGENTS.md / 注释）**
   自然语言约束，需要 Agent 判断，用得越少越好。只保留无法用更高层强制的部分。注释常被她视为有害（会变成“借口”或被复制的错误范本），倾向禁止或强约束。
5. **人工审查（最底层，投入最少）**
   最难规模化。主要用于发现系统性缺口，然后把规则上移到更高层，而不是逐 PR 盯。

**原则**：发现错误时先问“能不能往上挪一层？”；先有失败模式，再沉淀 skill/规则。

### 2. 从低信任循环到高信任循环

- **低信任**：Agent 写垃圾 → 人手工排查 → 再让 Agent 改（人是瓶颈）。
- **高信任**：先搭好环境（架构 + Lint + 验证 skill），让 Agent 默认写对，并自己完成验证闭环。人只做意图对齐与抽样模式发现。[]([https://www.163.com/dy/article/LBQHL7J80519EA27.html](https://www.163.com/dy/article/LBQHL7J80519EA27.html))

信任是并行的前提。没有信任就开上百个 Agent，只会产出垃圾 PR。

### 3. 关键实践与工具

- **pstack（开源 Harness）**：她的核心技能集（数十个 Skills + 剧本 + 原则）。统一入口如 `/poteto-mode`，目标驱动（写清目标、完成标准、证据），过程尽量隐身。强调“想跑得快，先扎得深”。包含 `/how`、`/why`、`/teach`、`/architect`、`/correct`、`/no-comments` 等。
- **间接提示词**：不直接微观指挥，先让 Agent 用大白话复述问题、反过来采访你，确保意图对齐，再给自由度。
- **代码库即记忆 / 园丁角色**：持续清理技术债与坏模式（像花园除草），让“被抄也没关系”。
- **过夜循环与窄 PR**：小步提交、立即验证、失败回滚；自动化外环（连接 Slack、Sentry 等）把任务推给协调 Agent 分派。
- **实战示例**：业余项目（如 tibo.dog 游戏）4 天合入约 1150 个 PR，用 TLA+ 验状态机、Lint 锁性能约束、确定性重放反作弊。

### 4. 其他重要观点

- 软件工程师的核心变成“如何在大幅提高生产力的同时保持甚至提升质量”。
- 人从“将兵”转向“将将”：监督比自己更强的 Agent 的艺术。
- 自动化本身是技能，需要刻意练习把隐性判断教给 Bot。
- 所有代码都是“slop”（垃圾），但通过环境可以把它们变成黄金。

**总结一句话**：别把精力花在“管教”单个输出上，而是花在设计一个让 Agent 默认做对的环境上。信任足够后，吞吐量会自然爆炸。她的方法高度可复用（pstack 已开源），普通人可从验证 skill 和一层层上移规则开始爬信任阶梯。

---

## 二、工具与标准框架实践：资料筹备

> 本节为落地实践的第一手资料汇编，来源以 pstack 官方仓库（cursor/plugins/pstack，MIT 协议）与她的访谈实录为准。

### 1. pstack 总览（标准 Agent Harness）

- **定位**：“写得少、质量高”的工程化技能包；拒绝 slop。Cursor 官方插件库收录，Cursor 与 Claude Code 双端可用（`harness/pstack/` 适配层自动映射命令，如 `/poteto-mode` → `/pstack:poteto-mode`）。
- **规模口径**（2026-10，版本基准 0.15.36）：58 个 Skills（34 个功能技能 + 24 条原则）、23 套实战剧本（playbooks）、2 个子 Agent（`poteto-agent`、`comment-sicko`）。
- **安装**：
  - Cursor: `/add-plugin pstack`
  - Claude Code: `/plugin marketplace add cursor/plugins` + `/plugin install pstack@cursor-plugins`
- **上手两步**：`/setup-pstack`（选推理预算与各角色模型）→ 凡需严谨工程的任务一律 `/poteto-mode` 开头。
- **默认模型分工**：代码委派（feature/refactor/bugfix/perf/hillclimb）、prose、判断类 → Opus 5.5 @ xhigh；评审 panel 默认 fable 5.2 / opus 5.5 / gemini 4 neon；Claude Code 中叫不到的模型回落主对话模型。

### 2. 核心机制：一个路由 + 多套剧本 + 多模型子代理

- **主对话不写码**：`/poteto-mode` 读请求 → 匹配剧本 → 开 todo list（剧本步骤逐条进入）→ 按步骤路由到其他 skill → 派发 `subagent_type: "poteto-agent"` 子代理（执行前先完整加载 poteto-mode 与内联原则索引）。
- **23 套剧本**（节选重点）：
  - `investigation`（只读调查）/ `bug fix`（先复现、根因、带运行时证据修复）/ `perf`（对基线追溯测量慢点）/ `hillclimb`（对单一指标科学爬坡，每个被接受的改进一个 commit）
  - `feature`（从命名数据形状出发）/ `refactoring` / `prototype`（用一次性实验裁决设计分叉）
  - `babysit`（推进 PR 到可合：冲突、review、CI）/ `shipping`（独立验证绿栈后自底向上落地）/ `autonomous run` / `autopilot-full`（每 PR 一个 owner，swarm 验证每个 code-ready head，后续改动重新全查）/ `autopilot-stack`
  - `multi-phase plan` / `session pickup` / `pause safely` / `worktree cleanup` / `opening a pr`（小步有序 commit + conventional commits 标题 + briefing 式正文）
- **关键工作流 skill**：`/architect`（跨函数边界前先定调用方用法、类型、模块形状）、`/arena`（N 个并行方案竞标取长）、`/swarm`（N 个并行 worker 分片作业汇总）、`/interrogate`（多模型对抗审查 diff，只保留能被运行证明的发现）、`/correct`（挖掘重复犯错类别，在最高可用层修复：架构→类型/lint/CI→测试→文档，并维护“规则↔执行者”对照表）、`/tdd`、`/unslop`、`/no-comments`、`/technical-writing`（Diátaxis + Google dev style + STE + Global English 分层文档标准）。
- **24 条原则**（每个一条短 skill，poteto-mode 内联索引，任务开始即读）：如 `laziness-protocol`（倾向删除与最小变更）、`foundational-thinking`（先定核心类型与数据结构）、"Prove It Works"（对真实产物验证而非“能编译”）、"Test Behavior, Not Implementation"、"Sequence Work into Verifiable Units" 等。

### 3. 验证体系（她自己认定的“最重要的单一技能”）

- **验证 = 给 Agent 手和眼**：能自己跑应用、像用户一样操作、采 CPU trace / heap snapshot、自我 debug。没有验证就没有真正的 loop——Agent 看不到自己工作的结果就无法迭代，人就成了瓶颈代理。
- **验证 skill 的两组件结构**（她在 Cursor 的第一个 skill ControlGlass 即此形态）：
  1. **确定性 CLI**：放在 skill 目录内、可复现地启动应用并采集 trace/证据的脚本，避免 Agent 每次会话现写不一致的脚本；值得持续投入做成“好工具”。
  2. **Feature Map（功能地图）**：受 sitemap 启发的“物化记忆”——应用有哪些功能、用户如何到达（快捷键、要点哪些 DOM 元素）、各功能做什么；存于 skill 目录、由自动化维护。CLI + Feature Map 组合后，Agent 既能可复现操控应用，又能理解用户模糊的截图/报障。
- **验证光谱**：低端 = 上述验证 skill（Chrome DevTools Protocol 等）；高端 = 形式化验证（TLA+ / Lean）验证业务不变量与状态机。她说即使不用形式化方法，验证 skill 已能走很远。
- **配套技能**：`/create-verification-skill`（为任意语言/平台生成项目本地 verify skill + feature map）、`/maintain-verification-skill`（feature map 漂移后的源波 + 实跑校正，至多一个 PR）、`/create-formal-verification-skill` + `/maintain-formal-verification-skill`（TLA+ 属性验证与随代码演进）、`/statechart`（校验 TLA+ 模型并画 mermaid 状态图、标注违规状态与最短到达路径）。示例项目：`poteto/verification-skill-example`。
- **Autopilot 验证环**：每个 PR 派多个 verifier agent，实际运行应用、像真人一样点击 fuzz、找回归、自我修复后重试，直到可落地。Token 消耗大、可调档。

### 4. 内环 / 外环与规模化

- **内环**：Agent 工程师在代码库内向意图快照推进；**外环**：Slack / Linear / X 等外部信号源。用 Grok Bot、Slack MCP 订阅等把外环事件自动接回内环（如订阅 bug 报障频道 → 自动 triage、用验证 skill 在 main 上复现），人从“上下文搬运工”角色退场。
- **协调 Agent**（Cursor Projects 等）：只派工不做工，管理任务清单、派发子代理；她“开连锁餐厅”式的并行即建立在这些循环上。
- **评审策略**：抽样 + 模式发现（同一 shortcut 被复制传播 = 系统性缺口，把规则上移到架构/lint/类型层）。
- **园艺式维护**：大量日常工作是清除技术债与坏模式，让“被 Agent 抄也没关系”。

### 5. 已知代价与适用边界（社区实测）

- Token 成本显著：有测试者反馈不用 pstack 约 30 分钟的任务、用了约 1 小时，但多发现 3 条错误断言。
- 小任务（改 CSS、写 demo）跑全套 architect/arena/interrogate/verification 属于过度流程；适合中大型 codebase、复杂 bug、重构迁移、性能工作。
- 文字只能指导，真正强制约束的是脚本/规则——她持续把规则从 prose 挪进代码。
- 对“难以验证或错误不可回退”的工作，她自认尚无答案。

### 6. 资料清单（一手/深度来源）

| 资料 | 类型 | 要点 |
| --- | --- | --- |
| https://github.com/cursor/plugins/tree/main/pstack | 官方仓库 | README（安装、剧本表、skill 表、原则表）、`skills/poteto-mode/SKILL.md`（Non-negotiables 与触发路由） |
| https://github.com/poteto/verification-skill-example | 官方示例 | 验证 skill + feature map 完整样例 |
| https://johnny-zbb.github.io/inside-pstack-zh/ | 深度解读（中译） | 逐文件解读全部 skill 的结构与设计原因；版本基准 0.15.36 |
| https://pstack-learn.zhangwen.site/ | 中文课程 | 按章讲机制（引源码）、代价与失败模式；含版本沿革 |
| https://www.textpurr.com/transcript/how-i-shipped-2000-prs-last-month-trusting-ai-agentsgrok-botlauren-tan | 访谈转写 | ControlGlass 起源、feature map 发明过程、验证光谱 |
| https://mwolf.dev/library/live-poteto-creator-of-pstack-on-shipping-1-000-s-of-pr-s-a-month-at-spacex/ | Matt Pocock 对谈转写 | 信任阶梯、验证=loop 核心、内/外环、autopilot fuzz、园艺维护 |
| https://barnabyrobson.org/on-pstack/ | 评析 | pstack 背后的心智模型；可验证性边界 |
| https://kerryleung.github.io/blogs/2026/10/04/pstack-coding-agent-engineering-team/ | 实践测评 | opinionated 程度、适用场景边界 |
| https://agenticmedia.cn/story/432643/ | 新闻 | 58 skills / 23 playbooks / 2 子 Agent 口径 |
| https://redreamality.com/cn/blog/lauren-tan-poteto-trust-before-parallel/ | 中文综述 | 信任倒金字塔、米其林厨房类比 |

### 7. 落地筹备建议（结合本机环境）

1. **先装 pstack 观察**：Claude Code `/plugin install pstack@cursor-plugins`，读 `poteto-mode/SKILL.md` 与几个剧本原文，比读二手文章更准。
2. **第一优先级是验证 skill**：为自己的项目跑 `/create-verification-skill`，产出确定性 CLI + feature map；这是信任阶梯的第一级杠杆。
3. **规则上移习惯**：每次纠正 Agent 重复犯错时走 `/correct` 思路——问“能在哪一层强制”（架构→类型→lint/CI→测试→文档）。
4. **小任务不用全套**：按第 5 节边界裁剪流程，避免 token 与时间开销倒挂。
