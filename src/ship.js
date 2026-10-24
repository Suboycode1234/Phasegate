// StarShip Flight Controller, 6-DOF Physics, Particle Thrusters & Weapons
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { sounds } from './audio.js';

export class ShipController {
  constructor(scene, camera, inputManager) {
    this.scene = scene;
    this.camera = camera;
    this.input = inputManager;

    this.shipGroup = new THREE.Group();
    this.model = null;

    // Flight dynamics
    this.velocity = new THREE.Vector3();
    this.angularVelocity = new THREE.Vector3();
    this.speed = 0;
    this.maxNormalSpeed = 48.0;
    this.maxBoostSpeed = 95.0;
    this.acceleration = 35.0;
    this.drag = 0.985;
    this.angularDrag = 0.92;

    // Ship vital status
    this.shield = 100;
    this.maxShield = 100;
    this.hull = 100;
    this.maxHull = 100;
    this.boostEnergy = 100;
    this.maxBoostEnergy = 100;
    this.isBoosting = false;

    // Laser hardpoints
    this.weaponCooldown = 0;
    this.fireRate = 0.14; // seconds
    this.activeHardpoint = 0; // alternate left/right

    // Thruster visual effects
    this.thrusterLight = null;
    this.thrusterFlames = [];

    // Camera follow parameters (framed for the massive, imposing 34m starship)
    this.cameraOffset = new THREE.Vector3(0, 16.0, 52.0);
    this.baseFov = 60;
    this.boostFov = 74;

    // Hyperjump Warp Drive System
    this.hyperjumpActive = false;
    this.hyperjumpTimer = 0;
    this.warpStreaks = null;
    this.combat = null;
    this.onHyperjumpStatus = null;
    this.prevJumpKey = false;

    // Seated-Only Flight Control State (Ship moves only when player is sitting in the seat)
    this.isPiloted = false;
    this.viewMode = 'cockpit';
    this.cameraSnapNeeded = true; // 'cockpit' (seated inside looking at live screens) or 'exterior' (chase cam)

    // Forward Prow Exterior Camera System
    this.prowCamera = new THREE.PerspectiveCamera(80, 16 / 9, 0.2, 4500);
    this.prowCamera.position.set(0, 1.8, -17.5); // Mounted on forward nose of ship
    this.prowCamera.rotation.set(0, 0, 0); // Faces directly forward in local space (-Z)
    this.shipGroup.add(this.prowCamera);

    this.prowRenderTarget = new THREE.WebGLRenderTarget(512, 288, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });
    this.prowTexture = this.prowRenderTarget.texture;

    this.init();
    this.initWarpStreaks();
  }

  initWarpStreaks() {
    const count = 400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 6); // Lines: 2 points each
    for (let i = 0; i < count * 6; i += 6) {
      const rx = (Math.random() - 0.5) * 120;
      const ry = (Math.random() - 0.5) * 80;
      const rz = (Math.random() - 0.5) * 350;
      pos[i] = rx;
      pos[i + 1] = ry;
      pos[i + 2] = rz;
      pos[i + 3] = rx;
      pos[i + 4] = ry;
      pos[i + 5] = rz - 30; // Streak line length
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.0
    });
    this.warpStreaks = new THREE.LineSegments(geo, mat);
    this.shipGroup.add(this.warpStreaks);
  }

  async init() {
    this.scene.add(this.shipGroup);
    this.shipGroup.position.set(0, 100, 250); // In orbit outside the ship interior

    const gltfLoader = new GLTFLoader();
    try {
      console.log("Loading StarShip exterior...");
      const gltf = await gltfLoader.loadAsync('/assets/ship_exterior.glb');
      this.model = gltf.scene;
      // Grand, imposing heavy gunship scale (visible, imposing 34m presence)
      this.model.scale.set(3.2, 3.2, 3.2);
      this.model.rotation.y = Math.PI; // Face forward
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.metalness = 0.9;
            child.material.roughness = 0.25;
            if (child.material.emissive) {
              child.material.emissiveIntensity = 2.0;
            }
          }
        }
      });
      this.shipGroup.add(this.model);
    } catch (e) {
      console.warn("Could not load ship_exterior.glb, falling back to procedural heavy battlecruiser:", e);
      this.createProceduralFighter();
    }

    this.setupThrusterEffects();
  }

  createProceduralFighter() {
    const group = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x1a2634, metalness: 0.9, roughness: 0.25 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 1.2 });
    const cockpitMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.95, roughness: 0.1 });

    // Fuselage (Substantial 38m scale)
    const fuselage = new THREE.Mesh(new THREE.ConeGeometry(7.0, 38.0, 8), hullMat);
    fuselage.rotation.x = -Math.PI / 2;
    group.add(fuselage);

    // Cockpit canopy
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(4.2, 16.0, 6), cockpitMat);
    canopy.rotation.x = -Math.PI / 2;
    canopy.position.set(0, 3.0, 3.5);
    group.add(canopy);

    // Main Wings (36m wingspan)
    const wingGeo = new THREE.BoxGeometry(36.0, 0.9, 14.0);
    const wings = new THREE.Mesh(wingGeo, hullMat);
    wings.position.set(0, 0, -3.0);
    group.add(wings);

    // Wingtip plasma hardpoints
    const tipLeft = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 6.5), accentMat);
    tipLeft.position.set(-18.0, 0.5, -3.0);
    group.add(tipLeft);

    const tipRight = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 6.5), accentMat);
    tipRight.position.set(18.0, 0.5, -3.0);
    group.add(tipRight);

    this.model = group;
    this.shipGroup.add(this.model);
  }

  setupThrusterEffects() {
    // Twin heavy plasma thruster exhaust plumes matching the enlarged starship hull
    const flameGeo = new THREE.ConeGeometry(2.6, 12.0, 16);
    flameGeo.rotateX(-Math.PI / 2);
    flameGeo.translate(0, 0, 6.0);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.88
    });

    const leftFlame = new THREE.Mesh(flameGeo, flameMat);
    leftFlame.position.set(-6.2, 1.8, 14.5);
    this.shipGroup.add(leftFlame);
    this.thrusterFlames.push(leftFlame);

    const rightFlame = new THREE.Mesh(flameGeo, flameMat.clone());
    rightFlame.position.set(6.2, 1.8, 14.5);
    this.shipGroup.add(rightFlame);
    this.thrusterFlames.push(rightFlame);

    // Bright engine illumination
    this.thrusterLight = new THREE.PointLight(0x00e1ff, 7.5, 120);
    this.thrusterLight.position.set(0, 2.0, 16.5);
    this.shipGroup.add(this.thrusterLight);
  }

  renderProwCamera(renderer, scene, environment) {
    if (!this.prowCamera || !this.prowRenderTarget) return;
    const currentTarget = renderer.getRenderTarget();

    const prevSpaceVis = environment.spaceGroup.visible;
    const prevInteriorVis = environment.interiorGroup.visible;
    const prevStarbaseVis = environment.starbaseGroup ? environment.starbaseGroup.visible : false;

    // Exterior prow camera captures the space expanse (stars, planets, asteroids, jammer, enemy ships)
    environment.spaceGroup.visible = true;
    environment.interiorGroup.visible = false;
    if (environment.starbaseGroup) environment.starbaseGroup.visible = false;

    renderer.setRenderTarget(this.prowRenderTarget);
    renderer.clear();
    renderer.render(scene, this.prowCamera);

    // Restore visibilities
    environment.spaceGroup.visible = prevSpaceVis;
    environment.interiorGroup.visible = prevInteriorVis;
    if (environment.starbaseGroup) environment.starbaseGroup.visible = prevStarbaseVis;

    renderer.setRenderTarget(currentTarget);
  }

  handleInput(delta) {
    if (!this.isPiloted) {
      // Ship moves ONLY while a person is sitting in the seat!
      this.velocity.multiplyScalar(0.85);
      if (this.velocity.lengthSq() < 0.001) this.velocity.set(0, 0, 0);
      this.angularVelocity.set(0, 0, 0);
      this.speed = this.velocity.length();
      this.shipGroup.position.addScaledVector(this.velocity, delta);
      sounds.setThrusterIntensity(0, false);
      return;
    }

    const mouseDelta = this.input.consumeMouseDelta();

    // Flight angular steering
    const pitchSpeed = 0.0016;
    const yawSpeed = 0.0016;
    const rollSpeed = 0.85; // Reduced sensitivity for heavy starship handling

    this.angularVelocity.x -= mouseDelta.y * pitchSpeed;
    this.angularVelocity.y -= mouseDelta.x * yawSpeed;

    // Roll controls: Q (left roll), E (right roll)
    if (this.input.isDown('KeyQ')) this.angularVelocity.z += rollSpeed * delta;
    if (this.input.isDown('KeyE')) this.angularVelocity.z -= rollSpeed * delta;

    // Apply angular drag
    this.angularVelocity.multiplyScalar(this.angularDrag);

    // Rotate ship group based on local axes
    this.shipGroup.rotateX(this.angularVelocity.x);
    this.shipGroup.rotateY(this.angularVelocity.y);
    this.shipGroup.rotateZ(this.angularVelocity.z);

    // Boost & Energy
    const wantBoost = this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight');
    if (wantBoost && this.boostEnergy > 5) {
      this.isBoosting = true;
      this.boostEnergy = Math.max(0, this.boostEnergy - 32 * delta);
    } else {
      this.isBoosting = false;
      this.boostEnergy = Math.min(this.maxBoostEnergy, this.boostEnergy + 15 * delta);
    }

    const currentMaxSpeed = this.isBoosting ? this.maxBoostSpeed : this.maxNormalSpeed;

    // Forward / Reverse thrust
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.shipGroup.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.shipGroup.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.shipGroup.quaternion);

    let thrust = 0;
    if (this.input.isDown('KeyW')) thrust += 1.0;
    if (this.input.isDown('KeyS')) thrust -= 0.6;

    let strafeX = 0;
    if (this.input.isDown('KeyD')) strafeX += 0.8;
    if (this.input.isDown('KeyA')) strafeX -= 0.8;

    let strafeY = 0;
    if (this.input.isDown('Space')) strafeY += 0.8;
    if (this.input.isDown('KeyC') || this.input.isDown('ControlLeft')) strafeY -= 0.8;

    // Accelerate
    if (thrust !== 0) {
      this.velocity.addScaledVector(forward, thrust * this.acceleration * delta * (this.isBoosting ? 2.0 : 1.0));
    }
    if (strafeX !== 0) {
      this.velocity.addScaledVector(right, strafeX * this.acceleration * 0.6 * delta);
    }
    if (strafeY !== 0) {
      this.velocity.addScaledVector(up, strafeY * this.acceleration * 0.6 * delta);
    }

    // Velocity drag
    this.velocity.multiplyScalar(this.drag);

    // Speed clamp
    if (this.velocity.length() > currentMaxSpeed) {
      this.velocity.setLength(currentMaxSpeed);
    }

    this.speed = this.velocity.length();

    // Position integration
    this.shipGroup.position.addScaledVector(this.velocity, delta);

    // Audio engine sync
    const throttleRatio = this.speed / this.maxNormalSpeed;
    sounds.setThrusterIntensity(throttleRatio, this.isBoosting);

    // Thruster flame visuals
    const flameScaleZ = 0.5 + throttleRatio * (this.isBoosting ? 3.0 : 1.8) + Math.random() * 0.2;
    const flameScaleXY = 0.8 + throttleRatio * 0.5;
    this.thrusterFlames.forEach((flame) => {
      flame.scale.set(flameScaleXY, flameScaleXY, flameScaleZ);
      flame.material.color.setHex(this.isBoosting ? 0xff6600 : 0x00d4ff);
    });
    if (this.thrusterLight) {
      this.thrusterLight.intensity = 1.0 + throttleRatio * 4.0;
      this.thrusterLight.color.setHex(this.isBoosting ? 0xff7700 : 0x00e1ff);
    }

    // Shields regeneration
    if (this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + 6 * delta);
    }

    // Weapon firing
    if (this.weaponCooldown > 0) {
      this.weaponCooldown -= delta;
    }
    if (this.input.mouse.leftButton && this.weaponCooldown <= 0) {
      this.fireWeapon();
      this.weaponCooldown = this.fireRate;
    }

    // Hyperjump Warp Drive trigger (KeyJ)
    if (this.input.isDown('KeyJ') && !this.prevJumpKey) {
      this.triggerHyperjump();
    }
    this.prevJumpKey = !!this.input.isDown('KeyJ');
  }

  triggerHyperjump() {
    if (this.hyperjumpActive) return;

    // Check if within Hyperspace Jammer field
    if (this.combat && this.combat.isHyperspaceJammed(this.shipGroup.position)) {
      sounds.playJammerWarning();
      if (this.onHyperjumpStatus) this.onHyperjumpStatus('jammed');
      return;
    }

    this.hyperjumpActive = true;
    this.hyperjumpTimer = 2.6;
    sounds.playHyperjump();
    if (this.onHyperjumpStatus) this.onHyperjumpStatus('spooling');
  }

  fireWeapon() {
    sounds.playLaser(true);

    // Calculate hardpoint spawn position from wings
    const side = (this.activeHardpoint === 0) ? -7.8 : 7.8;
    this.activeHardpoint = (this.activeHardpoint + 1) % 2;

    const offset = new THREE.Vector3(side, 0.4, -9.5).applyQuaternion(this.shipGroup.quaternion);
    const spawnPos = this.shipGroup.position.clone().add(offset);
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.shipGroup.quaternion);

    if (this.onFireLaser) {
      this.onFireLaser({
        position: spawnPos,
        direction: direction,
        speed: 180.0,
        damage: 25,
        isPlayer: true
      });
    }
  }

  updateCamera() {
    // Dynamic trailing chase camera
    const desiredOffset = this.cameraOffset.clone().applyQuaternion(this.shipGroup.quaternion);
    const desiredCamPos = this.shipGroup.position.clone().add(desiredOffset);

    // Smooth position interpolation with initial snap on mode switch
    if (this.cameraSnapNeeded) {
      this.camera.position.copy(desiredCamPos);
      this.cameraSnapNeeded = false;
    } else {
      this.camera.position.lerp(desiredCamPos, 0.18);
    }

    // Look slightly ahead of ship
    const lookTarget = this.shipGroup.position.clone().add(
      new THREE.Vector3(0, 1.5, -28).applyQuaternion(this.shipGroup.quaternion)
    );
    this.camera.lookAt(lookTarget);

    // FOV boost warp effect
    const targetFov = this.isBoosting ? this.boostFov : this.baseFov;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.1);
    this.camera.updateProjectionMatrix();
  }

  update(delta, updateCameraFollow = true) {
    if (this.hyperjumpActive) {
      this.hyperjumpTimer -= delta;

      // Accelerate forward into hyperspace corridor
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.shipGroup.quaternion);
      this.shipGroup.position.addScaledVector(forward, 260.0 * delta);

      // Warp streaks visual effect
      if (this.warpStreaks) {
        this.warpStreaks.material.opacity = Math.min(1.0, this.warpStreaks.material.opacity + delta * 2.5);
        this.warpStreaks.rotation.z += delta * 7.0;
      }

      // Camera FOV hyper-stretch
      if (updateCameraFollow) {
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 108, 0.12);
        this.camera.updateProjectionMatrix();
      }

      if (this.hyperjumpTimer <= 0) {
        // Hyperspace exit into new deep space coordinates
        this.hyperjumpActive = false;
        if (this.warpStreaks) this.warpStreaks.material.opacity = 0;

        const newX = (Math.random() - 0.5) * 550;
        const newZ = 150 + (Math.random() - 0.5) * 450;
        this.shipGroup.position.set(newX, 100, newZ);
        this.velocity.set(0, 0, 0);
        this.shield = 100;
        this.boostEnergy = 100;

        sounds.playLand();
        if (this.onHyperjumpStatus) this.onHyperjumpStatus('complete');
      }

      if (updateCameraFollow) this.updateCamera();
      return;
    }

    this.handleInput(delta);
    if (updateCameraFollow && this.viewMode === 'exterior') {
      this.updateCamera();
    }
  }

  takeDamage(amount) {
    if (this.shield > 0) {
      this.shield -= amount;
      if (this.shield < 0) {
        this.hull += this.shield; // Overflow to hull
        this.shield = 0;
      }
    } else {
      this.hull = Math.max(0, this.hull - amount);
    }

    if (this.hull <= 0) {
      sounds.playExplosion();
      // Respawn / repair
      this.hull = 100;
      this.shield = 100;
      this.shipGroup.position.set(0, 100, 250);
      this.velocity.set(0, 0, 0);
    }
  }
}
