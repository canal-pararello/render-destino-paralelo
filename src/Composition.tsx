import { AbsoluteFill } from "remotion";
import { useFormato } from "./layout";

export type TextoCentralProps = {
  texto: string;
};

// Fundo preto com o texto branco no centro. O tamanho da letra acompanha a largura
// da tela; no curto (em pé) a letra é proporcionalmente maior e pode quebrar linha.
export const TextoCentral: React.FC<TextoCentralProps> = ({ texto }) => {
  const { width, curto, margemVertical } = useFormato();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "black",
        justifyContent: "center",
        alignItems: "center",
        padding: `${margemVertical}px ${Math.round(width * 0.06)}px`,
      }}
    >
      <div
        style={{
          color: "white",
          fontFamily: "'Montserrat', 'Arial Black', Arial, sans-serif",
          fontWeight: 800,
          fontSize: Math.round(width * (curto ? 0.13 : 0.09)),
          lineHeight: 1.1,
          textAlign: "center",
        }}
      >
        {texto}
      </div>
    </AbsoluteFill>
  );
};
