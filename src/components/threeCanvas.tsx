import { useEffect, useRef } from "react";
import { Demo } from "../Demo";
import { ABlock } from "../lib/ABlock";

interface ThreeCanvasProps {
  onBlockClick?: (block: ABlock) => void;
}

export default function ThreeCanvas({ onBlockClick }: ThreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const demoRef = useRef<Demo | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas == null) {
      throw new Error("Canvas not found");
    }

    // Always create a fresh instance for better stability
    demoRef.current = new Demo(canvas);
    if (onBlockClick) {
      demoRef.current.onBlockClick = onBlockClick;
    }

    // Initialize the demo instance
    demoRef.current.init();

    // Cleanup function to fully dispose the demo when component unmounts
    return () => {
      if (demoRef.current) {
        demoRef.current.dispose();
        demoRef.current = null;
        console.log("Fully disposed Demo instance in ThreeCanvas component");
      }
    };
  }, [onBlockClick]);

  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;

    const resizeCanvas = () => {
      if (canvas == null) throw new Error("Canvas not found");

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    window.addEventListener("resize", resizeCanvas);

    resizeCanvas();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} id="threecanvas"></canvas>;
}
