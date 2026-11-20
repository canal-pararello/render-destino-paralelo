import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useFormato } from "./layout";

export type BarraProgressoProps = {
  /** Altura da linha em pixels. Padrão 6 no longo e 10 no curto. */
  altura?: number;
  cor?: string;
};

/**
 * Linha vermelha que vai de 0% a 100% da largura ao longo do vídeo inteiro
 * (100% exatamente no último quadro).
 *   longo: colada na borda de baixo, 6 px.
 *   curto: 10 px, a 150 px da borda de baixo (fora da faixa da interface do app).
 * Use no nível de cima da composição, fora de <Sequence>, para contar o vídeo todo.
 */
export const BarraProgresso: React.FC<BarraProgressoProps> = ({ altura, cor = "#FF0000" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { curto, margemVertical } = useFormato();

  const largura = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: margemVertical,
          height: altura ?? (curto ? 10 : 6),
          width: `${largura}%`,
          backgroundColor: cor,
        }}
      />
    </AbsoluteFill>
  );
};
