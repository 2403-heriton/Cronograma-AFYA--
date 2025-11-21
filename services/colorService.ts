/**
 * Gera uma cor HSL consistente com base em uma string de entrada (ex: nome da disciplina).
 * Isso garante que cada disciplina sempre tenha a mesma cor.
 * @param str A string de entrada.
 * @returns Uma string de cor HSL (ex: 'hsl(120, 75%, 60%)').
 */
export const stringToColor = (str: string): string => {
  if (!str) {
    return 'hsl(0, 0%, 70%)'; // Cor cinza padrão para strings vazias
  }

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360; // Gera um matiz de 0 a 359
  const saturation = 60; // Saturação mais suave para tons pastel
  const lightness = 75;  // Luminosidade maior para cores mais claras

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};