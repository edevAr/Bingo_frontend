import React, { useState, useEffect } from 'react';
import { useBingoStore } from '../store/bingoStore';
import { useDraggable } from '../hooks/useDraggable';

export const GeneratedNumbers = () => {
  const { generatedNumbers, winner, isGameRunning, isGeneratedNumbersPanelMinimized, setIsGeneratedNumbersPanelMinimized } = useBingoStore();
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Sincronizar con el estado del store
  useEffect(() => {
    if (isGeneratedNumbersPanelMinimized !== isMinimized) {
      setIsMinimized(isGeneratedNumbersPanelMinimized);
    }
  }, [isGeneratedNumbersPanelMinimized]);
  
  // Actualizar el store cuando cambia el estado local
  const handleMinimizeChange = (minimized: boolean) => {
    setIsMinimized(minimized);
    setIsGeneratedNumbersPanelMinimized(minimized);
  };

  // Verificar si un número es parte de la línea ganadora
  const isWinningNumber = (num: number): boolean => {
    const isWinner = winner?.winningNumbers?.includes(num) || false;
    if (isWinner) {
      console.log('🎯 Número ganador encontrado:', num, 'Winner:', winner);
    }
    return isWinner;
  };
  
  // Log para depuración
  React.useEffect(() => {
    if (winner) {
      console.log('📊 GeneratedNumbers - Winner data:', {
        winningNumbers: winner.winningNumbers,
        winningCells: winner.winningCells,
        clientId: winner.clientId
      });
    }
  }, [winner]);

  // Calcular posición inicial (parte inferior de la pantalla)
  const getInitialPosition = () => {
    if (typeof window === 'undefined') return { x: 16, y: 600 };
    // Calcular posición en la parte inferior, dejando espacio para otros elementos
    const bottomOffset = 20; // 20px desde el fondo
    const panelHeight = 300; // Altura estimada del panel
    return { 
      x: 16, // left-4 (16px)
      y: window.innerHeight - panelHeight - bottomOffset // Parte inferior con espacio
    };
  };
  
  const { position, isDragging, elementRef, handleMouseDown, handleTouchStart, style } = useDraggable({
    initialX: getInitialPosition().x,
    initialY: getInitialPosition().y,
  });

  // No mostrar si no hay números generados y el juego no está corriendo
  if (generatedNumbers.length === 0 && !isGameRunning) {
    return null;
  }

  // Si está minimizado, mostrar solo el icono flotante sobre el icono de controles de juego
  if (isMinimized) {
    return (
      <div className="fixed bottom-56 right-4 z-40">
        <button
            onClick={() => handleMinimizeChange(false)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full p-4 shadow-2xl transition-all duration-200 transform hover:scale-110 relative"
          title="Abrir números generados"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
            />
          </svg>
          {generatedNumbers.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {generatedNumbers.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={elementRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        ...style,
        width: '320px',
        maxWidth: '320px',
      }}
      className="fixed z-40 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-gray-200/50 overflow-hidden"
    >
      {/* Header con drag handle */}
      <div className="drag-handle bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 flex items-center justify-between cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
            />
          </svg>
          <h3 className="text-lg font-bold">
            Números Generados ({generatedNumbers.length})
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMinimizeChange(true);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className="hover:bg-white/20 rounded-full p-1 transition-colors"
          style={{ touchAction: 'manipulation' }}
          data-no-drag="true"
          title="Minimizar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>
      </div>

      {/* Contenido */}
      <div className="p-4 max-w-md max-h-[400px] overflow-y-auto custom-scrollbar">
        {generatedNumbers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Aún no se han generado números. Espera a que el administrador inicie el juego.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {generatedNumbers.map((num, index) => {
              const isWinner = isWinningNumber(num);
              return (
                <span
                  key={`${num}-${index}`}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all min-w-[2.5rem] text-center ${
                    isWinner
                      ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-white border-2 border-yellow-600 animate-pulse scale-110'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                  }`}
                >
                  {num}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


