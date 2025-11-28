import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useBingoStore } from '../store/bingoStore';

interface ChatMessage {
  id: string;
  playerName: string;
  message: string;
  timestamp: string;
}

interface ChatProps {
  socket?: Socket | null;
}

export const Chat = ({ socket }: ChatProps) => {
  const { 
    playerName, 
    chatMessages, 
    addChatMessage, 
    isChatMinimized, 
    setIsChatMinimized, 
    unreadMessages, 
    setUnreadMessages 
  } = useBingoStore();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (!isChatMinimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatMinimized]);

  // Escuchar mensajes del servidor
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data: ChatMessage) => {
      addChatMessage(data);
      // Si el chat está minimizado, incrementar contador de mensajes no leídos
      const store = useBingoStore.getState();
      if (store.isChatMinimized) {
        setUnreadMessages(store.unreadMessages + 1);
      }
    };

    socket.on('chatMessage', handleChatMessage);

    return () => {
      socket.off('chatMessage', handleChatMessage);
    };
  }, [socket, addChatMessage, setUnreadMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = inputMessage.trim();
    
    if (!trimmedMessage || !socket || !playerName) return;

    // Enviar mensaje al servidor
    socket.emit('chatMessage', {
      playerName,
      message: trimmedMessage,
    });

    setInputMessage('');
  };

  const handleToggleMinimize = () => {
    setIsChatMinimized(!isChatMinimized);
    // Si se está abriendo, resetear contador de mensajes no leídos
    if (isChatMinimized) {
      setUnreadMessages(0);
    }
  };

  // Si está minimizado, mostrar solo el botón flotante
  if (isChatMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={handleToggleMinimize}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-all duration-200 transform hover:scale-110 relative"
          title="Abrir chat"
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={chatContainerRef}
      className="fixed bottom-4 right-4 w-80 md:w-96 bg-white rounded-lg shadow-2xl z-40 flex flex-col border-2 border-gray-200"
      style={{ height: '500px', maxHeight: '80vh' }}
    >
      {/* Header del Chat */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="font-bold text-lg">Chat</h3>
        </div>
        <button
          onClick={handleToggleMinimize}
          className="text-white hover:text-gray-200 transition-colors"
          title="Minimizar chat"
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
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No hay mensajes aún</p>
            <p className="text-sm mt-2">¡Sé el primero en escribir!</p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.playerName === playerName ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.playerName === playerName
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                <div className="text-xs font-semibold mb-1 opacity-90">
                  {msg.playerName === playerName ? 'Tú' : msg.playerName}
                </div>
                <div className="text-sm break-words">{msg.message}</div>
                <div className="text-xs mt-1 opacity-75">
                  {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors font-semibold"
            title="Enviar mensaje"
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {inputMessage.length}/200 caracteres
        </p>
      </form>
    </div>
  );
};

