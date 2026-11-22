# 实践案例：hnzxb.duckdb 评审（2026-11-22）

旁路评审目标：`/Users/benz/hnzxb/hnzxb.duckdb`（~150 行个人工具：DuckDB 单例 + CLI + Hono HTTP）。

## 总评

信任阶梯仅搭到第 1 层一半：架构形状好但经验文档已定性的「SQL 拼接通病」在 `importJson` 复发（架构层缺口）；无 git、`.gitignore` 反而忽略 src/docs（静态层为零）；验证全靠会话现写 curl（验证层为零）。README 已知坑节质量高（每条有为什么）但有过时表述（pnpm/拼写/端口实参）。

## 分层判定

| 层级 | 判定 | 关键证据 |
|---|---|---|
| 1 架构 | ⚠️ | `src/singleton.js:38` DDL 标识符拼接；`src/singleton.js:40` 值全 String() 类型失真 |
| 2 静态分析 | ❌ | 非 git 仓库；`.gitignore` 第 4-5 行忽略 `docs/` `src/` |
| 3 验证体系 | ⚠️ | 无 tests/justfile/scripts（仅 start/serve）；README 用法示例可跑 |
| 4 Prose | ⚠️ | 已知坑节 ✅；pnpm 表述过时、`hnzzb-duckdb` 拼写、`src/server.js:41` argv[3] 端口 bug |
| 5 人工 | ✅ | 规模匹配 |

## 评审期实跑证据（只读冒烟，均已清理临时产物）

- `bun src/cli.js -q "SELECT 1 AS one"` → `[{"one":1}]`，退出码 0；`--tables` → `[]`
- HTTP：`/health`→`{"ok":true,"db":"data-smoke.duckdb"}`；`POST /query`→`{"success":true,"data":[{"x":42}]}`；坏 SQL→400 `QUERY_FAILED`；`POST /import` 2 行→`columns:["a","b"]`；`/tables`→`t1`
- `bun src/server.js 9599` 实际监听 9521（argv[3] bug 证据）

## 工作计划（2026-11-22 全部完工，commit 54a65f9/eb21ad0/afa5037）

- [P0-版本基线与静态门禁.csv](P0-版本基线与静态门禁.csv)：B1 git 基线（注：git init 由并行会话完成；评审初判「.gitignore 忽略 src/docs」系误读 ls 输出，已更正）、B2 ESLint、D1 勘误 —— 已完成
- [P1-架构止血与验证闭环.csv](P1-架构止血与验证闭环.csv)：A1 标识符白名单、A2 类型保真导入、C1 Vitest 冒烟（用户纠正：用 Vitest 非 bun test）、C2 check 一键门禁 —— 已完成
- 最终证据：`bun run check` → lint 0 error + 10 tests passed，退出码 0

## 明确不建议

CI workflow、JSON Schema 契约库、TS/类型层——150 行个人工具上这些属流程倒挂（对齐融合映射「小任务不跑全套」）。

## 沉淀到方法论的经验

「经验文档记录的坑在新代码复发」是 poteto「代码库即记忆、坏模式被继承」的直接例证：prose 层记录（README 已知坑#3）不构成强制，必须上移到架构层（白名单函数）+ 验证层（恶意标识符回归用例）才闭环。

## 复检记录（2026-11-23，旁路专家按新注入约定）

按用户新定的注入约定复检：CI 可选 ✅（个人工具未建）、知行合一 ✅（复跑 bun run check：lint 0 error + 12 tests，exit 0）、临时产物清理 ✅。两处修正：
1. **合规自测未隔离**：原 tests/smoke.test.js 混装项目冒烟与专家合规用例 → 拆分，白名单+类型保真 6 用例迁 `tests/poteto/compliance.test.js`（专家资产），smoke 留 CLI/HTTP（项目资产），拆后 12 tests 全绿，commit 4761701
2. **红旗无留痕**：TDD 先红后绿无法事后验证 → compliance.test.js 头部注明红阶段预期失败内容；方法论教训已上移：合规自测须在案例 CSV 记录首跑失败快照，否则「TDD 模式」只是自称
