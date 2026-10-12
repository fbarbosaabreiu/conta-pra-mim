// Conteúdo por faixa etária: o que recomendar e o guia para os pais.
// Marcos de fala: CDC (2022). Tempo de tela: OMS (2019), SBP "Menos telas, mais saúde" (2019), AAP.
import type { Lang } from '../i18n/langs'
import type { AgeId } from '../lib/age'
import type { ThemeId } from '../modules/quiz/questions'

/** Histórias recomendadas por faixa (ids de src/content/stories). Uma história pode servir para várias. */
export const STORIES_BY_AGE: Record<AgeId, string[]> = {
  a0: ['fazenda', 'boa-noite', 'dormir', 'musica', 'bichinhos-de-casa'],
  a1: ['fazenda', 'bichinhos-de-casa', 'banho', 'roupas', 'brinquedos', 'frutas', 'parque', 'cozinha', 'boa-noite', 'dormir', 'musica'],
  a2: ['zoologico', 'no-sitio', 'arco-iris', 'patinhos', 'veiculos', 'ceu', 'praia', 'cozinha', 'parque', 'frutas', 'floresta', 'musica'],
  a3: ['selva', 'floresta', 'praia', 'zoologico', 'no-sitio', 'veiculos', 'ceu', 'arco-iris', 'patinhos'],
}

/** Jogos recomendados por faixa. Antes de 1 ano, nenhum: o foco é o adulto contar e cantar. */
export const QUIZ_BY_AGE: Record<AgeId, ThemeId[]> = {
  a0: [],
  a1: ['animais'],
  a2: ['animais', 'cores', 'numeros'],
  a3: ['animais', 'cores', 'numeros'],
}

/** Minutos de uso seguido antes do lembrete gentil de parar. */
export const SESSION_MINUTES: Record<AgeId, number> = { a0: 5, a1: 10, a2: 15, a3: 20 }
export const SESSION_MINUTES_DEFAULT = 15

export interface AgeGuide {
  speech: string[]
  screen: string
  together: string[]
  offline: string[]
}

export interface AgeCopy {
  labels: Record<AgeId, string>
  /** "Para 1–2 anos" */
  forAge: (label: string) => string
  question: string
  questionHint: string
  change: string
  guideLink: string
  guideTitle: string
  sections: { speech: string; screen: string; together: string; offline: string; recommended: string }
  noQuiz: string
  others: string
  later: string
  disclaimer: string
  sources: string
  reminder: { title: (min: number) => string; body: string; more: string; stop: string }
  guides: Record<AgeId, AgeGuide>
}

export const AGE_COPY: Record<Lang, AgeCopy> = {
  pt: {
    labels: { a0: '0–1 ano', a1: '1–2 anos', a2: '2–3 anos', a3: '3+ anos' },
    forAge: (l) => `Para ${l}`,
    question: 'Quantos anos tem o bebê?',
    questionHint: 'Assim mostramos o que combina com a idade e um guia para você.',
    change: 'Mudar',
    guideLink: 'Guia para os pais',
    guideTitle: 'Guia para os pais',
    sections: {
      speech: '🗣️ O que esperar da fala',
      screen: '📱 E a tela?',
      together: '🤝 Como usar juntos',
      offline: '🌳 Fora da tela',
      recommended: '⭐ No app, para esta idade',
    },
    noQuiz: 'Nesta idade, prefira as histórias com você contando e o Soninho.',
    others: 'Outras',
    later: 'Para mais tarde',
    disclaimer:
      'Cada criança tem o seu ritmo: esses marcos são uma referência, não uma prova. Se algo preocupar, converse com o pediatra — quanto antes, melhor.',
    sources:
      'Fontes: Organização Mundial da Saúde (2019); Sociedade Brasileira de Pediatria, “Menos telas, mais saúde” (2019); Academia Americana de Pediatria; CDC, marcos do desenvolvimento (2022).',
    reminder: {
      title: (m) => `Já são ${m} minutos juntos 💛`,
      body: 'Que tal levar a brincadeira para fora da tela?',
      more: 'Mais 5 minutos',
      stop: 'Vamos parar',
    },
    guides: {
      a0: {
        speech: [
          'Sorri e reage quando você fala com ele.',
          'Balbucia sílabas como “ba-ba” e “ma-ma” (por volta dos 6–9 meses).',
          'Atende pelo nome e entende “tchau” (perto dos 9–12 meses).',
          'A primeira palavra costuma aparecer perto de 1 ano.',
        ],
        screen:
          'A OMS recomenda nenhuma tela antes de 1 ano, e a Sociedade Brasileira de Pediatria, evitar até os 2. Nessa fase, o mais valioso é a sua voz: use o app como apoio para você contar e cantar, com o bebê olhando para você, não para o celular. O Soninho funciona com o celular longe, só com o som.',
        together: [
          'Conte a história você mesmo, com o bebê no colo, de frente para você.',
          'Imite os sons dos bichos com exagero e espere ele “responder”.',
          'Narre o dia: “agora vamos trocar a fralda”.',
        ],
        offline: [
          'Cante a mesma música várias vezes: a repetição ajuda a aprender.',
          'Brinque de esconde-achou: “cadê? achou!”.',
          'Mostre objetos de verdade e diga o nome: “bola”, “água”.',
        ],
      },
      a1: {
        speech: [
          'Fala as primeiras palavras e usa gestos: aponta, dá tchau.',
          'Imita sons de bichos e de coisas: “muuu”, “bi-bi”.',
          'Perto dos 18 meses, fala algumas palavras e entende muito mais do que fala.',
          'Perto dos 2 anos, junta duas palavras: “mais água”, “papai foi”.',
        ],
        screen:
          'A OMS não recomenda tela para crianças de 1 ano, e a SBP sugere evitar até os 2. Se usar, que seja por poucos minutos, sempre junto e conversando: a Academia Americana de Pediatria considera aceitável assim, a partir dos 18 meses, com conteúdo de qualidade. O app foi feito para isso: você conduz, a criança aponta e tenta falar.',
        together: [
          'Toque no bicho, faça o som junto e espere a criança tentar.',
          'Quando aparecer “Sua vez!”, espere de verdade: 5 segundos parecem muito, mas ajudam.',
          'Repita o que ela disser, completando: “au!” → “isso, o cachorro faz au-au!”.',
        ],
        offline: [
          'Passeie pela casa nomeando tudo: porta, luz, sapato.',
          'Com bichos de pelúcia, pergunte: “cadê o gato? Como ele faz?”.',
          'Leia livros de papel com figuras grandes e deixe ela virar as páginas.',
        ],
      },
      a2: {
        speech: [
          'Junta 2 ou 3 palavras, e o vocabulário cresce rápido.',
          'Começa a nomear cores e a contar pequenas quantidades.',
          'Perto dos 3 anos, conversa em frases curtas e pergunta “o que é isso?”.',
        ],
        screen:
          'OMS e SBP recomendam no máximo 1 hora de tela por dia nessa idade, somando TV, celular e tablet — e menos é melhor. Sempre com um adulto junto. Prefira sessões curtas no app e depois leve a brincadeira para fora da tela.',
        together: [
          'Pergunte antes de tocar: “qual é o amarelo?”, e deixe ela responder.',
          'Contem em voz alta juntos, apontando cada um.',
          'Faça perguntas sobre a história: “aonde o pato foi?”.',
        ],
        offline: [
          'Caça às cores pela casa: “ache algo vermelho!”.',
          'Contem coisas do dia a dia: degraus, colheres, carrinhos.',
          'Brinquem de faz de conta com bonecos e panelinhas.',
        ],
      },
      a3: {
        speech: [
          'Fala em frases e conta o que aconteceu.',
          'Pergunta muito: “por quê?”.',
          'A maioria das pessoas já entende o que ela fala.',
          'Gosta de rimas, músicas e histórias com começo, meio e fim.',
        ],
        screen:
          'Até os 5 anos, a recomendação de OMS e SBP continua: no máximo 1 hora de tela por dia, com um adulto junto. Use o app em sessões curtas e convide a criança a recontar a história com as próprias palavras.',
        together: [
          'Peça para ela contar a história para você, olhando as figuras.',
          'Pergunte o que vem depois antes de virar a página.',
          'Inventem juntos um final diferente.',
        ],
        offline: [
          'Recontem a história com brinquedos.',
          'Brinquem de “o que é, o que é?” com bichos e sons.',
          'Desenhe a parte preferida da história e peça para ela explicar.',
        ],
      },
    },
  },
  en: {
    labels: { a0: '0–1 yr', a1: '1–2 yrs', a2: '2–3 yrs', a3: '3+ yrs' },
    forAge: (l) => `For ${l}`,
    question: 'How old is your little one?',
    questionHint: 'We’ll show what fits their age and a guide for you.',
    change: 'Change',
    guideLink: 'Parents’ guide',
    guideTitle: 'Parents’ guide',
    sections: {
      speech: '🗣️ What to expect from speech',
      screen: '📱 What about screens?',
      together: '🤝 How to use it together',
      offline: '🌳 Away from the screen',
      recommended: '⭐ In the app, for this age',
    },
    noQuiz: 'At this age, stick to stories with you telling them, and Sleepy time.',
    others: 'Others',
    later: 'For later',
    disclaimer:
      'Every child has their own pace: these milestones are a reference, not a test. If something worries you, talk to your pediatrician — the sooner, the better.',
    sources:
      'Sources: World Health Organization (2019); Brazilian Society of Pediatrics, “Less screens, more health” (2019); American Academy of Pediatrics; CDC developmental milestones (2022).',
    reminder: {
      title: (m) => `That’s ${m} minutes together 💛`,
      body: 'How about taking the fun away from the screen?',
      more: '5 more minutes',
      stop: 'Let’s stop',
    },
    guides: {
      a0: {
        speech: [
          'Smiles and reacts when you talk to them.',
          'Babbles syllables like “ba-ba” and “ma-ma” (around 6–9 months).',
          'Responds to their name and understands “bye-bye” (around 9–12 months).',
          'The first word usually shows up around 1 year.',
        ],
        screen:
          'The WHO recommends no screen time before age 1, and the Brazilian Society of Pediatrics recommends avoiding it until 2. At this stage, your voice is what matters most: use the app as a prompt for you to tell and sing, with your baby looking at you, not at the phone. Sleepy time works with the phone out of reach, sound only.',
        together: [
          'Tell the story yourself, with your baby on your lap, facing you.',
          'Make the animal sounds big and silly, then wait for them to “answer”.',
          'Narrate your day: “now we’re changing your diaper”.',
        ],
        offline: [
          'Sing the same song again and again: repetition helps learning.',
          'Play peekaboo: “where is it? There it is!”.',
          'Show real objects and say their names: “ball”, “water”.',
        ],
      },
      a1: {
        speech: [
          'Says first words and uses gestures: points, waves bye-bye.',
          'Copies animal and object sounds: “moo”, “beep-beep”.',
          'Around 18 months, says a few words and understands much more than they say.',
          'Around 2, puts two words together: “more water”, “daddy gone”.',
        ],
        screen:
          'The WHO does not recommend screen time for 1-year-olds, and the Brazilian Society of Pediatrics suggests avoiding it until 2. If you use it, keep it to a few minutes, always together and talking: the American Academy of Pediatrics considers that acceptable from 18 months, with quality content. That’s what this app is for: you lead, your child points and tries to talk.',
        together: [
          'Tap the animal, make the sound together and wait for your child to try.',
          'When “Your turn!” appears, really wait: 5 seconds feels long, but it helps.',
          'Repeat what they say and add to it: “woof!” → “yes, the dog says woof-woof!”.',
        ],
        offline: [
          'Walk around the house naming everything: door, light, shoe.',
          'With stuffed animals, ask: “where’s the cat? What does it say?”.',
          'Read paper books with big pictures and let them turn the pages.',
        ],
      },
      a2: {
        speech: [
          'Puts 2 or 3 words together, and vocabulary grows fast.',
          'Starts naming colors and counting small amounts.',
          'Around 3, talks in short sentences and asks “what’s that?”.',
        ],
        screen:
          'The WHO and the Brazilian Society of Pediatrics recommend no more than 1 hour of screen time a day at this age, adding up TV, phone and tablet — and less is better. Always with an adult. Keep app sessions short, then take the game away from the screen.',
        together: [
          'Ask before tapping: “which one is yellow?”, and let them answer.',
          'Count out loud together, pointing at each one.',
          'Ask about the story: “where did the duck go?”.',
        ],
        offline: [
          'Color hunt around the house: “find something red!”.',
          'Count everyday things: stairs, spoons, toy cars.',
          'Play pretend with dolls and toy pots.',
        ],
      },
      a3: {
        speech: [
          'Talks in sentences and tells what happened.',
          'Asks a lot: “why?”.',
          'Most people can understand what they say.',
          'Loves rhymes, songs and stories with a beginning, middle and end.',
        ],
        screen:
          'Until age 5, the WHO and Brazilian Society of Pediatrics advice stays the same: no more than 1 hour of screen time a day, with an adult. Use the app in short sessions and invite your child to retell the story in their own words.',
        together: [
          'Ask them to tell you the story, looking at the pictures.',
          'Ask what comes next before turning the page.',
          'Make up a different ending together.',
        ],
        offline: [
          'Retell the story with toys.',
          'Play riddles with animals and their sounds.',
          'Draw their favorite part of the story and ask them to explain it.',
        ],
      },
    },
  },
  es: {
    labels: { a0: '0–1 año', a1: '1–2 años', a2: '2–3 años', a3: '3+ años' },
    forAge: (l) => `Para ${l}`,
    question: '¿Cuántos años tiene tu peque?',
    questionHint: 'Así te mostramos lo que va con su edad y una guía para ti.',
    change: 'Cambiar',
    guideLink: 'Guía para padres',
    guideTitle: 'Guía para padres',
    sections: {
      speech: '🗣️ Qué esperar del habla',
      screen: '📱 ¿Y las pantallas?',
      together: '🤝 Cómo usarla juntos',
      offline: '🌳 Fuera de la pantalla',
      recommended: '⭐ En la app, para esta edad',
    },
    noQuiz: 'A esta edad, mejor los cuentos contados por ti y A dormir.',
    others: 'Otros',
    later: 'Para más adelante',
    disclaimer:
      'Cada niño tiene su ritmo: estos hitos son una referencia, no un examen. Si algo te preocupa, habla con el pediatra; cuanto antes, mejor.',
    sources:
      'Fuentes: Organización Mundial de la Salud (2019); Sociedad Brasileña de Pediatría, “Menos pantallas, más salud” (2019); Academia Americana de Pediatría; CDC, hitos del desarrollo (2022).',
    reminder: {
      title: (m) => `Ya llevan ${m} minutos juntos 💛`,
      body: '¿Y si siguen jugando fuera de la pantalla?',
      more: '5 minutos más',
      stop: 'Vamos a parar',
    },
    guides: {
      a0: {
        speech: [
          'Sonríe y reacciona cuando le hablas.',
          'Balbucea sílabas como “ba-ba” y “ma-ma” (hacia los 6–9 meses).',
          'Responde a su nombre y entiende “adiós” (hacia los 9–12 meses).',
          'La primera palabra suele llegar cerca del año.',
        ],
        screen:
          'La OMS recomienda nada de pantallas antes del año, y la Sociedad Brasileña de Pediatría, evitarlas hasta los 2. En esta etapa lo más valioso es tu voz: usa la app como apoyo para contar y cantar, con el bebé mirándote a ti, no al móvil. A dormir funciona con el móvil lejos, solo con el sonido.',
        together: [
          'Cuenta tú el cuento, con el bebé en brazos, de frente a ti.',
          'Imita los sonidos de los animales exagerando y espera a que “responda”.',
          'Narra el día: “ahora vamos a cambiar el pañal”.',
        ],
        offline: [
          'Canta la misma canción muchas veces: la repetición ayuda a aprender.',
          'Juega al cucú-tras: “¿dónde está? ¡Aquí está!”.',
          'Muestra objetos de verdad y di su nombre: “pelota”, “agua”.',
        ],
      },
      a1: {
        speech: [
          'Dice sus primeras palabras y usa gestos: señala, dice adiós con la mano.',
          'Imita sonidos de animales y cosas: “muuu”, “pi-pi”.',
          'Hacia los 18 meses dice algunas palabras y entiende mucho más de lo que dice.',
          'Hacia los 2 años junta dos palabras: “más agua”, “papá fue”.',
        ],
        screen:
          'La OMS no recomienda pantallas para niños de 1 año, y la Sociedad Brasileña de Pediatría sugiere evitarlas hasta los 2. Si la usas, que sean pocos minutos, siempre juntos y conversando: la Academia Americana de Pediatría lo considera aceptable así desde los 18 meses, con contenido de calidad. Para eso está hecha la app: tú guías, el peque señala e intenta hablar.',
        together: [
          'Toca el animal, haz el sonido juntos y espera a que lo intente.',
          'Cuando aparezca “¡Tu turno!”, espera de verdad: 5 segundos parecen mucho, pero ayudan.',
          'Repite lo que diga y complétalo: “¡guau!” → “¡sí, el perro hace guau-guau!”.',
        ],
        offline: [
          'Paseen por la casa nombrando todo: puerta, luz, zapato.',
          'Con peluches, pregunta: “¿dónde está el gato? ¿Cómo hace?”.',
          'Lean libros de papel con dibujos grandes y deja que pase las páginas.',
        ],
      },
      a2: {
        speech: [
          'Junta 2 o 3 palabras y el vocabulario crece rápido.',
          'Empieza a nombrar colores y a contar cantidades pequeñas.',
          'Hacia los 3 años conversa con frases cortas y pregunta “¿qué es eso?”.',
        ],
        screen:
          'La OMS y la Sociedad Brasileña de Pediatría recomiendan como máximo 1 hora de pantalla al día a esta edad, sumando tele, móvil y tableta, y menos es mejor. Siempre con un adulto. Mejor sesiones cortas en la app y luego seguir el juego fuera de la pantalla.',
        together: [
          'Pregunta antes de tocar: “¿cuál es el amarillo?”, y deja que responda.',
          'Cuenten en voz alta juntos, señalando cada uno.',
          'Pregunta sobre el cuento: “¿adónde fue el pato?”.',
        ],
        offline: [
          'Caza de colores por la casa: “¡busca algo rojo!”.',
          'Cuenten cosas del día: escalones, cucharas, cochecitos.',
          'Jueguen a imaginar con muñecos y cacharritos.',
        ],
      },
      a3: {
        speech: [
          'Habla con frases y cuenta lo que pasó.',
          'Pregunta mucho: “¿por qué?”.',
          'Casi todo el mundo entiende lo que dice.',
          'Le encantan las rimas, las canciones y los cuentos con principio, medio y final.',
        ],
        screen:
          'Hasta los 5 años, la recomendación de la OMS y la Sociedad Brasileña de Pediatría sigue igual: como máximo 1 hora de pantalla al día, con un adulto. Usa la app en sesiones cortas e invita al peque a volver a contar el cuento con sus palabras.',
        together: [
          'Pídele que te cuente el cuento mirando los dibujos.',
          'Pregunta qué pasará antes de pasar la página.',
          'Inventen juntos otro final.',
        ],
        offline: [
          'Vuelvan a contar el cuento con juguetes.',
          'Jueguen a las adivinanzas con animales y sus sonidos.',
          'Dibuja su parte favorita del cuento y pídele que la explique.',
        ],
      },
    },
  },
  fr: {
    labels: { a0: '0–1 an', a1: '1–2 ans', a2: '2–3 ans', a3: '3 ans et +' },
    forAge: (l) => `Pour ${l}`,
    question: 'Quel âge a votre bébé ?',
    questionHint: 'Pour vous montrer ce qui convient à son âge, et un guide pour vous.',
    change: 'Changer',
    guideLink: 'Guide des parents',
    guideTitle: 'Guide des parents',
    sections: {
      speech: '🗣️ Le langage à cet âge',
      screen: '📱 Et les écrans ?',
      together: '🤝 L’utiliser ensemble',
      offline: '🌳 Loin de l’écran',
      recommended: '⭐ Dans l’appli, pour cet âge',
    },
    noQuiz: 'À cet âge, privilégiez les histoires racontées par vous, et Dodo.',
    others: 'Autres',
    later: 'Pour plus tard',
    disclaimer:
      'Chaque enfant a son rythme : ces repères sont une indication, pas un examen. Si quelque chose vous inquiète, parlez-en au pédiatre — le plus tôt sera le mieux.',
    sources:
      'Sources : Organisation mondiale de la santé (2019) ; Société brésilienne de pédiatrie, « Moins d’écrans, plus de santé » (2019) ; Académie américaine de pédiatrie ; CDC, étapes du développement (2022).',
    reminder: {
      title: (m) => `Déjà ${m} minutes ensemble 💛`,
      body: 'Et si vous continuiez le jeu loin de l’écran ?',
      more: 'Encore 5 minutes',
      stop: 'On arrête',
    },
    guides: {
      a0: {
        speech: [
          'Sourit et réagit quand vous lui parlez.',
          'Babille des syllabes comme « ba-ba » et « ma-ma » (vers 6–9 mois).',
          'Réagit à son prénom et comprend « au revoir » (vers 9–12 mois).',
          'Le premier mot arrive souvent vers 1 an.',
        ],
        screen:
          'L’OMS recommande aucun écran avant 1 an, et la Société brésilienne de pédiatrie de les éviter jusqu’à 2 ans. À cet âge, c’est votre voix qui compte le plus : utilisez l’appli comme support pour raconter et chanter, bébé vous regardant vous, pas le téléphone. Dodo fonctionne téléphone posé au loin, avec le son seulement.',
        together: [
          'Racontez l’histoire vous-même, bébé sur les genoux, face à vous.',
          'Imitez les cris des animaux en exagérant et attendez qu’il « réponde ».',
          'Racontez la journée : « maintenant on change la couche ».',
        ],
        offline: [
          'Chantez la même chanson plusieurs fois : la répétition aide à apprendre.',
          'Jouez à coucou-caché : « où est-il ? Le voilà ! ».',
          'Montrez de vrais objets et nommez-les : « ballon », « eau ».',
        ],
      },
      a1: {
        speech: [
          'Dit ses premiers mots et fait des gestes : montre du doigt, fait au revoir.',
          'Imite les cris des animaux et les bruits : « meuh », « tut-tut ».',
          'Vers 18 mois, dit quelques mots et comprend bien plus qu’il ne dit.',
          'Vers 2 ans, associe deux mots : « encore eau », « papa parti ».',
        ],
        screen:
          'L’OMS ne recommande pas d’écran à 1 an, et la Société brésilienne de pédiatrie conseille de l’éviter jusqu’à 2 ans. Si vous l’utilisez, quelques minutes seulement, toujours ensemble et en parlant : l’Académie américaine de pédiatrie le juge acceptable ainsi dès 18 mois, avec un contenu de qualité. C’est le but de l’appli : vous menez, l’enfant montre et essaie de parler.',
        together: [
          'Touchez l’animal, faites le cri ensemble et attendez qu’il essaie.',
          'Quand « À toi ! » apparaît, attendez vraiment : 5 secondes semblent longues, mais ça aide.',
          'Répétez ce qu’il dit en complétant : « ouaf ! » → « oui, le chien fait ouaf-ouaf ! ».',
        ],
        offline: [
          'Faites le tour de la maison en nommant tout : porte, lumière, chaussure.',
          'Avec des peluches, demandez : « où est le chat ? Il fait comment ? ».',
          'Lisez des livres en papier avec de grandes images et laissez-le tourner les pages.',
        ],
      },
      a2: {
        speech: [
          'Associe 2 ou 3 mots, et le vocabulaire grandit vite.',
          'Commence à nommer les couleurs et à compter de petites quantités.',
          'Vers 3 ans, parle en phrases courtes et demande « c’est quoi ? ».',
        ],
        screen:
          'L’OMS et la Société brésilienne de pédiatrie recommandent au maximum 1 heure d’écran par jour à cet âge, télé, téléphone et tablette compris — et moins, c’est mieux. Toujours avec un adulte. Préférez de courtes séances dans l’appli, puis continuez le jeu loin de l’écran.',
        together: [
          'Demandez avant de toucher : « lequel est jaune ? », et laissez-le répondre.',
          'Comptez à voix haute ensemble, en montrant chacun.',
          'Posez des questions sur l’histoire : « où est allé le canard ? ».',
        ],
        offline: [
          'Chasse aux couleurs dans la maison : « trouve quelque chose de rouge ! ».',
          'Comptez les choses du quotidien : marches, cuillères, petites voitures.',
          'Jouez à faire semblant avec des poupées et une dînette.',
        ],
      },
      a3: {
        speech: [
          'Parle en phrases et raconte ce qui s’est passé.',
          'Pose beaucoup de questions : « pourquoi ? ».',
          'La plupart des gens comprennent ce qu’il dit.',
          'Adore les comptines, les chansons et les histoires avec un début, un milieu et une fin.',
        ],
        screen:
          'Jusqu’à 5 ans, la recommandation de l’OMS et de la Société brésilienne de pédiatrie reste la même : au maximum 1 heure d’écran par jour, avec un adulte. Utilisez l’appli en séances courtes et invitez l’enfant à raconter l’histoire avec ses propres mots.',
        together: [
          'Demandez-lui de vous raconter l’histoire en regardant les images.',
          'Demandez ce qui va se passer avant de tourner la page.',
          'Inventez ensemble une autre fin.',
        ],
        offline: [
          'Rejouez l’histoire avec des jouets.',
          'Jouez aux devinettes avec les animaux et leurs cris.',
          'Dessinez son passage préféré et demandez-lui de l’expliquer.',
        ],
      },
    },
  },
}
