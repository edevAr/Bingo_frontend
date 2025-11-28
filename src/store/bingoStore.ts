import { create } from 'zustand';

interface Winner {
  clientId: string;
  playerName: string;
  card: number[] | number[][]; // Array de números o matriz
  cardMatrix?: number[][]; // Matriz del cartón completo
  victoryType?: 'row' | 'column' | 'diagonal'; // Tipo de victoria
  winningCells?: Array<{ col: number; row: number }>; // Celdas que forman la línea ganadora
  winningNumbers?: number[]; // Números que forman la línea ganadora
  timestamp: string;
  prize?: number; // Premio individual
  totalPrize?: number; // Premio total del pozo
  houseCut?: number; // Corte de la casa
  totalPool?: number; // Pozo total acumulado
}

interface BingoState {
  isGameRunning: boolean;
  generatedNumbers: number[];
  currentNumber: number | null;
  numberDisplayReady: boolean; // Flag para indicar que el número está listo para marcar (después de la animación)
  totalClients: number;
  roomClients: number; // Jugadores en la misma sala
  roomPlayers: Array<{ clientId: string; playerName: string }>; // Lista de jugadores en la sala
  clientId: string | null;
  config: {
    delay: number;
    minNumber: number;
    maxNumber: number;
  };
  markedNumbers: Set<number>;
  gameEnded: boolean;
  winner: Winner | null; // Compatibilidad con código anterior
  winners: Winner[]; // Array de ganadores (puede haber múltiples)
  playerName: string;
  playerCard: number[][]; // Cartón actual del jugador (para compatibilidad)
  playerCards: number[][][]; // Array de todos los cartones comprados
  currentCardIndex: number; // Índice del cartón actualmente visible/activo
  showNameModal: boolean;
  showCardsViewer: boolean; // Mostrar visor de cartones después de compra
  cardsViewMode: 'stack' | 'grid' | 'single'; // Modo de visualización de cartones
  chatMessages: Array<{
    id: string;
    playerName: string;
    message: string;
    timestamp: string;
  }>;
  isChatMinimized: boolean;
  unreadMessages: number;
  isStatusPanelMinimized: boolean;
  isGameControlsPanelMinimized: boolean;
  isCurrentNumberPanelMinimized: boolean;
  isGeneratedNumbersPanelMinimized: boolean;
  selectedRoom: {
    id: number;
    name: string;
    price: number;
    icon: string;
    color: string;
    gradient: string;
  } | null;
  showRoomSelection: boolean;
  cardQuantity: number;
  
  // Actions
  setGameRunning: (running: boolean) => void;
  addGeneratedNumber: (number: number) => void;
  setCurrentNumber: (number: number | null) => void;
  setNumberDisplayReady: (ready: boolean) => void;
  setTotalClients: (count: number) => void;
  setRoomClients: (count: number) => void;
  setRoomPlayers: (players: Array<{ clientId: string; playerName: string }>) => void;
  setClientId: (id: string) => void;
  setConfig: (config: BingoState['config']) => void;
  markNumber: (number: number) => void;
  resetGame: () => void;
  setGameEnded: (ended: boolean) => void;
  setWinner: (winner: Winner | null) => void;
  setWinners: (winners: Winner[] | Winner) => void;
  setPlayerName: (name: string) => void;
  setPlayerCard: (card: number[][]) => void;
  setPlayerCards: (cards: number[][][]) => void;
  setCurrentCardIndex: (index: number) => void;
  setShowNameModal: (show: boolean) => void;
  setShowCardsViewer: (show: boolean) => void;
  setCardsViewMode: (mode: 'stack' | 'grid' | 'single') => void;
  addChatMessage: (message: {
    id: string;
    playerName: string;
    message: string;
    timestamp: string;
  }) => void;
  clearChatMessages: () => void;
  setIsChatMinimized: (minimized: boolean) => void;
  setUnreadMessages: (count: number) => void;
  setIsStatusPanelMinimized: (minimized: boolean) => void;
  setIsGameControlsPanelMinimized: (minimized: boolean) => void;
  setIsCurrentNumberPanelMinimized: (minimized: boolean) => void;
  setIsGeneratedNumbersPanelMinimized: (minimized: boolean) => void;
  setSelectedRoom: (room: {
    id: number;
    name: string;
    price: number;
    icon: string;
    color: string;
    gradient: string;
  } | null) => void;
  setShowRoomSelection: (show: boolean) => void;
  setCardQuantity: (quantity: number) => void;
  setInitialState: (data: {
    isGameRunning: boolean;
    generatedNumbers: number[];
    totalClients: number;
    clientId: string;
    config: BingoState['config'];
    gameEnded?: boolean;
    winner?: Winner | null;
  }) => void;
}

export const useBingoStore = create<BingoState>((set) => ({
  isGameRunning: false,
  generatedNumbers: [],
  currentNumber: null,
  numberDisplayReady: false,
  totalClients: 0,
  roomClients: 0,
  roomPlayers: [],
  clientId: null,
  config: {
    delay: 3000,
    minNumber: 1,
    maxNumber: 75,
  },
  markedNumbers: new Set<number>(),
  gameEnded: false,
  winner: null,
  winners: [],
  playerName: '',
  playerCard: [],
  playerCards: [],
  currentCardIndex: 0,
  showNameModal: false,
  showCardsViewer: false,
  cardsViewMode: 'single',
  chatMessages: [],
  isChatMinimized: true,
  unreadMessages: 0,
  isStatusPanelMinimized: true,
  isGameControlsPanelMinimized: true,
  isCurrentNumberPanelMinimized: false,
  isGeneratedNumbersPanelMinimized: false,
  selectedRoom: null,
  showRoomSelection: true,
  cardQuantity: 1,

  setGameRunning: (running) => set({ isGameRunning: running }),
  
  addGeneratedNumber: (number) =>
    set((state) => ({
      generatedNumbers: [...state.generatedNumbers, number],
      currentNumber: number,
      numberDisplayReady: false, // Resetear el flag cuando llega un nuevo número
    })),
  
  setCurrentNumber: (number) => set({ currentNumber: number, numberDisplayReady: false }),
  setNumberDisplayReady: (ready) => set({ numberDisplayReady: ready }),
  
  setTotalClients: (count) => set({ totalClients: count }),
  
  setRoomClients: (count) => set({ roomClients: count }),
  
  setRoomPlayers: (players) => set({ roomPlayers: players }),
  
  setClientId: (id) => set({ clientId: id }),
  
  setConfig: (config) => set({ config }),
  
  markNumber: (number) =>
    set((state) => {
      const newMarked = new Set(state.markedNumbers);
      newMarked.add(number);
      return { markedNumbers: newMarked };
    }),
  
  resetGame: () =>
    set({
      generatedNumbers: [],
      currentNumber: null,
      numberDisplayReady: false,
      markedNumbers: new Set(),
      isGameRunning: false,
      gameEnded: false,
      winner: null,
      winners: [],
      playerCard: [],
      playerCards: [],
      currentCardIndex: 0,
    }),
  
  setGameEnded: (ended) => set({ gameEnded: ended }),
  
  setWinner: (winner) => set({ 
    winner, 
    winners: Array.isArray(winner) ? winner : [winner],
    gameEnded: true 
  }),
  
  setWinners: (winners) => set({ 
    winners: Array.isArray(winners) ? winners : [winners],
    winner: Array.isArray(winners) && winners.length > 0 ? winners[0] : (Array.isArray(winners) ? null : winners),
    gameEnded: true 
  }),
  
  setPlayerName: (name) => set({ playerName: name }),
  
  setPlayerCard: (card) => set({ playerCard: card }),
  
  setPlayerCards: (cards) => set({ 
    playerCards: cards,
    playerCard: cards.length > 0 ? cards[0] : [],
    currentCardIndex: 0,
  }),
  
  setCurrentCardIndex: (index) => set((state) => ({
    currentCardIndex: index,
    playerCard: state.playerCards[index] || state.playerCard,
  })),
  
  setShowNameModal: (show) => set({ showNameModal: show }),
  
  setShowCardsViewer: (show) => set({ showCardsViewer: show }),
  
  setCardsViewMode: (mode) => set({ cardsViewMode: mode }),
  
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  
  clearChatMessages: () => set({ chatMessages: [] }),
  
  setIsChatMinimized: (minimized) => set({ isChatMinimized: minimized }),
  
  setUnreadMessages: (count) => set({ unreadMessages: count }),
  
  setIsStatusPanelMinimized: (minimized) => set({ isStatusPanelMinimized: minimized }),
  
  setIsGameControlsPanelMinimized: (minimized) => set({ isGameControlsPanelMinimized: minimized }),
  
  setIsCurrentNumberPanelMinimized: (minimized) => set({ isCurrentNumberPanelMinimized: minimized }),
  
  setIsGeneratedNumbersPanelMinimized: (minimized) => set({ isGeneratedNumbersPanelMinimized: minimized }),
  
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  
  setShowRoomSelection: (show) => set({ showRoomSelection: show }),
  
  setCardQuantity: (quantity) => set({ cardQuantity: quantity }),
  
  setInitialState: (data) =>
    set({
      isGameRunning: data.isGameRunning,
      generatedNumbers: data.generatedNumbers,
      totalClients: data.totalClients,
      clientId: data.clientId,
      config: data.config,
      gameEnded: data.gameEnded || false,
      winner: data.winner || null,
    }),
}));

