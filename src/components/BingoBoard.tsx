import { useEffect, useRef } from 'react';
import React from 'react';
import { Socket } from 'socket.io-client';
import { useBingoStore } from '../store/bingoStore';
import { generatePlayerCard, FREE_SQUARE, isNumberInCard } from '../utils/cardGenerator';
import { checkBingoInCard } from '../utils/bingoChecker';

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

// Tipo para las celdas ganadoras
export interface WinningCells {
  type: 'row' | 'column' | 'diagonal';
  index?: number; // Para fila o columna específica
  cells: Array<{ col: number; row: number }>; // Coordenadas de las celdas ganadoras
  numbers: number[]; // Números que forman la línea ganadora
}

// Función para obtener las celdas y números ganadores
export const getWinningCells = (card: number[][], marked: Set<number>): WinningCells | null => {
  const isMarked = (num: number) => num === FREE_SQUARE || marked.has(num);

  // Verificar filas
  for (let row = 0; row < 5; row++) {
    let allMarked = true;
    const cells: Array<{ col: number; row: number }> = [];
    const numbers: number[] = [];
    
    for (let col = 0; col < 5; col++) {
      if (col < card.length && row < card[col].length) {
        const num = card[col][row];
        cells.push({ col, row });
        if (num !== FREE_SQUARE) {
          numbers.push(num);
        }
        if (!isMarked(num)) {
          allMarked = false;
          break;
        }
      } else {
        allMarked = false;
        break;
      }
    }
    if (allMarked) {
      return { type: 'row', index: row, cells, numbers };
    }
  }

  // Verificar columnas
  for (let col = 0; col < card.length; col++) {
    let allMarked = true;
    const cells: Array<{ col: number; row: number }> = [];
    const numbers: number[] = [];
    
    for (let row = 0; row < card[col].length; row++) {
      const num = card[col][row];
      cells.push({ col, row });
      if (num !== FREE_SQUARE) {
        numbers.push(num);
      }
      if (!isMarked(num)) {
        allMarked = false;
        break;
      }
    }
    if (allMarked) {
      return { type: 'column', index: col, cells, numbers };
    }
  }

  // Verificar diagonal principal
  let diagonal1 = true;
  const cells1: Array<{ col: number; row: number }> = [];
  const numbers1: number[] = [];
  
  for (let i = 0; i < 5 && i < card.length; i++) {
    if (i < card[i].length) {
      const num = card[i][i];
      cells1.push({ col: i, row: i });
      if (num !== FREE_SQUARE) {
        numbers1.push(num);
      }
      if (!isMarked(num)) {
        diagonal1 = false;
        break;
      }
    } else {
      diagonal1 = false;
      break;
    }
  }
  if (diagonal1) {
    return { type: 'diagonal', cells: cells1, numbers: numbers1 };
  }

  // Verificar diagonal secundaria
  let diagonal2 = true;
  const cells2: Array<{ col: number; row: number }> = [];
  const numbers2: number[] = [];
  
  for (let i = 0; i < 5 && i < card.length; i++) {
    const colIndex = 4 - i;
    if (colIndex >= 0 && colIndex < card.length && i < card[colIndex].length) {
      const num = card[colIndex][i];
      cells2.push({ col: colIndex, row: i });
      if (num !== FREE_SQUARE) {
        numbers2.push(num);
      }
      if (!isMarked(num)) {
        diagonal2 = false;
        break;
      }
    } else {
      diagonal2 = false;
      break;
    }
  }
  if (diagonal2) {
    return { type: 'diagonal', cells: cells2, numbers: numbers2 };
  }

  return null;
};

// Función para determinar el tipo de victoria (mantener compatibilidad)
const getVictoryType = (card: number[][], marked: Set<number>): 'row' | 'column' | 'diagonal' => {
  const winning = getWinningCells(card, marked);
  return winning ? winning.type : 'row';
};

interface BingoBoardProps {
  socket?: Socket | null;
}

export const BingoBoard = ({ socket }: BingoBoardProps) => {
  const { 
    generatedNumbers, 
    markedNumbers, 
    config, 
    playerCard, 
    setPlayerCard,
    playerCards,
    currentCardIndex,
    setCurrentCardIndex,
    markNumber,
    isGameRunning,
    gameEnded,
    clientId,
    playerName,
    cardsViewMode,
    winner,
    currentNumber,
    numberDisplayReady
  } = useBingoStore();
  const { minNumber, maxNumber } = config;
  
  // Ref para rastrear el último número que se intentó marcar
  const lastProcessedNumber = useRef<number | null>(null);
  
  // Usar todos los cartones si existen, sino usar el cartón único
  const cardsToDisplay = playerCards.length > 0 ? playerCards : (playerCard.length > 0 ? [playerCard] : []);
  const viewMode = (cardsToDisplay.length > 1 ? (cardsViewMode || 'single') : 'single');

  // Generar cartón del jugador cuando se monta el componente o cambia la configuración
  useEffect(() => {
    if (playerCard.length === 0 && playerCards.length === 0) {
      const newCard = generatePlayerCard(minNumber, maxNumber, 5);
      setPlayerCard(newCard);
    }
  }, [minNumber, maxNumber, playerCard.length, playerCards.length, setPlayerCard]);

  // Resetear el ref cuando cambia el número actual
  useEffect(() => {
    lastProcessedNumber.current = null;
  }, [currentNumber]);

  // Marcar automáticamente los números generados que están en TODOS los cartones
  // Esperar a que el número se muestre en el panel y termine su animación antes de marcarlo
  useEffect(() => {
    // Solo proceder si el número está listo para marcarse (animación terminada)
    if (!isGameRunning || gameEnded || cardsToDisplay.length === 0 || !socket || !currentNumber) return;
    
    // CRÍTICO: Solo marcar si numberDisplayReady es true (la animación terminó)
    // Y agregar un pequeño delay adicional para asegurar que el renderizado visual esté completo
    if (!numberDisplayReady) {
      console.log('⏳ Esperando a que termine la animación del número', currentNumber);
      return;
    }

    // Evitar procesar el mismo número dos veces
    if (lastProcessedNumber.current === currentNumber) {
      console.log('⏭️ Número ya procesado:', currentNumber);
      return;
    }

    console.log('✅ Número listo para marcar:', currentNumber, 'numberDisplayReady:', numberDisplayReady);
    
    // Agregar un pequeño delay adicional después de que numberDisplayReady sea true
    // para asegurar que el número esté completamente visible antes de marcarlo
    const markTimeout = setTimeout(() => {

    // El número ya está visible en el panel (numberDisplayReady = true significa que la animación terminó)
    // Ahora podemos marcarlo en los cartones
    const store = useBingoStore.getState();
    const currentMarked = store.markedNumbers;
    let hasNewMark = false;

    // Solo marcar el número actual si aún no está marcado
    if (!currentMarked.has(currentNumber)) {
      // Verificar si el número actual está en alguno de los cartones
      cardsToDisplay.forEach((card) => {
        card.forEach((column) => {
          column.forEach((num) => {
            // No marcar FREE, solo números reales que coincidan con el número actual
            if (num !== FREE_SQUARE && num === currentNumber && !currentMarked.has(num)) {
              console.log('🎯 Marcando número', currentNumber, 'en cartón');
              store.markNumber(num);
              hasNewMark = true;
            }
          });
        });
      });
      
          // Marcar este número como procesado
        lastProcessedNumber.current = currentNumber;
      }

      // Si se marcó un nuevo número, verificar victoria en TODOS los cartones
      if (hasNewMark) {
        setTimeout(() => {
          const updatedStore = useBingoStore.getState();
          // Verificar nuevamente que el juego sigue corriendo
          if (!updatedStore.isGameRunning || updatedStore.gameEnded) return;

          // Verificar victoria en todos los cartones
          const allCards = updatedStore.playerCards.length > 0 
            ? updatedStore.playerCards 
            : (updatedStore.playerCard.length > 0 ? [updatedStore.playerCard] : []);
          
          for (let i = 0; i < allCards.length; i++) {
            const card = allCards[i];
            const hasBingo = checkBingoInCard(card, updatedStore.markedNumbers);
            
            if (hasBingo && socket && updatedStore.clientId) {
              console.log(`🎉 ¡BINGO detectado en cartón ${i + 1}!`);
            
            // Obtener información detallada de la victoria
            const winningInfo = getWinningCells(card, updatedStore.markedNumbers);
            const victoryType = winningInfo ? winningInfo.type : getVictoryType(card, updatedStore.markedNumbers);
            
            console.log('🎯 Información de victoria:', {
              type: victoryType,
              cells: winningInfo?.cells,
              numbers: winningInfo?.numbers,
              cardIndex: i
            });
            
            // Actualizar el cartón activo al ganador
            updatedStore.setCurrentCardIndex(i);
            updatedStore.setPlayerCard(card);
            
            // Actualizar estado local inmediatamente
            const winnerData = {
              clientId: updatedStore.clientId,
              playerName: updatedStore.playerName || `Jugador ${updatedStore.clientId.substring(0, 8)}`,
              card: Array.from(updatedStore.markedNumbers),
              cardMatrix: card,
              victoryType,
              winningCells: winningInfo?.cells || [],
              winningNumbers: winningInfo?.numbers || [],
              timestamp: new Date().toISOString(),
            };
            
            console.log('💾 Guardando winnerData:', winnerData);
            updatedStore.setWinner(winnerData);
            updatedStore.setGameEnded(true);
            updatedStore.setGameRunning(false);
            
            // Enviar evento de victoria al servidor
            socket.emit('playerWon', {
              clientId: updatedStore.clientId,
              playerName: updatedStore.playerName || `Jugador ${updatedStore.clientId.substring(0, 8)}`,
              victoryType,
              card: Array.from(updatedStore.markedNumbers),
              cardMatrix: card,
              roomId: updatedStore.selectedRoom?.id || null,
            });
            
            break; // Solo procesar el primer cartón ganador
          }
        }
      }, 100);
      }
    }, 200); // Delay adicional de 200ms después de que numberDisplayReady sea true
    
    // Cleanup: cancelar el timeout si el componente se desmonta o cambian las dependencias
    return () => {
      clearTimeout(markTimeout);
    };
  }, [currentNumber, numberDisplayReady, cardsToDisplay.length, isGameRunning, gameEnded, socket]);

  const isNumberGenerated = (num: number) => generatedNumbers.includes(num);
  const isNumberMarked = (num: number) => markedNumbers.has(num);

  // Función para renderizar un cartón individual
  const renderCard = (card: number[][], index: number, isActive: boolean = false) => {
    const offset = index - currentCardIndex;
    const isVisible = viewMode === 'grid' || viewMode === 'single' || Math.abs(offset) <= 2;

    if (!isVisible && viewMode === 'stack') return null;

    return (
      <div
        key={index}
        className={`
          transition-all duration-500 ease-in-out
          ${viewMode === 'stack' 
            ? `absolute transform ${
                offset === 0 
                  ? 'scale-100 z-30 translate-y-0 opacity-100' 
                  : offset === 1 
                  ? 'scale-95 z-20 translate-y-4 opacity-80 translate-x-4 rotate-2'
                  : offset === -1
                  ? 'scale-95 z-20 translate-y-4 opacity-80 -translate-x-4 -rotate-2'
                  : offset === 2
                  ? 'scale-90 z-10 translate-y-8 opacity-60 translate-x-8 rotate-3'
                  : 'scale-90 z-10 translate-y-8 opacity-60 -translate-x-8 -rotate-3'
              }`
            : viewMode === 'grid'
            ? 'relative'
            : isActive
            ? 'relative'
            : 'hidden'
          }
        `}
        style={viewMode === 'stack' ? {
          left: '50%',
          transform: `translateX(-50%) ${
            offset === 0 ? 'translateY(0)' :
            offset === 1 ? 'translateY(1rem) translateX(1rem) rotate(2deg)' :
            offset === -1 ? 'translateY(1rem) translateX(-1rem) rotate(-2deg)' :
            offset === 2 ? 'translateY(2rem) translateX(2rem) rotate(3deg)' :
            'translateY(2rem) translateX(-2rem) rotate(-3deg)'
          } scale(${offset === 0 ? 1 : offset === 1 || offset === -1 ? 0.95 : 0.9})`,
        } : {}}
      >
        <div className={`
          bg-white rounded-2xl shadow-2xl p-4 md:p-6
          ${isActive ? 'ring-4 ring-blue-500 shadow-3xl' : ''}
          transition-all duration-300
          ${viewMode === 'stack' || viewMode === 'grid' ? 'cursor-pointer hover:shadow-3xl hover:ring-2 hover:ring-blue-300' : ''}
        `}
        onClick={() => {
          if ((viewMode === 'stack' || viewMode === 'grid') && index !== currentCardIndex) {
            setCurrentCardIndex(index);
            setPlayerCard(card);
          }
        }}
        >
          {/* Header del cartón */}
          {cardsToDisplay.length > 1 && (
            <div className="text-center mb-3">
              <div className={`inline-block px-4 py-1 rounded-full ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                <span className="text-sm font-bold">
                  Cartón #{index + 1}
                </span>
              </div>
            </div>
          )}

          {/* Letras BINGO */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {BINGO_LETTERS.map((letter) => (
              <div
                key={letter}
                className="text-center font-bold text-lg md:text-xl text-blue-600 py-1"
              >
                {letter}
              </div>
            ))}
          </div>

          {/* Números del cartón */}
          <div className="grid grid-cols-5 gap-1.5 md:gap-2">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {card.map((column, colIndex) => {
                  const num = column[rowIndex];
                  if (num === undefined) return null;
                  
                  const isFree = num === FREE_SQUARE;
                  const generated = isFree ? true : isNumberGenerated(num);
                  const marked = isFree ? true : isNumberMarked(num);
                  
                  // Verificar si esta celda es parte de la línea ganadora
                  // Comparar si el cartón actual es el ganador comparando los valores
                  let isWinningCell = false;
                  if (winner && winner.cardMatrix && winner.winningCells && winner.clientId === clientId) {
                    // Comparar matrices de forma más robusta
                    const winnerCard = winner.cardMatrix;
                    const isSameCard = winnerCard.length === card.length &&
                      winnerCard.every((col, cIdx) => 
                        col.length === card[cIdx]?.length &&
                        col.every((num, rIdx) => num === card[cIdx]?.[rIdx])
                      );
                    
                    if (isSameCard) {
                      isWinningCell = winner.winningCells.some(cell => cell.col === colIndex && cell.row === rowIndex);
                    }
                  }
                  
                  let className = `
                    aspect-square flex items-center justify-center rounded-lg font-bold text-sm md:text-base
                    transition-all duration-200
                  `;
                  
                  // Aplicar estilo especial para celdas ganadoras
                  if (isWinningCell) {
                    className += 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-white shadow-lg border-4 border-yellow-600 animate-pulse';
                  } else if (isFree) {
                    className += 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md';
                  } else if (marked) {
                    className += 'bg-green-500 text-white shadow-md border-2 border-green-600';
                  } else if (generated) {
                    className += 'bg-blue-400 text-white shadow-md border-2 border-blue-500';
                  } else {
                    className += 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 border border-gray-300';
                  }

                  return (
                    <div
                      key={`${colIndex}-${rowIndex}`}
                      className={className}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isFree && generated && !marked && isGameRunning && !gameEnded) {
                          const store = useBingoStore.getState();
                          store.markNumber(num);
                          
                          // Verificar victoria en todos los cartones después de marcar manualmente
                          setTimeout(() => {
                            const updatedStore = useBingoStore.getState();
                            if (!updatedStore.isGameRunning || updatedStore.gameEnded) return;
                            
                            const allCards = updatedStore.playerCards.length > 0 
                              ? updatedStore.playerCards 
                              : (updatedStore.playerCard.length > 0 ? [updatedStore.playerCard] : []);
                            
                            for (let i = 0; i < allCards.length; i++) {
                              const checkCard = allCards[i];
                              const hasBingo = checkBingoInCard(checkCard, updatedStore.markedNumbers);
                              
                              if (hasBingo && socket && updatedStore.clientId) {
                                console.log(`🎉 ¡BINGO detectado en cartón ${i + 1} (marcado manualmente)!`);
                                
                                // Obtener información detallada de la victoria
                                const winningInfo = getWinningCells(checkCard, updatedStore.markedNumbers);
                                const victoryType = winningInfo ? winningInfo.type : getVictoryType(checkCard, updatedStore.markedNumbers);
                                
                                console.log('🎯 Información de victoria (manual):', {
                                  type: victoryType,
                                  cells: winningInfo?.cells,
                                  numbers: winningInfo?.numbers,
                                  cardIndex: i
                                });
                                
                                updatedStore.setCurrentCardIndex(i);
                                updatedStore.setPlayerCard(checkCard);
                                
                                const winnerData = {
                                  clientId: updatedStore.clientId,
                                  playerName: updatedStore.playerName || `Jugador ${updatedStore.clientId.substring(0, 8)}`,
                                  card: Array.from(updatedStore.markedNumbers),
                                  cardMatrix: checkCard,
                                  victoryType,
                                  winningCells: winningInfo?.cells || [],
                                  winningNumbers: winningInfo?.numbers || [],
                                  timestamp: new Date().toISOString(),
                                };
                                
                                console.log('💾 Guardando winnerData (manual):', winnerData);
                                updatedStore.setWinner(winnerData);
                                updatedStore.setGameEnded(true);
                                updatedStore.setGameRunning(false);
                                
                             socket.emit('playerWon', {
                               clientId: updatedStore.clientId,
                               playerName: updatedStore.playerName || `Jugador ${updatedStore.clientId.substring(0, 8)}`,
                               victoryType,
                               card: Array.from(updatedStore.markedNumbers),
                               cardMatrix: checkCard,
                               roomId: updatedStore.selectedRoom?.id || null,
                             });
                                
                                break;
                              }
                            }
                          }, 100);
                        }
                      }}
                      style={{ cursor: !isFree && generated && !marked && isGameRunning && !gameEnded ? 'pointer' : 'default' }}
                    >
                      {isFree ? (
                        <span className="text-xs md:text-sm font-extrabold">FREE</span>
                      ) : (
                        <span>{num}</span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (cardsToDisplay.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Generando cartón...
      </div>
    );
  }

  return (
    <div className="bingo-card w-full">
      {/* Controles de navegación (solo si hay múltiples cartones) */}
      {cardsToDisplay.length > 1 && (viewMode === 'single' || viewMode === 'stack') && (
        <div className="mb-6 flex items-center justify-center gap-4">
          <button
            onClick={() => {
              if (currentCardIndex > 0) {
                const newIndex = currentCardIndex - 1;
                setCurrentCardIndex(newIndex);
                setPlayerCard(cardsToDisplay[newIndex]);
              }
            }}
            disabled={currentCardIndex === 0}
            className="px-4 py-2 bg-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors shadow-md"
          >
            ← Anterior
          </button>
          <span className="text-gray-700 font-semibold text-lg">
            Cartón {currentCardIndex + 1} / {cardsToDisplay.length}
          </span>
          <button
            onClick={() => {
              if (currentCardIndex < cardsToDisplay.length - 1) {
                const newIndex = currentCardIndex + 1;
                setCurrentCardIndex(newIndex);
                setPlayerCard(cardsToDisplay[newIndex]);
              }
            }}
            disabled={currentCardIndex === cardsToDisplay.length - 1}
            className="px-4 py-2 bg-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors shadow-md"
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Área de cartones */}
      <div className={`
        ${viewMode === 'stack' ? 'relative h-[600px] flex items-center justify-center' : ''}
        ${viewMode === 'single' ? 'flex justify-center' : ''}
        ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : ''}
      `}>
        {cardsToDisplay.map((card, index) => 
          renderCard(card, index, index === currentCardIndex)
        )}
      </div>

      {/* Indicadores de pila (solo en modo stack) */}
      {viewMode === 'stack' && cardsToDisplay.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {cardsToDisplay.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentCardIndex(index);
                setPlayerCard(cardsToDisplay[index]);
              }}
              className={`h-3 rounded-full transition-all duration-300 ${
                index === currentCardIndex 
                  ? 'bg-blue-600 w-8' 
                  : 'bg-gray-300 hover:bg-gray-400 w-3'
              }`}
              aria-label={`Ir al cartón ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p className="font-semibold">Números generados: {generatedNumbers.length} / {maxNumber - minNumber + 1}</p>
        <p className="mt-1">Números marcados: {markedNumbers.size}</p>
        {cardsToDisplay.length > 1 && (
          <p className="mt-1 text-blue-600 font-medium">
            💡 Los números se marcan automáticamente en todos tus cartones
          </p>
        )}
      </div>
    </div>
  );
};

