import { useState, useEffect } from 'react';
import { useBingoStore } from '../store/bingoStore';
import { useSocket } from '../hooks/useSocket';

interface Room {
  id: number;
  name: string;
  price: number;
  icon: string;
  color: string;
  gradient: string;
}

interface RoomStatus {
  roomId: number;
  isGameRunning: boolean;
  gameEnded: boolean;
  playerCount: number;
  hasActiveGame: boolean;
}

const ROOMS: Room[] = [
  {
    id: 1,
    name: 'Sala Básica',
    price: 0.50,
    icon: '🎯',
    color: 'from-green-500 to-emerald-600',
    gradient: 'from-green-400 to-emerald-500',
  },
  {
    id: 2,
    name: 'Sala Estándar',
    price: 1,
    icon: '⭐',
    color: 'from-blue-500 to-cyan-600',
    gradient: 'from-blue-400 to-cyan-500',
  },
  {
    id: 3,
    name: 'Sala Premium',
    price: 2,
    icon: '💎',
    color: 'from-purple-500 to-indigo-600',
    gradient: 'from-purple-400 to-indigo-500',
  },
  {
    id: 4,
    name: 'Sala VIP',
    price: 5,
    icon: '👑',
    color: 'from-yellow-500 to-orange-600',
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    id: 5,
    name: 'Sala Élite',
    price: 10,
    icon: '🏆',
    color: 'from-red-500 to-pink-600',
    gradient: 'from-red-400 to-pink-500',
  },
  {
    id: 6,
    name: 'Sala Máxima',
    price: 20,
    icon: '💫',
    color: 'from-indigo-500 to-purple-600',
    gradient: 'from-indigo-400 to-purple-500',
  },
];

export const RoomSelectionModal = () => {
  const { setSelectedRoom, setShowRoomSelection, showRoomSelection, selectedRoom } = useBingoStore();
  const [hoveredRoom, setHoveredRoom] = useState<number | null>(null);
  const [roomsStatus, setRoomsStatus] = useState<Record<number, RoomStatus>>({});
  const { socket } = useSocket(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000');

  // Solicitar el estado de las salas cuando se abre el modal
  // IMPORTANTE: Los hooks deben estar ANTES de cualquier return temprano
  useEffect(() => {
    if (socket) {
      // Solicitar estado inicial cuando se abre el modal
      if (showRoomSelection) {
        socket.emit('getRoomsStatus');
      }
      
      const handleRoomsStatus = (status: Record<number, RoomStatus>) => {
        setRoomsStatus(status);
      };

      const handleRoomJoinRejected = (data: { message: string }) => {
        alert(data.message);
      };

      // Escuchar cambios en tiempo real del estado de las salas
      // Este listener debe estar siempre activo, incluso cuando el modal no está visible
      const handleRoomStatusChanged = (data: { 
        roomId: number; 
        status: RoomStatus; 
        allRoomsStatus: Record<number, RoomStatus> 
      }) => {
        console.log('🔄 Estado de sala actualizado en RoomSelectionModal:', data);
        // Actualizar el estado siempre, incluso si el modal no está visible
        // Esto asegura que cuando el usuario abra el modal, vea el estado actualizado
        setRoomsStatus(data.allRoomsStatus);
      };

      socket.on('roomsStatus', handleRoomsStatus);
      socket.on('roomJoinRejected', handleRoomJoinRejected);
      socket.on('roomStatusChanged', handleRoomStatusChanged);

      return () => {
        socket.off('roomsStatus', handleRoomsStatus);
        socket.off('roomJoinRejected', handleRoomJoinRejected);
        socket.off('roomStatusChanged', handleRoomStatusChanged);
      };
    }
  }, [socket, showRoomSelection]);

  // No mostrar si ya hay una sala seleccionada
  if (!showRoomSelection || selectedRoom) return null;

  const handleSelectRoom = (room: Room) => {
    const status = roomsStatus[room.id];
    
    // No permitir seleccionar salas con juego en curso
    if (status && status.isGameRunning) {
      return;
    }
    
    setSelectedRoom(room);
    setShowRoomSelection(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 p-4 animate-fadeIn overflow-y-auto"
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          // Permitir cerrar haciendo clic fuera si es necesario
        }
      }}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full mx-auto overflow-hidden transform transition-all animate-scaleIn my-4 md:my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <div className="text-8xl mb-6 animate-bounce">🎰</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
              Selecciona tu Sala
            </h1>
            <p className="text-xl md:text-2xl opacity-95">
              Elige la sala que mejor se adapte a ti
            </p>
          </div>
        </div>

        {/* Contenido - Grid de Salas */}
        <div className="p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ROOMS.map((room) => {
              const status = roomsStatus[room.id];
              const isGameRunning = status?.isGameRunning || false;
              const playerCount = status?.playerCount || 0;
              const isDisabled = isGameRunning;
              
              return (
              <div
                key={room.id}
                onMouseEnter={() => !isDisabled && setHoveredRoom(room.id)}
                onMouseLeave={() => setHoveredRoom(null)}
                onClick={() => !isDisabled && handleSelectRoom(room)}
                className={`
                  relative bg-white rounded-2xl shadow-lg p-6
                  transform transition-all duration-300
                  ${isDisabled 
                    ? 'opacity-60 cursor-not-allowed' 
                    : hoveredRoom === room.id 
                      ? 'scale-105 shadow-2xl -translate-y-2 cursor-pointer' 
                      : 'hover:scale-102 hover:shadow-xl cursor-pointer'
                  }
                  border-2 ${hoveredRoom === room.id && !isDisabled ? 'border-transparent' : 'border-gray-200'}
                  overflow-hidden group
                `}
              >
                {/* Fondo con gradiente animado */}
                <div className={`absolute inset-0 bg-gradient-to-br ${room.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                {/* Contenido */}
                <div className="relative z-10">
                  {/* Icono */}
                  <div className="text-center mb-4">
                    <div className={`
                      inline-block p-4 rounded-full bg-gradient-to-br ${room.color}
                      transform transition-transform duration-300
                      ${hoveredRoom === room.id ? 'scale-110 rotate-12' : ''}
                    `}>
                      <span className="text-4xl">{room.icon}</span>
                    </div>
                  </div>

                  {/* Nombre de la sala */}
                  <h3 className="text-2xl font-bold text-center mb-3 text-gray-800">
                    {room.name}
                  </h3>

                  {/* Precio */}
                  <div className="text-center mb-4">
                    <div className="inline-block">
                      <div className="text-sm text-gray-500 mb-1">Precio por cartón</div>
                      <div className={`
                        text-3xl font-bold bg-gradient-to-r ${room.color} bg-clip-text text-transparent
                      `}>
                        {room.price.toFixed(2)} Bs
                      </div>
                    </div>
                  </div>

                  {/* Estado del juego */}
                  {isGameRunning && (
                    <div className="mb-4 text-center">
                      <div className="inline-block px-4 py-2 bg-red-100 border-2 border-red-400 rounded-lg">
                        <div className="text-sm font-bold text-red-700">
                          🎮 Juego en curso
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                          {playerCount} {playerCount === 1 ? 'jugador' : 'jugadores'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botón de selección */}
                  <button
                    disabled={isDisabled}
                    className={`
                      w-full py-3 px-6 rounded-xl font-bold text-white
                      bg-gradient-to-r ${room.color}
                      transform transition-all duration-200
                      ${isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : hoveredRoom === room.id 
                          ? 'shadow-lg scale-105' 
                          : 'hover:shadow-md'
                      }
                    `}
                  >
                    {isDisabled ? 'No disponible' : 'Seleccionar'}
                  </button>
                </div>

                {/* Efecto de brillo al hover */}
                {hoveredRoom === room.id && !isDisabled && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer"></div>
                )}
              </div>
              );
            })}
          </div>

          {/* Información adicional */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              💡 Puedes comprar múltiples cartones en la sala que elijas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

