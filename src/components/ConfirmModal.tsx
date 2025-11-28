import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  icon?: string;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = 'from-red-500 to-red-600',
  icon = '⚠️'
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-scaleIn border-4 border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-r ${confirmColor} text-white p-8 text-center relative overflow-hidden`}>
          {/* Efectos decorativos de fondo */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
          </div>
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <div className="text-8xl mb-4 animate-bounce drop-shadow-2xl">{icon}</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
              {title}
            </h2>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="mb-6">
            <p className="text-lg text-gray-700 text-center leading-relaxed">
              {message}
            </p>
          </div>

          {/* Información adicional con iconos */}
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Ten en cuenta:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>Perderás todos tus cartones de esta sala</li>
                  <li>Se reiniciará tu progreso en el juego</li>
                  <li>Podrás unirte a otra sala después</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 border-2 border-gray-300"
            >
              <span className="flex items-center justify-center gap-2">
                <span>✖️</span>
                <span>{cancelText}</span>
              </span>
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-6 py-4 bg-gradient-to-r ${confirmColor} text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 border-2 border-transparent hover:border-white`}
            >
              <span className="flex items-center justify-center gap-2">
                <span>✓</span>
                <span>{confirmText}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

