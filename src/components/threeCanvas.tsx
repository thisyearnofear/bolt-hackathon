import { useEffect, useRef, useState } from "react";
import { Demo } from "../Demo";
import { ABlock } from "../lib/ABlock";
import WebGPU from "three/examples/jsm/capabilities/WebGPU.js";

interface ThreeCanvasProps {
  onBlockClick?: (block: ABlock) => void;
}

export default function ThreeCanvas({ onBlockClick }: ThreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const demoRef = useRef<Demo | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas == null) {
      throw new Error("Canvas not found");
    }

    // Check WebGPU support first
    if (!WebGPU.isAvailable()) {
      setInitError(
        "WebGPU is not available in your browser. Please use a browser that supports WebGPU, such as Chrome 113+, Edge 113+, or Opera 99+."
      );
      return;
    }

    // Always create a fresh instance for better stability
    demoRef.current = new Demo(canvas);
    if (onBlockClick) {
      demoRef.current.onBlockClick = onBlockClick;
    }

    // Initialize the demo instance with error handling
    demoRef.current.init().catch((error) => {
      console.error("Failed to initialize WebGPU demo:", error);
      setInitError(
        "Failed to initialize 3D scene. Please check if your browser supports WebGPU and hardware acceleration is enabled."
      );
    });

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

  return (
    <>
      <canvas ref={canvasRef} id="threecanvas"></canvas>
      {initError && (
        <div
          className="webgpu-error-message"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "20px",
            borderRadius: "8px",
            maxWidth: "80%",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          <h2>3D Scene Error</h2>
          <p>{initError}</p>
          <p>
            You can still navigate to the{" "}
            <a href="/admin" style={{ color: "#4a9eff" }}>
              Admin Dashboard
            </a>{" "}
            to manage your hackathon.
          </p>
        </div>
      )}
    </>
  );
}
