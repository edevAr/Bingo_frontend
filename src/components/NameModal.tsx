import { useState, useEffect } from 'react';
import { useBingoStore } from '../store/bingoStore';
import { Socket } from 'socket.io-client';
import { generatePlayerCard } from '../utils/cardGenerator';

interface NameModalProps {
  socket?: Socket | null;
}

export const NameModal = ({ socket }: NameModalProps) => {
  const { 
    playerName, 
    setPlayerName, 
    clientId, 
    setShowNameModal, 
    showNameModal,
    selectedRoom,
    cardQuantity,
    setCardQuantity
  } = useBingoStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Mostrar modal si no hay nombre y hay una sala seleccionada
  useEffect(() => {
    if (!playerName && selectedRoom) {
      setShowNameModal(true);
      // Limpiar el nombre cuando se muestra el modal (por si había uno anterior)
      setName('');
      setError('');
    }
  }, [playerName, selectedRoom, setShowNameModal]);

  // Resetear el nombre y cantidad cuando cambia la sala seleccionada
  useEffect(() => {
    if (selectedRoom && !playerName) {
      setName('');
      setError('');
      // Resetear cantidad de cartones a 1 cuando se selecciona una nueva sala
      setCardQuantity(1);
    }
  }, [selectedRoom?.id, playerName, setCardQuantity]);

  if (!showNameModal || playerName || !selectedRoom) return null;

  const totalPrice = (selectedRoom.price * cardQuantity).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    if (trimmedName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (trimmedName.length > 20) {
      setError('El nombre no puede tener más de 20 caracteres');
      return;
    }

    setError('');
    setPlayerName(trimmedName);
    setShowNameModal(false);
    
    // Enviar nombre y datos de compra al servidor
    if (socket && clientId && selectedRoom) {
      socket.emit('setPlayerName', {
        clientId,
        playerName: trimmedName,
      });
      
      // Enviar información de la compra
      socket.emit('purchaseCards', {
        clientId,
        playerName: trimmedName,
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        cardQuantity,
        totalPrice: parseFloat(totalPrice),
      });
      
      // Generar múltiples cartones después de la compra
      const store = useBingoStore.getState();
      const cards: number[][][] = [];
      
      for (let i = 0; i < cardQuantity; i++) {
        const newCard = generatePlayerCard(store.config.minNumber, store.config.maxNumber, 5);
        cards.push(newCard);
      }
      
      store.setPlayerCards(cards);
      // Mostrar el visor de cartones para que el usuario seleccione el modo de vista
      store.setShowCardsViewer(true);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // No permitir cerrar haciendo clic fuera si no hay nombre
    if (e.target === e.currentTarget && name.trim().length >= 2) {
      handleSubmit(e as any);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 p-4 animate-fadeIn overflow-y-auto"
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden transform transition-all animate-scaleIn my-4 md:my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <div className="text-7xl mb-4 animate-bounce">🎲</div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">
              ¡Bienvenido al Bingo!
            </h2>
            <p className="text-lg opacity-95">
              Ingresa tu nombre para comenzar a jugar
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-8">
          {/* Información de la sala seleccionada */}
          <div className={`mb-6 p-4 rounded-xl bg-gradient-to-r ${selectedRoom.gradient} text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedRoom.icon}</span>
                <div>
                  <p className="font-semibold text-lg">{selectedRoom.name}</p>
                  <p className="text-sm opacity-90">{selectedRoom.price.toFixed(2)} Bs por cartón</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="playerName" className="block text-sm font-semibold text-gray-700 mb-2">
                Tu Nombre
              </label>
              <input
                id="playerName"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Ej: Juan, María, Carlos..."
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
                autoFocus
                maxLength={20}
              />
              {error && (
                <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}
              {!error && name.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  {name.length}/20 caracteres
                </p>
              )}
            </div>

            {/* Cantidad de cartones */}
            <div>
              <label htmlFor="cardQuantity" className="block text-sm font-semibold text-gray-700 mb-2">
                Cantidad de Cartones
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setCardQuantity(Math.max(1, cardQuantity - 1))}
                  className="w-12 h-12 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xl transition-colors flex items-center justify-center"
                >
                  −
                </button>
                <input
                  id="cardQuantity"
                  type="number"
                  min="1"
                  max="10"
                  value={cardQuantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setCardQuantity(Math.min(10, Math.max(1, value)));
                  }}
                  className="flex-1 px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg text-center font-bold transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => setCardQuantity(Math.min(10, cardQuantity + 1))}
                  className="w-12 h-12 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xl transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Mínimo 1, máximo 10 cartones
              </p>
            </div>

            {/* Resumen de compra */}
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 font-medium">Cartones:</span>
                <span className="font-bold text-gray-800">{cardQuantity}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 font-medium">Precio unitario:</span>
                <span className="font-bold text-gray-800">{selectedRoom.price.toFixed(2)} Bs</span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">Total:</span>
                  <span className={`text-2xl font-bold bg-gradient-to-r ${selectedRoom.color} bg-clip-text text-transparent`}>
                    {totalPrice} Bs
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={name.trim().length < 2}
              className={`w-full bg-gradient-to-r ${selectedRoom.color} text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg`}
            >
              <span className="flex items-center justify-center gap-2">
                <span>🚀</span>
                <span>Comprar {cardQuantity} {cardQuantity === 1 ? 'Cartón' : 'Cartones'} - {totalPrice} Bs</span>
              </span>
            </button>
          </form>

          {/* Información adicional */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              💡 Tu nombre será visible para otros jugadores cuando ganes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

