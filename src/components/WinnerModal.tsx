import React from 'react';
import { useBingoStore } from '../store/bingoStore';
import { getNumbersForColumn } from '../utils/bingoChecker';
import { Tabs } from './Tabs';
import { FREE_SQUARE } from '../utils/cardGenerator';

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WinnerModal = ({ isOpen, onClose }: WinnerModalProps) => {
  const { winner, winners, clientId, config, playerCard, markedNumbers, generatedNumbers } = useBingoStore();

  // Usar winners si está disponible, sino usar winner
  const displayWinners = (winners && winners.length > 0) ? winners : (winner ? [winner] : []);
  
  if (!isOpen || displayWinners.length === 0) return null;

  const isCurrentPlayer = displayWinners.some(w => w.clientId === clientId);
  const { minNumber, maxNumber } = config;
  
  // Obtener información del premio del primer ganador (todos tienen la misma)
  const prizeInfo = displayWinners[0] ? {
    prize: displayWinners[0].prize || 0,
    totalPrize: displayWinners[0].totalPrize || 0,
    houseCut: displayWinners[0].houseCut || 0,
    totalPool: displayWinners[0].totalPool || 0,
  } : null;
  
  // Obtener el tipo de victoria
  const getVictoryTypeText = (victoryType?: string) => {
    if (!victoryType) return 'BINGO';
    switch (victoryType) {
      case 'row':
        return 'Fila Completa';
      case 'column':
        return 'Columna Completa';
      case 'diagonal':
        return 'Diagonal Completa';
      default:
        return 'BINGO';
    }
  };
  
  // Crear un Set de números marcados del cartón del ganador
  const getWinnerMarkedNumbers = (winnerCard: number[] | number[][]) => {
    const markedNumbers = new Set<number>();
    if (winnerCard && Array.isArray(winnerCard)) {
      // Si es un array de números (formato simple)
      if (typeof winnerCard[0] === 'number') {
        winnerCard.forEach((num) => {
          if (num > 0) {
            markedNumbers.add(num);
          }
        });
      } else {
        // Si es una matriz (formato complejo)
        winnerCard.forEach((row) => {
          if (Array.isArray(row)) {
            row.forEach((num) => {
              if (num > 0) {
                markedNumbers.add(num);
              }
            });
          }
        });
      }
    }
    return markedNumbers;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Solo cerrar si se hace clic en el backdrop, no en el contenido del modal
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-t-2xl">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              ¡BINGO!
            </h2>
            <p className="text-xl md:text-2xl mb-2">
              {displayWinners.length === 1
                ? (isCurrentPlayer
                    ? '¡Felicidades! ¡Has ganado!'
                    : `${displayWinners[0].playerName} ganó el juego`)
                : `${displayWinners.length} jugadores ganaron simultáneamente!`}
            </p>
            {prizeInfo && prizeInfo.totalPool > 0 && (
              <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-2xl md:text-3xl font-bold mb-2">
                  💰 Premio: {prizeInfo.prize.toFixed(2)} Bs {displayWinners.length > 1 ? 'cada uno' : ''}
                </p>
                <p className="text-sm opacity-90">
                  Pozo total: {prizeInfo.totalPool.toFixed(2)} Bs • 
                  Premio total: {prizeInfo.totalPrize.toFixed(2)} Bs • 
                  Casa: {prizeInfo.houseCut.toFixed(2)} Bs
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contenido con Tabs */}
        <div className="p-6">
          <Tabs
            tabs={[
              {
                id: 'my-card',
                label: 'Mi Cartón',
                content: (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-center text-gray-700">
                      Tu Cartón
                    </h3>
                    {playerCard.length > 0 ? (
                      <div className="bingo-card">
                        {/* Header con letras BINGO */}
                        <div className="grid grid-cols-5 gap-2 mb-4">
                          {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                            <div
                              key={letter}
                              className="text-center font-bold text-xl md:text-2xl text-blue-600 py-2 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center"
                            >
                              {letter}
                            </div>
                          ))}
                        </div>

                        {/* Tablero de números del jugador */}
                        <div className="grid grid-cols-5 gap-2">
                          {Array.from({ length: 5 }).map((_, rowIndex) => (
                            <React.Fragment key={rowIndex}>
                              {playerCard.map((column, colIndex) => {
                                const num = column[rowIndex];
                                if (num === undefined) return null;
                                
                                const isFree = num === FREE_SQUARE;
                                const isMarked = isFree || markedNumbers.has(num);
                                const isGenerated = isFree || generatedNumbers.includes(num);
                                
                                // Verificar si esta celda es parte de la línea ganadora
                                const isWinningCell = winner && winner.winningCells && 
                                  winner.clientId === clientId &&
                                  winner.winningCells.some(cell => cell.col === colIndex && cell.row === rowIndex);

                                return (
                                  <div
                                    key={`${colIndex}-${rowIndex}`}
                                    className={`bingo-number ${
                                      isWinningCell
                                        ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-white shadow-lg border-4 border-yellow-600 animate-pulse'
                                        : isFree
                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold'
                                        : isMarked
                                        ? 'bg-green-500 text-white'
                                        : isGenerated
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {isFree ? 'FREE' : num}
                                  </div>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                        
                        {/* Información del cartón del jugador */}
                        <div className="mt-4 text-center text-sm text-gray-600">
                          <p>Números marcados: {markedNumbers.size}</p>
                          <p>Números generados: {generatedNumbers.length}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No hay cartón disponible
                      </p>
                    )}
                  </div>
                ),
              },
              {
                id: 'winner-card',
                label: displayWinners.length === 1 ? 'Cartón del Ganador' : 'Cartones de los Ganadores',
                content: (
                  <div>
                    {/* Información de los ganadores */}
                    {displayWinners.map((winner, index) => {
                      const winnerMarkedNumbers = getWinnerMarkedNumbers(winner.card);
                      const isThisPlayer = winner.clientId === clientId;
                      
                      // Log para depuración
                      console.log(`🏆 Ganador ${index + 1}:`, {
                        playerName: winner.playerName,
                        clientId: winner.clientId,
                        isThisPlayer,
                        winningCells: winner.winningCells,
                        winningCellsLength: winner.winningCells?.length || 0,
                        winningNumbers: winner.winningNumbers,
                        winningNumbersLength: winner.winningNumbers?.length || 0,
                        cardMatrix: winner.cardMatrix,
                        cardMatrixLength: winner.cardMatrix?.length || 0
                      });
                      
                      return (
                        <div key={winner.clientId || index} className="mb-8">
                          <div className="mb-4 text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
                            <p className="text-xl font-bold text-gray-800 mb-2">
                              {isThisPlayer ? '🏆 Tú' : `🏆 ${winner.playerName}`}
                              {displayWinners.length > 1 && ` (Ganador ${index + 1})`}
                            </p>
                            {winner.victoryType && (
                              <p className="text-md text-gray-600 mb-2">
                                <strong>Tipo de Victoria:</strong> {getVictoryTypeText(winner.victoryType)}
                              </p>
                            )}
                            {winner.prize && winner.prize > 0 && (
                              <p className="text-lg font-bold text-green-600 mb-2">
                                💰 Premio: {winner.prize.toFixed(2)} Bs
                              </p>
                            )}
                            <p className="text-sm text-gray-500">
                              {new Date(winner.timestamp).toLocaleString()}
                            </p>
                          </div>

                          {/* Cartón del ganador */}
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">
                              {isThisPlayer ? 'Tu Cartón Ganador' : `Cartón de ${winner.playerName}`}
                            </h3>
                            <div className="bingo-card">
                              {/* Header con letras BINGO */}
                              <div className="grid grid-cols-5 gap-2 mb-4">
                                {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                                  <div
                                    key={letter}
                                    className="text-center font-bold text-xl md:text-2xl text-blue-600 py-2 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center"
                                  >
                                    {letter}
                                  </div>
                                ))}
                              </div>

                              {/* Tablero de números - Mostrar cartón del ganador si está disponible */}
                              {winner.cardMatrix && winner.cardMatrix.length > 0 ? (
                                <div className="grid grid-cols-5 gap-2">
                                  {Array.from({ length: 5 }).map((_, rowIndex) => (
                                    <React.Fragment key={rowIndex}>
                                      {winner.cardMatrix!.map((column, colIndex) => {
                                        const num = column[rowIndex];
                                        if (num === undefined) return null;
                                        
                                        // Verificar si es FREE (valor -1)
                                        const isFree = num === FREE_SQUARE;
                                        const isMarked = isFree || winnerMarkedNumbers.has(num);
                                        
                                        // Verificar si esta celda es parte de la línea ganadora
                                        const isWinningCell = winner.winningCells && 
                                          winner.winningCells.some(cell => cell.col === colIndex && cell.row === rowIndex);

                                        return (
                                          <div
                                            key={`${colIndex}-${rowIndex}`}
                                            className={`bingo-number ${
                                              isWinningCell
                                                ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-white shadow-lg border-4 border-yellow-600 animate-pulse'
                                                : isFree
                                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold'
                                                : isMarked
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}
                                          >
                                            {isFree ? 'FREE' : num}
                                          </div>
                                        );
                                      })}
                                    </React.Fragment>
                                  ))}
                                </div>
                              ) : (
                                <div className="grid grid-cols-5 gap-2">
                                  {[0, 1, 2, 3, 4].map((colIndex) => {
                                    const numbers = getNumbersForColumn(
                                      colIndex,
                                      minNumber,
                                      maxNumber
                                    );

                                    return numbers.map((num) => {
                                      const isMarked = winnerMarkedNumbers.has(num);

                                      return (
                                        <div
                                          key={num}
                                          className={`bingo-number ${
                                            isMarked
                                              ? 'bg-green-500 text-white'
                                              : 'bg-gray-100 text-gray-600'
                                          }`}
                                        >
                                          {num}
                                        </div>
                                      );
                                    });
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ),
              },
            ]}
            defaultTab="my-card"
          />

          {/* Botón de cerrar */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

