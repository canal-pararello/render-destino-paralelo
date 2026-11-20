import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONTE, VERMELHO } from "./regras";

/**
 * Impacto (substitui os clipes de luta da referência, que aqui são imagens paradas):
 * - quadros 0-1: flash branco;
 * - quadros 0-11: "rajada" de 4 cortes de 3 quadros (enquadramentos 100% / 145% / 125% / 160%
 *   da mesma imagem, cada um num ponto diferente), imitando as rajadas de 0,1 s da referência;
 * - até 0,5 s: tremida que vai diminuindo; depois zoom de soco (1,08 -> 1,16) até o fim.
 */
const RAJADA = [
  { s: 1.0, x: 0, y: 0 },
  { s: 1.45, x: -12, y: -6 },
  { s: 1.25, x: 10, y: 4 },
  { s: 1.6, x: 0, y: -10 },
];

export const ImagemImpacto: React.FC<{ imagem: string; duracaoSegundos: number; semente: number }> = ({
  imagem,
  duracaoSegundos,
  semente,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = Math.max(1, Math.round(duracaoSegundos * fps));
  const rajada = total > 24 ? RAJADA : RAJADA.slice(0, 2);
  const passo = Math.floor(frame / 3);
  const naRajada = passo < rajada.length;
  const r = naRajada ? rajada[passo] : null;

  const zoom = interpolate(frame, [rajada.length * 3, total], [1.08, 1.16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const forca = interpolate(frame, [0, fps * 0.5], [22, 0], { extrapolateRight: "clamp" });
  const tx = (random(`x${semente}-${frame}`) - 0.5) * 2 * forca;
  const ty = (random(`y${semente}-${frame}`) - 0.5) * 2 * forca;
  const flash = interpolate(frame, [0, 2, 4], [0.95, 0.6, 0], { extrapolateRight: "clamp" });

  const transform = r
    ? `translate(${r.x}%, ${r.y}%) scale(${r.s})`
    : `translate(${tx}px, ${ty}px) scale(${zoom})`;

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform, transformOrigin: "center" }}>
        <Img src={staticFile(imagem)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      {/* linhas de velocidade escuras nas bordas durante a tremida */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
          opacity: interpolate(frame, [0, fps * 0.6], [1, 0.35], { extrapolateRight: "clamp" }),
        }}
      />
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />
    </AbsoluteFill>
  );
};

/**
 * Quadro inclinado em perspectiva com borda preta (momentos de tensão na referência):
 * a imagem fica a 86% do tamanho, girada em 3D, e se aproxima devagar.
 */
export const QuadroInclinado: React.FC<{ imagem: string; duracaoSegundos: number; lado: 1 | -1 }> = ({
  imagem,
  duracaoSegundos,
  lado,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = Math.max(1, Math.round(duracaoSegundos * fps));
  const p = interpolate(frame, [0, total], [0, 1], { extrapolateRight: "clamp" });
  const escala = interpolate(p, [0, 1], [0.76, 0.82]);
  return (
    <AbsoluteFill style={{ backgroundColor: "black", perspective: 1400, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${escala}) rotateY(${lado * 10}deg) rotateZ(${lado * -2.5}deg)`,
          transformOrigin: "center",
          boxShadow: "0 0 80px rgba(0,0,0,0.9)",
        }}
      >
        <Img src={staticFile(imagem)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Fala de personagem entre aspas, branca sobre preto (\"Eu preciso me provar\"). */
export const TelaCitacao: React.FC<{ texto: string }> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const op = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 8], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: "black", justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity: op,
          transform: `translateY(${y}px)`,
          color: "white",
          fontFamily: FONTE,
          fontWeight: 800,
          fontSize: Math.round(width * 0.036),
          maxWidth: "70%",
          textAlign: "center",
          textWrap: "balance",
          lineHeight: 1.25,
        }}
      >
        “{texto}”
      </div>
    </AbsoluteFill>
  );
};

/** Palavra solta por cima da imagem (\"Décadas*\", hora em vermelho): campo `palavra` da cena. */
export const PalavraTela: React.FC<{ texto: string; vermelha?: boolean }> = ({ texto, vermelha }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          transform: `scale(${interpolate(s, [0, 1], [1.4, 1])})`,
          opacity: s,
          filter: `blur(${interpolate(s, [0, 1], [10, 0])}px)`,
          color: vermelha ? VERMELHO : "white",
          fontFamily: FONTE,
          fontWeight: 900,
          fontSize: Math.round(width * 0.075),
          textTransform: "uppercase",
          textShadow: vermelha
            ? `0 0 30px ${VERMELHO}, 0 6px 18px rgba(0,0,0,0.8)`
            : "0 6px 24px rgba(0,0,0,0.85)",
        }}
      >
        {texto}
      </div>
    </AbsoluteFill>
  );
};

/** Chamada \"INSCREVA-SE\" (botão + sino), ~2 s, uma vez por vídeo perto de 37%. */
export const CtaInscreva: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();
  const entra = spring({ frame, fps, config: { damping: 11, stiffness: 160 } });
  const clique = frame > fps * 0.8;
  const sai = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const t = Math.round(width * 0.03);
  const balanco = Math.sin(frame / 2.2) * interpolate(frame, [fps, fps * 1.6], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{ backgroundColor: `rgba(0,0,0,${0.72 * sai})`, justifyContent: "center", alignItems: "center", opacity: sai }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: t, transform: `scale(${entra})` }}>
        <div
          style={{
            background: clique ? "#3a3a3a" : "#E00000",
            color: "white",
            fontFamily: FONTE,
            fontWeight: 900,
            fontSize: t * 1.4,
            padding: `${t * 0.5}px ${t * 1.2}px`,
            borderRadius: t * 0.4,
            transform: `scale(${clique && frame < fps * 0.9 ? 0.92 : 1})`,
            boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
          }}
        >
          {clique ? "INSCRITO" : "INSCREVA-SE"}
        </div>
        <svg
          width={t * 2.2}
          height={t * 2.2}
          viewBox="0 0 24 24"
          style={{ transform: `rotate(${balanco}deg)`, transformOrigin: "50% 10%", opacity: clique ? 1 : 0.6 }}
        >
          <path
            fill="white"
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z"
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
