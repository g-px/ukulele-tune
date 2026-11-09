/** Brazilian Portuguese copy. Vocabulary follows docs/knowledge/08-beginners.md. */
import type { MicError } from "../audio/mic-errors";
import type { IdentifiedTuning } from "../core/identify";
import { solfege } from "../core/pitch-math";
import type { Strings } from "./types";

export const ptBR: Strings = {
  appName: "Ukulele Tune",
  help: "Ajuda",
  settings: "Configurações",
  back: "Voltar ao afinador",
  tuning: "Afinação",

  tuningNames: {
    "c-high-g": "Padrão em Dó (Sol agudo)",
    "c-low-g": "Padrão em Dó (Sol grave)",
    baritone: "Barítono",
    "d-high-a": "Ré (Lá agudo)",
    "d-low-a": "Canadense (Lá grave)",
    "slack-key": "Slack-key",
    bb: "Si♭",
    "half-step-down": "Meio tom abaixo",
    "vintage-g": "Sol antigo (vintage)",
  },

  a11y: {
    tuner: "Afinador",
    mode: "Modo",
    strings: "Cordas",
    micLevel: "Nível do microfone",
    noNote: "Nenhuma nota detectada",
    cents: "cents",
    language: "Idioma",
  },

  start: {
    instruction: "Toque em começar, permita o microfone e toque uma corda de cada vez.",
    startTuner: "Abrir afinador",
    tonesOnly: "Afinar de ouvido com notas de referência",
    privacy: "O áudio nunca sai do seu aparelho. Tudo roda no navegador e funciona offline.",
    firstLead:
      "É novo no ukulele? Vamos descobrir qual é o seu e afiná-lo com você, passo a passo.",
    setup: "Configurar meu ukulele",
    setupSub: "Cerca de 1 minuto",
    knowTuning: "Já sei minha afinação · Abrir afinador",
    setupLink: "Novo no ukulele? Configurar meu ukulele",
  },

  showSolfege: true,

  setup: {
    label: "Configurar meu ukulele",
    step: (n: number) => `Passo ${n} de 4`,
    skip: "Pular",
    next: "Avançar",
    back: "Voltar",
    hold: {
      title: "Segure assim",
      face: "↑ Para o seu rosto",
      floor: "↓ Para o chão",
      b1: "Braço para a esquerda, cordas para fora. Toque sobre a boca com a mão direita.",
      b1Left: "Braço para a direita, cordas para fora. Toque sobre a boca com a mão esquerda.",
      b2: "A corda 4 é a mais perto do seu rosto. A corda 1 é a mais perto do chão.",
      b3: "Cada corda termina em uma tarraxa na mão do ukulele. Passe o dedo pela corda para achar a tarraxa dela.",
      lefty: "Sou canhoto",
      leftySub: "Braço para a direita; o desenho inverte",
      drawing:
        "Ukulele como você segura: corda 4 em cima, mais perto do rosto, corda 1 embaixo, mais perto do chão",
      head: "Mão e tarraxas",
      strum: "Toque aqui",
    },
    size: {
      title: "Qual o tamanho?",
      lead: "Meça do topo da mão até o fim do corpo.",
      group: "Tamanho do ukulele",
      names: {
        soprano: "Soprano",
        concert: "Concert",
        tenor: "Tenor",
        baritone: "Barítono",
      },
      length: (cm: number, _inches: number) => `Cerca de ${cm} cm`,
      unsure: "Não sei · deixar o app ouvir",
      info: "Soprano, concert e tenor afinam igual: G C E A (Sol Dó Mi Lá). Só o barítono é diferente. O tamanho costuma estar numa etiqueta dentro da boca.",
    },
    look: {
      title: "Olhe a corda 4",
      lead: "A mais perto do seu rosto. Compare com a corda 3, logo ao lado.",
      group: "Corda 4 comparada com a corda 3",
      thin: "Mais fina que a corda 3",
      thinTag: "Sol agudo · o mais comum",
      thick: "Mais grossa que a corda 3",
      thickSub: "Muitas vezes encapada de metal, como corda de violão",
      thickTag: "Sol grave",
      unsure: "Não sei dizer · deixar o app ouvir",
      warn: "Isso importa: uma corda de Sol grave afinada até o Sol agudo arrebenta, e uma de Sol agudo afinada para baixo fica frouxa.",
    },
    listen: {
      title: "Deixe o app ouvir",
      lead: "Toque a corda 4 e depois a corda 3. Uma de cada vez, deixando soar.",
      start: "Começar a ouvir",
      string: (n: number) => `Corda ${n}`,
      heard: "Ouvida",
      now: "Toque agora…",
      waiting: "Em seguida",
      info: "Num ukulele de Sol agudo a corda 4 soa mais aguda que a corda 3. No Sol grave e no barítono, soa mais grave. Funciona mesmo desafinado.",
      same: "As duas soaram iguais. Toque a corda 4 e depois a que fica ao lado dela (corda 3).",
      noMic:
        "O microfone está desligado, então esta verificação será pulada. Vamos usar suas respostas.",
      restart: "Recomeçar",
      privacy: "Usa o microfone. Nada é gravado nem enviado.",
      drawing: (n: number) => `Cordas 4 a 1; a corda ${n} está destacada`,
    },
    result: {
      title: "Seu ukulele",
      found: "Encontramos",
      check: "Confira",
      headline: (size: string, tuning: IdentifiedTuning) =>
        tuning === "baritone"
          ? "Barítono"
          : `${size ? `${size} · ` : ""}${tuning === "c-high-g" ? "Sol agudo" : "Sol grave"}`,
      tuningLine: (name: string) => `${name} ·`,
      why: {
        listenLook: (high: boolean) =>
          high
            ? "A corda 4 soou mais aguda que a corda 3, e você disse que ela parece mais fina. As duas coisas indicam Sol agudo."
            : "A corda 4 soou mais grave que a corda 3, e você disse que ela parece mais grossa. As duas coisas indicam Sol grave.",
        listen: (high: boolean) =>
          high
            ? "A corda 4 soou mais aguda que a corda 3. Isso indica Sol agudo."
            : "A corda 4 soou mais grave que a corda 3. Isso indica Sol grave.",
        listenBaritone:
          "A corda 4 soou mais grave que a corda 3, e as duas soaram graves. É um barítono.",
        look: (high: boolean) =>
          high
            ? "Você disse que a corda 4 é mais fina que a corda 3. Isso indica Sol agudo."
            : "Você disse que a corda 4 é mais grossa que a corda 3. Isso indica Sol grave.",
        size: "Ukuleles barítono são afinados em D G B E (Ré Sol Si Mi), como as quatro cordas mais finas do violão.",
        default:
          "A maioria dos ukuleles é de Sol agudo, então escolhemos essa. Se uma corda soar uma oitava fora, o afinador avisa.",
        conflict:
          "O que você viu e o que ouvimos não combinam. Toque as cordas 4 e 3 de novo, ou confira qual corda está mais perto do seu rosto.",
      },
      mapLabel: "Cordas e suas notas",
      face: "Mais perto do rosto",
      floor: "Mais perto do chão",
      lowest: "A nota mais grave",
      tip1: "Aperte a tarraxa para deixar a nota mais aguda, afrouxe para deixá-la mais grave.",
      tip2: "Gire um pouquinho e toque de novo. Se o ponteiro for para o lado errado, gire para o outro lado.",
      guide: "Afinar comigo",
      manual: "Não é esse? Escolher a afinação",
      again: "Ouvir de novo",
    },
  },

  guide: {
    title: "Afinação guiada",
    round: (n: number) => `Volta ${n} de 2`,
    step: (n: number) => `Passo ${n} de 4`,
    string: (n: number, letter: string) => `Corda ${n} · ${letter} (${solfege(letter)})`,
    hint4: "Mais perto do rosto. Siga a corda até a tarraxa, toque e gire devagar.",
    hint1: "Mais perto do chão. Siga a corda até a tarraxa, toque e gire devagar.",
    hintMid: "Siga a corda até a tarraxa, toque e gire devagar.",
    wrongWayStrong: "Está se afastando.",
    wrongWay: (letter: string) => `Gire a tarraxa da corda ${letter} para o outro lado.`,
    footer: "Segure no verde por um segundo e seguimos.",
    skip: "Pular corda",
    next: "Em seguida",
    tileString: (n: number) => `Corda ${n}`,
    done: "As quatro cordas estão afinadas.",
    doneBody: "As cordas esticam, então confira de novo depois de alguns minutos tocando.",
    again: "Dar outra volta",
    finish: "Pronto",
    leave: "Sair da afinação guiada",
  },

  pill: { inTune: "Afinado", tighten: "Apertar", loosen: "Afrouxar" },
  flatLabel: "♭ abaixo",
  sharpLabel: "acima ♯",
  modeAuto: "Automático",
  modeChromatic: "Cromático",
  locked: (letter: string) => `Travado: ${letter} · toque em Automático para destravar`,
  a4Badge: (a4: number) => `A4 = ${a4}`,
  playTone: (note: string) => `Tocar nota de referência ${note}`,
  stopTone: (note: string) => `Parar nota de referência ${note}`,

  status: {
    starting: "Ligando o microfone…",
    listening: "Ouvindo… toque uma corda perto da boca do ukulele.",
    noSignal: "Ainda não ouvi nada. Toque uma corda perto da boca do ukulele.",
    heard: (hz: number) => `Ouvi ${Math.round(hz)} Hz`,
    tighten: (s: string) =>
      `Gire a tarraxa da corda ${s} para deixar a nota mais aguda. Se passar do ponto, volte e suba de novo.`,
    loosen: (s: string) =>
      `Gire a tarraxa da corda ${s} para deixar a nota mais grave e depois suba até o ponto.`,
    inTune: (s: string) => `${s} está afinada. Toque a próxima corda.`,
    playingTone: (note: string) => `Tocando a nota de referência ${note}`,
    micOff: "Microfone desligado · só notas de referência. Toque em ▶ para ouvir uma corda.",
    micSilent:
      "O microfone está mandando silêncio. Feche outros apps que usam o microfone (chamadas, gravadores) e recarregue a página.",
  },

  octave: {
    low: "Soa uma oitava abaixo.",
    high: "Soa uma oitava acima.",
    lowBody: (note: string) => `É uma corda grave? Não aperte até ${note}: ela pode arrebentar.`,
    highBody: (note: string) =>
      `É uma corda aguda? Nesta afinação ela deveria soar uma oitava abaixo de ${note}.`,
    switchTo: (name: string) => `Mudar para ${name}`,
  },

  announce: (note: string, cents: number, action: "in" | "tighten" | "loosen") =>
    cents === 0 || action === "in"
      ? `${note}, afinada`
      : `${note}, ${Math.abs(Math.round(cents))} cents ${cents < 0 ? "abaixo" : "acima"}, ${
          action === "tighten" ? "apertar" : "afrouxar"
        }`,

  micError: {
    title: {
      denied: "Microfone bloqueado",
      "not-found": "Nenhum microfone encontrado",
      "in-use": "Microfone ocupado",
      "insecure-context": "Precisa de página segura",
      unsupported: "Captura de áudio não suportada",
      unknown: "Problema no microfone",
    } satisfies Record<MicError, string>,
    cause: {
      denied:
        "O navegador recusou o acesso ao microfone, então o afinador não consegue ouvir suas cordas.",
      "not-found": "Este aparelho não tem um microfone que o navegador possa usar.",
      "in-use": "Outro app ou aba está usando o microfone agora.",
      "insecure-context":
        "Os navegadores só liberam o microfone em páginas https:// ou em localhost.",
      unsupported:
        "Este navegador não consegue capturar áudio. Use uma versão atual do Chrome, Firefox ou Safari.",
      unknown: "Não foi possível ligar o microfone.",
    } satisfies Record<MicError, string>,
    fixTitle: "Como resolver",
    fixes: {
      denied: [
        "Toque no cadeado ou no ícone “aA” da barra de endereço e permita o microfone.",
        "No iPhone: Ajustes › Safari › Microfone › Permitir, depois recarregue.",
        "Se abriu pelo Instagram ou outro app, abra no Safari ou no Chrome.",
        "A página precisa estar em https:// ou localhost.",
      ],
      "not-found": [
        "Conecte um fone com microfone ou um microfone USB.",
        "Confira se o sistema não desativou o microfone.",
      ],
      "in-use": [
        "Feche chamadas de vídeo ou apps de gravação.",
        "Feche outras abas que usam o microfone e tente de novo.",
      ],
      "insecure-context": [
        "Abra o endereço https:// deste app.",
        "Se estiver rodando por conta própria, use npm run dev ou sirva a pasta dist/ em localhost.",
      ],
      unsupported: ["Atualize o navegador.", "Abra a página fora de navegadores de apps."],
      unknown: [
        "Recarregue a página e tente de novo.",
        "Reinicie o navegador se continuar falhando.",
      ],
    } satisfies Record<MicError, string[]>,
    retry: "Tentar de novo",
    ringer:
      "As notas de referência saem pelo alto-falante. No iPhone, tire do modo silencioso para ouvir.",
  },

  settingsScreen: {
    a4: "Referência A4",
    a4Hint: "415–466 Hz · o padrão é 440",
    a4Down: "Diminuir A4",
    a4Up: "Aumentar A4",
    window: "Margem de afinação",
    windowHint: "Fica verde dentro desta margem em cents",
    names: "Nomes das notas",
    sharps: "Sustenidos ♯",
    flats: "Bemóis ♭",
    left: "Canhoto",
    leftHint: "Inverte a ordem dos botões das cordas",
    theme: "Tema",
    themeSystem: "Sistema",
    themeLight: "Claro",
    themeDark: "Escuro",
    advanced: "Avançado",
    bufferSize: "Janela de análise",
    bufferHint: "Maior é mais estável nas cordas graves, porém mais lento",
    gate: "Filtro de ruído",
    reset: "Restaurar padrões",
    language: "Idioma",
    languageAuto: "Automático",
    findMine: "Não sabe? Descobrir meu ukulele",
  },

  helpScreen: {
    sections: [
      {
        title: "Como afinar",
        steps: [
          "Toque uma corda solta perto da boca do ukulele e deixe soar.",
          "Ponteiro à esquerda: nota baixa, aperte a tarraxa. À direita: nota alta, afrouxe.",
          "Termine sempre subindo até a nota. Se passar do ponto, desça e suba de novo.",
          "Dê duas voltas pelas quatro cordas. Afinar uma corda mexe um pouco nas outras.",
        ],
      },
      {
        title: "Sol agudo ou Sol grave?",
        body: "A afinação padrão é G C E A (Sol Dó Mi Lá), com a corda Sol mais aguda que a Dó. Isso é normal e se chama afinação reentrante. Um jogo de Sol grave usa uma corda mais grossa, afinada uma oitava abaixo. Nunca aperte uma corda de Sol grave até o Sol agudo: ela arrebenta. Escolha a afinação certa nas Configurações.",
      },
      {
        title: "Por que o ponteiro pula?",
        body: "O primeiro instante depois de tocar a corda é barulhento. Espere meio segundo, toque uma corda de cada vez e fique longe de ventiladores e zumbidos. Cordas novas continuam esticando por alguns dias, então afine com frequência.",
      },
      {
        title: "O microfone não funciona",
        body: "Permita o microfone na barra de endereço. No iPhone, toque em Abrir afinador de novo ao voltar para o app. A página precisa de https:// ou localhost, e navegadores dentro de apps (Instagram, Facebook) costumam bloquear o microfone: abra no Safari ou no Chrome.",
      },
    ],
    which: "Qual ukulele eu tenho?",
    whichBody:
      "Uma verificação de um minuto descobre sua afinação: tamanho, corda 4 e uma escuta rápida.",
    privacy: (version: string) =>
      `Privado por padrão: o áudio é analisado no seu aparelho e nunca é enviado. Versão ${version}.`,
  },
};
