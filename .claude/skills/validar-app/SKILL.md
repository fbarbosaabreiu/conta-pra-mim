---
name: validar-app
description: Valida o Fala Falinha de ponta a ponta — conteúdo nos 4 idiomas, usabilidade no celular, todas as histórias/quizzes no navegador e a qualidade de todos os sons dos bichos. Use depois de adicionar ou mudar histórias, bichos, sons ou telas, e antes de publicar.
---

# Validar o app (usabilidade + todos os áudios)

Roda cinco etapas e termina com um relatório. Pare na primeira etapa que falhar de forma óbvia
(ex.: build quebrado), corrija e rode de novo.

Os scripts ficam em `.claude/skills/validar-app/scripts/` e usam a raiz do repositório
automaticamente. Execute tudo a partir da raiz do repo.

## 0. Preparar (uma vez por máquina)

```bash
cd .claude/skills/validar-app/scripts && npm install && cd -
```

Instala `playwright-core` (usa o Edge ou Chrome já instalado — não baixa navegador) e `ffmpeg-static`.
Se não houver Edge, rode com `BROWSER=chrome`.

O app precisa estar rodando: `npm run dev` (porta 5173). Se a porta já responder, reaproveite.
Outra URL: `APP_URL=http://localhost:4173/#`.

## 1. Conteúdo (rápido, sem navegador)

```bash
python .claude/skills/validar-app/scripts/check_content.py
```

Confere: todo texto nos 4 idiomas (pt, en, es, fr), toda história registrada em
`src/content/stories/index.ts`, todo som citado existe em `public/sounds/`, todo som tem crédito
em `src/content/sound-credits.json` e nome na tela de créditos, bichos do quiz completos.

## 2. Tipos e build

```bash
npx tsc --noEmit && npm run build
```

## 3. Usabilidade (celular, 390×844)

```bash
node .claude/skills/validar-app/scripts/usability.mjs <pasta-de-saida>
```

Em cada tela (início, listas, a 1ª página de cada história, quiz, créditos, tutorial) e nos 4 idiomas:
- sem rolagem horizontal;
- todo botão/link com área de toque ≥ 44×44 px e com nome acessível (`aria-label` ou texto);
- texto não estoura a largura;
- em todas as histórias, o balão da palavra de **cada** elemento fica dentro da cena.

Salva capturas em `<pasta-de-saida>/ux-*.png` — **abra algumas e olhe** (o script não vê se algo ficou feio).

## 4. Fluxo completo nos 4 idiomas

```bash
node .claude/skills/validar-app/scripts/e2e.mjs
```

Para cada idioma: lista mostra todas as histórias; cada história até a tela de fim (texto certo em
cada página, o ❓ toca a gravação, tocar no bicho toca o som); os 3 quizzes até o troféu; cada som da
tela de créditos toca; nenhum erro de JavaScript nem arquivo faltando. Leva vários minutos.

## 4b. Login (Supabase simulado)

Suba um segundo servidor com chaves de mentira e rode o teste — ele responde no lugar do Supabase:

```bash
VITE_SUPABASE_URL=https://fake-projeto.supabase.co VITE_SUPABASE_ANON_KEY=teste npx vite --port 5174 &
APP_URL=http://localhost:5174/# node .claude/skills/validar-app/scripts/auth.mjs <pasta-de-saida>
```

Confere: sem sessão só abre a tela de entrar (e a privacidade); e-mail inválido, senha errada, senha
curta e e-mail já cadastrado mostram aviso; entrar e criar conta abrem o app e a sessão sobrevive a
recarregar; “esqueci a senha” manda o link, o link volta pedindo a senha nova (e o link vencido avisa);
“Sair” e “Apagar minha conta” funcionam.
Pare o servidor da porta 5174 no fim.

## 5. Qualidade dos sons

```bash
node .claude/skills/validar-app/scripts/audio_report.mjs <pasta-de-saida>
```

Para cada MP3 de `public/sounds/`: duração, volume médio e de pico, e quanto da energia está acima de
300 Hz (abaixo disso o alto-falante do celular quase não toca — foi o problema do leão). Marca ⚠️:
- **baixo demais** (volume médio < −26 dB) ou **estourado** (pico > −0,5 dB);
- **grave demais** (< 35% da energia acima de 300 Hz);
- **curto/longo** (< 0,5 s ou > 4,5 s);
- **ruído** (energia espalhada sem estrutura — pouca diferença entre o trecho mais alto e o mais baixo).

Gera `<pasta-de-saida>/sons.png`, uma folha com o espectrograma de todos os sons. **Olhe a imagem**:
um som bom mostra o desenho do bicho (faixas de harmônicos no mugido/miado, pulsos no coaxar e no
latido, chilreio em traços inclinados); um som ruim aparece como chiado uniforme ou quase vazio.
Os ⚠️ são pistas — confirme no espectrograma antes de trocar um som.

Para trocar um som: escolha outro arquivo livre no Wikimedia Commons (CC0, domínio público, CC BY ou
CC BY-SA), recorte o trecho mais forte, normalize e atualize os créditos (veja a seção “Sons de
bichos” do README).

## Relatório

Termine com uma tabela curta: cada etapa, quantos itens passaram, e a lista do que falhou com a tela /
história / som exato. Não diga que está tudo certo se alguma etapa não rodou.
