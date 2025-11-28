/**
 * Utilidades para generar cartones de Bingo personalizados
 */

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];
const NUMBERS_PER_COLUMN = 15;

/**
 * Obtiene los números de una columna específica
 */
const getNumbersForColumn = (columnIndex: number, min: number, max: number): number[] => {
  const numbers: number[] = [];
  const start = min + columnIndex * NUMBERS_PER_COLUMN;
  const end = Math.min(start + NUMBERS_PER_COLUMN - 1, max);

  for (let i = start; i <= end; i++) {
    numbers.push(i);
  }

  return numbers;
};

/**
 * Genera un cartón de Bingo personalizado para un jugador
 * Cada columna tiene números aleatorios de su rango correspondiente
 * 
 * @param minNumber Número mínimo (por defecto 1)
 * @param maxNumber Número máximo (por defecto 75)
 * @param numbersPerColumn Números por columna (por defecto 5 para un cartón 5x5)
 * @returns Matriz 5x5 con números del cartón
 */
// Valor especial para representar la casilla FREE
export const FREE_SQUARE = -1;

export const generatePlayerCard = (
  minNumber: number = 1,
  maxNumber: number = 75,
  numbersPerColumn: number = 5
): number[][] => {
  const card: number[][] = [];
  const FREE_COLUMN = 2; // Columna N (índice 2)
  const FREE_ROW = 2; // Fila central (índice 2)

  for (let col = 0; col < 5; col++) {
    const columnNumbers = getNumbersForColumn(col, minNumber, maxNumber);
    const selectedNumbers: number[] = [];
    const usedIndices = new Set<number>();

    // Si es la columna central (N), necesitamos 4 números + FREE
    const numbersNeeded = (col === FREE_COLUMN) ? numbersPerColumn - 1 : numbersPerColumn;

    // Seleccionar números aleatorios de esta columna
    while (selectedNumbers.length < numbersNeeded && usedIndices.size < columnNumbers.length) {
      const randomIndex = Math.floor(Math.random() * columnNumbers.length);
      
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedNumbers.push(columnNumbers[randomIndex]);
      }
    }

    // Ordenar los números de la columna
    selectedNumbers.sort((a, b) => a - b);

    // Si es la columna central, insertar FREE en la posición central
    if (col === FREE_COLUMN) {
      selectedNumbers.splice(FREE_ROW, 0, FREE_SQUARE);
    }

    card.push(selectedNumbers);
  }

  return card;
};

/**
 * Genera un cartón completo (todos los números de cada columna)
 * Útil para mostrar el tablero completo
 */
export const generateFullCard = (
  minNumber: number = 1,
  maxNumber: number = 75
): number[][] => {
  const card: number[][] = [];

  for (let col = 0; col < 5; col++) {
    const columnNumbers = getNumbersForColumn(col, minNumber, maxNumber);
    card.push([...columnNumbers]);
  }

  return card;
};

/**
 * Convierte un cartón (matriz) a un Set de números
 */
export const cardToNumberSet = (card: number[][]): Set<number> => {
  const numberSet = new Set<number>();
  
  card.forEach((column) => {
    column.forEach((num) => {
      if (num > 0) {
        numberSet.add(num);
      }
    });
  });

  return numberSet;
};

/**
 * Verifica si un número está en el cartón del jugador
 */
export const isNumberInCard = (card: number[][], number: number): boolean => {
  if (number === FREE_SQUARE) return false; // FREE no es un número válido para buscar
  return card.some((column) => column.includes(number));
};

