import { useEffect, useRef } from "react";
import { Demo } from "../Demo";
import { ABlock } from "../lib/ABlock";

interface ThreeCanvasProps {
    onBlockClick?: (block: ABlock) => void;
}

export default function ThreeCanvas({ onBlockClick }: ThreeCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas == null) {
            throw new Error('Canvas not found');
        }
        if( Demo.instance != null) {
            console.warn("Demo instance already exists : aborting");
            return;
        }
        const demo: Demo = new Demo(canvas);
        if (onBlockClick) {
            demo.onBlockClick = onBlockClick;
        }

        (async () => {
            await demo.init();
        })();

    }, []);

    
    useEffect(() => {
        const canvas: HTMLCanvasElement | null = canvasRef.current;

        const resizeCanvas = () => {
            if (canvas == null) throw new Error('Canvas not found');

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
        }
        window.addEventListener('resize', resizeCanvas);

        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        }
    }, []);

    return (
        <canvas ref={canvasRef} id="threecanvas"></canvas>
    );
}