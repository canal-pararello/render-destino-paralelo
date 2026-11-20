import { AbsoluteFill, Audio, Series, staticFile, useVideoConfig } from "remotion";
import { BarraProgresso } from "./BarraProgresso";
import { DIRECOES, ImagemKenBurns } from "./ImagemKenBurns";
import { LegendaAnimada } from "./LegendaAnimada";
import { IMAGENS_TESTE } from "./TesteKenBurns";

export const SEGUNDOS_TESTE_LEGENDA = 15;
const PROJETO = "audio/teste-roteiro-01";

// Primeiros 15 s da narração com a legenda por cima das pirâmides (5 s cada),
// para ver o contorno preto sobre fundo claro e escuro.
export const TesteLegenda: React.FC = () => {
  const { fps } = useVideoConfig();
  const porImagem = Math.round((SEGUNDOS_TESTE_LEGENDA / IMAGENS_TESTE.length) * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Series>
        {IMAGENS_TESTE.map((imagem, i) => (
          <Series.Sequence key={imagem} durationInFrames={porImagem}>
            <ImagemKenBurns
              imagem={imagem}
              duracaoSegundos={porImagem / fps}
              direcao={DIRECOES[i % DIRECOES.length]}
            />
          </Series.Sequence>
        ))}
      </Series>
      <Audio src={staticFile(`${PROJETO}/narracao-limpa.wav`)} />
      <LegendaAnimada arquivoPalavras={`${PROJETO}/palavras.json`} />
      <BarraProgresso />
    </AbsoluteFill>
  );
};
