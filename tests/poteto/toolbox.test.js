#!/usr/bin/env node
// 工具箱自检：init 全链路 + 自检脚本正反两向，任何一步失败即 exit 1
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const bin = join(import.meta.dirname, '../../bin/poteto.js')
let failed = 0
const ok = (name, fn) => {
  try { fn(); console.log(`✅ ${name}`) }
  catch (err) { failed++; console.error(`✖ ${name}: ${err.message}`) }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg) }
const tmp = mkdtempSync(join(tmpdir(), 'poteto-self-'))

try {
  ok('bin/poteto.js 语法门禁', () => {
    execFileSync('node', ['--check', bin])
  })
  ok('init 安装 skills 与文档', () => {
    execFileSync('node', [bin, 'init'], { cwd: tmp })
    for (const f of ['.claude/skills/poteto-verify/SKILL.md', '.claude/skills/poteto-correct/SKILL.md',
      'docs/poteto/poteto方法论.md', 'docs/poteto/融合映射.md', 'docs/poteto/功能地图.md', 'docs/poteto/纠错台账.md', 'tests/poteto/check.js'])
      assert(fs.existsSync(join(tmp, f)), `缺失 ${f}`)
  })
  ok('生成脚本能被 node 解析并通过', () => {
    const out = execFileSync('node', ['tests/poteto/check.js'], { cwd: tmp, encoding: 'utf8' })
    assert(out.includes('完整'), `输出异常: ${out}`)
  })
  ok('重复 init 不覆盖已填写的模板', () => {
    const map = join(tmp, 'docs/poteto/功能地图.md')
    fs.writeFileSync(map, '已填写内容')
    execFileSync('node', [bin, 'init'], { cwd: tmp, stdio: 'ignore' })
    assert(fs.readFileSync(map, 'utf8') === '已填写内容', '模板被覆盖')
  })
  ok('缺失文件时自检失败 (exit 1)', () => {
    fs.rmSync(join(tmp, 'docs/poteto/融合映射.md'))
    let code = 0
    try { execFileSync('node', ['tests/poteto/check.js'], { cwd: tmp, stdio: 'ignore' }) } catch (err) { code = err.status }
    assert(code === 1, `期望 exit 1，实际 ${code}`)
  })
  ok('list/read/skills 可用', () => {
    const list = execFileSync('node', [bin, 'list'], { encoding: 'utf8' })
    assert(list.includes('poteto方法论.md'), 'list 未包含方法论文档')
    const read = execFileSync('node', [bin, 'read', 'docs/poteto方法论.md'], { encoding: 'utf8' })
    assert(read.length > 100, 'read 输出为空')
    assert(execFileSync('node', [bin, 'skills'], { encoding: 'utf8' }).includes('poteto-verify'), 'skills 未列出')
  })
} finally { rmSync(tmp, { recursive: true, force: true }) }

if (failed) { console.error(`\n${failed} 项失败`); process.exit(1) }
console.log('\n全部通过')
