import { Composition } from "remotion";
import { TextoCentral } from "./Composition";
import { IMAGENS_TESTE, SEGUNDOS_POR_CENA, TesteKenBurns } from "./TesteKenBurns";
import { DURACAO_TESTE_TITULO, TesteTitulo } from "./TesteTitulo";
import { TesteDestaque } from "./TesteDestaque";
import { SEGUNDOS_TESTE_LEGENDA, TesteLegenda } from "./TesteLegenda";
import { calcularVideoFinal, VideoFinal } from "./VideoFinal";
import { VideoEssence, VideoEssenceProps } from "./essence/VideoEssence";
import { CalculateMetadataFunction, staticFile } from "remotion";

const calcularVideoEssence: CalculateMetadataFunction<VideoEssenceProps> = async (args) => {
  const r = await calcularVideoFinal(args as Parameters<typeof calcularVideoFinal>[0]);
  // trilhas.json é opcional (ferramentas/escolher_trilhas.py)
  let trilhas = args.props.trilhas;
  if (!trilhas) {
    const t = await fetch(staticFile(`${args.props.projeto}/trilhas.json`));
    trilhas = t.ok ? await t.json() : [];
  }
  return { ...r, props: { ...args.props, ...(r.props ?? {}), trilhas } };
};

const FPS = 30;
const DURACAO_SEGUNDOS = 5;

// Os componentes se adaptam sozinhos ao formato (veja src/layout.ts):
// cada teste tem a versão deitada (1920x1080, longo) e a em pé (1080x1920, curto).
const LONGO = { width: 1920, height: 1080 };
const CURTO = { width: 1080, height: 1920 };

// Mapa 1920x1898 do Commons; centro de Santa Catarina no mapa original: (1070, 1565).
const MAPA = {
  imagem: "midia/mapa.jpg",
  larguraImagem: 1920,
  alturaImagem: 1898,
  xImagem: 1070,
  yImagem: 1565,
  anguloSeta: 315,
  corFundo: "#C6ECFF",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Texto no centro */}
      <Composition
        id="Teste"
        component={TextoCentral}
        durationInFrames={DURACAO_SEGUNDOS * FPS}
        fps={FPS}
        {...LONGO}
        defaultProps={{ texto: "Funcionou!" }}
      />
      <Composition
        id="TesteCurto"
        component={TextoCentral}
        durationInFrames={DURACAO_SEGUNDOS * FPS}
        fps={FPS}
        {...CURTO}
        defaultProps={{ texto: "Funcionou!" }}
      />

      {/* Ken Burns: 3 imagens de 4 s, direção alternando */}
      <Composition
        id="TesteKenBurns"
        component={TesteKenBurns}
        durationInFrames={IMAGENS_TESTE.length * SEGUNDOS_POR_CENA * FPS}
        fps={FPS}
        {...LONGO}
      />
      <Composition
        id="TesteKenBurnsCurto"
        component={TesteKenBurns}
        durationInFrames={IMAGENS_TESTE.length * SEGUNDOS_POR_CENA * FPS}
        fps={FPS}
        {...CURTO}
      />

      {/* Título animado por cima de uma imagem */}
      <Composition
        id="TesteTitulo"
        component={TesteTitulo}
        durationInFrames={Math.round(DURACAO_TESTE_TITULO * FPS)}
        fps={FPS}
        {...LONGO}
      />
      <Composition
        id="TesteTituloCurto"
        component={TesteTitulo}
        durationInFrames={Math.round(DURACAO_TESTE_TITULO * FPS)}
        fps={FPS}
        {...CURTO}
      />

      {/* Destaque (círculo + seta) em Santa Catarina. No curto o mapa ocupa a largura
          inteira e sai quase do mesmo tamanho do longo, então o círculo também. */}
      <Composition
        id="TesteDestaque"
        component={TesteDestaque}
        durationInFrames={3 * FPS}
        fps={FPS}
        {...LONGO}
        defaultProps={{ ...MAPA, raio: 62 }}
      />
      <Composition
        id="TesteDestaqueCurto"
        component={TesteDestaque}
        durationInFrames={3 * FPS}
        fps={FPS}
        {...CURTO}
        defaultProps={{ ...MAPA, raio: 66 }}
      />

      {/* Legenda animada + barra de progresso: primeiros 15 s da narração */}
      <Composition
        id="TesteLegenda"
        component={TesteLegenda}
        durationInFrames={SEGUNDOS_TESTE_LEGENDA * FPS}
        fps={FPS}
        {...LONGO}
      />
      <Composition
        id="TesteLegendaCurto"
        component={TesteLegenda}
        durationInFrames={SEGUNDOS_TESTE_LEGENDA * FPS}
        fps={FPS}
        {...CURTO}
      />

      {/* Vídeo final montado a partir do cenas.json do projeto (duração vem do arquivo) */}
      <Composition
        id="VideoFinal"
        component={VideoFinal}
        durationInFrames={30 * FPS}
        fps={FPS}
        {...LONGO}
        calculateMetadata={calcularVideoFinal}
        defaultProps={{
          projeto: "projetos/teste-roteiro-01",
          audio: "audio/teste-roteiro-01/narracao-limpa.wav",
          palavras: "audio/teste-roteiro-01/palavras.json",
        }}
      />

      {/* Estilo Essenceanime com as imagens do canal (estilos/estilo-essenceanime.md) */}
      <Composition
        id="VideoEssence"
        component={VideoEssence}
        durationInFrames={30 * FPS}
        fps={FPS}
        {...LONGO}
        calculateMetadata={calcularVideoEssence}
        defaultProps={{
          projeto: "projetos/2026-11-15-tita-fundador",
          audio: "audio/2026-11-15-tita-fundador/narracao-limpa.wav",
          palavras: "audio/2026-11-15-tita-fundador/palavras.json",
        } as VideoEssenceProps}
      />

      {/* Vídeo final em pé (Shorts/Reels/TikTok): mesmos componentes, 1080x1920 */}
      <Composition
        id="VideoFinalCurto"
        component={VideoFinal}
        durationInFrames={30 * FPS}
        fps={FPS}
        {...CURTO}
        calculateMetadata={calcularVideoFinal}
        defaultProps={{
          projeto: "projetos/teste-roteiro-01",
          audio: "audio/teste-roteiro-01/narracao-limpa.wav",
          palavras: "audio/teste-roteiro-01/palavras.json",
        }}
      />
    </>
  );
};
