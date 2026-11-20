import { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { dividirEmBlocos, Palavra } from "../LegendaAnimada";
import { FONTE, palavraChave, VERMELHO } from "./regras";

const limpar = (p: string) => p.replace(/[.,;:!?…"“”]+$/g, "").replace(/^["“]/, "");

/** Lê o palavras.json uma vez (com delayRender). */
export const usePalavras = (arquivo: string): Palavra[] | null => {
  const [palavras, setPalavras] = useState<Palavra[] | null>(null);
  const [handle] = useState(() => delayRender(`Lendo ${arquivo}`));
  useEffect(() => {
    fetch(staticFile(arquivo))
      .then((r) => {
        if (!r.ok) throw new Error(`Não achei ${arquivo}`);
        return r.json();
      })
      .then((d: Palavra[]) => {
        setPalavras(d);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [arquivo, handle]);
  return palavras;
};

/**
 * Abertura com texto cinético (0 a `ate` s): fundo quase preto, 1-2 palavras por vez em
 * caixa alta, grandes, no centro; a palavra-chave em vermelho com brilho. Cada bloco entra
 * com desfoque de movimento (escala 1,35 -> 1 e blur 14 -> 0 em 4 quadros).
 */
export const AberturaCinetica: React.FC<{ palavras: Palavra[]; ate: number }> = ({ palavras, ate }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  const lista = useMemo(() => palavras.filter((p) => p.inicio < ate), [palavras, ate]);
  const blocos = useMemo(() => dividirEmBlocos(lista, 2), [lista]);
  if (t >= ate) return null;

  let atual: number[] | null = null;
  for (let b = 0; b < blocos.length; b++) {
    const ini = lista[blocos[b][0]].inicio;
    const fim = blocos[b + 1] ? lista[blocos[b + 1][0]].inicio : ate;
    if (t >= ini - 0.05 && t < fim) atual = blocos[b];
  }
  const inicioBloco = atual ? lista[atual[0]].inicio : 0;
  const q = Math.max(0, frame - Math.round(inicioBloco * fps));
  const escala = interpolate(q, [0, 4], [1.35, 1], { extrapolateRight: "clamp" });
  const blur = interpolate(q, [0, 4], [14, 0], { extrapolateRight: "clamp" });
  const textos = atual ? atual.map((i) => limpar(lista[i].palavra)) : [];
  const chave = palavraChave(textos);
  const fundo = interpolate(t, [ate - 0.25, ate], [0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${fundo})`, justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          transform: `scale(${escala})`,
          filter: `blur(${blur}px)`,
          fontFamily: FONTE,
          fontWeight: 900,
          fontSize: Math.round(width * 0.07),
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          textAlign: "center",
          maxWidth: "85%",
        }}
      >
        {textos.map((w, i) => (
          <span
            key={i}
            style={{
              margin: `0 ${Math.round(width * 0.012)}px`,
              color: i === chave ? VERMELHO : "white",
              textShadow: i === chave ? `0 0 28px ${VERMELHO}, 0 0 8px ${VERMELHO}` : "0 4px 20px rgba(0,0,0,0.8)",
            }}
          >
            {w}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Legenda só no gancho (de `de` até `ate` s): 1-3 palavras, branca, fonte grossa, sombra
 * suave, sem caixa, sem contorno e sem destacar a palavra falada; troca seca.
 */
export const LegendaGancho: React.FC<{ palavras: Palavra[]; de: number; ate: number }> = ({ palavras, de, ate }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  const lista = useMemo(() => palavras.filter((p) => p.inicio >= de && p.inicio < ate), [palavras, de, ate]);
  const blocos = useMemo(() => dividirEmBlocos(lista, 3), [lista]);
  if (t < de || t >= ate) return null;

  let atual: number[] | null = null;
  for (let b = 0; b < blocos.length; b++) {
    const g = blocos[b];
    const ultima = lista[g[g.length - 1]];
    const prox = blocos[b + 1] ? lista[blocos[b + 1][0]].inicio : ate;
    const fim = prox - ultima.fim < 0.4 ? prox : Math.min(ultima.fim + 0.3, prox);
    if (t >= lista[g[0]].inicio && t < fim) atual = g;
  }
  if (!atual) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: "5.5%" }}>
      <div
        style={{
          fontFamily: FONTE,
          fontWeight: 800,
          fontSize: Math.round(width * 0.024),
          color: "white",
          textShadow: "0 2px 6px rgba(0,0,0,0.9), 0 0 18px rgba(0,0,0,0.6)",
          textAlign: "center",
        }}
      >
        {atual.map((i) => limpar(lista[i].palavra)).join(" ")}
      </div>
    </AbsoluteFill>
  );
};
