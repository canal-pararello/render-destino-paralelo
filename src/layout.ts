import { useVideoConfig } from "remotion";

/**
 * Formato curto (Shorts/Reels/TikTok): nada pode ficar a menos desta distância das
 * bordas de cima e de baixo (o app cobre essas faixas com a interface).
 */
export const MARGEM_VERTICAL_CURTO = 150;

/**
 * Diz se a composição é em pé (curto) ou deitada (longo). Os componentes usam isto para
 * se adaptar sozinhos: o mesmo componente serve para 1920x1080 e 1080x1920.
 */
export const useFormato = () => {
  const { width, height } = useVideoConfig();
  const curto = height > width;
  return {
    curto,
    width,
    height,
    /** Margem segura em cima e embaixo (0 no longo). */
    margemVertical: curto ? MARGEM_VERTICAL_CURTO : 0,
  };
};
