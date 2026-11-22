# 实践案例：chrome.keepdb 评审（2026-11-23）

旁路评审目标：`/Users/benz/hnzxb/chrome.keepdb`（DeepSeek BYOK 页面总结 Chrome 扩展，Nuxt 4 + KeepModules，MV3）。

## 总评

信任阶梯搭得好的样板：`bun run verify` 单一门禁（eslint→vitest→build→真 Chrome UAT 截图留痕），KeepModules 边界清晰，专用 skill 防 MV2 过时 API。短板：非 git 仓库（跨项目复发模式）、验证覆盖窄（仅 1 测试文件、UAT 仅 offline）。

## 分层判定

| 层级 | 判定 | 关键证据 |
|---|---|---|
| 1 架构 | ✅ | modules/ 双层（agent.deepseek 领域 + ext.* 构建单元），app/ 仅 app.vue；settings.js storage 依赖注入 |
| 2 静态分析 | ⚠️ | eslint 前置 ✅；非 git 仓库、无 CI |
| 3 验证体系 | ⚠️ | verify 一键收敛 + UAT 截图/uat-report.json ✅✅；仅 summarize.test.js；UAT 仅 offline；无功能地图 |
| 4 Prose | ✅ | CLAUDE.md 精简带为什么；CHROMEWEBSTORE.md 规则在文件无（知行不合一） |
| 5 人工 | ✅ | 工作记录 + archive/ 纪律好 |

## 评审期实跑证据

`bun run verify` → eslint 0 error + vitest 过 + build ok → dist/ + `✅ UAT(offline) 通过: NO_API_KEY 引导正确`（截图 `.uat-artifacts/screenshots/popup.png`，report 含 extId/consoleErrors=[]），**exit 0**。

## 工作计划

- [P0-版本基线与知行合一.csv](P0-版本基线与知行合一.csv)：B1 git init、D1 CHROMEWEBSTORE.md 二选一
- [P1-验证覆盖与可移植.csv](P1-验证覆盖与可移植.csv)：C1 settings/deepseek 单测、C2 UAT online 路径、A1 uat.mjs Chrome 路径可配置

## 明确不建议

CI workflow、popup/background 胶水层单测、schema 契约库——对单人扩展项目流程倒挂。

## 沉淀到方法论的经验

1. 「非 git 仓库」在 duckdb（2026-11-22）与本项目（2026-11-23）连续出现——**升级为通用判定项**：凡个人项目首评审必查 git 状态，非 git 即 P0。
2. 「CLAUDE.md 规则要求维护某文件但文件不存在」属 prose 知行不合一，评审时对每条 prose 规则做存在性核对（规则↔现实对照）。
3. **C2 误判教训**：评审判「UAT 仅 offline」，实际 uat.mjs:58 已有 UAT_LIVE=1 完整 online 实现——根因是只看了运行产物/报告（当时 report mode=offline）未通读脚本全部分支。通用判定项：**能力缺口判定必须 grep 到代码分支级**（如 `grep -n 'UAT_LIVE\|mode' scripts/`），不能凭单次运行证据推断「不存在」。
4. 非 git 项目转 git 时 .gitignore 大概率不完整（历史无 git 压力），init 后第一件事核对 staged 数量是否约等于源文件数。

## 落地结果（2026-11-23 01:31）

用户授权代干，全部完成：46b6c92（git 基线 294 文件）→ 40dc829（C1/A1/D1，+168-2）→ b9611e6（工作记录）。终态 `bun run verify` 全绿（eslint 0 error + 3 文件 7 tests + build + UAT offline 截图目检）；UAT_CHROME 失败路径实测退出码 1。C2 撤销（误判，见经验 3）。
