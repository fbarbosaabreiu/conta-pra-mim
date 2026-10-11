# Checagem estática do conteúdo: textos nos 4 idiomas, histórias registradas, sons e créditos.
import glob
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
os.chdir(ROOT)
sys.stdout.reconfigure(encoding='utf-8')

L = ['pt', 'en', 'es', 'fr']
probs = []
sounds = set(os.listdir('public/sounds'))


def text(x, where):
    if isinstance(x, str):
        return
    miss = [l for l in L if not x.get(l)]
    if miss:
        probs.append(f'{where}: falta {miss}')


def audio(a, where):
    if a and a not in sounds:
        probs.append(f'{where}: som {a} não existe em public/sounds')


stories = sorted(glob.glob('src/content/stories/*.json'))
index = open('src/content/stories/index.ts', encoding='utf-8').read()
pages = 0
for f in stories:
    name = os.path.basename(f)
    s = json.load(open(f, encoding='utf-8'))
    if f"'./{name}'" not in index:
        probs.append(f'{name}: não está registrada em src/content/stories/index.ts')
    text(s['title'], f'{name} título')
    for i, p in enumerate(s['pages']):
        pages += 1
        w = f'{name} página {i + 1}'
        for k in ['text', 'reveal', 'parentTip']:
            if k in p:
                text(p[k], f'{w} {k}')
        if 'highlight' in p:
            miss = [l for l in L if l not in p['highlight']]
            if miss:
                probs.append(f'{w} highlight: falta {miss}')
        audio(p.get('revealAudio'), w)
        for e in p['elements']:
            text(e['word'], f'{w} palavra')
            if 'sound' in e:
                text(e['sound'], f'{w} som escrito')
            audio(e.get('audio'), w)
            if not (0 <= e['x'] <= 100 and 0 <= e['y'] <= 100):
                probs.append(f'{w}: elemento {e["emoji"]} fora da cena (x={e["x"]}, y={e["y"]})')

animals = json.load(open('src/content/quiz/animais.json', encoding='utf-8'))
for a in animals:
    audio(a['audio'], f'quiz {a["id"]}')
    for l in L:
        if not a.get(l, {}).get('name') or not a[l].get('sound'):
            probs.append(f'quiz {a["id"]}: {l} sem nome ou som')

credits = json.load(open('src/content/sound-credits.json', encoding='utf-8'))
credited = {c['file'] for c in credits}
for c in credits:
    if not c.get('author') or not c.get('license') or not c.get('source'):
        probs.append(f'créditos {c["file"]}: falta autor, licença ou fonte')
names = open('src/pages/Credits.tsx', encoding='utf-8').read()
for s in sorted(sounds):
    if s not in credited:
        probs.append(f'{s}: sem crédito em sound-credits.json')
    if f'  {s[:-4]}: {{' not in names:
        probs.append(f'{s}: sem nome na tela de créditos (src/pages/Credits.tsx)')

print(f'{len(stories)} histórias, {pages} páginas, {len(animals)} bichos no quiz, {len(sounds)} sons')
if probs:
    print('\n'.join('FALHA  ' + p for p in probs))
    sys.exit(1)
print('OK  conteúdo completo nos 4 idiomas, sons e créditos em ordem')
