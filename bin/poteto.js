#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const cwd = process.cwd()

const skillsDir = path.join(root, 'skills')
const docsDir = path.join(root, 'docs')

const listDocs = (dir = docsDir, base = '') =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const rel = base ? `${base}/${e.name}` : e.name
    return e.isDirectory() ? listDocs(path.join(dir, e.name), rel) : [rel]
  })

const SELF_CHECK = `#!/usr/bin/env node
import fs from 'node:fs'

const missing = []
for (const f of ['.claude/skills/poteto-verify/SKILL.md', '.claude/skills/poteto-correct/SKILL.md',
  'docs/poteto/poteto方法论.md', 'docs/poteto/融合映射.md', 'docs/poteto/功能地图.md', 'docs/poteto/纠错台账.md']) {
  if (!fs.existsSync(f)) missing.push(f)
}

if (missing.length) {
  console.error('✖ poteto 安装不完整，缺失:\\\n' + missing.map((f) => '  - ' + f).join('\\\n'))
  process.exit(1)
}
console.log('✅ poteto 工具箱完整: 2 skills + 4 docs')
`

const usage = (code = 0) => {
  console.log(`hnzxb-poteto —— poteto 方法论工具箱

用法:
  hnzxb-poteto init            # 安装 skills 到 ./.claude/skills/，方法论文档到 ./docs/poteto/，自检脚本到 ./tests/poteto/
  hnzxb-poteto list            # 列出可用文档
  hnzxb-poteto read <路径>     # 打印文档内容（如 docs/poteto方法论.md）
  hnzxb-poteto skills          # 列出可安装的 skills
  hnzxb-poteto check           # 检查当前目录 poteto 安装完整性（缺则 exit 1，先红后绿用）
  hnzxb-poteto agent           # 采集当前项目事实，用 poteto 方法论作提示词调 DeepSeek 出评审报告`)
  process.exit(code)
}

const [, , cmd, ...rest] = process.argv
if (!cmd || cmd === '-h' || cmd === '--help') usage()

try {
  if (cmd === 'init') {
    fs.mkdirSync(path.join(cwd, '.claude/skills'), { recursive: true })
    for (const s of fs.readdirSync(skillsDir)) {
      fs.cpSync(path.join(skillsDir, s), path.join(cwd, '.claude/skills', s), { recursive: true })
      console.log(`✅ skill 已安装: .claude/skills/${s}`)
    }
    fs.mkdirSync(path.join(cwd, 'docs/poteto'), { recursive: true })
    for (const d of ['poteto方法论.md', '融合映射.md']) {
      fs.copyFileSync(path.join(docsDir, d), path.join(cwd, 'docs/poteto', d))
      console.log(`✅ 文档已安装: docs/poteto/${d}`)
    }
    const scaffold = (file, title) => {
      const target = path.join(cwd, 'docs/poteto', file)
      if (fs.existsSync(target)) return
      fs.writeFileSync(target, `# ${title}\n\n> 由 hnzxb-poteto 生成，按 skills/poteto-verify 填写。\n\n| 功能 | 到达路径 | 验证命令 | 证据形态 |\n|---|---|---|---|\n`)
      console.log(`✅ 模板已生成: docs/poteto/${file}`)
    }
    scaffold('功能地图.md', '功能地图')
    scaffold('纠错台账.md', '纠错台账')
    fs.mkdirSync(path.join(cwd, 'tests/poteto'), { recursive: true })
    fs.writeFileSync(path.join(cwd, 'tests/poteto/check.js'), SELF_CHECK)
    console.log('✅ 自检脚本已安装: tests/poteto/check.js')
  } else if (cmd === 'list') {
    for (const d of listDocs()) console.log(d)
  } else if (cmd === 'read') {
    const file = path.join(root, rest[0] ?? '')
    if (!file.startsWith(root) || !fs.existsSync(file)) throw new Error(`文档不存在: ${rest[0]}（先 hnzxb-poteto list 查看可用文档）`)
    console.log(fs.readFileSync(file, 'utf8'))
  } else if (cmd === 'skills') {
    for (const s of fs.readdirSync(skillsDir)) console.log(s)
  } else if (cmd === 'check') {
    const missing = []
    for (const f of ['.claude/skills/poteto-verify/SKILL.md', '.claude/skills/poteto-correct/SKILL.md',
      'docs/poteto/poteto方法论.md', 'docs/poteto/融合映射.md', 'docs/poteto/功能地图.md', 'docs/poteto/纠错台账.md', 'tests/poteto/check.js'])
      if (!fs.existsSync(path.join(cwd, f))) missing.push(f)
    if (missing.length) {
      console.error('✖ poteto 安装不完整，缺失:\n' + missing.map((f) => '  - ' + f).join('\n'))
      process.exit(1)
    }
    console.log('✅ poteto 工具箱完整: 2 skills + 4 docs + 自检脚本')
  } else if (cmd === 'agent') {
    const key = fs.existsSync(path.join(cwd, '.env'))
      ? (fs.readFileSync(path.join(cwd, '.env'), 'utf8').match(/^DEEPSEEK_API_KEY=["']?(.+?)["']?\s*$/m)?.[1] ?? '')
      : ''
    const apiKey = key || process.env.DEEPSEEK_API_KEY
    if (!apiKey) throw new Error('未找到 DEEPSEEK_API_KEY（目标目录 .env 或环境变量）')

    const collectFacts = () => {
      const entries = fs.readdirSync(cwd, { withFileTypes: true })
      const tree = entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name)).join('\n')
      const probes = {
        git仓库: fs.existsSync(path.join(cwd, '.git')),
        CI门禁: fs.existsSync(path.join(cwd, '.github/workflows')),
        justfile: fs.existsSync(path.join(cwd, 'justfile')),
        lint配置: entries.some((e) => /^eslint\.config\.|biome\.json|\.eslintrc/.test(e.name)),
        规范文件: entries.some((e) => /^(CLAUDE|AGENTS)\.md$/.test(e.name)),
        tests目录: entries.some((e) => e.isDirectory() && /^tests?|__tests__$/.test(e.name)),
      }
      let scripts = '无 package.json'
      const pkg = path.join(cwd, 'package.json')
      if (fs.existsSync(pkg)) scripts = JSON.stringify(JSON.parse(fs.readFileSync(pkg, 'utf8')).scripts ?? {})
      return `## 顶层目录\n${tree}\n## 环境探针\n${JSON.stringify(probes, null, 2)}\n## package.json scripts\n${scripts}`
    }

    const methodology = fs.readFileSync(path.join(docsDir, 'poteto方法论.md'), 'utf8')
    const system = `${methodology}\n\n你是 poteto 旁路评审专家。基于上述信任倒金字塔方法论，对用户给出的项目事实做评审。\n输出结构（五件套，缺一不可）：\n1. 总评：信任阶梯搭到第几层，最大短板\n2. 分层覆盖度表：五层逐行，判定 ✅⚠️❌ + 证据（引用事实）\n3. 系统性缺口清单：按"能在哪一层强制"上移排序（架构→lint/CI→测试→prose），拒绝下移建议\n4. 可执行改进项：最小变更，注明验证方式\n5. 明确不建议项：不值得做的，说明理由\n只依据给出的事实判断，不臆测未给出的信息。`
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: collectFacts() },
        ],
      }),
    })
    if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const report = (await res.json()).choices?.[0]?.message?.content
    if (!report) throw new Error('DeepSeek 返回为空')
    const out = path.join(cwd, 'docs/poteto/评审报告.md')
    fs.mkdirSync(path.dirname(out), { recursive: true })
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    fs.writeFileSync(out, `# poteto 评审报告（${date}，DeepSeek agent 生成）\n\n${report}\n`)
    console.log(report)
    console.log(`\n✅ 报告已写入: ${out}`)
  } else {
    usage(1)
  }
} catch (err) {
  console.error(`错误: ${err.message}`)
  process.exit(1)
}
