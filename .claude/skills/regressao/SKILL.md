---
name: regressao
description: Teste de regressão do Fala Falinha — garante que uma mudança não quebra nada do que já está no ar em falafalinha.com. Compara a versão nova (build de produção) com a produção (inventário de telas/botões/histórias nos 4 idiomas e fotos das telas) e roda todos os testes de funcionamento. Use SEMPRE antes de dar push na main de conta-pra-mim, e o smoke logo depois do deploy.
---

# Regressão: nada do que está no ar pode quebrar

A main publica direto em https://falafalinha.com (GitHub Actions). Por isso **nenhum push na main sem
esta skill passar**. Os scripts ficam em `.claude/skills/validar-app/scripts/` (mesmas dependências da
skill `validar-app`; na primeira vez: `cd .claude/skills/validar-app/scripts && npm install && cd -`).

## No GitHub (automático)

O workflow `.github/workflows/deploy.yml` roda esta regressão (`--rapido`, Chrome no Ubuntu) a cada
push na main **antes** de publicar: se ela falhar, o deploy não acontece e o site fica na versão
anterior. O relatório aparece no resumo da execução (`gh run view <id>`), e as imagens no artefato
`regressao`. Em outro ramo, `gh workflow run deploy.yml --ref <ramo>` roda só a regressão.
Mesmo assim, rode localmente antes do push: é mais rápido descobrir aqui do que no GitHub.

## 1. Antes de publicar

Da raiz do repositório, com o código que vai subir já no disco:

```bash
node .claude/skills/validar-app/scripts/regressao.mjs            # completo (~10-15 min)
node .claude/skills/validar-app/scripts/regressao.mjs --rapido   # fluxo e usabilidade só em pt
```

Ele mesmo gera o build de produção (`npm run build`, com o `.env.production`), sobe o `vite preview`
na porta 4173 e um servidor com Supabase de mentira na 5174, e roda:

| Etapa | O que garante | Se falhar |
|---|---|---|
| Conteúdo | todo texto nos 4 idiomas, histórias registradas, sons com crédito | ❌ |
| Tipos e build | o build de produção gera | ❌ (para tudo) |
| **Inventário** | cada link, botão, história, brincadeira, história de dormir e som que existe **no ar** continua existindo na versão nova, nos 4 idiomas; cada um abre sem erro de JS nem arquivo faltando | ❌ |
| **Comparação visual** | fotos das telas principais (sem e com conta) na produção × versão nova | ⚠️ revisar |
| Fluxo completo | cada história até o fim, os 3 quizzes, todos os sons tocam | ❌ |
| Usabilidade | sem rolagem lateral, toques ≥ 44 px, balões dentro da cena | ❌ |
| Sons | volume, graves, ruído | ⚠️ revisar |
| Conta | criar conta, entrar, esqueci a senha, progresso juntado, sair, apagar | ❌ |

O navegador dos testes nunca envia nada de verdade: medição de uso e Supabase reais ficam bloqueados.

Resultado em `regressao/relatorio.md` (+ `log-*.txt` de cada etapa). O script sai com código 1 se
alguma etapa ❌ falhou.

### Como decidir

- **❌ em qualquer etapa → não publique.** Corrija e rode de novo. Não "conserte" o teste para passar
  sem entender: se o teste estava certo, o app quebrou.
- **Inventário acusou item sumido de propósito** (ex.: um botão renomeado ou removido a pedido do
  usuário) → confirme que foi intencional e rode de novo com `--aceitar "texto do item"` (vários
  separados por `|`). Diga ao usuário o que foi aceito e por quê.
- **⚠️ na comparação visual → abra cada `regressao/visual-*.png`** (produção | nova | diferença em
  vermelho) e confira se a mudança é a esperada. Mudança fora do que foi pedido (texto cortado,
  botão sumido, layout quebrado em outra tela) é regressão.
- Linhas `ℹ️ a produção já tem problemas` não são regressão, mas conte ao usuário.

## 2. Depois do push

Espere o deploy (`gh run watch`) e confira o site no ar:

```bash
node .claude/skills/validar-app/scripts/smoke.mjs
```

Confere que a produção está com o arquivo principal recém-gerado, que `/sobre/`, prévia de link,
manifest, service worker e sons respondem, que a medição e o Supabase estão no ar (e "Confirm email"
continua desligado), e que as telas principais abrem sem login, sem erros nem arquivos faltando.
Se falhar, avise o usuário na hora; para desfazer, `git revert` do commit e push (não use force push).

## Relatório ao usuário

Uma tabela curta: etapa, ✅/⚠️/❌ e o resumo. Liste exatamente o que falhou (tela, idioma, item).
Nunca diga que está tudo certo se alguma etapa não rodou ou foi pulada.

## Mantendo a skill

- Tela nova importante → acrescente em `SCREENS` (`regress-lib.mjs`) para entrar no inventário e nas fotos.
- Fluxo novo → teste em `e2e.mjs` ou `auth.mjs`; ele passa a rodar aqui automaticamente.
