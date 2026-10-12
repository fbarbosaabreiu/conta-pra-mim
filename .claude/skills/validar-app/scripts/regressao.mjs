// Regressão completa antes de publicar: compara a versão nova (build de produção, servido localmente)
// com o que está no ar e roda todos os testes de funcionamento. Termina com um relatório e sai com
// código 1 se algo quebrou.
// Uso (da raiz do repo): node .claude/skills/validar-app/scripts/regressao.mjs [--rapido] [--aceitar "texto1|texto2"]
//   --rapido   fluxo completo e usabilidade só em português (o inventário continua nos 4 idiomas)
//   --aceitar  itens que sumiram DE PROPÓSITO (repassado ao inventário)
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from './lib.mjs'

const HERE = join(ROOT, '.claude/skills/validar-app/scripts')
const OUT = join(ROOT, 'regressao')
const fast = process.argv.includes('--rapido')
const acceptIdx = process.argv.indexOf('--aceitar')
const accept = acceptIdx > 0 ? ['--aceitar', process.argv[acceptIdx + 1]] : []
mkdirSync(OUT, { recursive: true })

const LOCAL_PORT = 4173
const AUTH_PORT = 5174
const servers = []

function run(name, cmd, args, env = {}) {
  return new Promise((resolve) => {
    const started = Date.now()
    const p = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...env }, shell: cmd === 'npm' || cmd === 'python' })
    let out = ''
    p.stdout.on('data', (d) => (out += d))
    p.stderr.on('data', (d) => (out += d))
    p.on('close', (code) => {
      const secs = Math.round((Date.now() - started) / 1000)
      writeFileSync(join(OUT, `log-${name}.txt`), out)
      resolve({ name, code, out, secs })
    })
  })
}

async function serve(args, port, env = {}) {
  const p = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), ...args, '--port', String(port), '--strictPort'], {
    cwd: ROOT,
    env: { ...process.env, ...env },
  })
  servers.push(p)
  for (let i = 0; i < 60; i++) {
    const ok = await fetch(`http://localhost:${port}/`).then((r) => r.ok, () => false)
    if (ok) return true
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

const node = (script, args = [], env = {}) => [process.execPath, [join(HERE, script), ...args], env]
const LOCAL = `http://localhost:${LOCAL_PORT}/`
const results = []
const step = async (label, [cmd, args, env], judge = (r) => r.code === 0) => {
  process.stdout.write(`▶ ${label}… `)
  const r = await run(label.replace(/\W+/g, '-').toLowerCase(), cmd, args, env)
  const verdict = judge(r)
  const summary = (r.out.match(/(\d+\/\d+ [^\n]+)\s*$/) ?? [])[1] ?? (r.code === 0 ? 'ok' : `saiu com código ${r.code}`)
  results.push({ label, verdict, summary, out: r.out, secs: r.secs })
  console.log(`${verdict === true ? '✅' : verdict === 'revisar' ? '⚠️' : '❌'} ${summary} (${r.secs}s)`)
  return verdict
}

try {
  await step('Conteúdo nos 4 idiomas', ['python', [join(HERE, 'check_content.py')]])
  const built = await step('Tipos e build de produção', ['npm', ['run', 'build']])
  if (built !== true) throw new Error('build quebrado — corrija antes de seguir')

  if (!(await serve(['preview'], LOCAL_PORT))) throw new Error(`vite preview não subiu na porta ${LOCAL_PORT}`)
  const local = { LOCAL_URL: LOCAL, APP_URL: `${LOCAL}#` }

  await step('Inventário: nada da produção sumiu', node('inventory.mjs', [OUT, ...accept], local))
  await step('Comparação visual com a produção', node('visual.mjs', [OUT], local), (r) => (r.code !== 0 ? false : /⚠️/.test(r.out) ? 'revisar' : true))
  await step('Fluxo completo (histórias, quizzes, sons)', node('e2e.mjs', fast ? ['pt'] : [], local))
  await step('Usabilidade no celular', node('usability.mjs', fast ? [OUT, 'pt'] : [OUT], local))
  await step('Qualidade dos sons', node('audio_report.mjs', [OUT]), (r) => (r.code !== 0 ? false : /⚠️/.test(r.out) ? 'revisar' : true))

  const authEnv = { VITE_SUPABASE_URL: 'https://fake-projeto.supabase.co', VITE_SUPABASE_ANON_KEY: 'teste' }
  if (await serve([], AUTH_PORT, authEnv)) await step('Conta (Supabase simulado)', node('auth.mjs', [OUT], { APP_URL: `http://localhost:${AUTH_PORT}/#` }))
  else results.push({ label: 'Conta (Supabase simulado)', verdict: false, summary: `servidor não subiu na porta ${AUTH_PORT}`, out: '' })
} catch (e) {
  results.push({ label: 'Interrompido', verdict: false, summary: e.message, out: '' })
} finally {
  for (const s of servers) s.kill()
}

// ---- relatório
const failed = results.filter((r) => r.verdict === false)
const review = results.filter((r) => r.verdict === 'revisar')
const fails = (out) => out.split('\n').filter((l) => /^FAIL|⚠️/.test(l)).slice(0, 30)
let md = `# Regressão — ${new Date().toLocaleString('pt-BR')}\n\n| Etapa | Resultado | |\n|---|---|---|\n`
for (const r of results) md += `| ${r.label} | ${r.verdict === true ? '✅' : r.verdict === 'revisar' ? '⚠️ revisar' : '❌'} | ${r.summary} |\n`
for (const r of [...failed, ...review]) if (fails(r.out).length) md += `\n## ${r.label}\n\n${fails(r.out).map((l) => `- ${l}`).join('\n')}\n`
md += failed.length
  ? `\n**NÃO PUBLIQUE**: ${failed.length} etapa(s) quebraram. Logs em \`regressao/log-*.txt\`.\n`
  : review.length
    ? `\n**Revise antes de publicar**: olhe as imagens \`regressao/visual-*.png\` e os sons marcados. Se as mudanças forem de propósito, pode publicar.\n`
    : `\n**Pode publicar.** Depois do deploy: \`node .claude/skills/validar-app/scripts/smoke.mjs\`.\n`
writeFileSync(join(OUT, 'relatorio.md'), md)
console.log(`\n${md}`)
process.exitCode = failed.length ? 1 : 0
