"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const MIN_CANVAS_ZOOM = 0.4;
export const MAX_CANVAS_ZOOM = 2.0;
export const CANVAS_ZOOM_STEP = 0.15;
export const DRAG_THRESHOLD_PX = 4;

export function clampCanvasZoom(
  zoom: number,
  min: number = MIN_CANVAS_ZOOM,
  max: number = MAX_CANVAS_ZOOM
): number {
  return Number(Math.min(max, Math.max(min, zoom)).toFixed(2));
}

export function calculatePanOffset(
  startPan: { x: number; y: number },
  startPos: { x: number; y: number },
  currentPos: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: Math.round(startPan.x + (currentPos.x - startPos.x)),
    y: Math.round(startPan.y + (currentPos.y - startPos.y)),
  };
}

export function isExceedingDragThreshold(
  dx: number,
  dy: number,
  threshold: number = DRAG_THRESHOLD_PX
): boolean {
  return Math.hypot(dx, dy) >= threshold;
}

export function calculateWheelZoom(
  currentZoom: number,
  deltaY: number
): number {
  const factor = deltaY < 0 ? 1.1 : 0.9;
  return clampCanvasZoom(currentZoom * factor);
}

export interface CanvasPanZoomState {
  pan: { x: number; y: number };
  zoom: number;
  isDragging: boolean;
}

export function useCanvasPanZoom(
  viewportRef?: React.RefObject<HTMLDivElement | null>,
  initialZoom: number = 1
) {
  const [zoom, setZoom] = useState<number>(clampCanvasZoom(initialZoom));
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fallbackRef = useRef<HTMLDivElement | null>(null);
  const activeViewportRef = viewportRef ?? fallbackRef;
  const isPointerDownRef = useRef<boolean>(false);
  const wasDraggedRef = useRef<boolean>(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setZoom((prev) => clampCanvasZoom(prev + CANVAS_ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => clampCanvasZoom(prev - CANVAS_ZOOM_STEP));
  }, []);

  const reset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Eventos de roda do mouse com listener não-passivo para evitar zoom de janela acidental
  useEffect(() => {
    const el = activeViewportRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        setZoom((prev) => calculateWheelZoom(prev, e.deltaY));
      } else {
        setPan((prev) => ({
          x: Math.round(prev.x - e.deltaX),
          y: Math.round(prev.y - e.deltaY),
        }));
      }
    };

    el.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheelNative);
    };
  }, [activeViewportRef]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Apenas clique principal (esquerdo) ou botão do meio
    if (e.button !== 0 && e.button !== 1) return;

    // Se o elemento clicado for um controle interativo de formulário (input/select), não interceptar
    const target = e.target as HTMLElement | null;
    if (target?.closest("input, select, textarea")) {
      return;
    }

    isPointerDownRef.current = true;
    wasDraggedRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startPanRef.current = { ...pan };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Falha graciosa se ambiente não suportar capture
    }
  }, [pan]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;

    if (!wasDraggedRef.current && isExceedingDragThreshold(dx, dy)) {
      wasDraggedRef.current = true;
      setIsDragging(true);
    }

    if (wasDraggedRef.current) {
      setPan(calculatePanOffset(startPanRef.current, startPosRef.current, {
        x: e.clientX,
        y: e.clientY,
      }));
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar caso já liberado
    }

    if (wasDraggedRef.current) {
      setIsDragging(false);
      // Mantém temporariamente para o onClickCapture suprimir disparos acidentais
      setTimeout(() => {
        wasDraggedRef.current = false;
      }, 60);
    }
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (wasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  return {
    zoom,
    setZoom,
    pan,
    setPan,
    isDragging,
    viewportRef,
    zoomIn,
    zoomOut,
    reset,
    canvasHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onClickCapture,
    },
  };
}
