# Medição de uso (Cloudflare Worker + D1)

Recebe eventos anônimos do app e mostra um painel de uso.

- **Painel:** https://api.falafalinha.com/painel (usuário: qualquer um; senha: segredo `DASHBOARD_PASSWORD`).
  Períodos: `?d=7`, `?d=30` (padrão), `?d=90`, `?d=0` (tudo).
- **O que mostra:** aparelhos únicos, sessões, histórias mais e menos acessadas (inclusive as nunca abertas),
  quizzes por tema, sistema, idioma, cidade/país, mapa de calor dia × hora, lista de aparelhos e atividade recente.

## Privacidade

- O app só envia algo depois que o adulto aceita o aviso na tela inicial (tela **Privacidade** para mudar de ideia).
- Cada aparelho tem um código aleatório (só existe com consentimento). Sem nome, e-mail, fotos ou voz.
- Local: cidade/região/país que o Cloudflare deduz da conexão. **O IP não é guardado.**
- "Apagar os dados deste aparelho" (tela Privacidade) chama `POST /forget`, que apaga tudo daquele código.

## Rotas

| Rota | O quê |
|---|---|
| `POST /e` | Lote de eventos (`text/plain` com JSON; só das origens em `ALLOWED_ORIGINS`) |
| `POST /forget` | Apaga os eventos de um aparelho |
| `GET /painel` | Painel (senha) |

Eventos: `app_open`, `story_open`, `story_complete`, `quiz_start`, `quiz_complete` (valor = acertos de primeira).
O app também manda o catálogo de histórias (id + título) quando ele muda, para o painel listar as nunca abertas.

## Operação

```bash
cd analytics
npx wrangler login                                   # uma vez por computador
npx wrangler deploy                                  # publica mudanças no Worker
npx wrangler secret put DASHBOARD_PASSWORD           # troca a senha do painel
npx wrangler d1 execute fala-falinha-analytics --remote --command "SELECT COUNT(*) FROM events"
```

Testar localmente: crie `analytics/.dev.vars` com `DASHBOARD_PASSWORD=teste`, rode
`npx wrangler d1 execute fala-falinha-analytics --local --file schema.sql` e `npx wrangler dev --local`;
depois o app com `VITE_ANALYTICS_URL=http://localhost:8787 npm run dev` (adicione a origem em `ALLOWED_ORIGINS`).

Na primeira publicação foi preciso: `wrangler d1 create fala-falinha-analytics` (o id está no `wrangler.toml`),
`wrangler d1 execute … --remote --file schema.sql` e `wrangler secret put DASHBOARD_PASSWORD`.
