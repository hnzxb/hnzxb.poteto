# 指令单 01 — at_console 五包分叉盘点（A 类零 diff 收编探测）

**产出方**：hnzxb.poteto 旁路专家 ｜ **执行方**：esptool.components 开发 Agent ｜ 2026-11-23

## 1. 修改目标与问题证据

现有组件.csv 记录 at_console 存在 5 个项目内分叉副本（ws_min/ws_link/ws_sensor 等三模板 + s3.idf.live + m5stack 工程各一份），职责相同但逐字节差异未知。目标：产出 `docs/规划/at_console-分叉diff报告.md`，判定 A 类（零 diff 直接收编）是否成立；不成立则给出 B 类（借鉴性重构）的分叉清单与净化点。

## 2. 影响范围与禁改范围

- 只新增上述报告文件；允许为取样本临时 `diff`，不留临时文件
- **禁改**：`components/` 骨架、`bin/comp.js`、`docs/规划/` 既有四件、任何源码文件

## 3. 预期产出形态

报告含：五副本路径表；逐对 diff 行数统计（`diff -u | wc -l` 即可，不必逐行分析）；差异分类（注释/空白 | 头文件声明 | 逻辑分叉）；结论行——A 类成立条件：存在一副本与其余全部零逻辑 diff；否则列 B 类分叉点（预计集中在线程模型与队列深度）

## 4. 验证命令

```bash
# 每对副本比对后：
git status --porcelain  # 应仅新增 1 个报告文件
node bin/comp.js check   # exit=0
```

## 5. 通过标准

- 报告覆盖 5 副本全排列比对（10 对）或以共同基线两两法等效覆盖
- 每对差异归入三分类之一，无未归类差异
- 明确给出 A/B 类结论，含一句理由

## 6. 回传证据

`git diff --stat` 输出 + `node bin/comp.js check` 退出码 + 报告文件路径
