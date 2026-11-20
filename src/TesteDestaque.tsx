import { AbsoluteFill, Img, Sequence, staticFile, useVideoConfig } from "remotion";
import { Destaque } from "./Destaque";

export type TesteDestaqueProps = {
  /** Caminho dentro de motion/public. */
  imagem: string;
  /** Tamanho original da imagem, em pixels. */
  larguraImagem: number;
  alturaImagem: number;
  /** Ponto a destacar em pixels DA IMAGEM ORIGINAL (não da tela). */
  xImagem: number;
  yImagem: number;
  raio?: number;
  anguloSeta?: number;
  /** Cor das sobras ao lado da imagem (no mapa, a cor do mar). Padrão preto. */
  corFundo?: string;
};

// Imagem inteira na tela ("contain", sem cortar) e o destaque entrando 0,5 s depois.
// O ponto é convertido da imagem para a tela, então funciona em 1920x1080 e em 1080x1920.
export const TesteDestaque: React.FC<TesteDestaqueProps> = ({
  imagem,
  larguraImagem,
  alturaImagem,
  xImagem,
  yImagem,
  raio,
  anguloSeta,
  corFundo = "black",
}) => {
  const { width, height } = useVideoConfig();
  const escala = Math.min(width / larguraImagem, height / alturaImagem);
  const sobraX = (width - larguraImagem * escala) / 2;
  const sobraY = (height - alturaImagem * escala) / 2;
  const x = sobraX + xImagem * escala;
  const y = sobraY + yImagem * escala;

  return (
    <AbsoluteFill style={{ backgroundColor: corFundo }}>
      <Img src={staticFile(imagem)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      <Sequence from={15}>
        <Destaque x={x} y={y} raio={raio} anguloSeta={anguloSeta} />
      </Sequence>
    </AbsoluteFill>
  );
};
