// Página do painel: HTML + CSS com os dados embutidos; os gráficos são desenhados
// no navegador por `client` (função autocontida, serializada para dentro da página).

export interface DashboardData {
  days: number
  generatedAt: string
  totals: { devices: number; sessions: number; storyOpens: number; storyCompletes: number; quizCompletes: number }
  newDevices: number
  daily: { day: string; devices: number; sessions: number }[]
  stories: { id: string; title: string; opens: number; completes: number; devices: number }[]
  quiz: { theme: string; starts: number; completes: number; devices: number }[]
  places: { country: string | null; region: string | null; city: string | null; devices: number; sessions: number }[]
  heat: { dow: number; hour: number; sessions: number }[]
  devices: {
    device: string
    first: string
    last: string
    sessions: number
    stories: number
    quizzes: number
    city: string | null
    country: string | null
    platform: string | null
    lang: string | null
    installed: number
  }[]
  recent: {
    ts: string
    device: string
    name: string
    story: string | null
    theme: string | null
    value: number | null
    city: string | null
    country: string | null
  }[]
  platforms: { key: string | null; devices: number }[]
  langs: { key: string | null; devices: number }[]
}

const CSS = `
:root {
  color-scheme: light;
  --page: #f9f9f7; --surface-1: #fcfcfb; --surface-2: #f0efec;
  --ink-1: #0b0b0b; --ink-2: #52514e; --ink-muted: #898781;
  --grid: #e1e0d9; --axis: #c3c2b7; --ring: rgba(11,11,11,0.10);
  --series-1: #2a78d6;
  --seq-1: #cde2fb; --seq-2: #9ec5f4; --seq-3: #6da7ec; --seq-4: #3987e5; --seq-5: #256abf; --seq-6: #184f95; --seq-7: #0d366b;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --page: #0d0d0d; --surface-1: #1a1a19; --surface-2: #262624;
    --ink-1: #f0efec; --ink-2: #c3c2b7; --ink-muted: #898781;
    --grid: #2c2c2a; --axis: #383835; --ring: rgba(255,255,255,0.10);
    --series-1: #3987e5;
    --seq-1: #104281; --seq-2: #184f95; --seq-3: #1c5cab; --seq-4: #2a78d6; --seq-5: #3987e5; --seq-6: #6da7ec; --seq-7: #9ec5f4;
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --page: #0d0d0d; --surface-1: #1a1a19; --surface-2: #262624;
  --ink-1: #f0efec; --ink-2: #c3c2b7; --ink-muted: #898781;
  --grid: #2c2c2a; --axis: #383835; --ring: rgba(255,255,255,0.10);
  --series-1: #3987e5;
  --seq-1: #104281; --seq-2: #184f95; --seq-3: #1c5cab; --seq-4: #2a78d6; --seq-5: #3987e5; --seq-6: #6da7ec; --seq-7: #9ec5f4;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--ink-1); font: 15px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
.wrap { max-width: 1100px; margin: 0 auto; padding: 24px 16px 48px; }
header { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
h1 { font-size: 22px; margin: 0; }
h2 { font-size: 16px; margin: 0 0 2px; }
.sub { color: var(--ink-2); font-size: 13px; margin: 0 0 14px; }
.periods { display: flex; gap: 4px; background: var(--surface-2); padding: 3px; border-radius: 999px; }
.periods a { color: var(--ink-2); text-decoration: none; padding: 5px 12px; border-radius: 999px; font-size: 13px; }
.periods a[aria-current] { background: var(--surface-1); color: var(--ink-1); font-weight: 600; box-shadow: 0 0 0 1px var(--ring); }
.grid { display: grid; gap: 16px; grid-template-columns: repeat(12, 1fr); }
.card { background: var(--surface-1); border-radius: 14px; padding: 16px; box-shadow: 0 0 0 1px var(--ring); grid-column: span 12; min-width: 0; }
@media (min-width: 860px) { .half { grid-column: span 6; } .third { grid-column: span 4; } }
.hero { display: flex; flex-wrap: wrap; gap: 28px; align-items: flex-end; }
.hero .big { font-size: 52px; font-weight: 600; line-height: 1; }
.tile .label { color: var(--ink-2); font-size: 13px; }
.tile .value { font-size: 24px; font-weight: 600; }
.tile .note { color: var(--ink-muted); font-size: 12px; }
.bars { display: flex; flex-direction: column; gap: 6px; }
.bar-row { display: grid; grid-template-columns: minmax(90px, 38%) 1fr auto; align-items: center; gap: 10px; padding: 3px 4px; border-radius: 6px; }
.bar-row:hover { background: var(--surface-2); }
.bar-row .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { height: 14px; display: flex; align-items: center; }
.bar { height: 14px; background: var(--series-1); border-radius: 0 4px 4px 0; min-width: 2px; }
.bar.zero { background: transparent; min-width: 0; }
.bar-row .val { font-variant-numeric: tabular-nums; color: var(--ink-2); font-size: 13px; text-align: right; min-width: 7ch; }
.tag { display: inline-block; font-size: 11px; color: var(--ink-2); background: var(--surface-2); border-radius: 999px; padding: 0 7px; margin-left: 6px; }
svg text { fill: var(--ink-muted); font-size: 11px; }
#daily { overflow: hidden; }
.heat { display: grid; grid-template-columns: 34px repeat(24, 1fr); gap: 2px; font-size: 11px; color: var(--ink-muted); }
.heat .cell { aspect-ratio: 1; border-radius: 3px; background: var(--surface-2); min-width: 0; }
.heat .lbl { display: flex; align-items: center; }
.legend-scale { display: flex; align-items: center; gap: 6px; margin-top: 10px; color: var(--ink-muted); font-size: 12px; }
.legend-scale span.sw { width: 18px; height: 10px; border-radius: 2px; display: inline-block; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { text-align: left; color: var(--ink-2); font-weight: 600; border-bottom: 1px solid var(--axis); padding: 6px 8px; white-space: nowrap; }
td { border-bottom: 1px solid var(--grid); padding: 6px 8px; vertical-align: top; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
.scroll { overflow-x: auto; }
code { font: 12px ui-monospace, Consolas, monospace; background: var(--surface-2); padding: 1px 5px; border-radius: 4px; }
.empty { color: var(--ink-muted); font-size: 13px; padding: 8px 0; }
#tip { position: fixed; pointer-events: none; background: var(--ink-1); color: var(--surface-1); font-size: 12px; padding: 6px 9px; border-radius: 6px; opacity: 0; transition: opacity .1s; z-index: 10; max-width: 260px; }
details summary { cursor: pointer; color: var(--ink-2); font-size: 13px; margin-top: 10px; }
`

/** Roda no navegador: monta todas as seções a partir dos dados. Não pode usar nada de fora. */
function client(D: DashboardData) {
  const $ = (id: string) => document.getElementById(id) as HTMLElement
  const esc = (s: unknown) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
  const fmt = (n: number) => new Intl.NumberFormat('pt-BR').format(n || 0)
  const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) + '%' : '—')
  const regionName = (() => {
    try {
      const dn = new Intl.DisplayNames(['pt-BR'], { type: 'region' })
      return (c: string | null) => (c ? (dn.of(c) ?? c) : '—')
    } catch {
      return (c: string | null) => c ?? '—'
    }
  })()
  const when = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  const code = (d: string) => d.slice(0, 6).toUpperCase()
  const place = (city: string | null, country: string | null) =>
    [city, country ? regionName(country) : null].filter(Boolean).join(', ') || '—'
  const THEMES: Record<string, string> = { animais: 'Animais', cores: 'Cores', numeros: 'Números' }
  const LANGS: Record<string, string> = { pt: 'Português', en: 'Inglês', es: 'Espanhol', fr: 'Francês' }
  const titleOf = (id: string | null) => (id ? (D.stories.find((s) => s.id === id)?.title ?? id) : '')
  const EVENT: Record<string, (e: DashboardData['recent'][number]) => string> = {
    app_open: () => 'abriu o app',
    story_open: (e) => 'abriu a história <b>' + esc(titleOf(e.story)) + '</b>',
    story_complete: (e) => 'terminou a história <b>' + esc(titleOf(e.story)) + '</b>',
    quiz_start: (e) => 'começou o quiz <b>' + esc(THEMES[e.theme ?? ''] ?? e.theme) + '</b>',
    quiz_complete: (e) =>
      'terminou o quiz <b>' + esc(THEMES[e.theme ?? ''] ?? e.theme) + '</b>' + (e.value != null ? ' (' + e.value + '/5 de primeira)' : ''),
    onboarding_done: () => 'viu o “Como usar”',
    onboarding_skip: () => 'pulou o “Como usar”',
  }

  // ----- tooltip compartilhado -----
  const tip = $('tip')
  document.addEventListener('mousemove', (ev) => {
    const el = (ev.target as HTMLElement).closest('[data-tip]') as HTMLElement | null
    if (!el) {
      tip.style.opacity = '0'
      return
    }
    tip.innerHTML = el.dataset.tip as string
    tip.style.opacity = '1'
    const x = Math.min(ev.clientX + 14, window.innerWidth - tip.offsetWidth - 8)
    tip.style.left = x + 'px'
    tip.style.top = ev.clientY + 14 + 'px'
  })

  // ----- números de destaque -----
  const t = D.totals
  $('hero').innerHTML =
    '<div><div class="tile label" style="color:var(--ink-2);font-size:13px">Aparelhos que usaram</div><div class="big">' +
    fmt(t.devices) +
    '</div></div>' +
    [
      ['Novos aparelhos', fmt(D.newDevices), 'usaram pela 1ª vez no período'],
      ['Sessões', fmt(t.sessions), 'vezes que o app foi aberto'],
      ['Histórias abertas', fmt(t.storyOpens), pct(t.storyCompletes, t.storyOpens) + ' lidas até o fim'],
      ['Quizzes concluídos', fmt(t.quizCompletes), 'as 5 perguntas até o fim'],
    ]
      .map(
        ([l, v, n]) =>
          '<div class="tile"><div class="label">' + l + '</div><div class="value">' + v + '</div><div class="note">' + n + '</div></div>',
      )
      .join('')

  // ----- uso por dia (colunas) — redesenhado quando a largura muda (ex.: girar o celular) -----
  let lastWidth = 0
  const drawDaily = () => {
    const box = $('daily')
    if (box.clientWidth === lastWidth) return
    lastWidth = box.clientWidth
    if (!D.daily.length) {
      box.innerHTML = '<p class="empty">Ainda sem uso neste período.</p>'
      return
    }
    // Preenche os dias sem uso com zero.
    const byDay = new Map(D.daily.map((d) => [d.day, d]))
    const start = new Date(D.days ? Date.now() - (D.days - 1) * 864e5 : D.daily[0].day + 'T00:00:00Z')
    const days: { day: string; devices: number; sessions: number }[] = []
    for (let d = new Date(start.toISOString().slice(0, 10) + 'T00:00:00Z'); d <= new Date(); d = new Date(d.getTime() + 864e5)) {
      const key = d.toISOString().slice(0, 10)
      days.push(byDay.get(key) ?? { day: key, devices: 0, sessions: 0 })
    }
    // Desenha na largura real do cartão (texto legível no celular, sem encolher o SVG).
    const W = Math.max(280, box.clientWidth),
      H = 220,
      L = 34,
      B = 24,
      T = 10
    const max = Math.max(1, ...days.map((d) => d.devices))
    const step = Math.max(1, Math.ceil(max / 4))
    const top = step * Math.ceil(max / step)
    const slot = (W - L) / days.length
    const bw = Math.min(24, slot * 0.7)
    const y = (v: number) => T + (H - T - B) * (1 - v / top)
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Aparelhos por dia">'
    for (let v = 0; v <= top; v += step) {
      svg +=
        '<line x1="' + L + '" x2="' + W + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="var(' + (v ? '--grid' : '--axis') + ')" stroke-width="1"/>' +
        '<text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '</text>'
    }
    const every = Math.ceil(days.length / Math.max(2, Math.floor(W / 90)))
    days.forEach((d, i) => {
      const x = L + i * slot + (slot - bw) / 2
      const h = y(0) - y(d.devices)
      const label = new Date(d.day + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
      const tipText = esc(label) + '<br>' + d.devices + ' aparelho(s) · ' + d.sessions + ' sessão(ões)'
      // Área de toque = a coluna inteira (maior que a barra).
      svg += '<rect x="' + (L + i * slot) + '" y="' + T + '" width="' + slot + '" height="' + (H - T - B) + '" fill="transparent" data-tip="' + tipText + '"/>'
      if (h > 0) {
        const r = Math.min(4, h, bw / 2)
        svg +=
          '<path pointer-events="none" fill="var(--series-1)" d="M' + x + ',' + y(0) + ' V' + (y(d.devices) + r) +
          ' Q' + x + ',' + y(d.devices) + ' ' + (x + r) + ',' + y(d.devices) + ' H' + (x + bw - r) +
          ' Q' + (x + bw) + ',' + y(d.devices) + ' ' + (x + bw) + ',' + (y(d.devices) + r) + ' V' + y(0) + ' Z"/>'
      }
      if (i % every === 0) svg += '<text x="' + (x + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(label) + '</text>'
    })
    box.innerHTML = svg + '</svg>'
  }
  drawDaily()
  let resizeTimer = 0
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(drawDaily, 150)
  })

  // ----- barras horizontais genéricas -----
  function bars(
    rows: { name: string; value: number; tag?: string; tip: string; valueText?: string }[],
    emptyText: string,
  ): string {
    if (!rows.length) return '<p class="empty">' + emptyText + '</p>'
    const max = Math.max(1, ...rows.map((r) => r.value))
    return (
      '<div class="bars">' +
      rows
        .map(
          (r) =>
            '<div class="bar-row" data-tip="' + r.tip + '"><span class="name">' + esc(r.name) + (r.tag ? '<span class="tag">' + r.tag + '</span>' : '') +
            '</span><span class="bar-track"><span class="bar' + (r.value ? '' : ' zero') + '" style="width:' + (100 * r.value) / max +
            '%"></span></span><span class="val">' + (r.valueText ?? fmt(r.value)) + '</span></div>',
        )
        .join('') +
      '</div>'
    )
  }

  // ----- histórias: mais e menos acessadas -----
  const stories = [...D.stories].sort((a, b) => b.opens - a.opens || a.title.localeCompare(b.title))
  const storyRow = (s: DashboardData['stories'][number]) => ({
    name: s.title,
    value: s.opens,
    // Na coluna do número (o nome pode ser cortado com reticências e esconderia a etiqueta).
    valueText: s.opens ? fmt(s.opens) : 'nunca aberta',
    tip:
      '<b>' + esc(s.title) + '</b><br>' + s.opens + ' abertura(s) · ' + s.devices + ' aparelho(s)<br>' +
      pct(s.completes, s.opens) + ' lidas até o fim',
  })
  $('stories-top').innerHTML = bars(
    stories.filter((s) => s.opens > 0).slice(0, 8).map(storyRow),
    'Nenhuma história aberta ainda.',
  )
  const least = [...D.stories].sort((a, b) => a.opens - b.opens || a.title.localeCompare(b.title)).slice(0, 8)
  $('stories-least').innerHTML = bars(least.map(storyRow), 'O catálogo chega quando o primeiro aparelho abre o app.')
  $('stories-table').innerHTML =
    '<table><thead><tr><th>História</th><th class="num">Aberturas</th><th class="num">Aparelhos</th><th class="num">Até o fim</th></tr></thead><tbody>' +
    stories
      .map(
        (s) =>
          '<tr><td>' + esc(s.title) + '</td><td class="num">' + fmt(s.opens) + '</td><td class="num">' + fmt(s.devices) +
          '</td><td class="num">' + pct(s.completes, s.opens) + '</td></tr>',
      )
      .join('') +
    '</tbody></table>'

  // ----- quiz -----
  $('quiz').innerHTML = bars(
    D.quiz.map((q) => ({
      name: THEMES[q.theme] ?? q.theme,
      value: q.starts,
      tip: '<b>' + esc(THEMES[q.theme] ?? q.theme) + '</b><br>' + q.starts + ' começados · ' + q.completes + ' concluídos<br>' + q.devices + ' aparelho(s)',
    })),
    'Nenhum quiz jogado ainda.',
  )

  // ----- onde -----
  $('places').innerHTML = bars(
    D.places.map((p) => ({
      name: place(p.city, p.country),
      value: p.devices,
      tip: '<b>' + esc(place(p.city, p.country)) + '</b>' + (p.region ? ' (' + esc(p.region) + ')' : '') + '<br>' + p.devices + ' aparelho(s) · ' + p.sessions + ' sessão(ões)',
    })),
    'Sem dados de local ainda.',
  )
  const small = (rows: { key: string | null; devices: number }[], names: Record<string, string>) =>
    bars(
      rows.map((r) => ({
        name: names[r.key ?? ''] ?? r.key ?? '—',
        value: r.devices,
        tip: esc(names[r.key ?? ''] ?? r.key ?? '—') + ': ' + r.devices + ' aparelho(s)',
      })),
      'Sem dados.',
    )
  $('platforms').innerHTML = small(D.platforms, {})
  $('langs').innerHTML = small(D.langs, LANGS)

  // ----- quando (mapa de calor dia x hora, hora local do aparelho) -----
  ;(() => {
    const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const map = new Map(D.heat.map((h) => [h.dow + '-' + h.hour, h.sessions]))
    const max = Math.max(0, ...D.heat.map((h) => h.sessions))
    const shade = (v: number) => (v ? 'var(--seq-' + Math.max(1, Math.ceil((7 * v) / max)) + ')' : 'var(--surface-2)')
    let html = '<div></div>'
    for (let h = 0; h < 24; h++) html += '<div style="text-align:center">' + (h % 3 === 0 ? h : '') + '</div>'
    for (let d = 0; d < 7; d++) {
      html += '<div class="lbl">' + DOW[d] + '</div>'
      for (let h = 0; h < 24; h++) {
        const v = map.get(d + '-' + h) ?? 0
        html += '<div class="cell" style="background:' + shade(v) + '" data-tip="' + DOW[d] + ', ' + h + 'h–' + (h + 1) + 'h: ' + v + ' sessão(ões)"></div>'
      }
    }
    $('heat').innerHTML = html
    $('heat-legend').innerHTML = max
      ? 'menos ' + [1, 2, 3, 4, 5, 6, 7].map((i) => '<span class="sw" style="background:var(--seq-' + i + ')"></span>').join('') + ' mais (até ' + max + ' sessões)'
      : ''
  })()

  // ----- quem (aparelhos) -----
  $('devices').innerHTML = D.devices.length
    ? '<table><thead><tr><th>Aparelho</th><th>Local</th><th>Sistema</th><th>Idioma</th><th>1º uso</th><th>Último uso</th><th class="num">Sessões</th><th class="num">Histórias</th><th class="num">Quizzes</th></tr></thead><tbody>' +
      D.devices
        .map(
          (d) =>
            '<tr><td><code>' + code(d.device) + '</code>' + (d.installed ? '<span class="tag">instalado</span>' : '') + '</td><td>' +
            esc(place(d.city, d.country)) + '</td><td>' + esc(d.platform ?? '—') + '</td><td>' + esc(LANGS[d.lang ?? ''] ?? d.lang ?? '—') +
            '</td><td>' + when(d.first) + '</td><td>' + when(d.last) + '</td><td class="num">' + fmt(d.sessions) + '</td><td class="num">' +
            fmt(d.stories) + '</td><td class="num">' + fmt(d.quizzes) + '</td></tr>',
        )
        .join('') +
      '</tbody></table>'
    : '<p class="empty">Nenhum aparelho no período.</p>'

  // ----- atividade recente -----
  $('recent').innerHTML = D.recent.length
    ? '<table><thead><tr><th>Quando</th><th>Aparelho</th><th>O quê</th><th>Onde</th></tr></thead><tbody>' +
      D.recent
        .map(
          (e) =>
            '<tr><td>' + when(e.ts) + '</td><td><code>' + code(e.device) + '</code></td><td>' + (EVENT[e.name]?.(e) ?? esc(e.name)) +
            '</td><td>' + esc(place(e.city, e.country)) + '</td></tr>',
        )
        .join('') +
      '</tbody></table>'
    : '<p class="empty">Nada ainda.</p>'

  $('updated').textContent = 'Atualizado em ' + new Date(D.generatedAt).toLocaleString('pt-BR')
}

export function renderDashboard(data: DashboardData): string {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  const period = (d: number, label: string) =>
    `<a href="?d=${d}"${data.days === d ? ' aria-current="page"' : ''}>${label}</a>`
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Fala Falinha · Uso</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
  <header>
    <div><h1>🧸 Fala Falinha · Uso</h1><p class="sub" id="updated" style="margin:4px 0 0"></p></div>
    <nav class="periods" aria-label="Período">
      ${period(7, '7 dias')}${period(30, '30 dias')}${period(90, '90 dias')}${period(0, 'Tudo')}
    </nav>
  </header>

  <div class="grid">
    <section class="card"><div class="hero" id="hero"></div></section>

    <section class="card">
      <h2>Aparelhos por dia</h2>
      <p class="sub">Quantos aparelhos diferentes usaram o app em cada dia (passe o mouse para ver as sessões).</p>
      <div id="daily"></div>
    </section>

    <section class="card half">
      <h2>Histórias mais acessadas</h2>
      <p class="sub">Aberturas no período.</p>
      <div id="stories-top"></div>
    </section>
    <section class="card half">
      <h2>Histórias menos acessadas</h2>
      <p class="sub">Inclui as que ninguém abriu.</p>
      <div id="stories-least"></div>
    </section>
    <section class="card">
      <details><summary>Ver todas as histórias em tabela</summary><div class="scroll" id="stories-table"></div></details>
    </section>

    <section class="card third">
      <h2>Brincadeiras</h2>
      <p class="sub">Quizzes começados por tema.</p>
      <div id="quiz"></div>
    </section>
    <section class="card third">
      <h2>Sistema</h2>
      <p class="sub">Aparelhos por sistema.</p>
      <div id="platforms"></div>
    </section>
    <section class="card third">
      <h2>Idioma</h2>
      <p class="sub">Aparelhos por idioma do app.</p>
      <div id="langs"></div>
    </section>

    <section class="card half">
      <h2>Onde</h2>
      <p class="sub">Aparelhos por cidade (aproximada, pela conexão).</p>
      <div id="places"></div>
    </section>
    <section class="card half">
      <h2>Quando</h2>
      <p class="sub">Sessões por dia da semana e hora (no horário de quem usou).</p>
      <div class="heat" id="heat"></div>
      <div class="legend-scale" id="heat-legend"></div>
    </section>

    <section class="card">
      <h2>Quem usou</h2>
      <p class="sub">Cada aparelho tem um código anônimo; a família vê o código do seu aparelho em Privacidade, no app.</p>
      <div class="scroll" id="devices"></div>
    </section>

    <section class="card">
      <h2>Atividade recente</h2>
      <p class="sub">Os últimos 40 eventos.</p>
      <div class="scroll" id="recent"></div>
    </section>
  </div>
</div>
<div id="tip" role="tooltip"></div>
<script>(${client.toString()})(${json});</script>
</body>
</html>`
}
