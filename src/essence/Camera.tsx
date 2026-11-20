import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Movimento de câmera para imagem parada (substitui o movimento natural dos clipes da
 * referência). Mais vivo que o ImagemKenBurns:
 * - 6 movimentos alternados (aproximar, afastar, ir para a esquerda/direita/cima/baixo);
 * - escala de 1,06 a 1,20, rápida no começo e devagar no fim (Easing.out), como câmera real;
 * - "soco" no corte: os 5 primeiros quadros chegam de +5% de zoom;
 * - leve balanço de câmera na mão (±3 px).
 */
export type Movimento = "aproximar" | "afastar" | "esquerda" | "direita" | "subir" | "descer";
export const MOVIMENTOS: Movimento[] = ["aproximar", "esquerda", "afastar", "direita", "subir", "descer"];

export const ImagemViva: React.FC<{ imagem: string; duracaoSegundos: number; movimento: Movimento; semente: number }> = ({
  imagem,
  duracaoSegundos,
  movimento,
  semente,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = Math.max(2, Math.round(duracaoSegundos * fps));
  const p = interpolate(frame, [0, total - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  let escala = 1.12;
  let x = 0; // % da largura
  let y = 0; // % da altura
  switch (movimento) {
    case "aproximar":
      escala = interpolate(p, [0, 1], [1.06, 1.2]);
      break;
    case "afastar":
      escala = interpolate(p, [0, 1], [1.2, 1.06]);
      break;
    case "esquerda":
      escala = 1.14;
      x = interpolate(p, [0, 1], [4, -4]);
      break;
    case "direita":
      escala = 1.14;
      x = interpolate(p, [0, 1], [-4, 4]);
      break;
    case "subir":
      escala = 1.16;
      y = interpolate(p, [0, 1], [4, -4]);
      break;
    case "descer":
      escala = 1.16;
      y = interpolate(p, [0, 1], [-4, 4]);
      break;
  }
  const soco = interpolate(frame, [0, 5], [0.05, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const bx = Math.sin((frame + semente * 7) / 11) * 3;
  const by = Math.cos((frame + semente * 5) / 13) * 3;

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(calc(${x}% + ${bx}px), calc(${y}% + ${by}px)) scale(${escala + soco})`,
          transformOrigin: "center",
        }}
      >
        <Img src={staticFile(imagem)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Vinheta + leve contraste por cima de tudo: segura as cores muito saturadas e ajuda a ler o texto. */
export const Vinheta: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.42) 100%)",
      pointerEvents: "none",
    }}
  />
);
