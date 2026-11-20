import { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useFormato } from "./layout";

/** Formato do palavras.json gerado pelo ferramentas/transcrever.py (Whisper). */
export type Palavra = { palavra: string; inicio: number; fim: number };

export type LegendaAnimadaProps = {
  /** Caminho do palavras.json dentro de motion/public. */
  arquivoPalavras: string;
  /** Máximo de palavras na tela de uma vez. Padrão 4. */
  maxPalavras?: number;
  /** Longo: distância da legenda até a borda de baixo, em % da altura. Padrão 9.
   *  No curto a legenda fica centralizada na tela (ignora este valor). */
  margemInferior?: number;
  /** Longo: tamanho da letra como fração da largura. Padrão 0,04 (77 px em 1920). */
  tamanhoEm?: number;
};

const FIM_FRASE = /[.!?…]["'”»)]*$/;
const VIRGULA = /[,;:—–]["'”»)]*$/;
const AMARELO = "#FFE600";

/**
 * Divide as palavras em blocos de até `max`, sem nunca juntar duas frases.
 * Dentro da frase escolhe os cortes com menor custo (programação dinâmica):
 * menos blocos, corte logo depois de vírgula, nada de palavra sozinha se der para evitar.
 * Mesma regra do ferramentas/gerar_legenda.py.
 */
export const dividirEmBlocos = (palavras: Palavra[], max: number): number[][] => {
  const frases: number[][] = [];
  let atual: number[] = [];
  palavras.forEach((p, i) => {
    atual.push(i);
    if (FIM_FRASE.test(p.palavra)) {
      frases.push(atual);
      atual = [];
    }
  });
  if (atual.length) frases.push(atual);

  const blocos: number[][] = [];
  for (const f of frases) {
    const n = f.length;
    const melhor = [0, ...Array(n).fill(Infinity)];
    const corte = Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) {
      for (let t = 1; t <= Math.min(max, i); t++) {
        const j = i - t;
        let custo = melhor[j] + 10;
        if (t === 1 && max > 1 && n > 1) custo += 4;
        if (i < n && VIRGULA.test(palavras[f[i - 1]].palavra)) custo -= 6;
        if (custo < melhor[i]) {
          melhor[i] = custo;
          corte[i] = j;
        }
      }
    }
    const grupos: number[][] = [];
    for (let i = n; i > 0; i = corte[i]) grupos.unshift(f.slice(corte[i], i));
    blocos.push(...grupos);
  }
  return blocos;
};

/** Tira . , ; : do fim para exibir (mantém ? e !). */
const limpar = (p: string) => p.replace(/[.,;:]+(["'”»)]*)$/, "$1");

/**
 * Legenda na parte de baixo da tela, até 4 palavras por vez, fonte grossa branca com
 * contorno preto. A palavra falada no momento fica amarela e 10% maior, no tempo exato
 * do palavras.json. Fundo transparente: vai por cima da cena.
 */
export const LegendaAnimada: React.FC<LegendaAnimadaProps> = ({
  arquivoPalavras,
  maxPalavras = 4,
  margemInferior = 9,
  tamanhoEm = 0.04,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, curto, margemVertical } = useFormato();
  const [palavras, setPalavras] = useState<Palavra[] | null>(null);
  const [handle] = useState(() => delayRender(`Lendo ${arquivoPalavras}`));

  useEffect(() => {
    fetch(staticFile(arquivoPalavras))
      .then((r) => {
        if (!r.ok) throw new Error(`Não achei ${arquivoPalavras} (HTTP ${r.status})`);
        return r.json();
      })
      .then((dados: Palavra[]) => {
        setPalavras(dados);
        continueRender(handle);
      })
      .catch((erro) => cancelRender(erro));
  }, [arquivoPalavras, handle]);

  // Curto: no máximo 2 palavras por vez (letra grande, leitura rápida no celular).
  const max = curto ? Math.min(2, maxPalavras) : maxPalavras;
  const blocos = useMemo(
    () => (palavras ? dividirEmBlocos(palavras, max) : []),
    [palavras, max],
  );

  if (!palavras) return null;
  const t = frame / fps;

  // Bloco atual: do início da 1ª palavra até o próximo bloco (pausa curta) ou 0,3 s depois.
  let atual: number[] | null = null;
  for (let b = 0; b < blocos.length; b++) {
    const g = blocos[b];
    const ultima = palavras[g[g.length - 1]];
    const proximo = blocos[b + 1] ? palavras[blocos[b + 1][0]].inicio : Infinity;
    const fim = proximo - ultima.fim < 0.4 ? proximo : Math.min(ultima.fim + 0.3, proximo);
    if (t >= palavras[g[0]].inicio && t < fim) {
      atual = g;
      break;
    }
  }
  if (!atual) return null;

  // Palavra falada: de seu início até o início da seguinte do bloco.
  let falada = atual[0];
  for (const i of atual) if (t >= palavras[i].inicio) falada = i;

  // Curto: área segura do app em 1080x1920. Embaixo (y > 1500) ficam perfil, descrição e
  // música; à direita (x > 900) ficam curtir/comentar/compartilhar. A legenda fica em
  // x 60..900 (centro 480) e centrada em y ~880, como no gerar_legenda.py.
  const AREA_CURTO = { esq: 60, dir: 180, cima: 260, baixo: 420 };
  const larguraUtil = width - AREA_CURTO.esq - AREA_CURTO.dir; // 840 px em 1080

  // longo: tamanhoEm da largura; curto: 130 px em 1080, reduzido se uma palavra longa
  // ("consequências") não couber na largura útil (Montserrat Black ~0,75 em por letra).
  let tamanho = Math.round(width * (curto ? 0.12 : tamanhoEm));
  if (curto) {
    const maiorPalavra = Math.max(...atual.map((i) => limpar(palavras[i].palavra).length));
    // Medido no render: Montserrat Black ~0,62 em por letra minúscula (+10% da palavra ativa).
    const limite = Math.floor(larguraUtil / (maiorPalavra * 0.62 * 1.1 + 0.6));
    tamanho = Math.max(60, Math.min(tamanho, limite));
  }
  const contorno = Math.max(4, Math.round(tamanho * 0.1));

  return (
    <AbsoluteFill
      style={
        curto
          ? {
              justifyContent: "center",
              alignItems: "center",
              padding: `${Math.max(margemVertical, AREA_CURTO.cima)}px ${AREA_CURTO.dir}px ${AREA_CURTO.baixo}px ${AREA_CURTO.esq}px`,
            }
          : {
              justifyContent: "flex-end",
              alignItems: "center",
              paddingBottom: `${margemInferior}%`,
            }
      }
    >
      <div
        style={{
          // Texto corrido (não flex) para o navegador equilibrar as linhas quando a
          // legenda quebra no curto: "Um caderno / preto cai", e não "... preto / cai".
          textAlign: "center",
          textWrap: "balance",
          maxWidth: curto ? "100%" : "85%",
          fontFamily: "'Montserrat', 'Arial Black', Arial, sans-serif",
          fontWeight: 900,
          fontSize: tamanho,
          lineHeight: 1.2,
        }}
      >
        {atual.map((i) => {
          const ativa = i === falada;
          // A palavra ativa cresce 10% para os lados: soma esse crescimento ao espaço,
          // senão palavras longas encostam na vizinha ("Milconsequências").
          const texto = limpar(palavras[i].palavra);
          const folga = ativa ? Math.round(texto.length * 0.62 * tamanho * 0.05) : 0;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                // Espaço largo: o contorno (metade por fora da letra) e a palavra ampliada
                // em 10% comem parte do vão; com 0,28 em as palavras quase encostavam.
                margin: `0 ${Math.round(tamanho * 0.25) + folga}px`,
                color: ativa ? AMARELO : "white",
                transform: `scale(${ativa ? 1.1 : 1})`,
                transformOrigin: "center 60%",
                // Contorno preto por fora da letra (o traço fica atrás do preenchimento).
                WebkitTextStroke: `${contorno * 2}px black`,
                paintOrder: "stroke fill",
                textShadow: "0 4px 10px rgba(0,0,0,0.45)",
              }}
            >
              {texto}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
