/**
 * Regras automáticas do estilo Essenceanime (estilos/estilo-essenceanime.md) aplicadas às
 * imagens geradas do canal. Cada cena pode forçar ou desligar o efeito pelo campo dela no
 * cenas.json (`impacto`, `inclinado`, `citacao`); sem o campo, decide pela frase.
 */

const sem = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Ação física / explosão: flash branco + tremida + rajada de cortes no começo da cena.
// Palavras INTEIRAS (sem acento). Fora da lista de propósito: "sangue" (\"sangue real\"),
// "rasgada" (roupa), "ataque" (\"Titã de Ataque\"), "quebrar" (\"quebrar a regra\").
const IMPACTO = [
  "soco", "socou", "socando", "golpe", "golpeia", "golpeou", "explode", "explodiu", "explosao",
  "esmaga", "esmagou", "esmagando", "destroi", "destruiu", "rasga", "chute", "chuta", "chutou",
  "grita", "gritou", "berra", "berrou", "ruge", "rugiu", "rugido", "estoura", "estourou",
  "despedaca", "arrebenta", "arrebentou", "atinge", "atingiu", "dispara", "disparou",
  "transforma", "transformou", "relampago", "trovao", "impacto", "colide", "desaba", "desabou",
  "atacam", "atacou", "ataca", "matou", "pega fogo", "explodem", "quebra a seringa",
  "esmagar", "transformar", "atacar", "explodir", "destruir", "gritar", "rasgam", "esticam",
  "kokusen", "rasengan", "chidori", "kamehameha",
];

// Tensão / ameaça: quadro inclinado em perspectiva com borda preta.
const TENSAO = [
  "silencio", "medo", "sombra", "encara", "encarou", "arrepio", "tremendo", "treme", "tremer",
  "sussurra", "sussurrou", "segredo", "estranho", "algo errado", "ninguem sabe", "escuro",
  "observa", "observando", "ameaca", "pressao", "gelado", "suspeita", "traicao", "traiu",
  "mentira", "de repente", "suando", "cercado", "sem saida", "sequestram", "frio",
];

const tem = (frase: string, lista: string[]) => {
  const f = ` ${sem(frase).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ")} `;
  return lista.some((k) => f.includes(` ${k} `));
};

export const ehImpacto = (frase: string) => tem(frase, IMPACTO);
export const ehTensao = (frase: string) => tem(frase, TENSAO);
/** Impacto automático: no máximo 1 a cada `IMPACTO_GAP_S` s (referência: ~1 rajada/min). */
export const IMPACTO_GAP_S = 25;

/** Texto entre aspas na frase (fala de personagem), até 70 caracteres. */
export const acharCitacao = (frase: string): string | null => {
  const m = frase.match(/[“"]([^”"]{3,70})[”"]/);
  return m ? m[1].trim() : null;
};

/** Palavra-chave que vai em vermelho num bloco curto de texto (a mais longa, ≥ 6 letras). */
export const palavraChave = (palavras: string[]): number => {
  let melhor = -1;
  let tam = 5;
  palavras.forEach((p, i) => {
    const n = p.replace(/[^\p{L}\p{N}]/gu, "").length;
    if (n > tam) {
      tam = n;
      melhor = i;
    }
  });
  return melhor;
};

export const VERMELHO = "#FF1A1A";
export const FONTE = "'Montserrat', 'Arial Black', Arial, sans-serif";
