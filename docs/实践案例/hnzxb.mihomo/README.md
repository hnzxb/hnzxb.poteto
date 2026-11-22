# 实践案例：hnzxb.mihomo 评审（2026-11-22）

旁路评审目标：`/Users/benz/hnzxb/hnzxb.mihomo`（macOS-only CLI，~1829 行：控制 root launchd 守护的 mihomo 内核，AI/dev 流量优选出口）。

## 总评

这是我评审过的项目里 **Prose 层与产品内验证最好的一档**：README 与开发过程记录每条决策都带「为什么」（含原始故障现象），doctor 命令是内建的运行时体检闭环（实跑 exit 0），CI 的 smoke 守卫甚至防住了 bundling 的 argv 陷阱。短板集中在静态与回归层：无 lint、无任何单元测试——最核心的决策算法 classify()（住宅/机房 IP 分类，直接决定选点对错）是纯词表数据无回归，规则组装同样只有端到端肉眼验证。

## 分层判定

| 层 | 判定 | 证据 |
|---|---|---|
| 1 架构 | ✅ | provider-native routing（复用机场自带分组，注释明示为什么不再本地派生）；YAML.stringify 生成配置（无字符串拼 SQL 类风险）；单文件 bundle + staged runtime 解 launchd 绝对路径问题 |
| 2 静态分析 | ⚠️ | CI 存在且质量高（macos runner + build + smoke + argv 守卫 grep，.github/workflows/ci.yml）；但无 eslint；typescript devDep 无 tsconfig——装饰性依赖 |
| 3 验证体系 | ⚠️ | doctor 内建体检闭环 ✅、CI smoke ✅；但无 tests/ 目录、无回归层——classify/规则组装零测试；验证命令已收敛 package.json scripts |
| 4 Prose | ✅ | 开发过程记录按「每次卡住的原因+为什么选这个解法」组织，最佳实践范本；⚠️ 微瑕：项目路径过期（~/Codes/Githubs） |
| 5 人工 | ✅ | 个人工具，人工即全部 |

## 实跑证据（2026-11-22，均退出码 0）

- `node dist/mihomo.mjs --help` → 完整命令表
- `node dist/mihomo.mjs doctor` → 配置语法 ✔ / API 可达 1.19.33 ✔ / launchd job 已启用 ✔，exit 0

## 系统性缺口（上移优先排序）

1. **classify() 无回归**（验证层落点）：17 个住宅 ASN + 双词表是 best 的决策核心，词表改坏（拼错、大小写、词冲突）无任何机制拦截 → A1
2. **规则组装无回归**（验证层）：AI_DOMAINS 撞名/顺序回归、无默认代理兜底漂移只能肉眼发现 → A2
3. **无静态门禁**（静态层）：lint 缺位，坏模式无确定性拦截 → B1
4. 开发记录路径过期（prose 微瑕）→ D1

## 明确不建议做的项

- 不给订阅 YAML 上 jsonschema 契约：单一可信源是机场，格式错了直接坏在 fetch/parse，契约校验是流程倒挂
- 不引入 justfile：package.json scripts 已收敛且本项目无多包
- 不补 tsconfig/全面 TS：数据表型代码，ESLint + 单测性价比更高
- 不动 CI：现有 ci.yml 的 smoke 守卫设计得比我默认模板好

## 方法论沉淀

正例入库：**「开发过程记录」的写法（故障现象原文 + 卡住原因 + 解法取舍）值得作为 poteto 案例文档的范式**；**doctor 模式（产品自带体检命令）是验证体系的优秀形态**——比外部测试更接近真实运行态。两者已在本次评审中作为反例的对照组。

## 实施记录（2026-11-23，用户授权「你自己判断」→ 直接实施）

裁决理由：个人工具、纯增量零行为变更、合规自测本就是专家交付物（知行合一）。项目 npm 生态保持 npm 不切 bun。

- **P0 完成**：eslint.config.js + lint/test/check scripts；lint 首跑揪出 3 处死导入（cli.js `RULES_FILE`、doctor.js `MIXED_PORT`/`isBlocked`）；CI 加 lint+test step。tests/poteto/gates.test.js **先红（3 failed：无 eslint 配置/check script/CI step）后绿**，红旗证据已记入 CSV
- **P1 完成**：`mergeSubscriptions(docs)` 纯函数抽取（验证层 seam，零行为变更）+ tests/unit 14 用例（classify 5 / 规则组合+parseEnv 9）
- **终态证据**：`npm run check` exit 0（lint 0 error + 16 tests passed）；`npm run build` exit 0；重构后 `node dist/mihomo.mjs doctor` 实跑「体检通过」（AI 端点延迟 ✔ 171ms/176ms）。commit 6f1849e
- 遗留：D1 开发记录勘误（路径过期）未做，留在 CSV 待实施
