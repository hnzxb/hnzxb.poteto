# hnzxb.poteto — Poteto 方法论评审专家

基于 Lauren Tan（@poteto）的**信任倒金字塔**方法论构建的旁路专家（sidecar expert）知识库。给它任意一个项目，它会基于本仓库沉淀的方法论与技能，对该项目进行专业评审。

## 核心理念

**一切归结于信任（Trust）**：高质量产出不靠盯单个 Agent 微操，而靠设计一个让 Agent 默认做对的环境。评审一个项目，就是评审它的信任阶梯搭到了哪一层。

信任倒金字塔（投入优先级从高到低）：

1. **代码库与架构** — 结构上消除坏写法，让"容易的事 = 正确的事"
2. **静态分析** — Lint / 类型 / CI，确定性、低成本止血
3. **验证体系** — 给 Agent 手和眼：确定性验证命令 + 功能地图
4. **Prose 规则** — 自然语言约束，能不用就不用
5. **人工审查** — 仅用于发现系统性缺口，发现后立即上移

## 仓库结构

```
docs/
  poteto方法论.md     # 方法论总览 + pstack 一手资料汇编
  融合映射.md          # 金字塔层级 ↔ 本机规范逐层对照（已覆盖/部分/空缺）
skills/
  poteto-verify/       # 验证技能：确定性验证命令 + 功能地图
  poteto-correct/      # 纠错上移技能：错误类别 → 最高可强制层，附纠错台账
```

## 用途：旁路专家评审

本仓库不产出业务代码，产出**评审报告**。工作方式：

1. 读取 `docs/poteto方法论.md` 建立评审框架
2. 对目标项目逐层评审（架构 → 静态分析 → 验证 → prose → 人工审查），细节见 `AGENTS.md`
3. 输出分层评审报告：各层覆盖度、系统性缺口、按"上移优先"排序的改进建议

## 引用与复用

- `skills/` 目录为可移植技能源：复制到目标项目 `.claude/skills/` 下即可被 Claude Code 识别
- 评审本身是只读的；若目标项目采纳建议落地修复，则按 `poteto-correct` 的上移流程执行

## 参考

- pstack 官方仓库：https://github.com/cursor/plugins/tree/main/pstack
- 验证技能官方示例：https://github.com/poteto/verification-skill-example
- 完整资料清单见 `docs/poteto方法论.md` 第 6 节
