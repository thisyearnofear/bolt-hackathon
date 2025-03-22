import { Vector3, MathUtils } from "three/webgpu";
import { ABlock } from "./ABlock";

export type AIAgentState = "idle" | "emerging" | "active" | "returning";
export type AIAgentAnimationType = "idle" | "speaking" | "thinking";

export class AIAgentBlock {
  private block: ABlock;
  private state: AIAgentState = "idle";
  private animationProgress: number = 0;
  private targetPosition: Vector3;
  private originalPosition: Vector3;
  private originalScale: Vector3;
  private hoverHeight: number = 2;
  private emergeDuration: number = 1.0; // seconds
  private returnDuration: number = 0.8; // seconds
  private currentAnimationType: AIAgentAnimationType = "idle";
  private animationStartTime: number = 0;

  constructor(block: ABlock) {
    this.block = block;
    this.originalPosition = block.position.clone();
    this.originalScale = block.scale.clone();
    this.targetPosition = this.originalPosition.clone();
    this.targetPosition.y += this.hoverHeight;
  }

  emerge() {
    if (this.state === "idle") {
      this.state = "emerging";
      this.animationProgress = 0;
    }
  }

  return() {
    if (this.state === "active") {
      this.state = "returning";
      this.animationProgress = 0;
    }
  }

  update(deltaTime: number) {
    switch (this.state) {
      case "emerging":
        this.updateEmerging(deltaTime);
        break;
      case "active":
        this.updateActive(deltaTime);
        break;
      case "returning":
        this.updateReturning(deltaTime);
        break;
    }
  }

  /**
   * Triggers a specific animation on the agent
   * @param type The type of animation to play
   */
  animate(type: AIAgentAnimationType) {
    if (this.state !== "active") return; // Only animate when active

    this.currentAnimationType = type;
    this.animationStartTime = performance.now();

    // Apply animation specific behaviors
    switch (type) {
      case "idle":
        // Reset to gentle hover animation
        break;
      case "speaking":
        // Apply speaking animation properties (more active movement)
        break;
      case "thinking":
        // Apply thinking animation (slight tilt, slower movement)
        break;
    }
  }

  private updateEmerging(deltaTime: number) {
    this.animationProgress += deltaTime / this.emergeDuration;
    if (this.animationProgress >= 1) {
      this.animationProgress = 1;
      this.state = "active";
    }

    // Position interpolation
    this.block.position.lerpVectors(
      this.originalPosition,
      this.targetPosition,
      this.easeOutCubic(this.animationProgress)
    );

    // Scale effect
    const scaleMultiplier = 1 + this.easeOutBack(this.animationProgress) * 0.5;
    this.block.scale.copy(this.originalScale).multiplyScalar(scaleMultiplier);
  }

  private updateActive(deltaTime: number) {
    const time = performance.now() * 0.001;
    let hoverOffset = 0;
    let rotationSpeed = 0.5;

    // Adjust animation based on current type
    switch (this.currentAnimationType) {
      case "idle":
        hoverOffset = Math.sin(time * 2) * 0.1;
        rotationSpeed = 0.5;
        break;
      case "speaking":
        // More active bobbing motion while speaking
        hoverOffset = Math.sin(time * 5) * 0.2;
        rotationSpeed = 1.0;
        break;
      case "thinking":
        // Slower, more contemplative movement
        hoverOffset = Math.sin(time * 1) * 0.15;
        // Add slight tilt
        this.block.rotationVector.z = Math.sin(time * 0.7) * 0.1;
        rotationSpeed = 0.2;
        break;
    }

    // Apply hover animation
    this.block.position.y = this.targetPosition.y + hoverOffset;

    // Apply rotation
    this.block.rotationVector.y += deltaTime * rotationSpeed;
  }

  private updateReturning(deltaTime: number) {
    this.animationProgress += deltaTime / this.returnDuration;
    if (this.animationProgress >= 1) {
      this.animationProgress = 1;
      this.state = "idle";
      // Reset any animation-specific properties
      this.block.rotationVector.z = 0;
      this.currentAnimationType = "idle";
    }

    // Position interpolation
    this.block.position.lerpVectors(
      this.targetPosition,
      this.originalPosition,
      this.easeInOutCubic(this.animationProgress)
    );

    // Scale interpolation
    const currentScale = this.originalScale.clone().multiplyScalar(1.5);
    this.block.scale.lerpVectors(
      currentScale,
      this.originalScale,
      this.easeInOutCubic(this.animationProgress)
    );
  }

  // Easing functions for smooth animations
  private easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
  }

  private easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  private easeOutBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  get currentState(): AIAgentState {
    return this.state;
  }

  /**
   * Returns the ID of the associated block
   */
  getBlockId(): number {
    return this.block.id;
  }
}
