import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  staticFile,
} from "remotion";
import { ImagemViva, MOVIMENTOS, Vinheta } from "./Camera";
import { Cena, VideoFinalProps } from "../VideoFinal";
import { CtaInscreva, ImagemImpacto, PalavraTela, QuadroInclinado, TelaCitacao } from "./Efeitos";
import { acharCitacao, ehImpacto, ehTensao, IMPACTO_GAP_S } from "./regras";
import { AberturaCinetica, blocosAbertura, LegendaGancho, usePalavras } from "./Texto";

/** Campos extras do cenas.json que este estilo entende (todos opcionais). */
export type CenaEssence = Cena & {
  /** true/false força ou desliga o impacto (flash + rajada + tremida). */
  impacto?: boolean;
  /** true/false força ou desliga o quadro inclinado. */
  inclinado?: boolean;
  /** Texto da tela de citação (fala entre aspas sobre preto); false desliga a automática. */
  citacao?: string | false;
  /** Palavra solta na tela (\"Décadas*\"); `palavraVermelha` deixa em vermelho. */
  palavra?: string;
  palavraVermelha?: boolean;
};

export type VideoEssenceProps = VideoFinalProps & {
  /** Música de fundo (dentro de motion/public). Fica ~24 dB abaixo da voz. */
  musica?: string;
  /** Efeitos sonoros (padrão true): pancada no impacto, whoosh no texto cinético e no Inscreva-se. */
  efeitosSonoros?: boolean;
  /** Trilha por capítulo (projetos/<projeto>/trilhas.json do ferramentas/escolher_trilhas.py). */
  trilhas?: Trilha[];
};

export type Trilha = { arquivo: string; inicio: number; fim: number; pularInicio?: number; clima?: string };

/** Trilhas normalizadas em -16 LUFS; narração em ~-14,7. 0,07 = -23 dB -> música ~24 dB abaixo da voz. */
export const VOLUME_TRILHA = 0.07;
const FADE_TRILHA = 1.2;

/** Volumes dos efeitos (medidos contra a narração a -14 LUFS). */
export const SFX = { impacto: 0.55, whoosh: 0.22, clique: 0.35, tensao: 0.3 };

export type TipoCena = "kenburns" | "impacto" | "inclinado" | "citacao" | "video" | "vazia";

const EXT_VIDEO = /\.(mp4|mov|webm|mkv)$/i;
/** -24 dB em amplitude. */
export const VOLUME_MUSICA = 0.063;

/** Decide o efeito de cada cena (campo da cena > regra automática pela frase). */
export const planejarEfeitos = (cenas: CenaEssence[]): TipoCena[] => {
  const tipos: TipoCena[] = [];
  let ultimoInclinado = -99;
  let ultimoImpacto = -999;
  cenas.forEach((c, i) => {
    const dur = c.fim - c.inicio;
    const citacao = c.citacao === false ? null : c.citacao ?? acharCitacao(c.frase);
    const impactoAuto = ehImpacto(c.frase) && c.inicio - ultimoImpacto >= IMPACTO_GAP_S;
    if (citacao) tipos.push("citacao");
    else if (!c.arquivo) tipos.push("vazia");
    else if (EXT_VIDEO.test(c.arquivo)) tipos.push("video");
    else if (c.impacto ?? impactoAuto) {
      tipos.push("impacto");
      ultimoImpacto = c.inicio;
    } else if (c.inclinado ?? (ehTensao(c.frase) && dur >= 1.5 && i - ultimoInclinado >= 6)) {
      tipos.push("inclinado");
      ultimoInclinado = i;
    } else tipos.push("kenburns");
  });
  return tipos;
};

/** Fim da abertura cinética (s): fim da 1ª cena, entre 2 e 4 s. */
export const fimAbertura = (cenas: Cena[]) => Math.min(4, Math.max(2, cenas[0]?.fim ?? 3));
/** Fim do gancho (s): início do 1º capítulo (cena com `titulo`), no máximo 90 s. */
export const fimGancho = (cenas: Cena[]) => Math.min(90, cenas.find((c, i) => i > 0 && c.titulo)?.inicio ?? 85);

const Midia: React.FC<{ cena: CenaEssence; tipo: TipoCena; indice: number; projeto: string }> = ({
  cena,
  tipo,
  indice,
  projeto,
}) => {
  const dur = cena.fim - cena.inicio;
  const caminho = cena.arquivo ? `${projeto}/${cena.arquivo}` : "";
  switch (tipo) {
    case "citacao":
      return <TelaCitacao texto={(cena.citacao || acharCitacao(cena.frase)) as string} />;
    case "vazia":
      return <AbsoluteFill style={{ backgroundColor: "#111" }} />;
    case "video":
      return (
        <AbsoluteFill style={{ backgroundColor: "black" }}>
          <OffthreadVideo src={staticFile(caminho)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      );
    case "impacto":
      return <ImagemImpacto imagem={caminho} duracaoSegundos={dur} semente={cena.cena} />;
    case "inclinado":
      return <QuadroInclinado imagem={caminho} duracaoSegundos={dur} lado={indice % 2 ? 1 : -1} />;
    default:
      return (
        <ImagemViva imagem={caminho} duracaoSegundos={dur} movimento={MOVIMENTOS[indice % MOVIMENTOS.length]} semente={cena.cena} />
      );
  }
};

/**
 * Vídeo no estilo Essenceanime com as imagens geradas do canal (estilos/estilo-essenceanime.md):
 * corte seco entre cenas e entre capítulos (sem cartela, sem etiqueta, sem barra), abertura com
 * texto cinético branco/vermelho, legenda só no gancho, impacto/inclinado/citação automáticos,
 * \"Inscreva-se\" uma vez perto de 37% e música ~24 dB abaixo da voz.
 */
export const VideoEssence: React.FC<VideoEssenceProps> = ({
  projeto,
  audio,
  palavras,
  musica,
  efeitosSonoros = true,
  trilhas = [],
  cenas = [],
}) => {
  const fps = 30;
  const q = (s: number) => Math.round(s * fps);
  const lista = cenas as CenaEssence[];
  const tipos = planejarEfeitos(lista);
  const pal = usePalavras(palavras);
  const total = lista.length ? lista[lista.length - 1].fim : 0;
  const cta = lista.find((c) => c.inicio >= total * 0.37 && tipos[lista.indexOf(c)] !== "citacao");
  const abertura = fimAbertura(lista);
  const gancho = fimGancho(lista);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {lista.map((c, i) => (
        <Sequence
          key={`m${c.cena}`}
          from={q(c.inicio)}
          durationInFrames={Math.max(1, q(c.fim) - q(c.inicio))}
          name={`Cena ${c.cena} · ${tipos[i]}`}
        >
          <Midia cena={c} tipo={tipos[i]} indice={i} projeto={projeto} />
          {c.palavra ? <PalavraTela texto={c.palavra} vermelha={c.palavraVermelha} /> : null}
        </Sequence>
      ))}

      <Vinheta />

      {cta ? (
        <Sequence from={q(cta.inicio)} durationInFrames={q(2)} name="Inscreva-se">
          <CtaInscreva />
        </Sequence>
      ) : null}

      {efeitosSonoros ? (
        <>
          {lista.map((c, i) =>
            tipos[i] === "impacto" ? (
              <Sequence key={`si${c.cena}`} from={q(c.inicio)} durationInFrames={q(1.2)} name="som impacto">
                <Audio src={staticFile("sfx/impacto.wav")} volume={SFX.impacto} />
              </Sequence>
            ) : tipos[i] === "inclinado" ? (
              <Sequence key={`st${c.cena}`} from={q(c.inicio)} durationInFrames={q(1.5)} name="som tensão">
                <Audio src={staticFile("sfx/tensao.wav")} volume={SFX.tensao} />
              </Sequence>
            ) : null,
          )}
          {cta ? (
            <>
              <Sequence from={q(cta.inicio)} durationInFrames={q(0.6)} name="som cta">
                <Audio src={staticFile("sfx/whoosh.wav")} volume={SFX.whoosh} />
              </Sequence>
              <Sequence from={q(cta.inicio + 0.8)} durationInFrames={q(0.3)} name="clique">
                <Audio src={staticFile("sfx/clique.wav")} volume={SFX.clique} />
              </Sequence>
            </>
          ) : null}
          {pal
            ? blocosAbertura(pal, abertura).map((t0, k) => (
                <Sequence key={`sw${k}`} from={Math.max(0, q(t0) - 3)} durationInFrames={q(0.6)} name="whoosh texto">
                  <Audio src={staticFile("sfx/whoosh.wav")} volume={SFX.whoosh * 0.7} />
                </Sequence>
              ))
            : null}
        </>
      ) : null}

      <Audio src={staticFile(audio)} />
      {musica ? <Audio src={staticFile(musica)} volume={VOLUME_MUSICA} loop /> : null}
      {trilhas.map((t, k) => {
        // cada trilha entra suave e sai suave; sobra 1 s por cima da próxima para cruzar
        const ultima = k === trilhas.length - 1;
        const dur = q(t.fim - t.inicio + (ultima ? 0 : 1));
        const fade = q(FADE_TRILHA);
        return (
          <Sequence key={`tr${k}`} from={q(t.inicio)} durationInFrames={Math.max(1, dur)} name={`Trilha ${t.clima ?? ""}`}>
            <Audio
              src={staticFile(t.arquivo)}
              startFrom={q(t.pularInicio ?? 0)}
              loop
              volume={(f) =>
                VOLUME_TRILHA *
                Math.min(1, k === 0 ? 1 : f / fade, Math.max(0, (dur - f) / fade))
              }
            />
          </Sequence>
        );
      })}

      {pal ? (
        <>
          <AberturaCinetica palavras={pal} ate={abertura} />
          <LegendaGancho palavras={pal} de={abertura} ate={gancho} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
