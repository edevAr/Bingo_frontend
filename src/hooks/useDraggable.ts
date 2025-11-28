import { useState, useRef, useEffect } from 'react';

interface UseDraggableOptions {
  initialX?: number;
  initialY?: number;
  bounds?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
}

export const useDraggable = (options: UseDraggableOptions = {}) => {
  const [position, setPosition] = useState(() => {
    // Si hay posiciones iniciales, usarlas; sino calcular desde el DOM
    if (options.initialX !== undefined || options.initialY !== undefined) {
      return { x: options.initialX || 0, y: options.initialY || 0 };
    }
    return { x: 0, y: 0 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Inicializar posición desde el DOM si no se proporcionó posición inicial
  useEffect(() => {
    if (!isInitialized.current && elementRef.current && (options.initialX === undefined && options.initialY === undefined)) {
      const rect = elementRef.current.getBoundingClientRect();
      setPosition({ x: rect.left, y: rect.top });
      isInitialized.current = true;
    }
  }, [options.initialX, options.initialY]);

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging || !elementRef.current) return;

      const deltaX = clientX - dragStartPos.current.x;
      const deltaY = clientY - dragStartPos.current.y;

      let newX = dragStartPos.current.elementX + deltaX;
      let newY = dragStartPos.current.elementY + deltaY;

      // Aplicar límites solo si están definidos explícitamente
      if (options.bounds) {
        if (options.bounds.left !== undefined) newX = Math.max(newX, options.bounds.left);
        if (options.bounds.right !== undefined) newX = Math.min(newX, options.bounds.right);
        if (options.bounds.top !== undefined) newY = Math.max(newY, options.bounds.top);
        if (options.bounds.bottom !== undefined) newY = Math.min(newY, options.bounds.bottom);
      }
      // Si no hay bounds, permitir movimiento completamente libre

      setPosition({ x: newX, y: newY });
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevenir scroll mientras se arrastra
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, position, options.bounds]);

  const startDrag = (clientX: number, clientY: number, target: HTMLElement) => {
    // No arrastrar si se hace clic en elementos interactivos - verificar primero
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('select') ||
      target.closest('a') ||
      target.closest('.custom-scrollbar') ||
      target.closest('[data-no-drag="true"]') ||
      target.hasAttribute('data-no-drag') ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT'
    ) {
      return false; // No interferir con elementos interactivos
    }
    
    // Solo arrastrar si se hace clic en el handle o en la parte superior del panel
    const isHandle = target.classList.contains('drag-handle') || target.closest('.drag-handle');
    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return false;
    
    const clickY = clientY - rect.top;
    
    // Permitir arrastrar desde el handle o desde los primeros 40px del panel
    if (isHandle || clickY < 40) {
      // Obtener la posición actual del elemento desde el DOM
      const currentX = rect.left;
      const currentY = rect.top;
      
      setIsDragging(true);
      dragStartPos.current = { 
        x: clientX, 
        y: clientY,
        elementX: currentX,
        elementY: currentY
      };
      return true;
    }
    return false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (startDrag(e.clientX, e.clientY, target)) {
      e.preventDefault();
      e.stopPropagation(); // Prevenir que el evento se propague
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    
    // Verificar PRIMERO si el target es un botón o elemento interactivo
    if (
      target.closest('button') || 
      target.closest('[data-no-drag="true"]') ||
      target.hasAttribute('data-no-drag') ||
      target.tagName === 'BUTTON'
    ) {
      // No hacer nada, dejar que el botón maneje el evento
      return;
    }
    
    if (e.touches.length > 0) {
      if (startDrag(e.touches[0].clientX, e.touches[0].clientY, target)) {
        e.preventDefault();
        e.stopPropagation(); // Prevenir que el evento se propague
      }
    }
  };

  return {
    position,
    isDragging,
    elementRef,
    handleMouseDown,
    handleTouchStart,
    style: {
      left: `${position.x}px`,
      top: `${position.y}px`,
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none' as const,
      touchAction: 'none' as const, // Prevenir acciones táctiles por defecto
    },
  };
};

