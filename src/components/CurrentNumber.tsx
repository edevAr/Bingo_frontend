import { useEffect, useState, useRef } from 'react';
import { useBingoStore } from '../store/bingoStore';
import { useDraggable } from '../hooks/useDraggable';

export const CurrentNumber = () => {
  const { currentNumber, isGameRunning, isCurrentNumberPanelMinimized, setIsCurrentNumberPanelMinimized } = useBingoStore();
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<number | null>(currentNumber);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Sincronizar con el estado del store
  useEffect(() => {
    if (isCurrentNumberPanelMinimized !== isMinimized) {
      setIsMinimized(isCurrentNumberPanelMinimized);
    }
  }, [isCurrentNumberPanelMinimized]);
  
  // Actualizar el store cuando cambia el estado local
  const handleMinimizeChange = (minimized: boolean) => {
    setIsMinimized(minimized);
    setIsCurrentNumberPanelMinimized(minimized);
  };
  
  // Calcular posición inicial (top-right)
  const getInitialPosition = () => {
    if (typeof window === 'undefined') return { x: 0, y: 120 };
    // En móviles, ajustar la posición para que sea visible
    const isMobile = window.innerWidth < 768;
    const panelWidth = 240;
    const margin = 16;
    return { 
      x: isMobile ? Math.max(0, window.innerWidth - panelWidth - margin) : window.innerWidth - panelWidth - margin,
      y: 120 
    };
  };

  // Cuando el juego se inicia por primera vez, asegurarse de que el panel esté visible (no minimizado)
  const prevGameRunning = useRef(isGameRunning);
  useEffect(() => {
    // Solo expandir automáticamente cuando el juego pasa de no estar corriendo a estar corriendo
    // No expandir si el usuario ya había minimizado el panel mientras el juego estaba corriendo
    if (isGameRunning && !prevGameRunning.current && isMinimized) {
      handleMinimizeChange(false);
    }
    prevGameRunning.current = isGameRunning;
  }, [isGameRunning]);
  
  const { position, isDragging, elementRef, handleMouseDown, handleTouchStart, style } = useDraggable({
    initialX: getInitialPosition().x,
    initialY: getInitialPosition().y,
  });

  // Efecto para animar cuando cambia el número
  useEffect(() => {
    if (currentNumber !== null && currentNumber !== displayNumber) {
      console.log('🎲 Nuevo número recibido:', currentNumber, 'Display actual:', displayNumber);
      setIsSpinning(true);
      const { setNumberDisplayReady } = useBingoStore.getState();
      setNumberDisplayReady(false); // Marcar que el número aún no está listo
      console.log('⏸️ numberDisplayReady establecido en false para', currentNumber);
      
      setTimeout(() => {
        setDisplayNumber(currentNumber);
        setIsSpinning(false);
        // Marcar que el número está listo para ser marcado después de que termine la animación
        setNumberDisplayReady(true);
        console.log('✅ Animación terminada, numberDisplayReady establecido en true para', currentNumber);
      }, 500);
    } else if (currentNumber === null) {
      setDisplayNumber(null);
      const { setNumberDisplayReady } = useBingoStore.getState();
      setNumberDisplayReady(false);
    }
  }, [currentNumber, displayNumber]);

  // Mostrar el panel si el juego está corriendo O si hay un número actual
  // Esto asegura que el panel aparezca cuando el juego se inicia, incluso antes de que se genere el primer número
  const shouldShow = isGameRunning || currentNumber !== null;
  
  if (!shouldShow) {
    return null;
  }

  // Si está minimizado, mostrar solo el número en formato compacto
  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-40">
        <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl shadow-2xl border-4 border-white p-4 relative">
          {/* Botón para expandir */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleMinimizeChange(false);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleMinimizeChange(false);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            className="absolute -top-2 -right-2 bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-600 rounded-full p-1.5 shadow-lg transition-all duration-200 transform hover:scale-110 active:scale-95 z-50"
            title="Expandir panel"
            style={{ touchAction: 'manipulation' }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
          {/* Número minimizado */}
          <div className="text-center min-w-[120px]">
            <div className="text-xs font-semibold text-white/90 uppercase tracking-wide mb-1">
              {isGameRunning ? 'Número Actual' : 'Último Número'}
            </div>
            <div 
              className={`text-5xl md:text-6xl font-black text-white drop-shadow-lg transition-all duration-500 ${
                isSpinning ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
              }`}
              style={{
                textShadow: '0 0 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {displayNumber !== null ? displayNumber : (isGameRunning ? '...' : '—')}
            </div>
            {isGameRunning && (
              <div className="mt-2 flex items-center justify-center gap-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-white/90">Generando...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
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
      <div 
        className={`bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 p-4 md:p-5 w-full md:min-w-[240px] md:max-w-[240px] ${isDragging ? 'opacity-90' : ''}`}
        onClick={(e) => {
          // Prevenir que los clics en el contenido activen el arrastre
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('[data-no-drag="true"]')) {
            e.stopPropagation();
          }
        }}
      >
        {/* Handle para arrastrar */}
        <div className="drag-handle absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full cursor-grab active:cursor-grabbing hover:bg-gray-400 transition-colors"></div>
        {/* Botón de minimizar - Con área táctil ampliada */}
        <div 
          className="absolute top-0 right-0 z-[100]"
          style={{ width: '60px', height: '60px', pointerEvents: 'none' }}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleMinimizeChange(true);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsMinimized(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors bg-white/95 rounded-full p-2.5 shadow-lg w-[44px] h-[44px] flex items-center justify-center"
            title="Minimizar panel"
            style={{ 
              touchAction: 'manipulation',
              pointerEvents: 'auto',
              WebkitTapHighlightColor: 'transparent'
            }}
            data-no-drag="true"
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
        {/* Título */}
        <div className="text-center mb-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {isGameRunning ? 'Número Actual' : 'Último Número'}
          </div>
        </div>

        {/* Tombola - Contenedor circular */}
        <div className="relative flex items-center justify-center">
          {/* Círculo exterior con efecto de rotación */}
          <div 
            className={`relative w-36 h-36 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-2xl border-6 border-white transform transition-all duration-500 ${
              isSpinning ? 'animate-spin' : ''
            }`}
            style={{
              boxShadow: '0 0 30px rgba(251, 191, 36, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.3)',
            }}
          >
            {/* Círculo interior con brillo */}
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-yellow-300 via-orange-400 to-red-400 shadow-inner">
              {/* Efecto de brillo animado */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              
              {/* Número en el centro */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className={`text-5xl md:text-6xl font-black text-white drop-shadow-2xl transition-all duration-500 ${
                    isSpinning ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                  }`}
                  style={{
                    textShadow: '0 0 15px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 255, 255, 0.3)',
                  }}
                >
                  {displayNumber || '—'}
                </div>
              </div>

              {/* Decoración - puntos alrededor */}
              <div className="absolute inset-0 rounded-full">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-white rounded-full"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-65px)`,
                      boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Efecto de resplandor pulsante */}
            <div 
              className={`absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/50 to-orange-500/50 ${
                isGameRunning ? 'animate-pulse' : ''
              }`}
              style={{
                filter: 'blur(20px)',
                zIndex: -1,
              }}
            />
          </div>

          {/* Efectos de partículas decorativas */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping"
                style={{
                  top: `${25 + i * 20}%`,
                  left: `${15 + i * 20}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '2s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Indicador de estado */}
        {isGameRunning && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-green-700">Generando números...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


