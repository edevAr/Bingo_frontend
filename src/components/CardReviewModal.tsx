import { useBingoStore } from '../store/bingoStore';

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

export const CardReviewModal = () => {
  const { showCardReview, setShowCardReview, playerCard, markedNumbers, generatedNumbers } = useBingoStore();

  if (!showCardReview || !playerCard) return null;

  const isNumberMarked = (num: number | null) => {
    if (num === null) return true; // FREE siempre está marcado
    return markedNumbers.has(num);
  };

  // Encontrar qué filas, columnas o diagonales están completas
  const getCompletedLines = () => {
    const completed: string[] = [];

    // Verificar filas
    for (let row = 0; row < 5; row++) {
      let allMarked = true;
      for (let col = 0; col < 5; col++) {
        const num = playerCard[row][col];
        if (num !== null && !markedNumbers.has(num)) {
          allMarked = false;
          break;
        }
      }
      if (allMarked) {
        completed.push(`Fila ${row + 1}`);
      }
    }

    // Verificar columnas
    for (let col = 0; col < 5; col++) {
      let allMarked = true;
      for (let row = 0; row < 5; row++) {
        const num = playerCard[row][col];
        if (num !== null && !markedNumbers.has(num)) {
          allMarked = false;
          break;
        }
      }
      if (allMarked) {
        completed.push(`Columna ${BINGO_LETTERS[col]}`);
      }
    }

    // Verificar diagonal principal
    let diagonal1Marked = true;
    for (let i = 0; i < 5; i++) {
      const num = playerCard[i][i];
      if (num !== null && !markedNumbers.has(num)) {
        diagonal1Marked = false;
        break;
      }
    }
    if (diagonal1Marked) {
      completed.push('Diagonal Principal');
    }

    // Verificar diagonal secundaria
    let diagonal2Marked = true;
    for (let i = 0; i < 5; i++) {
      const num = playerCard[i][4 - i];
      if (num !== null && !markedNumbers.has(num)) {
        diagonal2Marked = false;
        break;
      }
    }
    if (diagonal2Marked) {
      completed.push('Diagonal Secundaria');
    }

    return completed;
  };

  const completedLines = getCompletedLines();
  const completedNumbers = Array.from(markedNumbers).sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 md:p-8 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Revisión del Cartón</h2>
          <button
            onClick={() => setShowCardReview(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Cartón visual */}
        <div className="mb-6">
          <div className="grid grid-cols-5 gap-2 mb-2">
            {BINGO_LETTERS.map((letter) => (
              <div
                key={letter}
                className="text-center font-bold text-lg text-blue-600 py-2"
              >
                {letter}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {playerCard.map((row, rowIndex) =>
              row.map((num, colIndex) => {
                const isFree = num === null;
                const marked = isNumberMarked(num);
                
                let className = 'bingo-number ';
                if (isFree) {
                  className += 'bg-gradient-to-br from-purple-500 to-pink-500 text-white font-extrabold';
                } else if (marked) {
                  className += 'marked';
                } else {
                  className += 'inactive';
                }

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={className}
                  >
                    {isFree ? 'FREE' : num}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Información de líneas completadas */}
        {completedLines.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <h3 className="font-bold text-green-800 mb-2">✅ Líneas Completadas:</h3>
            <div className="flex flex-wrap gap-2">
              {completedLines.map((line, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium"
                >
                  {line}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Números completados */}
        <div className="mb-4">
          <h3 className="font-bold text-gray-700 mb-2">
            Números Marcados ({completedNumbers.length}):
          </h3>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
            {completedNumbers.length > 0 ? (
              completedNumbers.map((num) => (
                <span
                  key={num}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  {num}
                </span>
              ))
            ) : (
              <p className="text-gray-500">Aún no hay números marcados</p>
            )}
          </div>
        </div>

        {/* Números generados totales */}
        <div className="text-sm text-gray-600">
          <p>Total de números generados: {generatedNumbers.length}</p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setShowCardReview(false)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

