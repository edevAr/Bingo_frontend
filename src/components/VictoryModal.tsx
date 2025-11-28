import { useBingoStore } from '../store/bingoStore';

export const VictoryModal = () => {
  const { isWinner, victoryType, otherPlayerWon, winnerName, playerName, setShowCardReview } = useBingoStore();

  if (!isWinner && !otherPlayerWon) return null;

  // Si otro jugador ganó
  if (otherPlayerWon && !isWinner) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            {winnerName ? `${winnerName} ganó!` : 'Otro jugador ganó'}
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            El juego ha terminado. ¡Mejor suerte la próxima vez!
          </p>
          <button
            onClick={() => setShowCardReview(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Revisar Cartón
          </button>
        </div>
      </div>
    );
  }

  const getVictoryMessage = () => {
    switch (victoryType) {
      case 'row':
        return '¡Completaste una fila!';
      case 'column':
        return '¡Completaste una columna!';
      case 'diagonal':
        return '¡Completaste una diagonal!';
      default:
        return '¡BINGO!';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 text-center animate-bounce">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 mb-4">
          ¡FELICIDADES{playerName ? `, ${playerName}` : ''}!
        </h2>
        <p className="text-xl font-semibold text-gray-700 mb-6">
          {getVictoryMessage()}
        </p>
        <p className="text-lg text-gray-600 mb-4">
          Has ganado el juego de Bingo
        </p>
        <div className="mt-6 mb-6">
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-lg shadow-lg">
            🏆 GANADOR 🏆
          </div>
        </div>
        <button
          onClick={() => setShowCardReview(true)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-lg"
        >
          Revisar Cartón
        </button>
      </div>
    </div>
  );
};

