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
- **Sons de bichos**: gravações reais em `public/sounds/` (17 animais, Wikimedia Commons; o macaco é um gibão, não há gravação
  livre de chimpanzé). Tocar num bicho
  toca o som e depois fala o nome; o “…faz muuu!” revelado também toca a gravação (`revealAudio`); no quiz,
  “Quem faz…?” toca o som de verdade. Para usar em outro elemento, adicione `"audio": "vaca.mp3"` no JSON.
  Sem arquivo (ou se falhar), a voz fala “vaca! muuu!”.
- **Licenças**: autores e licenças estão em `src/content/sound-credits.json` e na tela “Créditos dos sons”.
  Vários são CC BY / CC BY-SA: ao trocar ou adicionar um som, atualize os créditos.
- Efeitos de toque/acerto são sintetizados (`src/lib/sfx.ts`); o botão 🔊 desliga todo o áudio.
- Progresso (histórias lidas, quizzes completos) fica no `localStorage`.

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

## Medição de uso

Com o consentimento do adulto (aviso na tela inicial; tela **Privacidade** para mudar ou apagar os dados),
o app envia eventos anônimos — app aberto, história aberta/concluída, quiz começado/concluído — para um
Worker no Cloudflare (`analytics/`). Painel com senha: https://api.falafalinha.com/painel.

- Cliente: `src/lib/analytics.ts` (fila, envio em lotes, código anônimo do aparelho, consentimento).
- O endereço vem de `VITE_ANALYTICS_URL` (`.env.production`); em desenvolvimento não é definido e nada é enviado.
- Servidor, painel e operação: `analytics/README.md`.
