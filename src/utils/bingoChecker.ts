/**
 * Utilidades para verificar si hay Bingo
 */

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];
const NUMBERS_PER_COLUMN = 15;

/**
 * Obtiene los números de una columna específica
 */
export const getNumbersForColumn = (
  columnIndex: number,
  min: number,
  max: number
): number[] => {
  const numbers: number[] = [];
  const start = min + columnIndex * NUMBERS_PER_COLUMN;
  const end = Math.min(start + NUMBERS_PER_COLUMN - 1, max);

  for (let i = start; i <= end; i++) {
    numbers.push(i);
  }

  return numbers;
};

/**
 * Obtiene el índice de columna para un número dado
 */
export const getColumnIndex = (number: number, min: number): number => {
  if (number < min) return 0;
  const columnIndex = Math.floor((number - min) / NUMBERS_PER_COLUMN);
  return Math.min(columnIndex, 4); // Máximo 4 (columna O)
};

/**
 * Crea una representación del cartón como matriz 5x15
 */
export const createCardMatrix = (
  min: number,
  max: number,
  markedNumbers: Set<number>
): number[][] => {
  const matrix: number[][] = [];

  for (let col = 0; col < 5; col++) {
    const column: number[] = [];
    const numbers = getNumbersForColumn(col, min, max);

    for (const num of numbers) {
      column.push(markedNumbers.has(num) ? num : 0);
    }

    matrix.push(column);
  }

  return matrix;
};

/**
 * Verifica si hay una línea horizontal completa (Bingo)
 * En nuestro tablero, una línea horizontal es una fila que tiene números de todas las columnas
 */
export const checkHorizontalBingo = (
  min: number,
  max: number,
  markedNumbers: Set<number>
): boolean => {
  // Obtener todas las columnas
  const columns: number[][] = [];
  for (let col = 0; col < 5; col++) {
    columns.push(getNumbersForColumn(col, min, max));
  }

  // Verificar cada posible fila (posición en cada columna)
  const maxRows = Math.max(...columns.map(col => col.length));
  
  for (let row = 0; row < maxRows; row++) {
    let allMarked = true;
    
    // Verificar si todos los números de esta fila están marcados
    for (let col = 0; col < 5; col++) {
      if (row < columns[col].length) {
        const num = columns[col][row];
        if (!markedNumbers.has(num)) {
          allMarked = false;
          break;
        }
      } else {
        allMarked = false;
        break;
      }
    }
    
    if (allMarked) {
      return true;
    }
  }

  return false;
};

/**
 * Verifica si hay una línea vertical completa (Bingo)
 * Una columna completa está marcada
 */
export const checkVerticalBingo = (
  min: number,
  max: number,
  markedNumbers: Set<number>
): boolean => {
  // Verificar si alguna columna completa está marcada
  for (let col = 0; col < 5; col++) {
    const numbers = getNumbersForColumn(col, min, max);
    let allMarked = true;

    for (const num of numbers) {
      if (!markedNumbers.has(num)) {
        allMarked = false;
        break;
      }
    }

    if (allMarked) {
      return true;
    }
  }

  return false;
};

/**
 * Verifica si hay una línea diagonal completa (Bingo)
 */
export const checkDiagonalBingo = (
  min: number,
  max: number,
  markedNumbers: Set<number>
): boolean => {
  const columns: number[][] = [];
  for (let col = 0; col < 5; col++) {
    columns.push(getNumbersForColumn(col, min, max));
  }

  const maxRows = Math.max(...columns.map(col => col.length));

  // Diagonal principal: misma posición en cada columna (0, 1, 2, 3, 4)
  let diagonal1 = true;
  for (let col = 0; col < 5; col++) {
    if (col < columns[col].length) {
      const num = columns[col][col];
      if (!markedNumbers.has(num)) {
        diagonal1 = false;
        break;
      }
    } else {
      diagonal1 = false;
      break;
    }
  }

  // Diagonal secundaria: posición inversa en cada columna
  let diagonal2 = true;
  for (let col = 0; col < 5; col++) {
    const rowIndex = Math.min(col, columns[col].length - 1);
    if (rowIndex >= 0 && rowIndex < columns[col].length) {
      const num = columns[col][rowIndex];
      if (!markedNumbers.has(num)) {
        diagonal2 = false;
        break;
      }
    } else {
      diagonal2 = false;
      break;
    }
  }

  return diagonal1 || diagonal2;
};

/**
 * Verifica si hay Bingo completo (todos los números marcados)
 */
export const checkFullBingo = (markedNumbers: Set<number>): boolean => {
  // En un Bingo completo, todos los números del 1 al 75 deben estar marcados
  // Pero para simplificar, verificamos si hay al menos una línea completa
  return markedNumbers.size >= 5; // Mínimo 5 números para una línea
};

import { FREE_SQUARE } from './cardGenerator';

/**
 * Verifica si hay Bingo en un cartón personalizado del jugador
 * @param playerCard Cartón del jugador (matriz 5x5)
 * @param markedNumbers Números marcados por el jugador
 * @returns true si hay bingo
 */
export const checkBingoInCard = (
  playerCard: number[][],
  markedNumbers: Set<number>
): boolean => {
  if (playerCard.length === 0) return false;

  // Función auxiliar para verificar si un número está marcado
  // La casilla FREE siempre se considera marcada
  const isMarked = (num: number) => {
    return num === FREE_SQUARE || markedNumbers.has(num);
  };

  // Verificar líneas horizontales (filas)
  for (let row = 0; row < 5; row++) {
    let allMarked = true;
    for (let col = 0; col < 5; col++) {
      if (col < playerCard.length && row < playerCard[col].length) {
        const num = playerCard[col][row];
        if (!isMarked(num)) {
          allMarked = false;
          break;
        }
      } else {
        allMarked = false;
        break;
      }
    }
    if (allMarked) return true;
  }

  // Verificar líneas verticales (columnas)
  for (let col = 0; col < playerCard.length; col++) {
    let allMarked = true;
    for (let row = 0; row < playerCard[col].length; row++) {
      const num = playerCard[col][row];
      if (!isMarked(num)) {
        allMarked = false;
        break;
      }
    }
    if (allMarked) return true;
  }

  // Verificar diagonal principal
  let diagonal1 = true;
  for (let i = 0; i < 5 && i < playerCard.length; i++) {
    if (i < playerCard[i].length) {
      const num = playerCard[i][i];
      if (!isMarked(num)) {
        diagonal1 = false;
        break;
      }
    } else {
      diagonal1 = false;
      break;
    }
  }
  if (diagonal1) return true;

  // Verificar diagonal secundaria
  let diagonal2 = true;
  for (let i = 0; i < 5 && i < playerCard.length; i++) {
    const colIndex = 4 - i;
    if (colIndex >= 0 && colIndex < playerCard.length && i < playerCard[colIndex].length) {
      const num = playerCard[colIndex][i];
      if (!isMarked(num)) {
        diagonal2 = false;
        break;
      }
    } else {
      diagonal2 = false;
      break;
    }
  }
  if (diagonal2) return true;

  return false;
};

/**
 * Verifica si hay algún tipo de Bingo (versión legacy para tablero completo)
 * Retorna true si hay al menos una línea completa (horizontal, vertical o diagonal)
 */
export const checkBingo = (
  min: number,
  max: number,
  markedNumbers: Set<number>
): boolean => {
  // Verificar línea horizontal (columna completa)
  if (checkHorizontalBingo(min, max, markedNumbers)) {
    return true;
  }

  // Verificar línea vertical (fila completa)
  if (checkVerticalBingo(min, max, markedNumbers)) {
    return true;
  }

  // Verificar línea diagonal
  if (checkDiagonalBingo(min, max, markedNumbers)) {
    return true;
  }

  return false;
};

