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
  'docs/poteto/poteto方法论.md', 'docs/poteto/融合映射.md']) {
  if (!fs.existsSync(f)) missing.push(f)
}

if (missing.length) {
  console.error('✖ poteto 安装不完整，缺失:\n' + missing.map((f) => '  - ' + f).join('\n'))
  process.exit(1)
}
console.log('✅ poteto 工具箱完整: 2 skills + 2 docs')
`

const usage = () => {
  console.log(`hnzxb-poteto —— poteto 方法论工具箱

用法:
  hnzxb-poteto init            # 安装 skills 到 ./.claude/skills/，方法论文档到 ./docs/
  hnzxb-poteto list            # 列出可用文档
  hnzxb-poteto read <路径>     # 打印文档内容（如 docs/poteto方法论.md）
  hnzxb-poteto skills          # 列出可安装的 skills`)
  process.exit(0)
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
  } else {
    usage()
  }
} catch (err) {
  console.error(`错误: ${err.message}`)
  process.exit(1)
}
