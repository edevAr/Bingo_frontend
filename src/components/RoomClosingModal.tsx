interface RoomClosingModalProps {
  isOpen: boolean;
  countdown: number;
}

export const RoomClosingModal = ({ isOpen, countdown }: RoomClosingModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-scaleIn">
        <div className="text-6xl mb-6 animate-bounce">⏰</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          La sala se cerrará pronto
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          La sala se cerrará automáticamente en:
        </p>
        <div className="mb-6">
          <div className="text-6xl font-bold text-red-600 mb-2 animate-pulse">
            {countdown}
          </div>
          <p className="text-sm text-gray-500">segundos</p>
        </div>
        <p className="text-sm text-gray-500">
          Serás redirigido a la selección de salas
        </p>
      </div>
    </div>
  );
};

