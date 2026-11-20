import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useFormato } from "./layout";

export type DestaqueProps = {
  /** Centro do destaque, em pixels da tela (ex.: 0..1920 e 0..1080). */
  x: number;
  y: number;
  /** Raio do círculo em pixels. Padrão 70 no longo e 95 no curto. */
  raio?: number;
  /** De onde a seta vem, em graus: 0 = da direita, 90 = de baixo, 180 = da esquerda,
   *  270 = de cima. Padrão 315 (de cima à direita). */
  anguloSeta?: number;
  /** Comprimento da seta em pixels. Padrão 220 no longo e 280 no curto. No curto ela é
   *  encurtada se for passar da margem segura (150 px de cima/baixo, 40 px dos lados). */
  comprimentoSeta?: number;
  cor?: string;
  /** Segundos para o círculo se formar. Padrão 0,8. */
  duracaoCirculo?: number;
};

/**
 * Por cima de uma imagem: um círculo vermelho se desenhando em volta de (x, y), como
 * caneta (começa no alto, um pouco inclinado, e passa um pouco do ponto de partida), e
 * uma seta que entra deslizando na direção do ponto e para na borda do círculo.
 * Fundo transparente.
 */
export const Destaque: React.FC<DestaqueProps> = ({
  x,
  y,
  raio: raioProp,
  anguloSeta = 315,
  comprimentoSeta: comprimentoProp,
  cor = "#ff2a2a",
  duracaoCirculo = 0.8,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { curto, margemVertical } = useFormato();
  const raio = raioProp ?? (curto ? 95 : 70);
  const comprimentoDesejado = comprimentoProp ?? (curto ? 280 : 220);

  // Círculo: desenha o traço de 0 a 108% da volta (passa um pouco, como feito à mão).
  const progressoCirculo = interpolate(frame, [0, duracaoCirculo * fps], [0, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const circunferencia = 2 * Math.PI * raio;
  const espessura = Math.max(6, raio * 0.11);

  // Seta: começa 0,3 s depois do círculo, entra de fora em 0,6 s.
  const inicioSeta = 0.3 * fps;
  const entradaSeta = interpolate(frame, [inicioSeta, inicioSeta + 0.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.4)), // passa um tiquinho e volta: "chega" no ponto
  });
  const opacidadeSeta = interpolate(frame, [inicioSeta, inicioSeta + 0.15 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rad = (anguloSeta * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const folga = raio + espessura * 2.2; // a ponta para um pouco antes do círculo
  // Posição final da ponta e do começo da seta.
  const pontaFinalX = x + dx * folga;
  const pontaFinalY = y + dy * folga;
  // No longo a seta entra de fora da tela. No curto ela entra de perto (recuo curto) e
  // o comprimento é limitado para a cauda nunca passar da margem segura, nem no começo.
  const recuoInicial = curto ? 120 : Math.max(width, height) * 0.35;
  let comprimentoSeta = comprimentoDesejado;
  if (curto) {
    const limites = [
      dx > 0 ? (width - 40 - pontaFinalX) / dx : dx < 0 ? (40 - pontaFinalX) / dx : Infinity,
      dy > 0 ? (height - margemVertical - pontaFinalY) / dy
        : dy < 0 ? (margemVertical - pontaFinalY) / dy : Infinity,
    ];
    const cabe = Math.min(...limites) - recuoInicial;
    comprimentoSeta = Math.max(60, Math.min(comprimentoDesejado, cabe));
  }
  // Entrando: tudo deslocado na direção de onde vem, até a posição final.
  const recuo = interpolate(entradaSeta, [0, 1], [recuoInicial, 0]);
  const pontaX = pontaFinalX + dx * recuo;
  const pontaY = pontaFinalY + dy * recuo;
  const caudaX = pontaX + dx * comprimentoSeta;
  const caudaY = pontaY + dy * comprimentoSeta;

  // Cabeça da seta (triângulo apontando para o ponto).
  const cabeca = espessura * 3.2;
  const angPonta = Math.atan2(-dy, -dx); // direção em que a seta aponta
  const asa = (lado: 1 | -1) => {
    const a = angPonta + Math.PI + lado * 0.5;
    return `${pontaX + Math.cos(a) * cabeca},${pontaY + Math.sin(a) * cabeca}`;
  };
  // O corpo termina na base da cabeça, para a ponta ficar fina.
  const baseX = pontaX + dx * cabeca * 0.8;
  const baseY = pontaY + dy * cabeca * 0.8;

  const sombra = "drop-shadow(0 3px 6px rgba(0,0,0,0.45))";

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {/* Círculo: começa no alto (-90°) e um pouco inclinado */}
        <circle
          cx={x}
          cy={y}
          r={raio}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={`${circunferencia * progressoCirculo} ${circunferencia * 2}`}
          transform={`rotate(-105 ${x} ${y})`}
          style={{ filter: sombra }}
        />
        {/* Seta */}
        <g opacity={opacidadeSeta} style={{ filter: sombra }}>
          <line
            x1={caudaX}
            y1={caudaY}
            x2={baseX}
            y2={baseY}
            stroke={cor}
            strokeWidth={espessura}
            strokeLinecap="round"
          />
          <polygon points={`${pontaX},${pontaY} ${asa(1)} ${asa(-1)}`} fill={cor} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
