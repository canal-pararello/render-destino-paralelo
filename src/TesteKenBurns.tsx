import { Series, useVideoConfig } from "remotion";
import { DIRECOES, ImagemKenBurns } from "./ImagemKenBurns";

export const SEGUNDOS_POR_CENA = 4;

export const IMAGENS_TESTE = [
  "midia/imagens/teste/piramides-de-gize-por-do-sol.jpg",
  "midia/imagens/teste/piramides-de-gize-com-cairo-ao-fundo.jpg",
  "midia/imagens/teste/caravana-de-camelos-e-piramide-ao-entardecer.jpg",
];

// 3 cenas de 4 s; a direção alterna: aproximar, afastar, direita.
export const TesteKenBurns: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      {IMAGENS_TESTE.map((imagem, i) => (
        <Series.Sequence key={imagem} durationInFrames={SEGUNDOS_POR_CENA * fps}>
          <ImagemKenBurns
            imagem={imagem}
            duracaoSegundos={SEGUNDOS_POR_CENA}
            direcao={DIRECOES[i % DIRECOES.length]}
          />
        </Series.Sequence>
      ))}
    </Series>
  );
};
