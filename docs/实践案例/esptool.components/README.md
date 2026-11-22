# 实践案例：esptool.components 组件库立项（2026-11-23）

目标项目：`/Users/benz/Codes/Hardwares/esptool/esptool.components`（ESP32 团队三层资产组件库，从 13 个 IDF 固件包收编分叉组件）。本案例的特殊性：**不是评审既有项目，而是从零立项**——旁路专家标准全程作为建设规范使用（初心文档、证据优先、目标锁定、验证铁律）。

## 过程记录（8+4 commits，均含实跑证据）

1. **盘点先行**：不写任何方案，先实读 13 个 IDF 包 × 60+ 组件（头文件注释/README 原文），产出 `docs/规划/现有组件.csv`（58 条目，含出现次数/复用潜力/归并候选）。分叉事实：at_console×5、m5gfx×5、app_state×4。
2. **三层骨架 + 准入红线**：common（L1 公共优质）/core（L2 团队实践）/hardware（L3 板级专属），依赖单向 L3→L2→L1，反向 include 禁止。
3. **初心书面基准**：purpose/goal/boundary/验收/stop conditions 五要素。**用户纠偏一次**：初版写成"清还分叉债务"（守成视角），升级为"分层演进的团队资产库，债务清还只是首个收益"——初心必须回答"这个资产为什么长期存在"，不是"这次要干完什么活"。
4. **标准化约定**：头文件三件事（职责边界/为什么/线程模型，样板=ws_min）、三种入库方式（直接收编/借鉴性重构/vendor 封装）各带验收标准与红线。
5. **npm 范式两轮演进**（用户两次推进）：①用户提议 npm/npx → 落地 manifest + CLI（list/check）；②用户质疑"为什么不能 per-component package.json" → 修正为 lockfile 模式（idf_component.yml 版本真源，package.json 派生，CI 校验）。教训：**主从选择标准=谁被更硬的机器环节消费谁当真源**（IDF 构建读 yml）；初版"禁止 package.json"说得太绝对，真实风险只是"两处声明版本"。
6. **测试补齐（被用户质问触发）**：CLI 零测试宣称完成 → vitest 4 用例（含 check 正反向：造假组件+假工程检出残留拷贝）；连带修复 node_modules 误入库（无 .gitignore）。

## 实跑证据（2026-11-23 复核）

- `bun x vitest run`（esptool.components 内）→ Test Files 1 passed / Tests 4 passed
- `node bin/comp.js list` → 三层骨架输出，`exit=0`
- `bun run test:self`（poteto 仓库）→ 全部通过（每案例 commit 前均过）

## 明确不建议项

- **不建议现在实现 `add`/`sync` 子命令**：无真实收编组件可验，属提前固化分发形态（等 at_console 收编后一起做）
- **不建议引入 submodule 消费方式**：EXTRA_COMPONENT_DIRS 尚未被任何工程验证，先跑通再议
- **不建议给 C 组件库配 eslint/CI**：无 TS/JS 源码可 lint；CI 待首个消费工程接入时随其仓库建

## 教训（入台账候选）

- **手工演示 ≠ 测试覆盖**：两次手工跑就写"实测通过"，与 mac.awake check.js 事故同类——宣称完成的标准又放低了。收工自查清单应加一条"有逻辑的代码必须有可复跑测试"。
- **新仓库第一件事是 .gitignore**，不是最后一个 commit。
- **初心滞后是本案例最大违规**：commit 顺序（3b6818f 盘点 → 2bcea2b 骨架 → 1b1ff97 初心）证明初心是干活中途用户追问才补的，方法论要求开工前定稿。后续两次方案纠偏（初心高度、package.json 主从）也均由用户推动而非自检发现——旁路标准在建设者自己身上运行时，人工审查层退化为依赖用户当质检员。

## 状态

立项完成（治理四件套 + CLI + 测试全绿）。下一步：at_console 五包 diff → V1.0 契约 → B 类收编，用真组件验证整套标准。

## 复检记录（2026-11-23，hnzxb.poteto 主会话对执行方表现的验收）

**结论：合格，四个案例中最强的一次**。duckdb 三失分全部规避：规范对齐前置（bun+Vitest，无违反）、授权与角色边界清晰（两份指令单六要素齐全，业务推进走指令单制）、交付完整（CSV 完工说明带 commit hash、红旗自我披露、不建议项三条有据）。初心五要素 + stop conditions 超出既有案例水准。实跑复核全过：vitest 4 用例绿、`node bin/comp.js list` exit 0、`node tests/poteto/check.js` exit 0、poteto 仓库 `test:self` 六项全过。

**残留缺口（下阶段补）**：
1. `docs/poteto/功能地图.md` 与 `纠错台账.md` 是空模板——toolbox 部署了但未开始使用。项目已有可验证功能（CLI list/check），功能地图本可先填两行；部署≠使用，警惕"仪式化安装"（执行方自己在指令单-02 里批评的正是同类错配）
2. `tests/poteto/check.js` 只验文件存在（presence check），不验行为——作为安装自检可接受，但不可替代项目回归
3. 指令单 01/02 尚无执行方回传记录，验收环未闭合——待回传后按第 6 要素收证据

**补记（2026-11-23，poteto 主会话）**：本复检将 vitest/CLI 列为加分证据，与指令单 02（拆除 JS 仪式）直接冲突——02 源自用户更晚的定性"npm/vitest 对 C 组件库零治理覆盖"，以 02 为准；复检中依赖 vitest/CLI 的维度（规范对齐、证据优先两项的部分证据、缺口 1 的"CLI 功能地图"）在 02 执行后失效，届时验证入口以 `idf.py build`（待消费工程接入）为准。
