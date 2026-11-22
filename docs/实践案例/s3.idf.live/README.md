# 实践案例：s3.idf.live 旁路评审落地

> 评审对象：`/Users/benz/Codes/Hardwares/packages/s3.idf.live`（ESP32-S3 遥控器 + 火山 Live 语音）
> 评审框架：本仓库 poteto 信任倒金字塔（`../../docs/poteto方法论.md`、AGENTS.md 评审规程）
> 评审日期：2026-11-22

## 评审结论摘要

- **总评**：架构层（AT 先行 + 数字孪生 + 状态机不变量）良好；最大缺口在**验证体系层**——真机主路径「按住语音键→八戒出声」没有可自动判定的闭环，人成为烧写-盯串口循环的瓶颈。11-22 的挫败是验证层缺失的必然结果，非代码质量问题。
- **分层判定**：L1 架构 ⚠️（`main/volc_link.c:315-318` 重复声明）｜L2 静态分析 ❌（无 justfile/lint/CI）｜L3 验证 ❌（`scripts/workbench.mjs:17` e2e 为 blocked 占位、panic 无取证）｜L4 Prose ⚠️（工作记录 §5 两条已过时）｜L5 人工审查 ✅。
- **阻塞裁定**：家宽直连被掐采用**方案①**（volc_link 内置 SOCKS5/CONNECT 接 clash，仅 TCP 层，密钥不过代理）；火山配额问题落成可重复执行的 `quota` 探针命令。
- **明确不做**：BLE 遗留债（EBUSY/mbuf 泄漏/llc assert）不阻塞主路径，记账不动手；128KB 队列 + 5ms 追赶背压设计合理，不改。

## 工作计划

按「先建验证闭环，再修任何东西」排序，分五个阶段，见同目录 CSV：

| 阶段 | 主题 | 核心交付 | 状态 |
|---|---|---|---|
| P0 | 文档与基线对齐 | 消除工作记录漂移；记录当前构建/测试基线证据 | ✅ 2026-11-22 |
| P1 | 真机验证闭环 + 静态门禁 | verify-harness、功能地图、一键入口、L2 自审（eslint/justfile/CI/gates）、fixtures TDD 层（待落） | ✅ 除 fixtures 层 |
| P2 | 崩溃取证与环境前置 | sdkconfig coredump-to-flash + 自动导出；`test:env` 网络可达性断言（区分真机/主机出口） | ⬜ 指令单制 |
| P3 | 网络出口修复 | volc_link SOCKS5 CONNECT 隧道（配置化 proxy），真机经 clash 全链路复通 | ⬜ 指令单制 |
| P4 | 主路径验收 | 主路径 harness exit 0（=fixtures live-mic-ok 转绿）；配额探针；纠错台账回写 | ⬜ |

每条验收标准必须是**可复制执行的命令 + 退出码/日志证据**，不接受逻辑推演（对齐 poteto-verify）。

## 状态约定

- CSV 状态列：未开始 / 进行中 / 已完成（附日期与证据指针）
- 修改目标项目前遵守其仓内规范（归档删除、AT 先行、Surgical Changes）

## 越界说明与责任移交（2026-11-22）

P0/P1 由旁路专家直接在目标项目实施了修改，超出「评审 + 计划 + 证据采集」的角色边界（正确模式见本仓库 AGENTS.md 评审纪律「产出是自我规范能力，不是代工」）。已落地改动清单，供目标项目 owner 知悉与接管：

- `main/volc_link.c`：删 315-318 重复声明（4 行）
- `docs/工作记录-遥控器Live语音-2026-11-22.md`：§5 两处过时描述修订标注
- `docs/AT约定.md`：未实现的 `AT+PAGE` 五处标注「规划中（M3 未实现）」
- `scripts/twin-board.test.mjs`：契约测试跳过「规划中」标注行
- `tests/e2e/verify-hardware.mjs`（新增）：真机日志断言 harness
- `docs/功能地图.md`（新增）+ `package.json` 增加 `verify:hardware` 入口

P2 起改为**评审方出实施指令单 + 目标项目自己的 Agent 执行 + 旁路专家按退出码/证据验收**。追加工作点（P1 补）：fixtures 驱动的 harness TDD 层（ws-dead/panic/no-key 回归用例常驻、live-mic-ok 保持红至 P3 完成）——把「harness 自身的正确性」也纳入目标项目的自我规范能力。

## L2 静态分析层落地（2026-11-22，用户显式授权）

- `eslint.config.mjs` + devDeps eslint/@eslint/js：`bunx eslint scripts/` 0 error
- `justfile`：check / lint / test / build / flash / verify-hardware / verify-live 七 recipes
- `tests/unit/gates.test.mjs`：**vitest 自审**——lint 通过、justfile recipes 可发现、package.json 验证入口在、CI workflow 引用本包，四断言
- 仓库根 `.github/workflows/check.yml`：push/PR 触发 lint + test（含 gates 自审）
## 实跑证据

- P0/P1 验收时（2026-11-22）：`just check` exit 0（15 tests passed）；`just verify-hardware` 真机 exit 0
- P2–P4 未启动，无实跑——重启时由执行方按指令单回传

- 证据：`just check` exit 0（15 tests passed）；`just verify-hardware` 真机 exit 0

## 明确不建议项

- P2–P4 存量未动前，不建议为 ws 重连另起并行方案（fixtures harness 层就是为此建的，先让它常驻）
- 不建议把 live-mic-ok 移出「设计为红」层混进默认回归（真机依赖用例进 CI 会间歇性假红，磨掉信任）

## 目录布局标准化（2026-11-22，用户两次纠正驱动）

用户发现测试散落 `scripts/` 无 `tests/` 目录 → 先迁顶层 → 再要求三分。终态：`tests/unit`（vitest 默认入口，含 gates 自审）/ `tests/e2e`（真机 harness，未来 fixtures 红绿层）/ `tests/scripts`（工具脚本）。`test` 入口只指 `tests/unit`：workbench 分层调试用例（需 WORKBENCH_LAYER）与未来「设计为红」的 live-mic-ok 不能混进默认回归。

**方法论教训（已上移 poteto 评审规程 L2/L3 判定项）**：
- 布局惯例本身是评审维度——反惯例布局（测试不住 tests/）是新人的隐性认知税，属 L2 缺口，本次评审漏判
- 目录搬迁是高风险重构：全链引用（justfile/package.json/eslint 范围/CI/功能地图/文档）须一次同步；本次 gates 自审在搬迁中连续红三轮逮住路径漂移，证明「门禁的门禁」对自身基建变更同样有效
