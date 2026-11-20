import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useFormato } from "./layout";

export type ContadorProps = {
  /** Número final. */
  valor: number;
  /** Palavra que vem depois do número (ex.: "segundos", "quilômetros"). */
  sufixo?: string;
  /** Duração da cena em segundos: o contador some no fim dela. */
  duracaoSegundos: number;
};

const formatar = (n: number) => Math.round(n).toLocaleString("pt-BR");

/**
 * Número grande que conta de 0 até `valor` (rápido no começo, devagar no fim), dá um
 * pulinho quando chega e fica até o fim da cena. Fica no terço de cima da tela, para não
 * bater na legenda (embaixo) nem no título (centro). Fundo transparente.
 */
export const Contador: React.FC<ContadorProps> = ({ valor, sufixo, duracaoSegundos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, curto, margemVertical } = useFormato();

  const total = Math.max(1, Math.round(duracaoSegundos * fps));
  const contagemFrames = Math.min(Math.round(1.2 * fps), Math.round(total * 0.6));
  const atual = interpolate(frame, [0, contagemFrames], [0, valor], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const pulo = spring({ frame: frame - contagemFrames, fps, config: { damping: 9, stiffness: 180 } });
  const escala = 1 + 0.12 * Math.sin(Math.min(pulo, 1) * Math.PI);
  const opacidade = interpolate(frame, [0, 6, total - 9, total], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tamanho = Math.round(width * (curto ? 0.26 : 0.12));
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: curto ? margemVertical + 120 : "9%",
        opacity: opacidade,
      }}
    >
      <div
        style={{
          fontFamily: "'Montserrat', 'Arial Black', Arial, sans-serif",
          fontWeight: 900,
          color: "#FFE600",
          fontSize: tamanho,
          lineHeight: 1,
          transform: `scale(${escala})`,
          WebkitTextStroke: `${Math.round(tamanho * 0.08)}px black`,
          paintOrder: "stroke fill",
          textShadow: "0 8px 24px rgba(0,0,0,0.5)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatar(atual)}
      </div>
      {sufixo ? (
        <div
          style={{
            marginTop: tamanho * 0.08,
            fontFamily: "'Montserrat', 'Arial Black', Arial, sans-serif",
            fontWeight: 800,
            color: "white",
            fontSize: Math.round(tamanho * 0.32),
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            WebkitTextStroke: `${Math.round(tamanho * 0.035)}px black`,
            paintOrder: "stroke fill",
            textShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          {sufixo}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ detecção na frase

const UNIDADES: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, "três": 3, tres: 3, quatro: 4, cinco: 5, seis: 6,
  sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14,
  catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70,
  oitenta: 80, noventa: 90, cem: 100, cento: 100, duzentos: 200, duzentas: 200,
  trezentos: 300, trezentas: 300, quatrocentos: 400, quatrocentas: 400,
  quinhentos: 500, quinhentas: 500, seiscentos: 600, seiscentas: 600,
  setecentos: 700, setecentas: 700, oitocentos: 800, oitocentas: 800,
  novecentos: 900, novecentas: 900,
};
const MULTIPLICADORES: Record<string, number> = {
  mil: 1e3, "milhão": 1e6, milhao: 1e6, "milhões": 1e6, milhoes: 1e6,
  "bilhão": 1e9, bilhao: 1e9, "bilhões": 1e9, bilhoes: 1e9,
};
const IGNORAR_SUFIXO = new Set(["de", "da", "do", "e", "a", "o", "os", "as"]);

/** Número "grande" (>= `minimo`) citado na frase, com a palavra seguinte como sufixo.
 *  Aceita algarismos ("2.000", "2 mil") e por extenso ("quarenta", "dois mil").
 *  Ignora anos ("em 1961"). Devolve null se não houver. */
export const acharNumero = (frase: string, minimo = 10): { valor: number; sufixo?: string } | null => {
  const palavras = frase
    .toLowerCase()
    .split(/\s+/)
    .map((p) => p.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}.,]+$/gu, "").replace(/[.,]+$/, ""));

  for (let i = 0; i < palavras.length; i++) {
    let valor = 0;
    let parcial = 0;
    let j = i;
    let achou = false;
    let ehAno = false;
    while (j < palavras.length) {
      const w = palavras[j];
      if (/^\d{1,3}(\.\d{3})+$|^\d+$/.test(w)) {
        const n = Number(w.replace(/\./g, ""));
        if (n >= 1000 && n <= 2100 && !w.includes(".") && ["em", "de", "desde", "até"].includes(palavras[i - 1] ?? "")) {
          ehAno = true;
        }
        parcial += n;
        achou = true;
      } else if (w in UNIDADES) {
        parcial += UNIDADES[w];
        achou = true;
      } else if (w in MULTIPLICADORES && achou) {
        valor += (parcial || 1) * MULTIPLICADORES[w];
        parcial = 0;
      } else if (w === "e" && achou && j + 1 < palavras.length &&
                 (palavras[j + 1] in UNIDADES || /^\d+$/.test(palavras[j + 1]))) {
        // "trinta e dois", "mil e quinhentos"
      } else {
        break;
      }
      j++;
    }
    valor += parcial;
    if (achou && !ehAno && valor >= minimo) {
      let k = j;
      while (k < palavras.length && IGNORAR_SUFIXO.has(palavras[k])) k++;
      const sufixo = palavras[k] && /\p{L}/u.test(palavras[k]) ? palavras[k] : undefined;
      return { valor, sufixo };
    }
    if (achou) i = j - 1;
  }
  return null;
};
