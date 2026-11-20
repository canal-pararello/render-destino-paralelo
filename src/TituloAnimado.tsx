import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useFormato } from "./layout";

export type TituloAnimadoProps = {
  texto: string;
  /** Segundos da entrada (sobe e desfoca sumindo). Padrão 0,7. */
  entradaSegundos?: number;
  /** Segundos parado na tela. Padrão 2. */
  permanenciaSegundos?: number;
  /** Segundos do fade de saída. Padrão 0,6. */
  saidaSegundos?: number;
};

/** Duração total com os valores padrão (0,7 + 2 + 0,6 = 3,3 s). */
export const duracaoTitulo = (p: Partial<TituloAnimadoProps> = {}) =>
  (p.entradaSegundos ?? 0.7) + (p.permanenciaSegundos ?? 2) + (p.saidaSegundos ?? 0.6);

/**
 * Título centralizado que entra de baixo para cima com um desfoque que vai sumindo,
 * fica parado e sai com fade. Atrás dele, o fundo escurece um pouco (mais no centro).
 * Fundo transparente: vai por cima da imagem/vídeo da cena.
 */
export const TituloAnimado: React.FC<TituloAnimadoProps> = ({
  texto,
  entradaSegundos = 0.7,
  permanenciaSegundos = 2,
  saidaSegundos = 0.6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, curto, margemVertical } = useFormato();

  const fimEntrada = entradaSegundos * fps;
  const inicioSaida = fimEntrada + permanenciaSegundos * fps;
  const fimSaida = inicioSaida + saidaSegundos * fps;

  const suave = Easing.out(Easing.cubic);
  const entrada = interpolate(frame, [0, fimEntrada], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: suave,
  });
  const saida = interpolate(frame, [inicioSaida, fimSaida], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const opacidade = Math.min(entrada, saida);
  const subida = interpolate(entrada, [0, 1], [width * 0.04, 0]); // ~77 px em 1920
  const desfoque = interpolate(entrada, [0, 1], [14, 0]);

  return (
    <AbsoluteFill>
      {/* Fundo escurecendo: mais escuro no centro, atrás do texto */}
      <AbsoluteFill
        style={{
          opacity: opacidade,
          background: curto
            ? "radial-gradient(ellipse 95% 28% at 50% 50%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.25) 100%)"
            : "radial-gradient(ellipse 70% 45% at 50% 50%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.25) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: `${margemVertical}px 0`,
        }}
      >
        <div
          style={{
            opacity: opacidade,
            transform: `translateY(${subida}px)`,
            filter: `blur(${desfoque}px)`,
            color: "white",
            fontFamily: "'Montserrat', 'Arial Black', Arial, sans-serif",
            fontWeight: 900,
            // No curto a letra é bem maior e o título quebra em linhas.
            fontSize: Math.round(width * (curto ? 0.1 : 0.055)),
            letterSpacing: "0.02em",
            textAlign: "center",
            // Linhas de tamanho parecido ("CAPÍTULO 2: / A QUEDA", não "... A / QUEDA").
            textWrap: "balance",
            lineHeight: 1.1,
            padding: `0 ${Math.round(width * (curto ? 0.08 : 0.06))}px`,
            textShadow: "0 4px 18px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.35)",
          }}
        >
          {texto}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
