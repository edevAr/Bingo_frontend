import { useEffect, useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { useBingoStore } from './store/bingoStore';
import { BingoBoard } from './components/BingoBoard';
import { CurrentNumber } from './components/CurrentNumber';
import { GameControls } from './components/GameControls';
import { GeneratedNumbers } from './components/GeneratedNumbers';
import { ConnectionStatus } from './components/ConnectionStatus';
import { WinnerModal } from './components/WinnerModal';
import { RoomClosingModal } from './components/RoomClosingModal';
import { NameModal } from './components/NameModal';
import { Chat } from './components/Chat';
import { RoomSelectionModal } from './components/RoomSelectionModal';
import { CardsViewer } from './components/CardsViewer';
import { checkBingoInCard, createCardMatrix } from './utils/bingoChecker';
import { getWinningCells } from './components/BingoBoard';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

function App() {
  const { socket, isConnected, error } = useSocket(SOCKET_URL);
  const {
    setGameRunning,
    addGeneratedNumber,
    setTotalClients,
    setRoomClients,
    setRoomPlayers,
    setClientId,
    setConfig,
    resetGame,
    setInitialState,
    markedNumbers,
    config,
    clientId,
    playerName,
    setPlayerName,
    setWinner,
    setGameEnded,
    gameEnded,
    winner,
    isGameRunning,
    playerCard,
  } = useBingoStore();
  
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [modalClosedByUser, setModalClosedByUser] = useState(false);
  const [showRoomClosingModal, setShowRoomClosingModal] = useState(false);
  const [closingCountdown, setClosingCountdown] = useState(5);
  
  // Función para abrir el modal del ganador
  const handleViewWinnerCard = () => {
    setModalClosedByUser(false);
    setShowWinnerModal(true);
  };

  useEffect(() => {
    if (!socket) return;

    // Escuchar cuando se rechaza la unión a una sala
    const handleRoomJoinRejected = (data: { roomId: number; reason: string; message: string }) => {
      console.log('⚠️ Unión a sala rechazada:', data);
      alert(data.message);
      // Volver a mostrar el modal de selección de sala
      const { setShowRoomSelection, setSelectedRoom } = useBingoStore.getState();
      setSelectedRoom(null);
      setShowRoomSelection(true);
    };
    
    socket.on('roomJoinRejected', handleRoomJoinRejected);

    // Escuchar cambios en tiempo real del estado de las salas
    const handleRoomStatusChanged = (data: { 
      roomId: number; 
      status: { isGameRunning: boolean; playerCount: number; hasActiveGame: boolean }; 
      allRoomsStatus: Record<number, any> 
    }) => {
      console.log('🔄 Estado de sala actualizado (broadcast):', data);
      // Este evento se maneja en RoomSelectionModal, pero lo escuchamos aquí también
      // para que todos los clientes estén al tanto de los cambios
    };
    
    socket.on('roomStatusChanged', handleRoomStatusChanged);

    // Escuchar cuando el servidor indica que se debe mostrar el modal de cierre de sala
    // Este evento se envía a TODOS los clientes de la sala después de 20 segundos desde que terminó el juego
    const handleShowRoomClosingModal = (data: { roomId: number; countdown: number }) => {
      console.log('⏰ Recibida notificación del servidor para mostrar modal de cierre de sala:', data);
      // Cerrar el modal de ganador si está abierto (para todos los clientes)
      setShowWinnerModal(false);
      setModalClosedByUser(true);
      // Mostrar el modal de cierre de sala con el countdown especificado
      // Esto se aplica a TODOS los clientes de la sala al mismo tiempo
      setShowRoomClosingModal(true);
      setClosingCountdown(data.countdown);
    };
    
    socket.on('showRoomClosingModal', handleShowRoomClosingModal);

    // Escuchar cuando se conecta
    socket.on('connected', (data) => {
      console.log('Estado inicial recibido:', data);
      setInitialState({
        isGameRunning: data.isGameRunning,
        generatedNumbers: data.generatedNumbers || [],
        totalClients: data.totalClients,
        clientId: data.clientId,
        config: {
          delay: data.config.delay,
          minNumber: data.config.minNumber,
          maxNumber: data.config.maxNumber,
        },
        gameEnded: data.gameEnded || false,
        winner: data.winner || null,
      });
      
      // Si hay un ganador previo, mostrar el modal
      if (data.winner) {
        setWinner(data.winner);
        setShowWinnerModal(true);
      }
      
      // El NameModal se mostrará automáticamente si no hay nombre
    });

    // Escuchar nuevos números
    socket.on('newNumber', (data) => {
      console.log('Nuevo número:', data);
      addGeneratedNumber(data.number);
    });

    // Escuchar eventos del juego
    socket.on('gameStarted', () => {
      console.log('Juego iniciado');
      setGameRunning(true);
    });

    socket.on('gameStopped', () => {
      console.log('Juego detenido');
      setGameRunning(false);
    });

    socket.on('gameReset', () => {
      console.log('Juego reiniciado');
      resetGame();
    });

    socket.on('clientConnected', (data) => {
      console.log('Nuevo cliente conectado:', data);
      const { setTotalClients, setRoomClients, setRoomPlayers } = useBingoStore.getState();
      setTotalClients(data.totalClients || data.roomClients || 0);
      if (data.roomClients !== undefined) {
        setRoomClients(data.roomClients);
      }
      // Actualizar lista de jugadores si viene en el evento
      if (data.players && Array.isArray(data.players)) {
        console.log('📋 Actualizando lista de jugadores desde clientConnected:', data.players);
        setRoomPlayers(data.players);
      }
    });

    socket.on('clientDisconnected', (data) => {
      console.log('Cliente desconectado:', data);
      const { setTotalClients, setRoomClients, setRoomPlayers } = useBingoStore.getState();
      setTotalClients(data.totalClients || 0);
      if (data.roomClients !== undefined) {
        setRoomClients(data.roomClients);
      }
      // Actualizar lista de jugadores si viene en el evento
      if (data.players && Array.isArray(data.players)) {
        console.log('📋 Actualizando lista de jugadores desde clientDisconnected:', data.players);
        setRoomPlayers(data.players);
      }
    });

    // Escuchar cuando alguien se une a la sala (para todos los jugadores en la sala)
    socket.on('playerJoinedRoom', (data) => {
      console.log('Jugador se unió a la sala:', data);
      const { setRoomClients, setRoomPlayers } = useBingoStore.getState();
      if (data.roomClients !== undefined) {
        setRoomClients(data.roomClients);
      }
      // Actualizar lista de jugadores si viene en el evento
      if (data.players && Array.isArray(data.players)) {
        console.log('📋 Actualizando lista de jugadores desde playerJoinedRoom:', data.players);
        setRoomPlayers(data.players);
      }
    });

    // Escuchar cuando alguien sale de la sala (para todos los jugadores en la sala)
    socket.on('playerLeftRoom', (data) => {
      console.log('Jugador salió de la sala:', data);
      const { setRoomClients, setRoomPlayers } = useBingoStore.getState();
      if (data.roomClients !== undefined) {
        setRoomClients(data.roomClients);
      }
      // Actualizar lista de jugadores si viene en el evento
      if (data.players && Array.isArray(data.players)) {
        console.log('📋 Actualizando lista de jugadores desde playerLeftRoom:', data.players);
        setRoomPlayers(data.players);
      }
    });

    // Escuchar cuando se actualiza la lista de jugadores de la sala
    socket.on('roomPlayersUpdated', (data) => {
      console.log('Lista de jugadores actualizada:', data);
      const { setRoomClients, setRoomPlayers } = useBingoStore.getState();
      if (data.roomClients !== undefined) {
        setRoomClients(data.roomClients);
      }
      if (data.players && Array.isArray(data.players)) {
        console.log('📋 Actualizando lista de jugadores desde roomPlayersUpdated:', data.players);
        setRoomPlayers(data.players);
      }
    });

    // Escuchar confirmación de compra de cartones (puede incluir actualización de jugadores)
    socket.on('cardsPurchased', (data) => {
      console.log('Cartones comprados:', data);
      const { setRoomClients, setRoomPlayers } = useBingoStore.getState();
      if (data.roomClients !== undefined) {
        setRoomClients(data.roomClients);
      }
      if (data.players && Array.isArray(data.players)) {
        console.log('📋 Actualizando lista de jugadores desde cardsPurchased:', data.players);
        setRoomPlayers(data.players);
      }
    });

    // Escuchar cuando se une a una sala
    socket.on('roomJoined', (data) => {
      console.log('Unido a sala:', data);
      const store = useBingoStore.getState();
      const { setRoomClients, setRoomPlayers, setGameRunning, addGeneratedNumber, setGameEnded, setWinner, setWinners } = store;
      
      // Guardar los cartones actuales y números marcados antes de limpiar (si existen)
      const currentPlayerCards = store.playerCards;
      const currentPlayerCard = store.playerCard;
      const currentCardIndex = store.currentCardIndex;
      const currentShowCardsViewer = store.showCardsViewer;
      const currentMarkedNumbers = new Set(store.markedNumbers); // Preservar números marcados
      
      setRoomClients(data.roomClients || 0);
      // Actualizar lista de jugadores (siempre debe venir del servidor)
      if (data.players && Array.isArray(data.players)) {
        console.log('📋 Actualizando lista de jugadores desde roomJoined:', data.players);
        setRoomPlayers(data.players);
      }
      
      // IMPORTANTE: Si el usuario acaba de comprar cartones, NO hacer nada más
      // Solo actualizar la lista de jugadores y el estado básico
      // No limpiar ni modificar cartones o números marcados
      if (currentPlayerCards.length > 0 || currentShowCardsViewer) {
        // El usuario acaba de comprar cartones, no tocar nada
        console.log('📋 Usuario acaba de comprar cartones, preservando estado completo');
        // Solo actualizar lista de jugadores y estado básico
        setRoomClients(data.roomClients || 0);
        if (data.players && Array.isArray(data.players)) {
          setRoomPlayers(data.players);
        }
        return; // No hacer nada más, preservar todo el estado
      }
      
      // Si no hay cartones nuevos, entonces es una sincronización normal
      // Sincronizar estado del juego de la sala
      // Solo sincronizar si hay un juego activo, de lo contrario limpiar todo
      if (data.gameState) {
        setGameRunning(data.gameState.isGameRunning || false);
        setGameEnded(data.gameState.gameEnded || false);
        
        // Solo agregar números generados si hay un juego activo
        if (data.gameState.isGameRunning && data.gameState.generatedNumbers && data.gameState.generatedNumbers.length > 0) {
          // Si hay un juego activo, NO limpiar los cartones ni los números marcados
          // Solo sincronizar el estado del juego
          // Los cartones y números marcados deben preservarse
          setGameRunning(true);
          
          // Preservar números marcados actuales
          const currentMarked = new Set(store.markedNumbers);
          
          // Agregar números generados previamente que aún no estén en la lista
          const currentGenerated = store.generatedNumbers;
          data.gameState.generatedNumbers.forEach((num: number) => {
            if (!currentGenerated.includes(num)) {
              addGeneratedNumber(num);
            }
          });
          
          // Asegurar que los números marcados se preserven
          // (addGeneratedNumber no debería limpiar markedNumbers, pero por si acaso)
          currentMarked.forEach((num) => {
            if (!store.markedNumbers.has(num)) {
              store.markNumber(num);
            }
          });
        } else {
          // Si no hay juego activo, limpiar todo
          store.resetGame();
          store.setWinner(null);
          store.setWinners([]);
        }
        
        // Solo establecer ganadores si hay un juego activo
        if (data.gameState.isGameRunning && data.gameState.winners && data.gameState.winners.length > 0) {
          setWinners(data.gameState.winners);
        } else {
          setWinner(null);
          setWinners([]);
        }
      } else {
        // Si no hay gameState, limpiar todo
        store.resetGame();
        store.setWinner(null);
        store.setWinners([]);
      }
    });

    // Escuchar confirmación de salida de sala
    socket.on('roomLeft', (data) => {
      console.log('Salido de sala:', data);
      // Asegurar que todo esté limpio (por si acaso)
      const store = useBingoStore.getState();
      store.setPlayerCard([]);
      store.setPlayerCards([]);
      store.setCurrentCardIndex(0);
      store.resetGame();
      store.setPlayerName('');
      store.setCardQuantity(1);
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
      store.clearChatMessages();
      store.setUnreadMessages(0);
      // Minimizar todos los paneles y el chat cuando se cierra la sala
      store.setIsChatMinimized(true);
      store.setIsStatusPanelMinimized(true);
      store.setIsGameControlsPanelMinimized(true);
      store.setIsCurrentNumberPanelMinimized(true);
      store.setIsGeneratedNumbersPanelMinimized(true);
      store.setShowRoomSelection(true);
    });

    socket.on('status', (data) => {
      console.log('Estado recibido:', data);
      setGameRunning(data.isGameRunning);
      setTotalClients(data.totalClients || 0);
      if (data.roomClients !== undefined) {
        setRoomClients(data.roomClients);
      }
      if (data.gameEnded && data.winner) {
        setWinner(data.winner);
        setShowWinnerModal(true);
      }
    });

    // Escuchar cuando el juego termina (alguien ganó)
    socket.on('gameEnded', (data) => {
      console.log('Juego terminado:', data);
      setGameEnded(true);
      setGameRunning(false);
      
      // Manejar múltiples ganadores
      if (data.winners && Array.isArray(data.winners)) {
        const { setWinners } = useBingoStore.getState();
        setWinners(data.winners);
      } else {
        setWinner(data.winner);
      }
      
      setShowWinnerModal(true);
    });

    // Escuchar cuando cualquier jugador gana (broadcast desde el servidor)
    socket.on('playerWon', (data) => {
      console.log('Jugador ganó (broadcast):', data);
      setGameEnded(true);
      setGameRunning(false);
      
      // Manejar múltiples ganadores
      if (data.winners && Array.isArray(data.winners)) {
        // Calcular winningCells para cada ganador si no vienen del servidor
        const processedWinners = data.winners.map((w: any) => {
          const cardMatrix = w.cardMatrix || [];
          const markedNumbersSet = new Set<number>();
          
          // Reconstruir markedNumbers desde el card
          if (w.card && Array.isArray(w.card)) {
            w.card.forEach((num: number) => {
              if (typeof num === 'number' && num > 0) {
                markedNumbersSet.add(num);
              }
            });
          }
          
          let winningCells: Array<{ col: number; row: number }> | undefined;
          let winningNumbers: number[] | undefined;
          
          if (cardMatrix && Array.isArray(cardMatrix) && cardMatrix.length > 0 && Array.isArray(cardMatrix[0])) {
            if (markedNumbersSet.size > 0) {
              try {
                const winningInfo = getWinningCells(cardMatrix as number[][], markedNumbersSet);
                if (winningInfo) {
                  winningCells = winningInfo.cells;
                  winningNumbers = winningInfo.numbers;
                }
              } catch (error) {
                console.error('❌ Error calculando winningCells para ganador múltiple:', error);
              }
            }
          }
          
          return {
            ...w,
            winningCells: w.winningCells || winningCells || [],
            winningNumbers: w.winningNumbers || winningNumbers || []
          };
        });
        
        console.log('📥 Múltiples ganadores procesados:', processedWinners);
        const { setWinners } = useBingoStore.getState();
        setWinners(processedWinners);
      } else {
        // Crear objeto winner con la información recibida (compatibilidad)
        const cardMatrix = data.cardMatrix || data.winner?.cardMatrix || [];
        const markedNumbersSet = new Set<number>();
        
        console.log('📥 Datos recibidos del servidor:', {
          cardMatrix: cardMatrix,
          card: data.card,
          cardType: Array.isArray(cardMatrix) ? 'array' : 'not array',
          cardLength: Array.isArray(cardMatrix) ? cardMatrix.length : 0,
          firstElement: Array.isArray(cardMatrix) && cardMatrix.length > 0 ? cardMatrix[0] : null
        });
        
        // Si tenemos el cardMatrix, calcular winningCells
        let winningCells: Array<{ col: number; row: number }> | undefined;
        let winningNumbers: number[] | undefined;
        
        if (cardMatrix && Array.isArray(cardMatrix) && cardMatrix.length > 0 && Array.isArray(cardMatrix[0])) {
          // Reconstruir markedNumbers desde el card o cardMatrix
          if (data.card && Array.isArray(data.card)) {
            data.card.forEach((num: number) => {
              if (typeof num === 'number' && num > 0) {
                markedNumbersSet.add(num);
              }
            });
          }
          
          console.log('🔍 Calculando winningCells:', {
            cardMatrixLength: cardMatrix.length,
            markedNumbersSize: markedNumbersSet.size,
            markedNumbers: Array.from(markedNumbersSet)
          });
          
          // Calcular winningCells si tenemos los datos necesarios
          if (markedNumbersSet.size > 0) {
            try {
              const winningInfo = getWinningCells(cardMatrix as number[][], markedNumbersSet);
              console.log('✅ WinningInfo calculado:', winningInfo);
              if (winningInfo) {
                winningCells = winningInfo.cells;
                winningNumbers = winningInfo.numbers;
                console.log('🎯 Celdas ganadoras:', winningCells);
                console.log('🎯 Números ganadores:', winningNumbers);
              } else {
                console.warn('⚠️ No se encontró información de victoria');
              }
            } catch (error) {
              console.error('❌ Error calculando winningCells:', error);
            }
          } else {
            console.warn('⚠️ No hay números marcados para calcular winningCells');
          }
        } else {
          console.warn('⚠️ cardMatrix no está en el formato correcto:', cardMatrix);
        }
        
        const winnerData = {
          clientId: data.clientId || data.winner?.clientId || '',
          playerName: data.playerName || data.winner?.playerName || 'Jugador',
          card: data.card || data.winner?.card || [],
          cardMatrix: cardMatrix,
          victoryType: data.victoryType || data.winner?.victoryType,
          winningCells: data.winningCells || winningCells || [],
          winningNumbers: data.winningNumbers || winningNumbers || [],
          timestamp: data.timestamp || data.winner?.timestamp || new Date().toISOString(),
          prize: data.prizeInfo?.prizePerWinner,
          totalPrize: data.prizeInfo?.totalPrize,
          houseCut: data.prizeInfo?.houseCut,
          totalPool: data.prizeInfo?.totalPool,
        };
        
        console.log('📥 Winner recibido del servidor (final):', {
          ...winnerData,
          winningCellsLength: winnerData.winningCells?.length || 0,
          winningNumbersLength: winnerData.winningNumbers?.length || 0
        });
        setWinner(winnerData);
      }
      
      setShowWinnerModal(true);
    });

    // Escuchar confirmación de victoria (solo para el ganador)
    socket.on('victoryConfirmed', (data) => {
      console.log('Victoria confirmada:', data);
      setGameEnded(true);
      setGameRunning(false);
      
      const store = useBingoStore.getState();
      const cardMatrix = data.cardMatrix || store.playerCard;
      
      // Calcular winningCells si no vienen del servidor
      let winningCells: Array<{ col: number; row: number }> | undefined;
      let winningNumbers: number[] | undefined;
      
      if (cardMatrix && cardMatrix.length > 0 && Array.isArray(cardMatrix[0])) {
        const markedNumbersSet = new Set(store.markedNumbers);
        const winningInfo = getWinningCells(cardMatrix as number[][], markedNumbersSet);
        if (winningInfo) {
          winningCells = winningInfo.cells;
          winningNumbers = winningInfo.numbers;
        }
      }
      
      const winnerData = {
        clientId: data.clientId || store.clientId || '',
        playerName: data.playerName || data.winnerName || store.playerName || 'Jugador',
        card: data.card || Array.from(store.markedNumbers),
        cardMatrix: cardMatrix,
        victoryType: data.victoryType,
        winningCells: data.winningCells || winningCells,
        winningNumbers: data.winningNumbers || winningNumbers,
        timestamp: data.timestamp || new Date().toISOString(),
        prize: data.prize,
        totalPrize: data.totalPrize,
        houseCut: data.houseCut,
        totalPool: data.totalPool,
      };
      
      console.log('📥 Winner confirmado:', winnerData);
      setWinner(winnerData);
      setShowWinnerModal(true);
    });

    return () => {
      socket.off('connected');
      socket.off('newNumber');
      socket.off('gameStarted');
      socket.off('gameStopped');
      socket.off('gameReset');
      socket.off('clientConnected');
      socket.off('clientDisconnected');
      socket.off('roomJoined');
      socket.off('playerJoinedRoom');
      socket.off('playerLeftRoom');
      socket.off('roomPlayersUpdated');
      socket.off('cardsPurchased');
      socket.off('status');
      socket.off('gameEnded');
      socket.off('playerWon');
      socket.off('victoryConfirmed');
      socket.off('roomJoinRejected', handleRoomJoinRejected);
      socket.off('roomStatusChanged', handleRoomStatusChanged);
      socket.off('showRoomClosingModal', handleShowRoomClosingModal);
    };
  }, [socket, setGameRunning, addGeneratedNumber, setTotalClients, setRoomClients, setRoomPlayers, setClientId, setConfig, resetGame, setInitialState, playerName, setPlayerName, setWinner, setGameEnded]);

  // Mostrar modal cuando hay un ganador (solo si el usuario no lo cerró manualmente)
  useEffect(() => {
    if (winner && !showWinnerModal && !modalClosedByUser) {
      setShowWinnerModal(true);
    }
  }, [winner, showWinnerModal, modalClosedByUser]);

  // El servidor coordinará el cierre automático y el modal de cierre para todos los clientes
  // No necesitamos un timer local aquí, el servidor enviará el evento showRoomClosingModal
  // después de 20 segundos desde que terminó el juego, sincronizando a todos los clientes

  // Resetear el flag cuando el ganador cambia (nuevo juego)
  useEffect(() => {
    if (!winner) {
      setModalClosedByUser(false);
      setShowRoomClosingModal(false);
      setClosingCountdown(5);
    }
  }, [winner]);

  // Manejar countdown del modal de cierre de sala
  useEffect(() => {
    if (!showRoomClosingModal) {
      setClosingCountdown(5);
      return;
    }

    if (closingCountdown <= 0) {
      // Cerrar la sala y sacar al usuario
      const store = useBingoStore.getState();
      
      // Notificar al backend
      if (socket && store.selectedRoom) {
        socket.emit('leaveRoom', {
          roomId: store.selectedRoom.id
        });
      }

      // Limpiar estado del jugador completamente
      store.setPlayerCard([]);
      store.setPlayerCards([]);
      store.setCurrentCardIndex(0);
      store.resetGame();
      store.setPlayerName('');
      store.setCardQuantity(1);
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
      store.clearChatMessages();
      store.setUnreadMessages(0);
      // Minimizar todos los paneles y el chat
      store.setIsChatMinimized(true);
      store.setIsStatusPanelMinimized(true);
      store.setIsGameControlsPanelMinimized(true);
      store.setIsCurrentNumberPanelMinimized(true);
      store.setIsGeneratedNumbersPanelMinimized(true);
      store.setShowRoomSelection(true);
      
      // Cerrar el modal
      setShowRoomClosingModal(false);
      setClosingCountdown(5);
      return;
    }

    const timer = setInterval(() => {
      setClosingCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showRoomClosingModal, closingCountdown, socket]);

  return (
    <div className="min-h-screen py-4 px-4 md:px-8 pb-24 md:pb-20">
      <ConnectionStatus isConnected={isConnected} error={error} />
      <GameControls 
        socket={socket} 
        onViewWinnerCard={handleViewWinnerCard}
        showViewWinnerButton={gameEnded && winner && modalClosedByUser}
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            🎲 Bingo Digital
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Juego en tiempo real - Conecta y juega desde cualquier dispositivo
          </p>
        </header>

        {/* Número actual - Ahora es un panel flotante */}
        <CurrentNumber />

        {/* Tablero de Bingo */}
        <div className="mb-8">
          <BingoBoard socket={socket} />
        </div>

        {/* Números generados */}
        <GeneratedNumbers />

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Desarrollado con React + Socket.IO</p>
          <p className="mt-2">
            {isConnected ? '✅ Conectado al servidor' : '⏳ Conectando...'}
          </p>
        </footer>
      </div>

      {/* Modal del Ganador */}
      <WinnerModal
        isOpen={showWinnerModal}
        onClose={() => {
          setShowWinnerModal(false);
          setModalClosedByUser(true);
          
          // Si el usuario cierra manualmente, el servidor aún enviará el evento showRoomClosingModal
          // después de 20 segundos desde que terminó el juego, coordinando a todos los clientes de la sala
          // No necesitamos hacer nada aquí, el servidor se encargará de sincronizar a todos
        }}
      />

      {/* Modal de cierre de sala con countdown */}
      <RoomClosingModal 
        isOpen={showRoomClosingModal} 
        countdown={closingCountdown}
      />

      {/* Modal de Selección de Sala */}
      <RoomSelectionModal />

      {/* Modal de Nombre */}
      <NameModal socket={socket} />

      {/* Visor de Cartones */}
      <CardsViewer />

      {/* Chat flotante */}
      <Chat socket={socket} />
    </div>
  );
}

export default App;

