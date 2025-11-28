import { useState, useEffect } from 'react';
import { useBingoStore } from '../store/bingoStore';
import { Socket } from 'socket.io-client';
import { ConfirmModal } from './ConfirmModal';
import { useDraggable } from '../hooks/useDraggable';

interface GameControlsProps {
  socket: Socket | null;
  onViewWinnerCard?: () => void;
  showViewWinnerButton?: boolean;
}

export const GameControls = ({ socket, onViewWinnerCard, showViewWinnerButton }: GameControlsProps) => {
  const { 
    isGameRunning, 
    roomClients, 
    selectedRoom,
    setShowRoomSelection,
    resetGame,
    setPlayerName,
    setPlayerCard,
    setPlayerCards,
    setRoomClients,
    setRoomPlayers,
    setSelectedRoom,
    setShowCardsViewer,
    setShowNameModal,
    clearChatMessages,
    isGameControlsPanelMinimized,
    setIsGameControlsPanelMinimized
  } = useBingoStore();
  
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  
  // Sincronizar con el estado del store
  useEffect(() => {
    if (isGameControlsPanelMinimized !== isMinimized) {
      setIsMinimized(isGameControlsPanelMinimized);
    }
  }, [isGameControlsPanelMinimized]);
  
  // Actualizar el store cuando cambia el estado local
  const handleMinimizeChange = (minimized: boolean) => {
    setIsMinimized(minimized);
    setIsGameControlsPanelMinimized(minimized);
  };
  
  // Calcular posición inicial (top-left, debajo del panel de estado)
  const getInitialPosition = () => {
    if (typeof window === 'undefined') return { x: 16, y: 400 };
    return { 
      x: 16, // left-4 (16px)
      y: 400 // Debajo del panel de estado con espacio
    };
  };
  
  const { position, isDragging, elementRef, handleMouseDown, handleTouchStart, style } = useDraggable({
    initialX: getInitialPosition().x,
    initialY: getInitialPosition().y,
  });

  const handleStartGame = () => {
    if (socket) {
      socket.emit('startGame');
    }
  };

  const handleStopGame = () => {
    if (socket) {
      socket.emit('stopGame');
    }
  };

  const handleResetGame = () => {
    if (socket) {
      socket.emit('resetGame');
    }
  };

  const handleLeaveRoomClick = () => {
    if (!selectedRoom) return;
    setShowLeaveConfirm(true);
  };

  const handleConfirmLeave = () => {
    if (!selectedRoom) return;

    // Notificar al backend
    if (socket) {
      socket.emit('leaveRoom', {
        roomId: selectedRoom.id
      });
    }

    // Limpiar estado del jugador completamente
    const store = useBingoStore.getState();
    
    // Limpiar cartones explícitamente antes de resetGame
    store.setPlayerCard([]);
    store.setPlayerCards([]);
    store.setCurrentCardIndex(0);
    
    // Resetear el juego (esto limpia números, marcados, etc.)
    store.resetGame();
    
    // Limpiar otros datos del jugador
    store.setPlayerName('');
    store.setCardQuantity(1); // Resetear cantidad de cartones
    store.setRoomClients(0);
    store.setRoomPlayers([]);
    store.setSelectedRoom(null);
    store.setShowCardsViewer(false);
    store.setShowNameModal(false);
    store.setGameEnded(false);
    store.setWinner(null);
    store.setWinners([]);
    store.setCurrentNumber(null);
    store.setNumberDisplayReady(false);
    
    // Limpiar mensajes del chat
    store.clearChatMessages();
    store.setUnreadMessages(0);
    // Minimizar todos los paneles y el chat
    store.setIsChatMinimized(true);
    store.setIsStatusPanelMinimized(true);
    store.setIsGameControlsPanelMinimized(true);
    store.setIsCurrentNumberPanelMinimized(true);
    store.setIsGeneratedNumbersPanelMinimized(true);
    
    // Mostrar modal de selección de salas
    store.setShowRoomSelection(true);
    
    // Cerrar modal de confirmación
    setShowLeaveConfirm(false);
  };

  // Si está minimizado, mostrar solo el icono flotante
  if (isMinimized) {
    return (
      <>
        <div className="fixed bottom-40 right-4 z-40">
          <button
            onClick={() => handleMinimizeChange(false)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-full p-4 shadow-2xl transition-all duration-200 transform hover:scale-110 relative"
            title="Abrir controles del juego"
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
        {/* Modal de confirmación para salir de sala */}
        <ConfirmModal
          isOpen={showLeaveConfirm}
          onClose={() => setShowLeaveConfirm(false)}
          onConfirm={handleConfirmLeave}
          title="¿Salir de la Sala?"
          message="¿Estás seguro de que quieres salir de esta sala? Perderás todo tu progreso en esta sala, incluyendo tus cartones y números marcados."
          confirmText="Sí, Salir"
          cancelText="Cancelar"
          confirmColor="from-red-500 to-red-600"
          icon="🚪"
        />
      </>
    );
  }

  return (
    <>
      {/* Panel flotante de controles */}
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
          <div className="flex flex-col gap-3">
            {/* Título del panel */}
            <div className="text-center mb-2">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Controles del Juego</h3>
            </div>
            
            {/* Botones principales */}
            <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartGame();
                }}
                disabled={isGameRunning}
                className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                <span className="text-lg">▶️</span>
                <span>Iniciar Juego</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopGame();
                }}
                disabled={!isGameRunning}
                className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                <span className="text-lg">⏸️</span>
                <span>Detener</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetGame();
                }}
                className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="text-lg">🔄</span>
                <span>Reiniciar</span>
              </button>

              {/* Botón de salir de sala */}
              {selectedRoom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeaveRoomClick();
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mt-1"
                >
                  <span className="text-lg">🚪</span>
                  <span>Salir de Sala</span>
                </button>
              )}

              {/* Botón para ver el cartón ganador */}
              {showViewWinnerButton && onViewWinnerCard && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewWinnerCard();
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mt-1"
                >
                  <span className="text-lg">🏆</span>
                  <span>Ver el Cartón Ganador</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para salir de sala */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleConfirmLeave}
        title="¿Salir de la Sala?"
        message="¿Estás seguro de que quieres salir de esta sala? Perderás todo tu progreso en esta sala, incluyendo tus cartones y números marcados."
        confirmText="Sí, Salir"
        cancelText="Cancelar"
        confirmColor="from-red-500 to-red-600"
        icon="🚪"
      />
    </>
  );
};

