import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { ImagemKenBurns } from "./ImagemKenBurns";
import { duracaoTitulo, TituloAnimado } from "./TituloAnimado";

export const ATRASO_TITULO = 0.5; // segundos de imagem antes do título entrar
export const FOLGA_FINAL = 0.5; // segundos de imagem depois do título sair
export const DURACAO_TESTE_TITULO = ATRASO_TITULO + duracaoTitulo() + FOLGA_FINAL;

// Título por cima de uma imagem com Ken Burns, para ver o fundo escurecendo.
export const TesteTitulo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <ImagemKenBurns
        imagem="midia/imagens/teste/piramides-de-gize-por-do-sol.jpg"
        duracaoSegundos={DURACAO_TESTE_TITULO}
        direcao="aproximar"
      />
      <Sequence from={Math.round(ATRASO_TITULO * fps)}>
        <TituloAnimado texto="CAPÍTULO 2: A QUEDA" />
      </Sequence>
    </AbsoluteFill>
  );
};
