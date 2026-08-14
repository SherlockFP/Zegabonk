export interface MoveIntent {
  x: number;
  z: number;
}

export class InputController {
  private readonly pressed = new Set<string>();
  private enabled = false;
  private attackQueued = false;
  private interactQueued = false;
  private pointerTarget: HTMLCanvasElement | null = null;
  private cameraYaw = 0;
  private cameraPitch = 0;
  private mouseSensitivity = 1;

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.clear);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.clear();
  }

  setPointerTarget(target: HTMLCanvasElement): void {
    if (this.pointerTarget === target) return;
    this.pointerTarget?.removeEventListener("pointerdown", this.onPointerDown);
    this.pointerTarget = target;
    target.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("mousemove", this.onMouseMove);
  }

  setMouseSensitivity(value: number): void {
    this.mouseSensitivity = Math.max(0.35, Math.min(2.5, value));
  }

  requestAttack(): void {
    if (this.enabled) this.attackQueued = true;
  }

  consumeAttackIntent(): boolean {
    const requested = this.attackQueued;
    this.attackQueued = false;
    return requested;
  }

  consumeInteractIntent(): boolean {
    const requested = this.interactQueued;
    this.interactQueued = false;
    return requested;
  }

  getMoveIntent(): MoveIntent {
    if (!this.enabled) return { x: 0, z: 0 };
    const localX = Number(this.pressed.has("KeyD")) - Number(this.pressed.has("KeyA"));
    const localZ = Number(this.pressed.has("KeyS")) - Number(this.pressed.has("KeyW"));
    const length = Math.hypot(localX, localZ) || 1;
    const x = localX / length;
    const z = localZ / length;
    // Renderer camera is diagonally offset from the focus point. These are
    // its horizontal forward/right bases, so WASD agrees with the view rather
    // than an abstract world yaw.
    const forwardX = -Math.sin(this.cameraYaw + Math.atan2(0.72, 1));
    const forwardZ = -Math.cos(this.cameraYaw + Math.atan2(0.72, 1));
    const rightX = -forwardZ;
    const rightZ = forwardX;
    return { x: rightX * x - forwardX * z, z: rightZ * x - forwardZ * z };
  }

  getCameraYaw(): number {
    return this.cameraYaw;
  }

  getCameraPitch(): number {
    return this.cameraPitch;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    this.pressed.add(event.code);
    if (this.enabled && event.code === "KeyQ" && !event.repeat) this.attackQueued = true;
    if (this.enabled && event.code === "KeyE" && !event.repeat) this.interactQueued = true;
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled || event.button !== 0 || !this.pointerTarget || document.pointerLockElement === this.pointerTarget) return;
    void this.pointerTarget.requestPointerLock?.();
  };

  private readonly onMouseMove = (event: MouseEvent): void => {
    if (!this.enabled || !this.pointerTarget || document.pointerLockElement !== this.pointerTarget) return;
    this.cameraYaw -= event.movementX * 0.0022 * this.mouseSensitivity;
    this.cameraPitch = Math.max(-0.45, Math.min(0.35, this.cameraPitch - event.movementY * 0.0018 * this.mouseSensitivity));
  };

  private readonly clear = (): void => {
    this.pressed.clear();
    this.attackQueued = false;
    this.interactQueued = false;
  };
}
