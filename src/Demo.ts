import {
  Clock,
  PerspectiveCamera,
  Vector2,
  Scene,
  ACESFilmicToneMapping,
  Box2,
  MathUtils,
  BufferGeometry,
  PlaneGeometry,
  Mesh,
  Vector3,
  Color,
  EquirectangularReflectionMapping,
  BufferAttribute,
  BatchedMesh,
  Object3D,
  Plane,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  pass,
  PostProcessing,
  Renderer,
  fxaa,
  dof,
  ao,
  uniform,
  output,
  mrt,
  transformedNormalView,
  Raycaster,
  viewportUV,
  clamp,
  FloatType,
  MeshStandardNodeMaterial,
  MeshPhysicalNodeMaterial,
  Vector4,
} from "three/webgpu";
import { AIAgentBlock } from "./lib/AIAgentBlock";
import {
  ContestantCategory,
  loadContestantsData,
  createContestant,
} from "./lib/ContestantData";
import { OrbitControls, UltraHDRLoader } from "three/examples/jsm/Addons.js";
import WebGPU from "three/examples/jsm/capabilities/WebGPU.js";
import { ABlock } from "./lib/ABlock";
import { BlockGeometry } from "./lib/BlockGeometry";
import FastSimplexNoise from "@webvoxel/fast-simplex-noise";
import { Pointer } from "./lib/Pointer";
import { WebGPURenderer } from "three/webgpu";
import * as TWEEN from "three/examples/jsm/libs/tween.module.js";

export class Demo {
  static instance: Demo;
  static firstRenderDone: boolean = false;
  canvas: HTMLCanvasElement | null;
  renderer?: WebGPURenderer;
  camera: PerspectiveCamera = new PerspectiveCamera(20, 1, 0.1, 500);
  controls?: OrbitControls;
  post?: PostProcessing;
  scene: Scene = new Scene();
  pointerHandler?: Pointer;
  clock: Clock = new Clock(false);
  private agentBlocks: Map<number, AIAgentBlock> = new Map();
  private activeAgent: AIAgentBlock | null = null;
  private raycaster: Raycaster = new Raycaster();
  private activeCategory: ContestantCategory | null = null;
  private animationsFrozen: boolean = false;
  private isDisposed: boolean = false;
  private isLightweight: boolean = false;

  /**
   * Accessor from react to set the theme
   * @param theme "light" or "dark"
   */
  static setTheme(theme: string) {
    if (this.instance) {
      this.instance.setColorMode(theme);
    }
  }

  constructor(
    canvas: HTMLCanvasElement,
    initOptions: { lightweight?: boolean } = {}
  ) {
    if (Demo.instance != null) {
      console.warn("Demo instance already exists - disposing it first");
      Demo.instance.dispose();
      // After dispose, Demo.instance should be null
    }

    this.canvas = canvas;
    this.isLightweight = initOptions.lightweight || false;

    // Only add canvas listeners if not in lightweight mode
    if (!this.isLightweight) {
      this.addCanvasListeners();
    }

    Demo.instance = this;
  }

  dispose() {
    if (this.isDisposed) return;

    console.log("Fully disposing Demo instance");
    this.isDisposed = true;
    this.removeCanvasListeners();

    // For lightweight instances, we can skip most of this
    if (this.isLightweight) {
      this.canvas = null;
      Demo.instance = null;
      return;
    }

    // Stop animations before anything else
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
    }

    // Clear scene first to remove objects and their GPU resources
    if (this.scene) {
      // Remove all objects and materials
      this.scene.traverse((object) => {
        if (object instanceof Mesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      this.scene.clear();

      // Clear background and environment textures
      if (this.scene.background) {
        if ("dispose" in this.scene.background) {
          (this.scene.background as any).dispose();
        }
        this.scene.background = null;
      }
      if (this.scene.environment) {
        if ("dispose" in this.scene.environment) {
          (this.scene.environment as any).dispose();
        }
        this.scene.environment = null;
      }
    }

    // Dispose post-processing
    if (this.post) {
      this.post = undefined;
    }

    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
      this.controls = undefined;
    }

    // Dispose renderer last
    if (this.renderer) {
      try {
        if (typeof this.renderer.dispose === "function") {
          this.renderer.dispose();
        }
      } catch (error) {
        console.warn("Error disposing renderer:", error);
      }
      this.renderer = undefined;
    }

    // Remove event listeners
    window.removeEventListener("resize", this.onResize.bind(this));

    // Clear references and reset state
    this.blocks = [];
    this.agentBlocks.clear();
    this.activeAgent = null;
    this.canvas = null;

    // Reset the singleton instance and first render flag
    Demo.instance = null;
    Demo.firstRenderDone = false;
  }

  private addCanvasListeners() {
    if (this.canvas) {
      this.canvas.addEventListener("click", this.handlePointerClick.bind(this));
    }
  }

  private removeCanvasListeners() {
    if (this.canvas) {
      this.canvas.removeEventListener(
        "click",
        this.handlePointerClick.bind(this)
      );
    }
  }

  // start here
  async init() {
    // If this is a lightweight instance, don't initialize WebGPU
    if (this.isLightweight) {
      console.log(
        "Skipping WebGPU initialization for lightweight Demo instance"
      );
      return true;
    }

    if (!this.canvas) {
      console.warn("No canvas available for initialization");
      return false;
    }

    if (!WebGPU.isAvailable()) {
      console.error("WebGPU is not supported in this browser");
      document.body.classList.remove("loading");
      document.body.classList.add("webgpu-error");
      return Promise.reject(new Error("WebGPU not available"));
    }

    // Clean up existing renderer if it exists
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
      if (this.renderer.dispose) {
        this.renderer.dispose();
      }
      this.renderer = undefined;
    }

    // Reset disposed flag since we're reinitializing
    this.isDisposed = false;

    // Remove old listeners and add new ones
    this.removeCanvasListeners();
    this.addCanvasListeners();

    try {
      console.log("Initializing WebGPU renderer...");
      this.renderer = new WebGPURenderer({
        canvas: this.canvas,
        antialias: true,
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio for better performance
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.toneMapping = ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 0.9;

      window.addEventListener("resize", this.onResize.bind(this));

      this.initCamera();
      this.initPostProcessing();

      this.onResize(undefined);
      this.pointerHandler = new Pointer(
        this.renderer,
        this.camera,
        new Plane(new Vector3(0, 1, 0), 0)
      );

      console.log("Loading geometries and environment...");
      await BlockGeometry.init();
      await this.initEnvironment();
      await this.initGrid();
      await this.initBlocks();

      console.log("WebGPU initialization complete");
      document.body.classList.remove("loading");

      this.clock.start();
      this.renderer.setAnimationLoop(this.animate.bind(this));

      return true;
    } catch (error) {
      console.error("Fatal error initializing Demo:", error);
      document.body.classList.remove("loading");
      document.body.classList.add("webgpu-error");

      // Cleanup any partial initialization
      this.dispose();

      return Promise.reject(error);
    }
  }

  initCamera() {
    // setting the camera so that the scene is vaguely centered and fits the screen, at an angle where the light is gently grazing the objects
    const initCamAngle: number = (-Math.PI * 2) / 3;
    const initCamDist: number = 100;
    const camOffsetToFit: Vector3 = new Vector3(
      Math.cos(initCamAngle),
      0,
      Math.sin(initCamDist)
    ).multiplyScalar(10);
    this.camera.position
      .set(
        Math.cos(initCamAngle) * initCamDist,
        55,
        Math.sin(initCamAngle) * initCamDist
      )
      .add(camOffsetToFit);
    this.camera.updateProjectionMatrix();

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.maxPolarAngle = Math.PI / 2 - Math.PI / 16;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 250;
    this.controls.target.set(0, 0, 0).add(camOffsetToFit);
    this.controls.update();
  }

  effectController;
  initPostProcessing() {
    /*
     * post-processing set up with :
     * - a scene pass that outputs the color, normal and depth
     * - an ambient occlusion pass that uses the depth and normal to compute the AO
     * - a depth of field pass that uses the AO and the viewZ to compute the blur. Parameters are dynamic and updated in the animate loop
     * - an FXAA pass to antialias the final image
     */
    this.post = new PostProcessing(this.renderer as Renderer);

    const effectController = {
      focus: uniform(32.0),
      aperture: uniform(100),
      maxblur: uniform(0.02),
    };
    this.effectController = effectController;

    const scenePass = pass(this.scene, this.camera);
    scenePass.setMRT(
      mrt({
        output: output,
        normal: transformedNormalView,
      })
    );

    const scenePassColor = scenePass.getTextureNode("output");
    const scenePassNormal = scenePass.getTextureNode("normal");
    const scenePassDepth = scenePass.getTextureNode("depth");

    const aoPass = ao(scenePassDepth, scenePassNormal, this.camera);
    aoPass.distanceExponent.value = 1;
    aoPass.distanceFallOff.value = 0.1;
    aoPass.radius.value = 1.0;
    aoPass.scale.value = 1.5;
    aoPass.thickness.value = 1;

    const blendPassAO = aoPass.getTextureNode().mul(scenePassColor);
    const scenePassViewZ = scenePass.getViewZNode();
    const dofPass = dof(
      blendPassAO,
      scenePassViewZ,
      effectController.focus,
      effectController.aperture.mul(0.00001),
      effectController.maxblur
    );
    const vignetteFactor = clamp(
      viewportUV.sub(0.5).length().mul(1.2),
      0.0,
      1.0
    )
      .oneMinus()
      .pow(0.5);
    this.post.outputNode = fxaa(dofPass.mul(vignetteFactor));
  }

  async initEnvironment() {
    const { scene } = this;

    try {
      // loads an ultra hdr skybox to get some nice natural tinting and a few reflections
      // skybox is https://polyhaven.com/a/rustig_koppie_puresky , converted to ultra hdr jpg with with https://gainmap-creator.monogrid.com/
      const texture = await new UltraHDRLoader()
        .setDataType(FloatType)
        .setPath("./assets/ultrahdr/")
        .loadAsync("rustig_koppie_puresky_2k.jpg", (progress) => {
          console.log(
            (progress.loaded / progress.total) * 100 + "% skybox loaded"
          );
        });

      texture.mapping = EquirectangularReflectionMapping;
      texture.needsUpdate = true;

      // Clear existing background and environment before setting new ones
      if (scene.background) {
        scene.background = null;
      }
      if (scene.environment) {
        scene.environment = null;
      }

      scene.background = texture;
      scene.environment = texture;

      const groundGeom: BufferGeometry = new PlaneGeometry(50, 50, 1, 1); // Match grid size
      groundGeom.rotateX(-Math.PI * 0.5);
      const groundMat: MeshStandardNodeMaterial = new MeshStandardNodeMaterial({
        color: 0x333333,
      });
      const groundMesh: Mesh = new Mesh(groundGeom, groundMat);
      scene.add(groundMesh);

      return true;
    } catch (error) {
      console.error("Error initializing environment:", error);
      return false;
    }
  }

  blocks: ABlock[] = [];
  gridZone: Box2 = new Box2(new Vector2(0, 0), new Vector2(50, 50)); // Reduced grid size for better layout
  selectedBlock?: ABlock;
  onBlockClick?: (block: ABlock) => void;

  async initGrid() {
    // Load real contestant data from storage instead of generating mock data
    const contestants = await loadContestantsData();

    // If no data exists yet, create some initial entries
    if (contestants.length === 0) {
      // Create some basic entries for each category
      const tracks = Object.keys({
        "AI/ML": 0,
        Web3: 1,
        Gaming: 2,
        Mobile: 3,
        Social: 4,
      });

      // Add a sponsor
      contestants.push(
        createContestant(
          "Demo Sponsor",
          "Demo Sponsor",
          "Platform Integration",
          "Providing cloud credits and technical support",
          tracks[0],
          5,
          "sponsor"
        )
      );

      // Add a judge
      contestants.push(
        createContestant(
          "Demo Judge",
          "Judges Panel",
          "Hackathon Judging",
          "Industry expert in AI",
          tracks[1],
          1,
          "judge"
        )
      );

      // Add a prize
      contestants.push(
        createContestant(
          "Grand Prize",
          "Prize Pool",
          "Grand Prize",
          "Win by excelling in Web3",
          tracks[2],
          0,
          "prize"
        )
      );

      // Add a contestant
      contestants.push(
        createContestant(
          "Demo Team",
          "Team Demo",
          "Project Demo",
          "An innovative project that aims to solve AI/ML challenges",
          tracks[3],
          3,
          "contestant"
        )
      );
    }

    const zone: Box2 = this.gridZone;
    const maxBlockSize: Vector2 = new Vector2(5, 5);
    maxBlockSize.x = MathUtils.randInt(1, 5);
    maxBlockSize.y = maxBlockSize.x;

    let px: number = 0;
    let py: number = 0;

    // Double array to store the occupation state of the grid. -1 means free, any other number is the block id
    const occupied: number[][] = Array.from(
      { length: this.gridZone.max.x },
      () => Array(this.gridZone.max.y).fill(-1)
    );

    const squareChance: number = 0.5;
    // fills the whole grid with blocks of random sizes and colors
    while (py < zone.max.y) {
      while (px < zone.max.x) {
        let maxW: number = 0;
        const end: number = Math.min(zone.max.x, px + maxBlockSize.x);
        // check for the maximum width available
        for (let i: number = px; i < end; i++) {
          if (occupied[i][py] != -1) {
            break;
          }
          maxW++;
        }
        if (maxW == 0) {
          px++;
          continue;
        }

        // create a block entity with random paramaters
        const block: ABlock = new ABlock();
        const isSquare: boolean = MathUtils.randFloat(0, 1) < squareChance;
        block.typeTop = isSquare ? MathUtils.randInt(0, 5) : 0;
        block.typeBottom = BlockGeometry.topToBottom.get(block.typeTop)!;

        // Find an unassigned contestant of any category
        const contestant = contestants.find(
          (c) => !this.blocks.some((b) => b.contestant?.id === c.id)
        );
        if (contestant) {
          block.contestant = contestant;
          block.setTopColorIndex(contestant.colorIndex);
        } else {
          block.setTopColorIndex(
            MathUtils.randInt(0, ABlock.LIGHT_COLORS.length - 1)
          );
        }
        // define size and position
        const sx: number = MathUtils.randInt(1, maxW);
        const sy: number = isSquare ? sx : MathUtils.randInt(1, maxBlockSize.y);
        block.box.min.set(px, py);
        block.box.max.set(px + sx, py + sy);
        block.height = 1;
        block.rotation = isSquare
          ? (MathUtils.randInt(0, 4) * Math.PI) / 2
          : MathUtils.randInt(0, 2) * Math.PI;

        this.blocks.push(block);

        // fill occupied grid
        const endX: number = Math.min(zone.max.x, px + sx);
        const endY: number = Math.min(zone.max.y, py + sy);
        for (let i: number = px; i < endX; i++) {
          for (let j: number = py; j < endY; j++) {
            occupied[i][j] = block.id;
          }
        }
        px += sx;
      }
      py++;
      px = 0;

      // max sizes have a chance to be randomized after every line, to create some structure
      if (MathUtils.randFloat(0, 1) > 0.8) {
        maxBlockSize.x = MathUtils.randFloat(0, 1) > 0.5 ? 2 : 5;
        maxBlockSize.y = MathUtils.randFloat(0, 1) > 0.5 ? 2 : 5;
      }
    }
  }

  blockMesh?: BatchedMesh;
  async initBlocks() {
    const matParams = {
      roughness: 0.1,
      metalness: 0.0,
    };
    const mat: MeshPhysicalNodeMaterial = new MeshPhysicalNodeMaterial(
      matParams
    );
    mat.envMapIntensity = 0.25;

    // evaluate the maximum vertex and index count of the geometries
    const geoms: BufferGeometry[] = [];
    for (let i: number = 0; i < BlockGeometry.geoms.length; i++) {
      geoms.push(BlockGeometry.geoms[i]);
    }

    const vCounts: number[] = [];
    const iCounts: number[] = [];
    let totalV: number = 0;
    let totalI: number = 0;
    // get the vertex and index counts for each geometry
    for (let i: number = 0; i < geoms.length; i++) {
      const g: BufferGeometry = geoms[i];
      vCounts.push(g.attributes.position.count);
      iCounts.push((g.index as BufferAttribute).count);
    }

    // calculate the total vertex and index count
    for (let i: number = 0; i < this.blocks.length; i++) {
      totalV += vCounts[this.blocks[i].typeBottom];
      totalV += vCounts[this.blocks[i].typeTop];
      totalI += iCounts[this.blocks[i].typeBottom];
      totalI += iCounts[this.blocks[i].typeTop];
    }

    // create the mesh
    const maxBlocks: number = this.blocks.length * 2; // top and bottom
    this.blockMesh = new BatchedMesh(maxBlocks, totalV, totalI, mat);
    this.blockMesh.sortObjects = false; // depends on your use case, here I've had better performances without sorting
    this.blockMesh.position.x = -this.gridZone.max.x * 0.5;
    this.blockMesh.position.z = -this.gridZone.max.y * 0.5;
    this.scene.add(this.blockMesh);

    // setup the geometries and instances
    const geomIds: number[] = [];
    for (let i: number = 0; i < geoms.length; i++) {
      // all our geometries
      geomIds.push(this.blockMesh.addGeometry(geoms[i]));
    }

    // one top and one bottom for each block
    for (let i: number = 0; i < this.blocks.length; i++) {
      const block: ABlock = this.blocks[i];
      this.blockMesh.addInstance(geomIds[block.typeBottom]);
      this.blockMesh.addInstance(geomIds[block.typeTop]);
      this.blockMesh.setColorAt(i * 2, block.baseColor);
      this.blockMesh.setColorAt(i * 2 + 1, block.topColor);
    }
  }

  onResize(e?: Event, toSize?: Vector2) {
    const { camera, renderer } = this;
    const size: Vector2 = new Vector2(window.innerWidth, window.innerHeight);
    if (toSize) size.copy(toSize);

    const ww: number = window.innerWidth;
    const wh: number = window.innerHeight;
    const aspect: number = ww / wh;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    renderer!.setPixelRatio(1);
    renderer!.setSize(size.x, size.y);
    renderer!.domElement.style.width = `${size.x}px`;
    renderer!.domElement.style.height = `${size.y}px`;
  }

  elapsed: number = 0;
  async animate() {
    if (this.isDisposed || !this.renderer || !this.post || !this.controls) {
      return;
    }

    const { controls, clock, post } = this;

    const dt: number = clock.getDelta();
    this.elapsed = clock.getElapsedTime();

    this.updateBlocks(dt, this.elapsed);
    this.updateAgents(dt); // Update AI agents
    this.updateCamera(dt);
    controls!.update(dt);

    try {
      await post!.renderAsync();
    } catch (error) {
      console.warn("Error in render loop, ignoring:", error);
    }

    // Update TWEEN animations
    TWEEN.update();

    if (!Demo.firstRenderDone) {
      Demo.firstRenderDone = true;
    }
  }

  themeTransitionStart: number = -10;
  themeTransitionDuration: number = 5;
  dummy: Object3D = new Object3D();
  tempCol: Color = new Color();
  blockSize: Vector2 = new Vector2(1, 1);
  blockCenter: Vector2 = new Vector2();
  heightNoise: FastSimplexNoise = new FastSimplexNoise({
    frequency: 0.05,
    octaves: 2,
    min: 0,
    max: 1,
    persistence: 0.5,
  });
  wavesAmplitude: number = 8;
  setActiveCategory(category: ContestantCategory | null) {
    // Return all active agents
    if (this.activeAgent) {
      this.activeAgent.return();
      this.activeAgent = null;
    }

    // Set category and animation state
    this.activeCategory = category;
    this.animationsFrozen = category !== null;

    // Reset all highlighted blocks
    if (this.selectedBlock) {
      this.selectedBlock.isHighlighted = false;
      this.selectedBlock = undefined;
    }

    // Reset all blocks to base height first
    this.blocks.forEach((block) => {
      block.height = 1.0;
      block.heightVelocity = 0;
    });

    // Then set target heights based on category
    if (category) {
      this.blocks.forEach((block) => {
        if (block.contestant?.category !== category) {
          block.height = 0.2;
          block.targetHeight = 0.2;
        }
      });
    }
  }

  private handlePointerClick(event: MouseEvent) {
    if (!this.blockMesh || !this.camera || !this.canvas) return;

    try {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(new Vector2(x, y), this.camera);
      const intersects = this.raycaster.intersectObject(this.blockMesh);

      if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
        const instanceId = Math.floor(intersects[0].instanceId / 2);

        // Ensure the block exists in our blocks array
        if (instanceId < 0 || instanceId >= this.blocks.length) {
          console.warn(`Invalid block instance ID: ${instanceId}`);
          return;
        }

        const block = this.blocks[instanceId];
        if (!block) {
          console.warn(`Block not found for instance ID: ${instanceId}`);
          return;
        }

        // Only interact with blocks of the active category
        if (
          !this.activeCategory ||
          block.contestant?.category === this.activeCategory
        ) {
          // Deselect previous block
          if (this.selectedBlock && this.selectedBlock !== block) {
            this.selectedBlock.isHighlighted = false;
          }

          // Select new block
          this.selectedBlock = block;
          block.isHighlighted = true;

          // Create or update agent block
          if (this.activeAgent) {
            this.activeAgent.return();
          }

          let agentBlock = this.agentBlocks.get(block.id);
          if (!agentBlock) {
            agentBlock = new AIAgentBlock(block);
            this.agentBlocks.set(block.id, agentBlock);
          }
          agentBlock.emerge();
          this.activeAgent = agentBlock;

          if (this.onBlockClick) {
            this.onBlockClick(block);
          }
        }
      }
    } catch (error) {
      console.error("Error in handlePointerClick:", error);
    }
  }

  updateBlocks(dt: number, elapsed: number) {
    const {
      camera,
      raycaster,
      dummy,
      blockMesh,
      blocks,
      pointerHandler,
      groundRayPlane,
      heightNoise,
      wavesAmplitude,
      gridZone,
      blockSize,
      blockCenter,
      tempCol,
      cubicPulse,
    } = this;
    if (blockMesh == null) return;

    // Skip wave animations if frozen
    if (this.animationsFrozen) {
      return;
    }

    // calculate the transition time
    const transitionTime: number = MathUtils.clamp(
      (elapsed - this.themeTransitionStart) / this.themeTransitionDuration,
      0,
      1
    );
    const echoTime: number = MathUtils.clamp(
      (elapsed - this.themeTransitionStart - 0.3) /
        this.themeTransitionDuration,
      0,
      1
    ); // a bit of delay for the second ripple

    let targetHeight: number = 0;
    let baseI: number = 0;
    let topI: number = 0;

    // gets a raycast camera->ground so that the rippling effect is centered on screen
    const camDir: Vector3 = this.camDir;
    if (transitionTime < 1) {
      camera.getWorldDirection(camDir);
      groundRayPlane.constant = camera.position.y * 0.1;
      const temp = new Vector3().copy(camera.position);
      temp.y -= 10;
      raycaster.set(temp, camDir.normalize());
      raycaster.ray.intersectPlane(this.groundRayPlane, camDir);
    }

    let block: ABlock;
    let dx: number = 0;
    let dz: number = 0;
    let cDist: number = 0;
    let cFactor: number = 0;
    let noise: number = 0;
    let from0: number = 0;
    let ripple: number = 0;
    let echoRipple: number = 0;

    // update the blocks
    for (let i: number = 0; i < blocks.length; i++) {
      block = blocks[i];
      // our indices for this block in the batched mesh, a top and a bottom
      baseI = i * 2;
      topI = i * 2 + 1;

      block.box.getSize(blockSize);
      block.box.getCenter(blockCenter);

      // get block offset from pointer
      dx =
        blockCenter.x - pointerHandler!.scenePointer.x + blockMesh.position.x;
      dz =
        blockCenter.y - pointerHandler!.scenePointer.z + blockMesh.position.z;

      // calculate the height of the block wrt the distance from the pointer
      cDist = Math.sqrt(dx * dx + dz * dz);
      cFactor = MathUtils.clamp(1 - cDist * 0.1, 0, 1);
      noise = heightNoise.scaled2D(
        block.box.min.x * 0.1,
        block.box.min.y + elapsed * 5
      );
      // Adjust height based on contestant progress if available
      const progressBoost = block.contestant
        ? block.contestant.progress * 3
        : 0;
      const highlightBoost = block.isHighlighted ? 5 : 0;
      targetHeight =
        noise * wavesAmplitude +
        1 +
        cFactor * 5 +
        progressBoost +
        highlightBoost;

      if (transitionTime < 1) {
        // calculate the ripple effect based on the distance from the center of the screen
        from0 = MathUtils.clamp(
          (Math.sqrt(
            Math.pow(blockCenter.x - camDir.x - gridZone.max.x * 0.5, 2) +
              Math.pow(blockCenter.y - camDir.z - gridZone.max.y * 0.5, 2)
          ) /
            gridZone.max.x) *
            0.5,
          0,
          1
        );
        ripple = cubicPulse(
          Math.pow(this.gain(transitionTime, 1.1), 0.9),
          0.05,
          from0
        );
        echoRipple = cubicPulse(this.gain(echoTime, 1.3), 0.025, from0);
        targetHeight += ripple * 10 + echoRipple * 5;
      }

      // lerp the height of the block
      if (targetHeight >= block.height) {
        // raises slower than when going down
        block.height = MathUtils.lerp(block.height, targetHeight, 0.1);
      } else {
        block.height = MathUtils.lerp(block.height, targetHeight, 0.3);
      }

      // update the block mesh with matrices and colors
      // first the bottom, color changes on the first ripple
      dummy.rotation.y = block.rotation;
      dummy.position.set(blockCenter.x, 0, blockCenter.y);
      dummy.scale.set(blockSize.x, block.height, blockSize.y);
      dummy.updateMatrix();
      blockMesh.setMatrixAt(baseI, dummy.matrix);
      blockMesh.getColorAt(baseI, tempCol);
      tempCol.lerp(this.baseTargetColor, ripple);
      blockMesh.setColorAt(baseI, tempCol);

      // then the top, color changes on the second ripple
      dummy.position.y += block.height;
      dummy.scale.set(blockSize.x, 1, blockSize.y);
      dummy.updateMatrix();
      blockMesh.setMatrixAt(topI, dummy.matrix);
      blockMesh.getColorAt(topI, tempCol);
      tempCol.lerp(this.topTargetColors[block.topColorIndex], echoRipple);
      blockMesh.setColorAt(topI, tempCol);
    }
  }

  groundRayPlane: Plane = new Plane(new Vector3(0, 1, 0), 0);
  camDist: number = 50;
  camdistVel: number = 0.0;
  camK: number = 0.05;
  camDir: Vector3 = new Vector3();

  // an approximation of an auto-focus effect
  updateCamera(dt: number) {
    const camDir: Vector3 = this.camDir;
    this.camera.getWorldDirection(camDir);
    this.groundRayPlane.constant = this.camera.position.y * 0.1;
    this.raycaster.set(this.camera.position, camDir.normalize());
    this.raycaster.ray.intersectPlane(this.groundRayPlane, camDir);
    const dist: number = camDir.sub(this.camera.position).length();

    const targetDist: number = dist;
    const distVel: number = (targetDist - this.camDist) / dt;
    this.camdistVel = MathUtils.lerp(this.camdistVel, distVel, this.camK);
    this.camDist += this.camdistVel * dt;

    this.effectController.focus.value = MathUtils.lerp(
      this.effectController.focus.value,
      this.camDist * 0.85,
      0.05
    );
    this.effectController.aperture.value = MathUtils.lerp(
      this.effectController.aperture.value,
      100 - this.camDist * 0.5,
      0.025
    );
  }

  colorsModes: string[] = ["dark", "light"];
  baseTargetColor: Color = new Color(0x999999);
  topTargetColors: Color[] = ABlock.LIGHT_COLORS;
  colorMode: string = this.colorsModes[1];

  setColorMode(mode: string) {
    this.colorMode = mode;
    this.themeTransitionStart = this.elapsed;
    if (this.colorMode == "dark") {
      this.baseTargetColor.copy(ABlock.DARK_BASE_COLOR);
      this.topTargetColors = ABlock.DARK_COLORS;
    } else {
      this.baseTargetColor.copy(ABlock.LIGHT_BASE_COLOR);
      this.topTargetColors = ABlock.LIGHT_COLORS;
    }
  }

  /// Inigo Quilez remaping functions https://iquilezles.org/articles/functions/
  pcurve(x: number, a: number, b: number): number {
    const k: number =
      Math.pow(a + b, a + b) / (Math.pow(a, a) * Math.pow(b, b));
    return k * Math.pow(x, a) * Math.pow(1.0 - x, b);
  }

  gain(x: number, k: number): number {
    const a: number = 0.5 * Math.pow(2.0 * (x < 0.5 ? x : 1.0 - x), k);
    return x < 0.5 ? a : 1.0 - a;
  }

  cubicPulse(c: number, w: number, x: number): number {
    let x2 = Math.abs(x - c);
    if (x2 > w) return 0.0;
    x2 /= w;
    return 1.0 - x2 * x2 * (3.0 - 2.0 * x2);
  }

  updateAgents(dt: number) {
    // Update all active agent animations
    this.agentBlocks.forEach((agent) => {
      agent.update(dt);
    });
  }

  triggerAgentAnimation(type: "idle" | "speaking" | "thinking") {
    if (this.activeAgent) {
      this.activeAgent.animate(type);
    }
  }

  // Returns the active agent block
  getActiveAgent() {
    return this.activeAgent;
  }

  // Explicitly handle returning an agent to its original position
  returnActiveAgent() {
    if (this.activeAgent) {
      this.activeAgent.return();
      this.activeAgent = null;
    }
  }

  // Activates an agent for the selected category
  activateCategoryAgent(category: ContestantCategory) {
    // Find a representative block for this category
    const categoryBlock = this.blocks.find(
      (block) =>
        block.contestant?.category === category &&
        block.contestant.aiPersona !== undefined
    );

    if (categoryBlock) {
      // Highlight the selected category block
      categoryBlock.isHighlighted = true;
      this.selectedBlock = categoryBlock;

      // Create or get its agent
      let agentBlock = this.agentBlocks.get(categoryBlock.id);
      if (!agentBlock) {
        agentBlock = new AIAgentBlock(categoryBlock);
        this.agentBlocks.set(categoryBlock.id, agentBlock);
      }

      // Activate the agent
      agentBlock.emerge();
      this.activeAgent = agentBlock;

      // Trigger event for any UI components to respond
      if (this.onBlockClick) {
        this.onBlockClick(categoryBlock);
      }
    }
  }

  // Gets the screen position of the active agent for UI positioning
  getAgentScreenPosition(): { x: number; y: number } | null {
    if (!this.activeAgent || !this.camera || !this.renderer) {
      return null;
    }

    // Get the agent's 3D position
    const agentBlock = this.blocks.find(
      (block) => block.id === this.activeAgent!.getBlockId()
    );
    if (!agentBlock) return null;

    // Calculate block center position
    const blockSize = new Vector2();
    const blockCenter = new Vector2();
    agentBlock.box.getSize(blockSize);
    agentBlock.box.getCenter(blockCenter);

    // Create a 3D position for the agent (centered on block, adjusted for height)
    const position = new Vector3(
      blockCenter.x - this.gridZone.max.x * 0.5, // Adjust for the grid offset
      agentBlock.height + 2, // Position above the block
      blockCenter.y - this.gridZone.max.y * 0.5 // Adjust for the grid offset
    );

    // Convert to screen coordinates
    const canvas = this.renderer.domElement;
    const vector = position.clone().project(this.camera);

    return {
      x: Math.round(((vector.x + 1) * canvas.width) / 2),
      y: Math.round(((-vector.y + 1) * canvas.height) / 2),
    };
  }

  // Method to safely stop the animation loop without disposing the instance
  stopAnimation() {
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
    }
  }

  // Method to safely restart the animation loop
  startAnimation() {
    if (this.renderer && !this.isDisposed) {
      this.renderer.setAnimationLoop(this.animate.bind(this));
    }
  }
}
