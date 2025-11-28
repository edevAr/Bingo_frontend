import { useState, useEffect } from 'react';
import { useBingoStore } from '../store/bingoStore';
import { useDraggable } from '../hooks/useDraggable';

interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
}

export const ConnectionStatus = ({ isConnected, error }: ConnectionStatusProps) => {
  const { roomClients, roomPlayers, selectedRoom, playerName, isStatusPanelMinimized, setIsStatusPanelMinimized } = useBingoStore();
  const [isMinimized, setIsMinimized] = useState(true);
  
  // Sincronizar con el estado del store
  useEffect(() => {
    if (isStatusPanelMinimized !== isMinimized) {
      setIsMinimized(isStatusPanelMinimized);
    }
  }, [isStatusPanelMinimized]);
  
  // Actualizar el store cuando cambia el estado local
  const handleMinimizeChange = (minimized: boolean) => {
    setIsMinimized(minimized);
    setIsStatusPanelMinimized(minimized);
  };
  
  // Calcular posición inicial (top-left)
  const getInitialPosition = () => {
    if (typeof window === 'undefined') return { x: 16, y: 120 };
    return { 
      x: 16, // left-4 (16px)
      y: 120 // Debajo del header
    };
  };
  
  const { position, isDragging, elementRef, handleMouseDown, handleTouchStart, style } = useDraggable({
    initialX: getInitialPosition().x,
    initialY: getInitialPosition().y,
  });

  if (error) {
    return (
      <div className="fixed top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-pulse border-2 border-red-400">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <span className="font-semibold">Error: {error}</span>
        </div>
      </div>
    );
  }

  // Si está minimizado, mostrar solo el icono flotante
  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-4 z-40">
        <button
          onClick={() => handleMinimizeChange(false)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full p-4 shadow-2xl transition-all duration-200 transform hover:scale-110 relative"
          title="Abrir panel de estado"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {isConnected && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={elementRef}
      className="fixed z-40"
      style={{
        ...style,
        width: '240px',
        maxWidth: '240px',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className={`bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 p-4 md:p-5 w-full md:min-w-[240px] md:max-w-[240px] relative ${isDragging ? 'opacity-90' : ''}`}>
        {/* Handle para arrastrar */}
        <div className="drag-handle absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full cursor-grab active:cursor-grabbing hover:bg-gray-400 transition-colors"></div>
        {/* Botón de minimizar */}
        <button
            onClick={(e) => {
              e.stopPropagation();
              handleMinimizeChange(true);
            }}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          title="Minimizar panel"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>
        {/* Estado de conexión */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          <div className="relative">
            <div
              className={`w-4 h-4 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            {isConnected && (
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-500 animate-ping opacity-75" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Estado
            </div>
            <div className={`text-sm font-bold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? `Conectado${playerName ? ` (${playerName})` : ''}` : 'Desconectado'}
            </div>
          </div>
        </div>

        {/* Información de la sala */}
        {selectedRoom && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Sala Actual
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedRoom.icon}</span>
                <div className="flex-1">
                  <div className="font-bold text-gray-800 text-sm">{selectedRoom.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {selectedRoom.price.toFixed(2)} Bs por cartón
                  </div>
                </div>
              </div>
            </div>

            {/* Jugadores conectados */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Jugadores ({roomClients || 0})
              </div>
              {roomPlayers.length > 0 ? (
                <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                  {roomPlayers.map((player) => (
                    <div 
                      key={player.clientId} 
                      className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-700 font-medium truncate">
                        {player.playerName}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic py-2">
                  No hay jugadores conectados
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedRoom && (
          <div className="text-center py-4">
            <div className="text-xs text-gray-400 italic">
              No hay sala seleccionada
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

