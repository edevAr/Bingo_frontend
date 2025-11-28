import React, { useState } from 'react';
import { useBingoStore } from '../store/bingoStore';
import { FREE_SQUARE } from '../utils/cardGenerator';

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

type ViewMode = 'stack' | 'grid' | 'single';

export const CardsViewer = () => {
  const { 
    playerCards, 
    currentCardIndex, 
    setCurrentCardIndex, 
    setShowCardsViewer,
    selectedRoom,
    cardQuantity,
    showCardsViewer,
    cardsViewMode,
    setCardsViewMode
  } = useBingoStore();
  const [viewMode, setViewMode] = useState<ViewMode>(cardsViewMode || 'stack');
  
  // Sincronizar el modo de vista con el store
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setCardsViewMode(mode);
  };

  if (!showCardsViewer || playerCards.length === 0) return null;

  const handleStartGame = () => {
    // Asegurar que el cartón actual esté seleccionado
    const store = useBingoStore.getState();
    if (store.playerCards.length > 0 && store.currentCardIndex < store.playerCards.length) {
      store.setPlayerCard(store.playerCards[store.currentCardIndex]);
    }
    // Guardar el modo de vista seleccionado
    store.setCardsViewMode(viewMode);
    setShowCardsViewer(false);
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < playerCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const renderCard = (card: number[][], index: number, isActive: boolean = false, showIndex: boolean = true) => {
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
          ${viewMode === 'stack' ? 'cursor-pointer hover:shadow-3xl hover:ring-2 hover:ring-blue-300' : ''}
          ${viewMode === 'grid' ? 'hover:ring-2 hover:ring-blue-300' : ''}
        `}
        onClick={() => {
          if (viewMode === 'stack' || viewMode === 'grid') {
            setCurrentCardIndex(index);
          }
        }}
        >
          {/* Header del cartón */}
          {showIndex && (
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
                  
                  return (
                    <div
                      key={`${colIndex}-${rowIndex}`}
                      className={`
                        aspect-square flex items-center justify-center rounded-lg font-bold text-sm md:text-base
                        transition-all duration-200
                        ${isFree
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md'
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 border border-gray-300 hover:border-blue-300 hover:shadow-sm'
                        }
                        ${isActive ? 'scale-100' : 'scale-95'}
                      `}
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

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 p-4 animate-fadeIn overflow-y-auto"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y'
      }}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full mx-auto my-4 md:my-8 transform transition-all animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${selectedRoom?.color || 'from-blue-600 to-indigo-600'} text-white p-6 md:p-8`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                🎴 Tus Cartones
              </h2>
              <p className="text-lg opacity-90">
                {playerCards.length} {playerCards.length === 1 ? 'cartón comprado' : 'cartones comprados'}
                {selectedRoom && (
                  <span className="ml-2">
                    • {selectedRoom.name} • {selectedRoom.price.toFixed(2)} Bs c/u
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowCardsViewer(false)}
              className="text-white hover:text-gray-200 transition-colors text-2xl font-bold bg-white bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Controles de vista - Destacado */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
              🎨 ¿Cómo quieres ver tus cartones?
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Selecciona tu modo de visualización preferido
            </p>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-3 mb-4">
            <button
              onClick={() => handleViewModeChange('stack')}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                viewMode === 'stack'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl ring-4 ring-blue-300'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md border-2 border-gray-200'
              }`}
            >
              📚 Pila
            </button>
            <button
              onClick={() => handleViewModeChange('single')}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                viewMode === 'single'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl ring-4 ring-blue-300'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md border-2 border-gray-200'
              }`}
            >
              👁️ Individual
            </button>
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl ring-4 ring-blue-300'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md border-2 border-gray-200'
              }`}
            >
              🗂️ Grid
            </button>
          </div>

          {/* Navegación (solo en modo single o stack) */}
          {(viewMode === 'single' || viewMode === 'stack') && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={handlePreviousCard}
                disabled={currentCardIndex === 0}
                className="px-4 py-2 bg-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors shadow-md"
              >
                ← Anterior
              </button>
              <span className="text-gray-700 font-semibold">
                {currentCardIndex + 1} / {playerCards.length}
              </span>
              <button
                onClick={handleNextCard}
                disabled={currentCardIndex === playerCards.length - 1}
                className="px-4 py-2 bg-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors shadow-md"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>

        {/* Área de cartones */}
        <div className="p-6 md:p-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-[500px] relative">
          {/* Efecto de fondo decorativo */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-10 left-10 text-9xl">🎴</div>
            <div className="absolute bottom-10 right-10 text-9xl">🎲</div>
            <div className="absolute top-1/2 left-1/4 text-7xl">🎯</div>
            <div className="absolute top-1/3 right-1/4 text-8xl">🎰</div>
          </div>
          
          <div className="relative z-10">
            {viewMode === 'stack' ? (
              <div className="relative h-[600px] flex items-center justify-center">
                {playerCards.map((card, index) => renderCard(card, index, index === currentCardIndex))}
                {/* Indicador de cartones en pila */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {playerCards.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCardIndex(index)}
                      className={`h-3 rounded-full transition-all duration-300 ${
                        index === currentCardIndex 
                          ? 'bg-blue-600 w-8' 
                          : 'bg-gray-300 hover:bg-gray-400 w-3'
                      }`}
                      aria-label={`Ir al cartón ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : viewMode === 'single' ? (
              <div className="flex justify-center">
                {renderCard(playerCards[currentCardIndex], currentCardIndex, true)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playerCards.map((card, index) => (
                  <div 
                    key={index} 
                    onClick={() => setCurrentCardIndex(index)}
                    className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:z-10 relative"
                  >
                    {renderCard(card, index, index === currentCardIndex, true)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer con botón de iniciar */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 text-center">
          <button
            onClick={handleStartGame}
            className={`px-8 py-4 bg-gradient-to-r ${selectedRoom?.color || 'from-blue-600 to-indigo-600'} text-white font-bold text-lg rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105`}
          >
            🚀 Iniciar Juego
          </button>
        </div>
      </div>
    </div>
  );
};

