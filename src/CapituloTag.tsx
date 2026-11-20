import { AbsoluteFill } from "remotion";
import { useFormato } from "./layout";

/**
 * Etiqueta do capítulo no canto de cima à esquerda (estilo RankAnime: "LEVEL 1 · SOLDADO RASO"):
 * caixa escura com borda amarela, fica durante todo o capítulo. Fundo transparente.
 */
export const CapituloTag: React.FC<{ texto: string }> = ({ texto }) => {
  const { width, curto, margemVertical } = useFormato();
  const tamanho = Math.round(width * (curto ? 0.035 : 0.0145));
  return (
    <AbsoluteFill style={{ padding: `${curto ? margemVertical : width * 0.014}px ${width * 0.014}px` }}>
      <div
        style={{
          alignSelf: "flex-start",
          background: "rgba(20,16,12,0.82)",
          border: `${Math.max(2, Math.round(tamanho * 0.1))}px solid #F2C230`,
          borderRadius: Math.round(tamanho * 0.45),
          color: "white",
          fontFamily: "'Montserrat', 'Arial Black', Arial, sans-serif",
          fontWeight: 800,
          fontSize: tamanho,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          padding: `${Math.round(tamanho * 0.3)}px ${Math.round(tamanho * 0.7)}px`,
          whiteSpace: "nowrap",
        }}
      >
        {texto}
      </div>
    </AbsoluteFill>
  );
};
