# 实践案例：hnzxb.macbook 评审（2026-11-23）

旁路评审目标：`/Users/benz/hnzxb/hnzxb.macbook`（MacBook 运维经验与工具中枢：skills SOP + citty CLI，人机共享能力）。评审方式：**agent 初筛 + 专家抽查补采**（标准流程第 3 例）。

## 总评

**信任阶梯搭到第 3 层且形态罕见地好——这是一个"doctor 型"项目**：`ops doctor` 单命令收敛 4 项真实体检（zombies/net/orb/disk，实跑 4/4 通过 exit 0），AGENTS.md 三条核心哲学（CLI 优先/错误即规则/证据驱动）与 poteto 方法论同源。短板：第 2 层静态分析空缺（JS 仓库无 lint），`checks/` 体检脚本自身零测试。

## 分层判定

| 层级 | 判定 | 证据 |
|---|---|---|
| 1 架构 | ✅ | cli/cmds 子命令分组、skills ≤30 行纪律、bin/ 单入口；[TODO] 占位显式暴露能力边界，禁止假装存在 |
| 2 静态分析 | ❌ | 无 eslint/biome 配置；无 CI——CI 按"个人本地工具不建"惯例豁免，lint 无豁免理由 |
| 3 验证体系 | ⚠️ | doctor 体检闭环 ✅✅（实跑证据见下）；但 checks/*.check.js 自身无测试，体检工具的体检缺位 |
| 4 Prose | ✅ | AGENTS.md 38 行精简，每条带为什么；错误即规则条款与金字塔上移机制同构 |
| 5 人工 | ✅ | docs/known-issues.md 留痕已修问题 |

## 实跑证据

- `bun bin/ops.js doctor` → 4/4 项通过（zombies/net:proxy/orb:running/disk），exit 0
- `npx github:hnzxb/hnzxb.poteto check` → init 前红（缺 7 项）→ init 后绿 exit 0

## 明确不建议项

- **不建议建 CI**（推翻 agent 初筛建议）：checks 依赖本机状态（OrbStack/代理/磁盘），CI 环境跑不了真实体检，建了只能是假门禁——沿用 mihomo 案例"个人本地工具不建 CI"裁定
- **不建议给 checks 写 mock 单测**：体检脚本的价值就是碰真实系统，mock 掉等于测 mock
- **不建议引入 monorepo/重型工具链**：单 package 规模，agent 同判，采纳

## agent 初筛 vs 专家复核的差异记录

agent（新版采集+判定纪律）表现：[事实]/[推断] 标注到位、事实采集边界节完整、"建议补充采集"清单直接指导了抽查——新提示词首次实战合格。两处修正：CI 建议未考虑"个人本地工具"豁免惯例（规则库盲区，非幻觉）；未看到 checks/ 与 AGENTS.md 内容导致第 3/4 层低估（其已如实标注为采集边界，不算误判）。
