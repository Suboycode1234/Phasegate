// Unified input controller for Space3D Game
// Handles pointer lock, mouse look deltas, and keyboard states

export class InputManager {
  constructor(domElement) {
    this.domElement = domElement;
    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      leftButton: false,
      rightButton: false,
      isLocked: false
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);

    // Safeguard: Clear stuck keys and mouse inputs when window loses focus (Alt-Tab)
    this.onWindowBlur = () => {
      this.keys = {};
      this.mouse.leftButton = false;
      this.mouse.rightButton = false;
      this.mouse.dx = 0;
      this.mouse.dy = 0;
    };
    window.addEventListener('blur', this.onWindowBlur);

    // Safeguard: Prevent browser right-click context menu from breaking pointer lock
    this.onContextMenu = (e) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', this.onContextMenu);

    this.domElement.addEventListener('click', () => {
      if (!this.mouse.isLocked) {
        this.domElement.requestPointerLock();
      }
    });
  }

  onKeyDown(e) {
    this.keys[e.code] = true;
  }

  onKeyUp(e) {
    this.keys[e.code] = false;
  }

  onMouseMove(e) {
    if (this.mouse.isLocked) {
      this.mouse.dx += e.movementX || 0;
      this.mouse.dy += e.movementY || 0;
    }
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  onMouseDown(e) {
    if (e.button === 0) this.mouse.leftButton = true;
    if (e.button === 2) this.mouse.rightButton = true;
  }

  onMouseUp(e) {
    if (e.button === 0) this.mouse.leftButton = false;
    if (e.button === 2) this.mouse.rightButton = false;
  }

  onPointerLockChange() {
    this.mouse.isLocked = document.pointerLockElement === this.domElement;
  }

  isDown(code) {
    if (code === 'Escape' || code === 'KeyEscape') {
      const val = !!this.keys['Escape'] || !!this.keys['KeyEscape'];
      this.keys['Escape'] = false;
      this.keys['KeyEscape'] = false;
      return val;
    }
    return !!this.keys[code];
  }

  consumeMouseDelta() {
    const delta = { x: this.mouse.dx, y: this.mouse.dy };
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    return delta;
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }
}
