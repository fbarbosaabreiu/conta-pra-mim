# Fala Falinha

Histórias interativas e brincadeiras para bebês (1–3 anos) que incentivam a fala.
Feito para ser usado com um adulto: o adulto lê, a criança toca, aponta e tenta falar.

## Rodando

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # build de produção (PWA, funciona offline)
npm run preview  # testa o build
```

## Instalando no iPhone/iPad (sem App Store)

1. Publique a pasta `dist` (depois do `npm run build`) em qualquer hospedagem estática com HTTPS
   (Netlify, Cloudflare Pages, GitHub Pages…). O HTTPS é obrigatório para funcionar offline.
2. No iPhone, abra o link no **Safari** → botão **Compartilhar** → **Adicionar à Tela de Início**.
3. Abra uma vez com internet; depois disso funciona offline.

Ícones: edite `public/icon.svg` e rode `npm run icons` para regerar os PNGs.

## Módulos

- **Histórias** (`src/modules/stories`): páginas com cenas tocáveis (o elemento pula e mostra a palavra),
  palavras em destaque, pausa “❓” para a criança completar a frase e dica para o adulto.
- **Quiz** (`src/modules/quiz`): animais (“Cadê o gato?” / “Quem faz miau?”), cores e números (com contagem
  tocando nos itens). Sessões de 5 perguntas, começa com 2 opções e passa para 3 após 2 acertos de primeira.
  Errar não tem punição: o botão balança e a resposta certa pulsa como dica.

## Adicionando conteúdo

Todo o conteúdo fica em `src/content` como JSON:

- Nova história: crie `src/content/stories/minha-historia.json` (veja `fazenda.json`) e registre em
  `src/content/stories/index.ts`. Posições dos elementos (`x`, `y`) são em % da cena.
- Novo animal / cor / item de contagem: adicione uma linha em `src/content/quiz/*.json`.

## Notas

- **Narração** (`src/lib/speech.ts`): usa a melhor voz do navegador disponível (prefere vozes naturais/neurais).
  Lê cada página acendendo a palavra falada, pausa com “👂 Sua vez!” e revela o final; tocar nos bichos durante a
  narração não a interrompe. No quiz lê as perguntas, nomeia o que a criança tocou e só encoraja se ela ficar
  parada. Botão 🗣️ liga/desliga.
- **Frases variadas** (`src/lib/phrases.ts`): elogios, comentários de erro, perguntas e finais são sorteados sem
  repetir o anterior — é o que mais tira a sensação de robô.
- **Sons de bichos**: gravações reais em `public/sounds/` (27 animais, Wikimedia Commons e Freesound; o papagaio é uma arara, não há gravação
  livre melhor). Tocar num bicho
  toca o som e depois fala o nome; o “…faz muuu!” revelado também toca a gravação (`revealAudio`); no quiz,
  “Quem faz…?” toca o som de verdade. Para usar em outro elemento, adicione `"audio": "vaca.mp3"` no JSON.
  Sem arquivo (ou se falhar), a voz fala “vaca! muuu!”.
- **Licenças**: autores e licenças estão em `src/content/sound-credits.json` e na tela “Créditos dos sons”.
  Vários são CC BY / CC BY-SA: ao trocar ou adicionar um som, atualize os créditos.
- Efeitos de toque/acerto são sintetizados (`src/lib/sfx.ts`); o botão 🔊 desliga todo o áudio.
- Progresso (histórias lidas, quizzes completos) fica no `localStorage`.

## Conta opcional (Supabase)

O app abre direto, sem cadastro. Quem quiser cria uma conta (**e-mail e senha**, em `/entrar`, pelo
botão “Salvar progresso” da tela inicial) para guardar o progresso e continuar em outro aparelho.
“Criar conta” já entra, sem e-mail de confirmação. O único e-mail é o de **esqueci a senha**: o link
volta para o site, que pede a senha nova (`src/lib/auth.ts` lê e limpa o `#access_token=…` antes do
HashRouter). Código: `src/lib/auth.ts`, `src/lib/progress.ts` e `src/pages/Login.tsx`.

**Progresso:** fica no aparelho (`localStorage`) e, com conta, também na tabela `progress` do
Supabase. Ao entrar, junta os dois (fica o maior número de cada história/brincadeira); depois, cada
história ou brincadeira feita atualiza a cópia da conta.

Por que não um código de 6 números por e-mail: o Supabase só deixa mudar o texto dos e-mails com um
SMTP próprio (Resend, Brevo…). E link mágico não serve no iPhone: o app instalado na Tela de Início
não recebe a sessão aberta pelo link (ela fica no Safari).

**Sem as chaves a conta fica desligada** (é assim em desenvolvimento e nos testes). Para ligar:

1. Crie o projeto em [supabase.com](https://supabase.com) (região São Paulo).
2. Coloque a URL e a chave pública (*anon* / *publishable*) no `.env.production` — as duas são públicas:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_...
   ```
   Para testar localmente, as mesmas linhas num `.env.local` (não vai para o Git).
3. No painel do Supabase:
   - **Authentication → URL Configuration → Site URL**: `https://falafalinha.com`.
   - **Authentication → Sign In / Providers → Email**: desligue **Confirm email**.
   - **SQL Editor** → rode uma vez:
     ```sql
     -- botão "Apagar minha conta" da tela de privacidade
     create or replace function public.delete_my_account()
     returns void language sql security definer set search_path = ''
     as $$ delete from auth.users where id = auth.uid(); $$;
     revoke execute on function public.delete_my_account() from public, anon;
     grant execute on function public.delete_my_account() to authenticated;

     -- progresso de cada conta (apagado junto com a conta)
     create table if not exists public.progress (
       user_id uuid primary key references auth.users on delete cascade,
       data jsonb not null default '{}',
       updated_at timestamptz not null default now()
     );
     alter table public.progress enable row level security;
     create policy "cada um vê o seu progresso" on public.progress
       for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
     grant select, insert, update on public.progress to authenticated;
     notify pgrst, 'reload schema';
     ```
   - **Opcional**: o envio de e-mail embutido do Supabase manda só poucos e-mails por hora (só afeta
     “esqueci a senha”). Para mais, configure um SMTP em **Authentication → Emails → SMTP Settings**.

A tela de privacidade explica o que a conta guarda e permite entrar, sair e apagar a conta.
Teste sem conta real (Supabase simulado): `.claude/skills/validar-app/scripts/auth.mjs`.

## Divulgação

- **Página de apresentação:** `public/sobre/index.html` → https://falafalinha.com/sobre/ (HTML puro, nos
  4 idiomas, fora do app; o service worker não a troca pelo app). Imagens: `public/sobre/tela-*.png` e a
  prévia de link `public/og.png` (1200×630, também usada pelo `index.html`).
- **Origem dos links:** divulgue com uma marca, como `https://falafalinha.com/?origem=instagram`
  (também vale `?utm_source=`). O app guarda a primeira marca do aparelho, tira-a do endereço e, com
  consentimento, envia o evento `arrival`; o painel mostra “De onde vêm”. Marcas já usadas pelo app:
  `indicacao` (botão “Indicar para outra família”) e `site` (botões da página /sobre).
  Código: `src/lib/referral.ts`.
- **Indicar:** `src/lib/share.ts` abre a folha de compartilhar do celular (ou o WhatsApp Web) com um
  texto pronto e o link `?origem=indicacao`; cada toque gera o evento `share`.

## Validando antes de publicar

A skill `validar-app` (`.claude/skills/validar-app/`) confere tudo de uma vez: conteúdo nos 4 idiomas,
usabilidade no celular (rolagem, área de toque, balões dentro da cena), todas as histórias e quizzes no
navegador e a qualidade de cada som (volume, distorção, graves que o celular não toca, ruído), com uma
folha de espectrogramas para conferir no olho. No Claude Code: `/validar-app`. Os passos e comandos
estão no `SKILL.md`.

**Antes de todo push na main** (que publica direto no site), rode a regressão — ela compara a versão
nova com o que está no ar e roda todos os testes; depois do deploy, o `smoke.mjs` confere o site:

```bash
node .claude/skills/validar-app/scripts/regressao.mjs     # relatório em regressao/relatorio.md
node .claude/skills/validar-app/scripts/smoke.mjs         # depois do deploy
```

Detalhes em `.claude/skills/regressao/SKILL.md` (no Claude Code: `/regressao`).

## Idiomas

O app fala **português** (nativo), **inglês**, **espanhol** e **francês**. O idioma é escolhido na tela inicial;
na primeira abertura vem o do aparelho (se for um dos quatro) ou português. Ele vale para os textos, as histórias,
o quiz e a voz da narração (cada idioma usa uma voz do próprio idioma).

- Textos da interface: `src/i18n/ui.ts`.
- Frases do quiz com a gramática de cada idioma (artigos, gênero, plural, ¡¿ do espanhol, « » e espaços do
  francês): `src/i18n/grammar.ts`. Frases variadas (elogios, finais etc.): `src/lib/phrases.ts`.
- Conteúdo: nos JSON de `src/content`, cada texto vem com as quatro línguas — `{ "pt": "...", "en": "...",
  "es": "...", "fr": "..." }` (histórias: `title`, `text`, `reveal`, `parentTip`, `word`, `sound`; `highlight`
  é uma lista por idioma). Um texto igual em todas pode ser uma string só (ex.: `"word": "1"`). Bichos, cores e
  itens de contagem têm o nome por idioma e `"fem": true` quando são femininos naquela língua.
- Francês: escreva com espaço normal antes de `!` `?` `:` `»`; o app troca por espaço inseparável.

## Soninho (histórias para dormir)

Módulo em `/dormir` (`src/modules/bedtime`), com 5 histórias calmas em `src/content/bedtime` (4 idiomas).

- **Leitura automática:** lê cada página com voz mais lenta e grave (`calm` em `say`), vira sozinha e termina
  com "Boa noite". Botões para pausar e voltar/avançar. Sem narração, dá tempo para o adulto ler.
- **Sons para dormir:** chuva, mar, ruído branco e canção de ninar (Brahms), gerados no app como WAV em loop
  (`src/lib/sleepSounds.ts`), tocados por um `<audio>` (funciona no silencioso do iPhone).
- **Timer de sono:** 10/20/30 min; ao acabar, para a história e diminui o som até parar (no iPhone o volume
  não é ajustável pelo app, então o som para no fim). Ao sair do módulo, som e timer param.
- Enquanto lê ou toca som, pede para manter a tela acesa (Wake Lock), porque com a tela apagada o iPhone para a voz.
- Medição: aberturas/conclusões entram como histórias `soninho-<id>` (com 🌙 no painel).

## Medição de uso

Com o consentimento do adulto (aviso na tela inicial; tela **Privacidade** para mudar ou apagar os dados),
o app envia eventos anônimos — app aberto, história aberta/concluída, quiz começado/concluído — para um
Worker no Cloudflare (`analytics/`). Painel com senha: https://api.falafalinha.com/painel.

- Cliente: `src/lib/analytics.ts` (fila, envio em lotes, código anônimo do aparelho, consentimento).
- O endereço vem de `VITE_ANALYTICS_URL` (`.env.production`); em desenvolvimento não é definido e nada é enviado.
- Servidor, painel e operação: `analytics/README.md`.
