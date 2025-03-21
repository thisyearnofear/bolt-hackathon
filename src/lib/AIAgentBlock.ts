import { Vector3, MathUtils } from 'three/webgpu';
import { ABlock } from './ABlock';

export type AIAgentState = 'idle' | 'emerging' | 'active' | 'returning';

export class AIAgentBlock {
    private block: ABlock;
    private state: AIAgentState = 'idle';
    private animationProgress: number = 0;
    private targetPosition: Vector3;
    private originalPosition: Vector3;
    private originalScale: Vector3;
    private hoverHeight: number = 2;
    private emergeDuration: number = 1.0; // seconds
    private returnDuration: number = 0.8; // seconds

    constructor(block: ABlock) {
        this.block = block;
        this.originalPosition = block.position.clone();
        this.originalScale = block.scale.clone();
        this.targetPosition = this.originalPosition.clone();
        this.targetPosition.y += this.hoverHeight;
    }

    emerge() {
        if (this.state === 'idle') {
            this.state = 'emerging';
            this.animationProgress = 0;
        }
    }

    return() {
        if (this.state === 'active') {
            this.state = 'returning';
            this.animationProgress = 0;
        }
    }

    update(deltaTime: number) {
        switch (this.state) {
            case 'emerging':
                this.updateEmerging(deltaTime);
                break;
            case 'active':
                this.updateActive(deltaTime);
                break;
            case 'returning':
                this.updateReturning(deltaTime);
                break;
        }
    }

    private updateEmerging(deltaTime: number) {
        this.animationProgress += deltaTime / this.emergeDuration;
        if (this.animationProgress >= 1) {
            this.animationProgress = 1;
            this.state = 'active';
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
        // Add subtle floating animation
        const time = performance.now() * 0.001;
        const hoverOffset = Math.sin(time * 2) * 0.1;
        this.block.position.y = this.targetPosition.y + hoverOffset;

        // Add gentle rotation
        this.block.rotationVector.y += deltaTime * 0.5;
    }

    private updateReturning(deltaTime: number) {
        this.animationProgress += deltaTime / this.returnDuration;
        if (this.animationProgress >= 1) {
            this.animationProgress = 1;
            this.state = 'idle';
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
}
