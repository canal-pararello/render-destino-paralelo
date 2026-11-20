import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  OffthreadVideo,
  Sequence,
  staticFile,
} from "remotion";
import { BarraProgresso } from "./BarraProgresso";
import { CapituloTag } from "./CapituloTag";
import { acharNumero, Contador } from "./Contador";
import { DIRECOES, ImagemKenBurns } from "./ImagemKenBurns";
import { LegendaAnimada } from "./LegendaAnimada";
import { duracaoTitulo, TituloAnimado } from "./TituloAnimado";

/** Uma cena do cenas.json (gerado por ferramentas/montar_cenas.py). */
export type Cena = {
  cena: number;
  frase: string;
  inicio: number;
  fim: number;
  /** Relativo à pasta do projeto, ex.: "midia/cena-001.mp4". null = sem mídia. */
  arquivo: string | null;
  /** Opcional: mostra o TituloAnimado no começo da cena. */
  titulo?: string;
  /** Opcional: nome do capítulo, mostrado na etiqueta do canto durante a cena. */
  capitulo?: string;
  /** Opcional: força o contador ({valor, sufixo}) ou desliga (false). */
  contador?: { valor: number; sufixo?: string } | false;
};

export type VideoFinalProps = {
  /** Pasta do projeto dentro de motion/public, ex.: "projetos/teste-roteiro-01". */
  projeto: string;
  /** Narração e palavras (dentro de motion/public). */
  audio: string;
  palavras: string;
  /** Opcional: outro arquivo de cenas (dentro de motion/public), ex.: o recorte de um curto.
   *  As mídias continuam sendo lidas de `projeto`. Padrão: `${projeto}/cenas.json`. */
  arquivoCenas?: string;
  /** Preenchido pelo calculateMetadata a partir do cenas.json. */
  cenas?: Cena[];
};

const EXT_VIDEO = /\.(mp4|mov|webm|mkv)$/i;

/** Lê o cenas.json e define a duração do vídeo pelo fim da última cena. */
export const calcularVideoFinal: CalculateMetadataFunction<VideoFinalProps> = async ({ props }) => {
  const arquivo = props.arquivoCenas ?? `${props.projeto}/cenas.json`;
  const r = await fetch(staticFile(arquivo));
  if (!r.ok) throw new Error(`Não achei ${arquivo}`);
  const cenas: Cena[] = await r.json();
  const fps = 30;
  const fim = Math.max(...cenas.map((c) => c.fim));
  return { durationInFrames: Math.ceil(fim * fps), fps, props: { ...props, cenas } };
};

const MidiaDaCena: React.FC<{ cena: Cena; indice: number; projeto: string }> = ({
  cena,
  indice,
  projeto,
}) => {
  if (!cena.arquivo) {
    // Cena sem mídia: não inventa nada; fundo escuro (o montar_cenas.py lista essas cenas).
    return <AbsoluteFill style={{ backgroundColor: "#111" }} />;
  }
  const caminho = `${projeto}/${cena.arquivo}`;
  if (EXT_VIDEO.test(cena.arquivo)) {
    return (
      <AbsoluteFill style={{ backgroundColor: "black" }}>
        <OffthreadVideo
          src={staticFile(caminho)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    );
  }
  return (
    <ImagemKenBurns
      imagem={caminho}
      duracaoSegundos={cena.fim - cena.inicio}
      direcao={DIRECOES[indice % DIRECOES.length]}
    />
  );
};

export const VideoFinal: React.FC<VideoFinalProps> = ({ projeto, audio, palavras, cenas = [] }) => {
  const fps = 30;
  const quadro = (s: number) => Math.round(s * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* 1. Mídia de cada cena, no tempo exato (início da cena -> início da próxima) */}
      {cenas.map((c, i) => (
        <Sequence
          key={`m${c.cena}`}
          from={quadro(c.inicio)}
          durationInFrames={Math.max(1, quadro(c.fim) - quadro(c.inicio))}
          name={`Cena ${c.cena}`}
        >
          <MidiaDaCena cena={c} indice={i} projeto={projeto} />
        </Sequence>
      ))}

      {/* 2. Título quando a cena tiver "titulo" */}
      {cenas
        .filter((c) => c.titulo)
        .map((c) => (
          <Sequence
            key={`t${c.cena}`}
            from={quadro(c.inicio)}
            durationInFrames={quadro(duracaoTitulo())}
            name={`Título cena ${c.cena}`}
          >
            <TituloAnimado texto={c.titulo!} />
          </Sequence>
        ))}

      {/* 2b. Etiqueta do capítulo no canto, do início do capítulo até o início do próximo */}
      {cenas.map((c, i) => {
        if (!c.capitulo || cenas[i - 1]?.capitulo === c.capitulo) return null;
        let j = i;
        while (j + 1 < cenas.length && cenas[j + 1].capitulo === c.capitulo) j++;
        return (
          <Sequence
            key={`k${c.cena}`}
            from={quadro(c.inicio)}
            durationInFrames={Math.max(1, quadro(cenas[j].fim) - quadro(c.inicio))}
            name={`Etiqueta ${c.capitulo}`}
          >
            <CapituloTag texto={c.capitulo} />
          </Sequence>
        );
      })}

      {/* 3. Contador quando a frase tiver um número grande (ou o campo "contador") */}
      {cenas.map((c) => {
        const numero = c.contador === false ? null : c.contador ?? acharNumero(c.frase);
        if (!numero) return null;
        return (
          <Sequence
            key={`c${c.cena}`}
            from={quadro(c.inicio)}
            durationInFrames={Math.max(1, quadro(c.fim) - quadro(c.inicio))}
            name={`Contador cena ${c.cena}`}
          >
            <Contador valor={numero.valor} sufixo={numero.sufixo} duracaoSegundos={c.fim - c.inicio} />
          </Sequence>
        );
      })}

      {/* 4. Narração completa */}
      <Audio src={staticFile(audio)} />

      {/* 5. Legenda o vídeo todo e 6. barra de progresso */}
      <LegendaAnimada arquivoPalavras={palavras} tamanhoEm={0.028} margemInferior={7} />
      <BarraProgresso />
    </AbsoluteFill>
  );
};
