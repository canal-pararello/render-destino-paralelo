import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type DirecaoKenBurns = "aproximar" | "afastar" | "direita";

// Ordem usada para alternar a direção de uma cena para a outra.
export const DIRECOES: DirecaoKenBurns[] = ["aproximar", "afastar", "direita"];

export type ImagemKenBurnsProps = {
  /** Caminho dentro de motion/public, ex.: "midia/imagens/teste/foto.jpg" */
  imagem: string;
  /** Duração da cena em segundos (o movimento vai do começo ao fim dela). */
  duracaoSegundos: number;
  /** Se não vier, use DIRECOES[indiceDaCena % 3] para alternar. */
  direcao?: DirecaoKenBurns;
};

const ZOOM_MIN = 1.0;
const ZOOM_MAX = 1.12;

/**
 * Imagem que preenche a tela inteira sem distorcer (object-fit: cover corta as sobras)
 * com zoom lento de 100% a 112% e movimento suave (easing senoidal no começo e no fim).
 *   aproximar: 100% -> 112%
 *   afastar:   112% -> 100%
 *   direita:   106% -> 112% enquanto a câmera anda um pouco para a direita
 */
export const ImagemKenBurns: React.FC<ImagemKenBurnsProps> = ({
  imagem,
  duracaoSegundos,
  direcao = "aproximar",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = Math.max(1, Math.round(duracaoSegundos * fps));

  const progresso = interpolate(frame, [0, totalFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });

  let escala: number;
  let deslocamentoX = 0; // em % da largura
  if (direcao === "aproximar") {
    escala = interpolate(progresso, [0, 1], [ZOOM_MIN, ZOOM_MAX]);
  } else if (direcao === "afastar") {
    escala = interpolate(progresso, [0, 1], [ZOOM_MAX, ZOOM_MIN]);
  } else {
    escala = interpolate(progresso, [0, 1], [1.06, ZOOM_MAX]);
    // A câmera vai para a direita = a imagem anda para a esquerda.
    // Com escala >= 1,06 sobra 3% de cada lado, então ±2,5% nunca mostra borda.
    deslocamentoX = interpolate(progresso, [0, 1], [2.5, -2.5]);
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translateX(${deslocamentoX}%) scale(${escala})`,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        <Img
          src={staticFile(imagem)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
