# Conta pra Mim

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

- **Narração** (`src/lib/speech.ts`): usa a voz pt-BR do navegador. Lê cada página, pausa com “👂 Sua vez!”
  e revela o final; no quiz lê as perguntas e nomeia o que a criança tocou. Botão 🗣️ liga/desliga.
- **Sons de bichos**: tocar num elemento fala “Vaca! Muuu!”. Para usar gravações reais, coloque o arquivo em
  `public/sounds/` e adicione `"audio": "vaca.mp3"` ao elemento no JSON da história (sem arquivo, volta para a voz).
- Efeitos de toque/acerto são sintetizados (`src/lib/sfx.ts`); o botão 🔊 desliga todo o áudio.
- Progresso (histórias lidas, quizzes completos) fica no `localStorage`.
