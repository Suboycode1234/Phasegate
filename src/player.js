// Third Person Character Controller with Animations, Physics & Audio Sync
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { sounds } from './audio.js';

export const WEAPON_DEFS = {
  dual_grapplers: {
    id: 'dual_grapplers',
    name: 'Dual Kinetic Wrist Grapplers',
    type: 'Kinetic Mobility',
    category: 'scifi',
    color: 0x00f0ff,
    damage: 35,
    cooldown: 0.15,
    speed: 95,
    fireType: 'grapple',
    isGrapple: true,
    magSize: Infinity,
    currentAmmo: Infinity
  },

  unarmed: {
    id: 'unarmed',
    name: 'Unarmed [Fists]',
    type: 'Melee',
    category: 'basic',
    damage: 25,
    cooldown: 0.5,
    fireType: 'punch',
    magSize: Infinity,
    currentAmmo: Infinity
  },
  plasma_rifle: {
    id: 'plasma_rifle',
    name: 'PR-90 Plasma Core Rifle',
    type: 'Sci-Fi Energy',
    category: 'scifi',
    path: '/assets/guns/scifi/plasma_rifle.glb',
    targetLength: 1.05,
    color: 0x00ffcc,
    damage: 45,
    cooldown: 0.18,
    speed: 120,
    fireType: 'plasma',
    hasAnimation: true,
    magSize: 30,
    currentAmmo: 30,
    reloadTime: 2.2,
    handOffset: { pos: [0.06, -0.04, -0.16], rot: [0, Math.PI / 2, 0], scale: 1.0 },
    vmOffset: { pos: [0.26, -0.26, -0.52], rot: [0.05, -Math.PI / 2 + 0.12, 0.02], scale: 0.82 }
  },
  railgun: {
    id: 'railgun',
    name: 'X-7 Hyper-Kinetic Railgun',
    type: 'Sci-Fi Heavy',
    category: 'scifi',
    path: '/assets/guns/scifi/railgun.glb',
    targetLength: 1.15,
    color: 0x38bdf8,
    damage: 120,
    cooldown: 0.75,
    speed: 280,
    fireType: 'railgun',
    hasAnimation: false,
    magSize: 5,
    currentAmmo: 5,
    reloadTime: 2.5,
    handOffset: { pos: [0.06, -0.04, -0.18], rot: [0, Math.PI / 2, 0], scale: 1.0 },
    vmOffset: { pos: [0.28, -0.28, -0.58], rot: [0.05, -Math.PI / 2 + 0.12, 0.02], scale: 0.82 }
  },
  energy_pistol: {
    id: 'energy_pistol',
    name: 'Ion-9 Compact Energy Pistol',
    type: 'Sci-Fi Sidearm',
    category: 'scifi',
    path: '/assets/guns/scifi/energy_pistol.glb',
    targetLength: 0.45,
    color: 0x00e5ff,
    damage: 28,
    cooldown: 0.22,
    speed: 140,
    fireType: 'pistol',
    hasAnimation: false,
    magSize: 15,
    currentAmmo: 15,
    reloadTime: 1.6,
    handOffset: { pos: [0.03, -0.02, -0.10], rot: [0, 0, 0], scale: 1.0 },
    vmOffset: { pos: [0.22, -0.20, -0.42], rot: [0.05, -Math.PI / 2 + 0.12, 0.02], scale: 0.88 }
  },
  assault_rifle: {
    id: 'assault_rifle',
    name: 'M16A3 Tactical Assault Rifle',
    type: 'Ballistic Kinetic',
    category: 'basic',
    path: '/assets/guns/basic/assault_rifle.glb',
    targetLength: 0.95,
    color: 0xf59e0b,
    damage: 34,
    cooldown: 0.12,
    speed: 180,
    fireType: 'ballistic',
    hasAnimation: false,
    magSize: 30,
    currentAmmo: 30,
    reloadTime: 2.0,
    handOffset: { pos: [0.05, -0.04, -0.14], rot: [0, 0, 0], scale: 1.0 },
    vmOffset: { pos: [0.26, -0.24, -0.50], rot: [0.05, -Math.PI / 2 + 0.12, 0.02], scale: 0.82 }
  },
  combat_knife: {
    id: 'combat_knife',
    name: 'CQC Carbon Combat Knife',
    type: 'Tactical Melee',
    category: 'basic',
    path: '/assets/guns/basic/combat_knife.glb',
    targetLength: 0.38,
    color: 0xef4444,
    damage: 70,
    cooldown: 0.45,
    speed: 0,
    fireType: 'knife',
    hasAnimation: true,
    magSize: Infinity,
    currentAmmo: Infinity,
    handOffset: { pos: [0.02, -0.02, -0.08], rot: [0, 0, 0], scale: 1.0 },
    vmOffset: { pos: [0.20, -0.18, -0.38], rot: [0.2, -0.4, 0.3], scale: 0.9 }
  }
};

const LOWER_BODY_KEYWORDS = ['thigh', 'calf', 'foot', 'toe', 'pelvis', 'root', 'hip', 'knee', 'leg', 'waist'];
function isLowerTrack(name) {
  const lower = name.toLowerCase();
  return LOWER_BODY_KEYWORDS.some(k => lower.includes(k));
}
function isUpperTrack(name) {
  return !isLowerTrack(name);
}

export class PlayerController {
  constructor(scene, camera, inputManager, environmentManager = null) {
    this.scene = scene;
    this.camera = camera;
    this.input = inputManager;
    this.environment = environmentManager;
    this.combat = null;

    this.mesh = null;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.currentUpperAction = null;
    this.currentLowerAction = null;
    this.skeleton = null;

    // Physics / movement state
    this.floorY = 0.08; // Soles rest cleanly on top of floor plates without clipping
    this.position = new THREE.Vector3(0, this.floorY, 0);
    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.isCrouching = false;
    this.isSprinting = false;
    this.isAttacking = false;
    this.moveSpeed = 4.0;
    this.jumpForce = 6.8;
    this.gravity = 18.0;

    // Camera parameters & View Mode (True First Person with visible body/arms by default)
    this.viewMode = 'firstPerson';
    this.cameraYaw = 0;
    this.cameraPitch = 0.0;
    this.cameraDistance = 2.8;
    this.cameraTargetOffset = new THREE.Vector3(0.35, 1.4, 0);
    this.headBobTimer = 0;
    this.prevViewKey = false;

    // Personal Health, Shield & Friendly Fire System
    this.shield = 100.0;
    this.maxShield = 100.0;
    this.health = 100.0;
    this.maxHealth = 100.0;
    this.shieldRegenTimer = 0;
    this.isDead = false;
    this.respawnTimer = 0;
    this.multiplayer = null;
    this.onDeath = null;
    this.onRespawn = null;

    // Ladder climbing state
    this.isClimbing = false;
    this.nearLadder = null; // 'upper' or 'lower'
    this.deckLevel = 'main'; // 'upper', 'main', 'lower'

    // Weapons & Armory Inventory System
    this.equippedWeapon = null; // null = unarmed
    this.nearWeaponPedestal = null;
    this.unlockedWeapons = new Set(['unarmed']);
    this.rightHandBone = null;
    this.leftHandBone = null;
    this.grappleGroup = new THREE.Group();
    this.scene.add(this.grappleGroup);

    // Physical Dual Wrist Grapplers
    const makeHook = (side) => {
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: (side === 'left') ? 0x00f0ff : 0x38bdf8,
        linewidth: 3,
        transparent: true,
        opacity: 0.92
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.frustumCulled = false;
      line.visible = false;
      this.grappleGroup.add(line);

      const headGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.22, 8);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: (side === 'left') ? 0x00f0ff : 0x38bdf8,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.2
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.frustumCulled = false;
      head.rotation.x = Math.PI / 2;
      head.visible = false;
      this.grappleGroup.add(head);

      return {
        side: side,
        state: 'idle', // 'idle' | 'flying' | 'anchored'
        pos: new THREE.Vector3(),
        prevPos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        anchor: new THREE.Vector3(),
        restLength: 0,
        flightTime: 0,
        line: line,
        head: head
      };
    };

    this.grappleHooks = {
      left: makeHook('left'),
      right: makeHook('right')
    };

    this.prevMouseLeft = false;
    this.prevMouseRight = false;
    this.prevSpaceKey = false;
    this.grappleBeamGroup = new THREE.Group();
    this.scene.add(this.grappleBeamGroup);
    this.isGrappling = false;
    this.grappleAnchorLeft = null;
    this.grappleAnchorRight = null;
    this.grappleTimer = 0;
    this.grappleLineLeft = null;
    this.grappleLineRight = null;
    this.prevGrappleKey = false;
    this.prevAbilityKey = false;
    this.abilityCooldown = 0;
    this.abilityMaxCooldown = 25.0;
    this.rallyTimer = 0;
    this.onAbilityTriggered = null;
    this.viewmodelGroup = new THREE.Group();
    this.camera.add(this.viewmodelGroup);
    this.viewmodelRecoil = 0;
    this.equippedModel3rd = null;
    this.equippedModel1st = null;
    this.equippedMixer = null;
    this.equippedActions = {};
    this.fireCooldown = 0;
    this.isReloading = false;
    this.reloadTimer = null;
    this.prevInteractKey = false;
    this.prevReloadKey = false;
    this.prevNumKeys = {};

    // Held weapon scene group (not bound to bones - positioned at hands every frame)
    this.heldGunGroup = new THREE.Group();
    this.scene.add(this.heldGunGroup);
    this.heldGunModel = null;
    this._handWorldPos = new THREE.Vector3();

    // Audio timing
    this.footstepTimer = 0;

    // Spacewalk / EVA Jetpack & Hull Tether System
    this.isSpacewalk = false;
    this.isTethered = true;        // Magnetic boots locked to hull
    this.jetpackActive = false;    // 6DOF Zero-G Thruster Flight
    this.jetpackFuel = 100.0;
    this.jetpackMaxFuel = 100.0;
    this.oxygenLevel = 100.0;
    this.tetherAnchor = new THREE.Vector3(-18.2, 101.8, 250.0); // Exterior airlock location in space
    this.isTetherPulling = false;
    this.tetherTarget = null;
    this.prevTetherKey = false;
    this.thrusterParticleTimer = 0;
    this.prevJetpackKey = false;
    this.prevMagBootsKey = false;

    // Character selection state: 'pilot1' (Commander Vanguard) or 'pilot2' (Operative Nova)
    this.currentCharacter = 'pilot1';
    this.isLoadingCharacter = false;
    this.onCharacterChanged = null;

    // Pilot seat seated-only flight control state
    this.isSeatedInCockpit = false;
    this.flightViewMode = 'cockpit'; // 'cockpit' (1st-person seated) or 'exterior' (3rd-person ship flying)
    this.nearPilotSeat = false;
    this.prevKeyE = false;
    this.onPilotSeatToggle = null;
    this.onFlightViewModeChanged = null;

    // Interactive targets callback
    this.nearCockpit = false;
    this.nearDoor = false;
    this.nearDepartureGate = false;
    this.nearStorageDoor = false;
    this.nearAirlock = false;          // Interior airlock leading to space
    this.nearExteriorAirlock = false;  // Exterior hull airlock hatch
    this.onInteract = null;

    this.init();
  }

  async init() {
    await this.loadCharacter('pilot1');
  }

  async setCharacter(characterId) {
    if (this.currentCharacter === characterId && this.mesh) return;
    this.currentCharacter = characterId;
    await this.loadCharacter(characterId);
    if (characterId === 'pilot3') {
      this.equipWeapon('dual_grapplers');
    }
    if (this.onCharacterChanged) {
      this.onCharacterChanged(characterId);
    }
  }

  async loadCharacter(characterId = 'pilot1') {
    if (this.isLoadingCharacter) return;
    this.isLoadingCharacter = true;

    // Clean up previous character mesh and mixer
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh = null;
    }
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    this.actions = {};
    this.currentAction = null;
    this.currentUpperAction = null;
    this.currentLowerAction = null;

    const gltfLoader = new GLTFLoader();

    try {
      let idleClip = null;
      if (characterId === 'pilot2') {
        console.log('Loading Pilot 2 Mechanic avatar from player2.glb with full PBR textures...');
        const gltf = await gltfLoader.loadAsync('/assets/player2/player2.glb');
        this.mesh = gltf.scene;
        this.mesh.scale.set(1.0, 1.0, 1.0);
        this.mesh.rotation.set(0, 0, 0);

        // PRESERVE AND APPLY REAL EMBEDDED PBR TEXTURES (WITH REDUNDANT FALLBACK)
        const texLoader = new THREE.TextureLoader();
        this.mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
            if (child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach(mat => {
                mat.roughness = 0.45;
                mat.metalness = 0.55;
                // Redundant texture fallback if embedded GLB texture isn't bound:
                if (!mat.map) {
                  texLoader.load('/assets/player2/extracted_Material_001_Diffuse.jpg', (t) => {
                    t.colorSpace = THREE.SRGBColorSpace;
                    t.flipY = false;
                    mat.map = t;
                    mat.needsUpdate = true;
                  });
                }
                if (!mat.normalMap) {
                  texLoader.load('/assets/player2/extracted_Material_001_Normal.jpg', (nt) => {
                    nt.flipY = false;
                    mat.normalMap = nt;
                    mat.needsUpdate = true;
                  });
                }
                mat.needsUpdate = true;
              });
            }
          }
        });

        try {
          const idleGltf = await gltfLoader.loadAsync('/assets/anim_idle.glb');
          if (idleGltf.animations && idleGltf.animations.length > 0) {
            idleClip = idleGltf.animations[0];
          }
        } catch (e) {
          console.warn('Could not load idle clip for pilot2:', e);
        }

      } else if (characterId === 'pilot3') {
        console.log('Loading Pilot 3 Scout avatar from player3.glb with Dual Wrist Grapplers...');
        const gltf = await gltfLoader.loadAsync('/assets/player3/player3.glb');
        this.mesh = gltf.scene;
        this.mesh.scale.set(1.0, 1.0, 1.0);
        this.mesh.rotation.set(0, 0, 0);

        const texLoader = new THREE.TextureLoader();
        this.mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
            if (child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach(mat => {
                mat.roughness = 0.50;
                mat.metalness = 0.45;
                if (!mat.map) {
                  texLoader.load('/assets/player3/extracted_Material_001_Diffuse.jpg', (t) => {
                    t.colorSpace = THREE.SRGBColorSpace;
                    t.flipY = false;
                    mat.map = t;
                    mat.needsUpdate = true;
                  });
                }
                if (!mat.normalMap) {
                  texLoader.load('/assets/player3/extracted_Material_001_Normal.jpg', (nt) => {
                    nt.flipY = false;
                    mat.normalMap = nt;
                    mat.needsUpdate = true;
                  });
                }
                mat.needsUpdate = true;
              });
            }
          }
        });

        // Always load high-quality breathing humanoid idle animation from anim_idle.glb (do not use export T-pose)
        try {
          const idleGltf = await gltfLoader.loadAsync('/assets/anim_idle.glb');
          if (idleGltf.animations && idleGltf.animations.length > 0) {
            idleClip = idleGltf.animations[0];
          }
        } catch (e) {
          console.warn('Could not load idle clip for pilot3:', e);
        }

      } else {
        console.log('Loading Pilot 1 Commander Vanguard avatar from anim_idle.glb...');
        const gltf = await gltfLoader.loadAsync('/assets/anim_idle.glb');
        this.mesh = gltf.scene;
        this.mesh.scale.set(1.0, 1.0, 1.0);
        this.mesh.rotation.set(0, 0, 0);
        this.mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
            if (child.material) {
              child.material.roughness = 0.45;
              child.material.metalness = 0.4;
            }
          }
        });
        if (gltf.animations && gltf.animations.length > 0) {
          idleClip = gltf.animations[0];
        }
      }

      this.scene.add(this.mesh);
      this.mesh.position.copy(this.position);
      this.rightHandBone = this.mesh.getObjectByName('CC_Base_R_Hand') || this.mesh.getObjectByName('RightHand');
      this.leftHandBone = this.mesh.getObjectByName('CC_Base_L_Hand') || this.mesh.getObjectByName('LeftHand');
      this.mixer = new THREE.AnimationMixer(this.mesh);

      if (idleClip) {
        idleClip.name = 'idle';
        const action = this.mixer.clipAction(idleClip);
        action.setLoop(THREE.LoopRepeat);
        action.enabled = true;
        action.play();
        this.actions['idle'] = action;
        this.currentAction = action;

        const idleLowerClip = idleClip.clone();
        idleLowerClip.name = 'idle_lower';
        idleLowerClip.tracks = idleLowerClip.tracks.filter(t => isLowerTrack(t.name));
        const actionLower = this.mixer.clipAction(idleLowerClip);
        actionLower.setLoop(THREE.LoopRepeat);
              this.actions['idle_lower'] = actionLower;
      }

      const animConfigs = [
        { key: 'walk', url: '/assets/anim_walk.glb', loop: THREE.LoopRepeat, timeScale: 1.35, makeLower: true },
        { key: 'run', url: '/assets/anim_run.glb', loop: THREE.LoopRepeat, timeScale: 1.15, makeLower: true },
        { key: 'jump', url: '/assets/anim_jump.glb', loop: THREE.LoopOnce, clamp: true, timeScale: 1.25 },
        { key: 'crouch', url: '/assets/anim_crouch.glb', loop: THREE.LoopRepeat, timeScale: 1.0, makeLower: true },
        { key: 'punch', url: '/assets/anim_punch.glb', loop: THREE.LoopOnce, clamp: false, timeScale: 1.4 },
        { key: 'hold_gun', url: '/assets/anim_hold_gun.glb', loop: THREE.LoopRepeat, isUpperOnly: true, timeScale: 1.0 },
        { key: 'reload', url: '/assets/anim_reload.glb', loop: THREE.LoopOnce, clamp: true, isUpperOnly: true, timeScale: 1.0 }
      ];

      await Promise.all(animConfigs.map(async (config) => {
        try {
          const animGltf = await gltfLoader.loadAsync(config.url);
          if (animGltf.animations && animGltf.animations.length > 0) {
            const clip = animGltf.animations[0];
            clip.name = config.key;

            clip.tracks.forEach(track => {
              if (track.name.includes('BoneRoot.position') || track.name.includes('Root.position')) {
                const vals = track.values;
                const initX = vals[0], initZ = vals[2];
                for (let i = 0; i < vals.length; i += 3) {
                  vals[i] = initX;
                  vals[i + 2] = initZ;
                }
              }
            });

            if (config.isUpperOnly) {
              clip.tracks = clip.tracks.filter(t => isUpperTrack(t.name));
            }

            const action = this.mixer.clipAction(clip);
            action.setLoop(config.loop);
            action.clampWhenFinished = !!config.clamp;
            if (config.timeScale) action.timeScale = config.timeScale;
            this.actions[config.key] = action;

            if (config.makeLower) {
              const lowerClip = clip.clone();
              lowerClip.name = config.key + '_lower';
              lowerClip.tracks = lowerClip.tracks.filter(t => isLowerTrack(t.name));
              const lowerAction = this.mixer.clipAction(lowerClip);
              lowerAction.setLoop(config.loop);
              lowerAction.clampWhenFinished = !!config.clamp;
              if (config.timeScale) lowerAction.timeScale = config.timeScale;
              this.actions[config.key + '_lower'] = lowerAction;
            }
          }
        } catch (e) {
          console.warn("Could not load animation " + config.key, e);
        }
      }));

      this.mixer.addEventListener('finished', (e) => {
        if (e.action === this.actions['punch']) {
          this.isAttacking = false;
          this.updateAnimationState(this.isMoving);
        }
        if (e.action === this.actions['reload']) {
          this.completeReload();
        }
      });

 console.log("Character " + characterId + " successfully activated!");
    } catch (err) {
      console.error('Error loading character mesh:', err);
      this.createFallbackMesh();
    } finally {
      this.isLoadingCharacter = false;
    }
  }

  toggleFlightViewMode() {
    if (!this.isSeatedInCockpit) return;
    this.flightViewMode = (this.flightViewMode === 'cockpit') ? 'exterior' : 'cockpit';
    if (this.onFlightViewModeChanged) {
      this.onFlightViewModeChanged(this.flightViewMode);
    }
  }

  createFallbackMesh() {
    // Elegant fallback humanoid avatar if asset loading is delayed
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, roughness: 0.3, metalness: 0.8 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.6 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), bodyMat);
    torso.position.y = 1.0;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), bodyMat);
    head.position.y = 1.6;
    group.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.1), visorMat);
    visor.position.set(0, 1.62, 0.18);
    group.add(visor);

    this.mesh = group;
    this.scene.add(this.mesh);
  }

  fadeToAction(name, duration = 0.2) {
    const nextAction = this.actions[name];
    if (!nextAction) return;

    if (this.currentAction === nextAction) {
      if (!nextAction.isRunning()) {
        nextAction.enabled = true;
        nextAction.reset().play();
      }
      return;
    }

    const previousAction = this.currentAction;
    this.currentAction = nextAction;

    if (previousAction && previousAction !== nextAction) {
      previousAction.fadeOut(duration);
    }

    nextAction
      .reset()
      .setEffectiveTimeScale(nextAction.timeScale || 1.0)
      .setEffectiveWeight(1.0)
      .fadeIn(duration);
    nextAction.enabled = true;
    nextAction.play();
  }

  fadeToUpperAction(name, duration = 0.15) {
    const nextAction = this.actions[name];
    if (!nextAction) return;

    if (this.currentUpperAction === nextAction) {
      if (!nextAction.isRunning()) {
        nextAction.enabled = true;
        nextAction.reset().play();
      }
      return;
    }

    const previousAction = this.currentUpperAction;
    this.currentUpperAction = nextAction;

    if (previousAction && previousAction !== nextAction) {
      previousAction.fadeOut(duration);
    }

    nextAction
      .reset()
      .setEffectiveTimeScale(nextAction.timeScale || 1.0)
      .setEffectiveWeight(1.0)
      .fadeIn(duration);
    nextAction.enabled = true;
    nextAction.play();
  }

  fadeToLowerAction(name, duration = 0.15) {
    const nextAction = this.actions[name];
    if (!nextAction) return;

    if (this.currentLowerAction === nextAction) {
      if (!nextAction.isRunning()) {
        nextAction.enabled = true;
        nextAction.reset().play();
      }
      return;
    }

    const previousAction = this.currentLowerAction;
    this.currentLowerAction = nextAction;

    if (previousAction && previousAction !== nextAction) {
      previousAction.fadeOut(duration);
    }

    nextAction
      .reset()
      .setEffectiveTimeScale(nextAction.timeScale || 1.0)
      .setEffectiveWeight(1.0)
      .fadeIn(duration);
    nextAction.enabled = true;
    nextAction.play();
  }

  hasGunInHand() {
    if (!this.equippedWeapon) return false;
    const def = WEAPON_DEFS[this.equippedWeapon];
    return def && def.id !== 'unarmed' && def.id !== 'combat_knife' && def.id !== 'dual_grapplers';
  }

  reload() {
    if (!this.hasGunInHand() || this.isReloading) return;
    const def = WEAPON_DEFS[this.equippedWeapon];
    if (!def || def.currentAmmo >= def.magSize) return;

    this.isReloading = true;
    sounds.playReload();
    console.log(`[Reload] Starting reload for ${def.name}...`);

    if (this.actions['reload']) {
      this.fadeToUpperAction('reload', 0.12);
    }

    const reloadDuration = (def.reloadTime || 1.8) * 1000;
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
    this.reloadTimer = setTimeout(() => {
      this.completeReload();
    }, reloadDuration);
  }

  completeReload() {
    if (!this.isReloading) return;
    const def = this.equippedWeapon ? WEAPON_DEFS[this.equippedWeapon] : null;
    if (def) {
      def.currentAmmo = def.magSize;
      console.log(`[Reload] ${def.name} reloaded! [${def.currentAmmo}/${def.magSize}]`);
    }
    this.isReloading = false;
    if (this.hasGunInHand() && this.actions['hold_gun']) {
      this.fadeToUpperAction('hold_gun', 0.15);
    }
  }

  triggerAttack() {
    const punchAction = this.actions['punch'];
    if (!punchAction) return;

    this.isAttacking = true;
    sounds.playPunch();

    if (this.currentAction && this.currentAction !== punchAction) {
      this.currentAction.fadeOut(0.12);
    }
    this.currentAction = punchAction;
    punchAction.reset();
    punchAction.enabled = true;
    punchAction.setLoop(THREE.LoopOnce, 1);
    punchAction.clampWhenFinished = false;
    punchAction.setEffectiveWeight(1.0);
    punchAction.fadeIn(0.08);
    punchAction.play();

    // Friendly fire & melee hit detection
    this.checkMeleeHit();

    // Safety timeout ensures isAttacking never stays stuck
    clearTimeout(this.attackTimer);
    const clipDur = punchAction.getClip() ? punchAction.getClip().duration : 0.8;
    const durMs = (clipDur / (punchAction.timeScale || 1.4)) * 1000;
    this.attackTimer = setTimeout(() => {
      this.isAttacking = false;
      this.updateAnimationState(this.isMoving);
    }, Math.min(durMs + 40, 950));
  }

  equipWeapon(weaponId) {
    if (!weaponId || weaponId === 'unarmed') {
      this.heldGunGroup.clear();
      this.heldGunModel = null;
      this.equippedWeapon = null;
      this.equippedMixer = null;
      this.equippedActions = {};
      sounds.playEquip();
      console.log("[Weapon] Holstered weapon. Fists active.");
      return;
    }

    const def = WEAPON_DEFS[weaponId];
    if (!def) return;

    this.heldGunGroup.clear();
    this.heldGunModel = null;
    this.equippedMixer = null;
    this.equippedActions = {};
    this.equippedWeapon = weaponId;
    this.unlockedWeapons.add(weaponId);

    if (def.isGrapple) {
      // Build glowing dual wrist gauntlets model for held group
      const gauntletGroup = new THREE.Group();
      const baseBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.08, 0.20),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.3 })
      );
      const coil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.12, 12),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      coil.rotation.x = Math.PI / 2;
      coil.position.set(0, 0.03, 0.02);
      gauntletGroup.add(baseBox, coil);
      this.heldGunModel = gauntletGroup;
      this.heldGunGroup.add(gauntletGroup);
      sounds.playEquip();
      console.log("[Weapon] Equipped Dual Kinetic Wrist Grapplers.");
      return;
    }

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(def.path, (gltf) => {
      if (this.equippedWeapon !== weaponId) return;

      const gunScene = gltf.scene;
      if (weaponId === 'combat_knife') {
        gunScene.traverse((child) => {
          if (child.isMesh && (child.name === 'Mesh.001' || (child.material && child.material.name === 'arms'))) {
            child.visible = false;
          }
        });
      }

      gunScene.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false;
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.metalness = Math.max(child.material.metalness !== undefined ? child.material.metalness : 0.5, 0.6);
            child.material.roughness = Math.min(child.material.roughness !== undefined ? child.material.roughness : 0.4, 0.45);
            if (child.material.emissive && (child.material.emissive.r > 0.02 || child.material.emissive.g > 0.02 || child.material.emissive.b > 0.02)) {
              child.material.emissiveIntensity = 2.5;
            }
          }
        }
      });

      // Normalize model dimensions based on realistic weapon length
      const box = new THREE.Box3().setFromObject(gunScene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const targetScale = (def.targetLength / maxDim) * (def.handOffset.scale || 1.0);
      gunScene.scale.set(targetScale, targetScale, targetScale);

      // Center the gun mesh at its grip
      const center = new THREE.Vector3();
      new THREE.Box3().setFromObject(gunScene).getCenter(center);
      gunScene.position.sub(center);

      // Wrapper applies the weapon-specific orientation and grip offset
      const wrapper = new THREE.Group();
      wrapper.add(gunScene);
      wrapper.position.set(...def.handOffset.pos);
      wrapper.rotation.set(...def.handOffset.rot);

      this.heldGunGroup.clear();
      this.heldGunGroup.add(wrapper);
      this.heldGunModel = wrapper;
      this.heldGunGroup.visible = true;

      // Animations on equipped model (e.g. plasma rifle core rotation)
      if (gltf.animations && gltf.animations.length > 0 && def.hasAnimation) {
        const mixer = new THREE.AnimationMixer(gunScene);
        gltf.animations.forEach((clip) => {
          const act = mixer.clipAction(clip);
          act.setLoop(THREE.LoopRepeat);
          act.play();
          this.equippedActions[clip.name] = act;
        });
        this.equippedMixer = mixer;
      }

      sounds.playEquip();
      console.log(`[Weapon] Equipped ${def.name} successfully!`);
    });
  }

  triggerFire() {
    if (this.fireCooldown > 0 || this.isReloading) return;
    const def = this.equippedWeapon ? WEAPON_DEFS[this.equippedWeapon] : WEAPON_DEFS['unarmed'];
    if (!def) return;

    if (this.hasGunInHand()) {
      if (def.currentAmmo <= 0) {
        this.reload();
        return;
      }
      def.currentAmmo--;
    }

    this.fireCooldown = def.cooldown || 0.2;

    if (def.id === 'unarmed') {
      this.triggerAttack();
      return;
    }

    if (def.id === 'combat_knife') {
      this.triggerAttack();
      sounds.playPunch();
      this.viewmodelRecoil = 0.08;
      if (this.equippedMixer && this.equippedActions) {
        Object.values(this.equippedActions).forEach(act => act.reset().play());
      }
      if (this.combat) {
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
        const hitPos = this.position.clone().add(new THREE.Vector3(0, 1.2, 0)).add(forward.clone().multiplyScalar(1.5));
        this.combat.spawnSparks(hitPos, 0xef4444);
      }
      return;
    }

    // Gun projectile firing
    this.viewmodelRecoil = (def.id === 'railgun') ? 0.14 : 0.06;

    if (def.fireType === 'grapple' || def.isGrapple) {
      this.fireDualGrapple();
      return;
    }
    if (def.fireType === 'plasma') sounds.playPlasma();
    else if (def.fireType === 'railgun') sounds.playRailgun();
    else if (def.fireType === 'ballistic') sounds.playBallistic();
    else if (def.fireType === 'pistol') sounds.playLaser();

    if (this.equippedMixer && def.id === 'plasma_rifle') {
      Object.values(this.equippedActions).forEach(act => {
        act.timeScale = 3.2;
        setTimeout(() => { if (act) act.timeScale = 1.0; }, 400);
      });
    }

    if (this.viewMode === 'thirdPerson' && !this.isAttacking && !this.hasGunInHand()) {
      this.triggerAttack();
    }

    if (this.combat) {
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);

      if (def.id === 'assault_rifle') {
        forward.x += (Math.random() - 0.5) * 0.025;
        forward.y += (Math.random() - 0.5) * 0.020;
        forward.normalize();
      }

      let spawnPos;
      if (this.viewMode === 'firstPerson') {
        spawnPos = this.camera.position.clone().add(forward.clone().multiplyScalar(0.7));
      } else {
        spawnPos = this.position.clone().add(new THREE.Vector3(0, 1.4, 0)).add(forward.clone().multiplyScalar(0.8));
      }

      const laserData = {
        position: spawnPos,
        direction: forward,
        speed: def.speed || 100,
        damage: def.damage || 35,
        isPlayer: true,
        isLocalPlayer: true,
        senderId: (this.multiplayer ? this.multiplayer.localId : 'local'),
        weaponId: def.id || 'plasma_rifle',
        color: def.color || 0x00ffff,
        scale: (def.id === 'railgun') ? { x: 2.2, y: 2.2, z: 3.5 } : (def.id === 'plasma_rifle') ? { x: 1.6, y: 1.6, z: 1.8 } : { x: 1.0, y: 1.0, z: 1.2 },
        life: (def.id === 'railgun') ? 3.0 : 2.5
      };
      this.combat.addLaser(laserData);
      if (this.onFireLaser) {
        this.onFireLaser(laserData);
      }
    }

    // Auto-reload when last round in magazine is fired
    if (this.hasGunInHand() && def.currentAmmo <= 0) {
      this.reload();
    }
  }

  handleInput(delta) {
    const mouseDelta = this.input.consumeMouseDelta();

    // If seated in pilot seat, lock avatar in chair and allow bridge panoramic freelook
    if (this.isSeatedInCockpit) {
      this.position.set(0, 0.52, -19.50);
      this.velocity.set(0, 0, 0);
      this.isGrounded = true;
      this.isMoving = false;

      const mouseSensitivity = 0.0022;
      this.cameraYaw -= mouseDelta.x * mouseSensitivity;
      this.cameraPitch -= mouseDelta.y * mouseSensitivity;
      // Freelook clamped to cockpit panoramic display screens
      this.cameraYaw = Math.max(-1.45, Math.min(1.45, this.cameraYaw));
      this.cameraPitch = Math.max(-0.65, Math.min(0.85, this.cameraPitch));

      const standKeyDown = this.input.isDown('KeyE');
      if (standKeyDown && !this.prevKeyE) {
        this.standUpFromPilotSeat();
      }
      this.prevKeyE = standKeyDown;
      return;
    }

    // Mouse look rotation
    const mouseSensitivity = 0.0022;
    this.cameraYaw -= mouseDelta.x * mouseSensitivity;
    // Airlock Tether Winch Towing Physics
    if (this.isTetherPulling && this.tetherTarget) {
      const toTarget = new THREE.Vector3().subVectors(this.tetherTarget, this.position);
      const dist = toTarget.length();
      if (dist < 2.5) {
        this.isTetherPulling = false;
        this.velocity.set(0, 0, 0);
        if (this.isSpacewalk) {
          this.isTethered = true;
          this.jetpackActive = false;
          this.position.set(this.tetherTarget.x, this.tetherAnchor.y + 4.2, this.tetherTarget.z);
        } else {
          this.position.copy(this.tetherTarget);
        }
        if (sounds && sounds.playMagBoot) sounds.playMagBoot();
        if (sounds && sounds.playJetpack) sounds.playJetpack(false);
      } else {
        const pullDir = toTarget.normalize();
        const pullSpeed = this.isSpacewalk ? 36.0 : 18.0;
        this.velocity.lerp(pullDir.multiplyScalar(pullSpeed), Math.min(1.0, delta * 9.0));
        this.position.addScaledVector(this.velocity, delta);
        if (!this.isSpacewalk && this.position.y < 0.08) {
          this.position.y = 0.08;
        }
        return; // Automatic tether winch takes over movement until docked
      }
    }


    this.cameraPitch -= mouseDelta.y * mouseSensitivity;
    // Allow looking deeply down (-1.35 rad) to clearly see player's arms, chest, legs, and feet
    this.cameraPitch = Math.max(-1.35, Math.min(1.2, this.cameraPitch));

    // Movement directions relative to camera yaw
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

    const moveDir = new THREE.Vector3();

    if (this.input.isDown('KeyW') || this.input.isDown('ArrowUp')) moveDir.add(forward);
    if (this.input.isDown('KeyS') || this.input.isDown('ArrowDown')) moveDir.sub(forward);
    if (this.input.isDown('KeyD') || this.input.isDown('ArrowRight')) moveDir.add(right);
    if (this.input.isDown('KeyA') || this.input.isDown('ArrowLeft')) moveDir.sub(right);

    const isMoving = moveDir.lengthSq() > 0.001;
    if (isMoving) moveDir.normalize();
    this.isMoving = isMoving;

    this.isSprinting = this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight');
    this.isCrouching = this.input.isDown('KeyC');

    // Toggle 1st / 3rd Person View with KeyV (debounced)
    const viewKeyDown = this.input.isDown('KeyV');
    if (viewKeyDown && !this.prevViewKey) {
      this.viewMode = (this.viewMode === 'firstPerson') ? 'thirdPerson' : 'firstPerson';
      if (sounds && sounds.playClick) sounds.playClick();
      console.log(`[View] Switched view mode to: ${this.viewMode}`);
    }
    this.prevViewKey = viewKeyDown;

    // Manual weapon reload trigger [KeyR]
    const reloadDown = this.input.isDown('KeyR');
    if (reloadDown && !this.prevReloadKey) {
      this.reload();
    }
    this.prevReloadKey = reloadDown;

    // Weapon firing trigger (LMB or KeyF)
    const isAutoWeapon = (this.equippedWeapon === 'plasma_rifle' || this.equippedWeapon === 'assault_rifle');
    // Automatic Airlock Grapple Tether Launch [KeyF]
    const tetherDown = this.input.isDown('KeyF');
    if (tetherDown && !this.prevTetherKey) {
      this.launchTetherToAirlock();
    }
    this.prevTetherKey = tetherDown;

    // Dual Grapplers Trigger: LMB for Left Hook, RMB for Right Hook
    if (this.equippedWeapon === 'dual_grapplers') {
      if (this.input.mouse.leftButton && !this.prevMouseLeft) {
        this.toggleHook('left');
      }
      this.prevMouseLeft = this.input.mouse.leftButton;

      if (this.input.mouse.rightButton && !this.prevMouseRight) {
        this.toggleHook('right');
      }
      this.prevMouseRight = this.input.mouse.rightButton;
    } else {
      // Weapon firing trigger (strictly LMB, punch/shoot)
      const fireRequested = this.input.mouse.leftButton;
      if (fireRequested && this.fireCooldown <= 0) {
        if (!isAutoWeapon) {
          this.input.mouse.leftButton = false; // Consume click for semi-auto / single fire
        }
        this.triggerFire();
      }
    }

    // Armory Weapon Pedestal Proximity & Interaction [KeyE]
    this.nearWeaponPedestal = null;
    if (this.environment && this.environment.armoryPedestals) {
      for (const ped of this.environment.armoryPedestals) {
        const dx = this.position.x - ped.position.x;
        const dz = this.position.z - ped.position.z;
        const distSq = dx * dx + dz * dz;
        if (distSq <= 5.5 && Math.abs(this.position.y - ped.position.y) < 2.5) {
          this.nearWeaponPedestal = ped;
          break;
        }
      }
    }

    // Class Special Ability [KeyQ]
    const abilityDown = this.input.isDown('KeyQ');
    if (abilityDown && !this.prevAbilityKey) {
      this.triggerAbility();
    }
    this.prevAbilityKey = abilityDown;

    // Quick Dual Grappler [KeyG] for Scout
    const grappleDown = this.input.isDown('KeyG');
    if (grappleDown && !this.prevGrappleKey) {
      if (this.isAnyHookAnchored()) {
        this.slingshotLeap();
      } else {
        if (this.equippedWeapon !== 'dual_grapplers') {
          this.equipWeapon('dual_grapplers');
        }
        this.firePhysicalHook('left');
        this.firePhysicalHook('right');
      }
    }
    this.prevGrappleKey = grappleDown;

    const interactDown = this.input.isDown('KeyE');
    if (interactDown && !this.prevInteractKey) {
      if (this.nearWeaponPedestal) {
        this.equipWeapon(this.nearWeaponPedestal.id);
      }
    }
    this.prevInteractKey = interactDown;

    // Quick-switch weapons with keys [1-6]
    const keyMap = [
      { key: 'Digit1', id: 'unarmed' },
      { key: 'Digit2', id: 'plasma_rifle' },
      { key: 'Digit3', id: 'railgun' },
      { key: 'Digit4', id: 'energy_pistol' },
      { key: 'Digit5', id: 'assault_rifle' },
      { key: 'Digit6', id: (this.currentCharacter === 'pilot3') ? 'dual_grapplers' : 'combat_knife' }
    ];
    keyMap.forEach(({ key, id }) => {
      const isDown = this.input.isDown(key);
      if (isDown && !this.prevNumKeys[key]) {
        this.equipWeapon(id);
      }
      this.prevNumKeys[key] = isDown;
    });

    // Speed calculation with class passives
    let baseSpeed = 3.8;
    let sprintSpeed = 7.5;
    if (this.currentCharacter === 'pilot3') {
      baseSpeed *= 1.15; // Scout passive +15% base speed
      sprintSpeed *= 1.25; // Scout passive +25% sprint speed
    }
    if (this.rallyTimer > 0) {
      sprintSpeed *= 1.35; // Captain Rally Aura +35% sprint boost
    }
    let targetSpeed = baseSpeed;
    if (this.isCrouching) targetSpeed = 1.8;
    else if (this.isSprinting) targetSpeed = sprintSpeed;

    // Environment Mode Adaptive Collision Clamping & Floor Elevation:
    const currentMode = (this.environment && this.environment.mode) ? this.environment.mode : 'interior';

    if (currentMode === 'eva') {
      // ==========================================
      // SPACEWALK / ZERO-G EVA JETPACK & HULL TETHER
      // ==========================================
      this.isSpacewalk = true;

      // Mag-Boots toggle via [KeyB]
      const magBootsPressed = this.input.isDown('KeyB');
      if (magBootsPressed && !this.prevMagBootsKey) {
        const distToHull = Math.abs(this.position.y - (this.tetherAnchor.y + 4.2));
        if (this.isTethered) {
          // Disengage Mag-Boots -> Activate Jetpack
          this.isTethered = false;
          this.jetpackActive = true;
          sounds.playJetpack(true);
        } else if (distToHull < 8.0) {
          // Re-engage Mag-Boots onto hull
          this.isTethered = true;
          this.jetpackActive = false;
          this.position.y = this.tetherAnchor.y + 4.2;
          this.velocity.set(0, 0, 0);
          sounds.playMagBoot();
        }
      }
      this.prevMagBootsKey = magBootsPressed;

      if (this.isTethered) {
        // --- TETHERED MODE: WALKING ON SHIP HULL WITH MAG-BOOTS ---
        const hullY = this.tetherAnchor.y + 4.2;
        this.position.y = hullY;
        this.velocity.y = 0;
        this.isGrounded = true;

        if (isMoving) {
          this.velocity.x = moveDir.x * targetSpeed;
          this.velocity.z = moveDir.z * targetSpeed;
          this.footstepTimer += delta;
          if (this.footstepTimer >= 0.45) {
            sounds.playMagBoot();
            this.footstepTimer = 0;
          }
        } else {
          this.velocity.x = 0;
          this.velocity.z = 0;
        }

        // Jump disengages Mag-Boots into Jetpack Flight
        if (this.input.isDown('Space')) {
          this.isTethered = false;
          this.jetpackActive = true;
          this.velocity.y = 4.5;
          sounds.playJetpack(true);
        }
      } else {
        // --- JETPACK FLIGHT MODE: 3D 6DOF ZERO-G THRUSTERS ---
        this.isGrounded = false;
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();

        const thrustAccel = this.isSprinting ? 30.0 : 16.0;
        let isThrusting = false;

        if (this.input.isDown('KeyW') || this.input.isDown('ArrowUp')) {
          this.velocity.addScaledVector(camDir, thrustAccel * delta);
          isThrusting = true;
        }
        if (this.input.isDown('KeyS') || this.input.isDown('ArrowDown')) {
          this.velocity.addScaledVector(camDir, -thrustAccel * delta);
          isThrusting = true;
        }
        if (this.input.isDown('KeyA') || this.input.isDown('ArrowLeft')) {
          this.velocity.addScaledVector(camRight, -thrustAccel * delta);
          isThrusting = true;
        }
        if (this.input.isDown('KeyD') || this.input.isDown('ArrowRight')) {
          this.velocity.addScaledVector(camRight, thrustAccel * delta);
          isThrusting = true;
        }
        if (this.input.isDown('Space')) {
          this.velocity.y += thrustAccel * delta;
          isThrusting = true;
        }
        if (this.input.isDown('KeyC') || this.input.isDown('ControlLeft')) {
          this.velocity.y -= thrustAccel * delta;
          isThrusting = true;
        }

        // Space drag / RCS stabilizer damping
        this.velocity.multiplyScalar(0.985);

        // Sound & Fuel
        if (isThrusting) {
          this.thrusterParticleTimer += delta;
          if (this.thrusterParticleTimer >= 0.18) {
            sounds.playJetpack(this.isSprinting);
            this.thrusterParticleTimer = 0;
          }
          this.jetpackFuel = Math.max(0, this.jetpackFuel - delta * (this.isSprinting ? 8.0 : 3.5));
        } else {
          this.jetpackFuel = Math.min(this.jetpackMaxFuel, this.jetpackFuel + delta * 6.0);
        }
      }

      // Check proximity to exterior airlock hatch on Mothership
      const distToAirlock = this.position.distanceTo(this.tetherAnchor);
      this.nearExteriorAirlock = (distToAirlock < 7.0);
      if (this.nearExteriorAirlock && this.input.isDown('KeyE')) {
        if (this.onInteract) this.onInteract('enter_interior');
      }

      // Tether range limiter (elastic pull at > 260m)
      const distToShip = this.position.distanceTo(this.tetherAnchor);
      if (distToShip > 250) {
        const pullDir = new THREE.Vector3().subVectors(this.tetherAnchor, this.position).normalize();
        this.velocity.addScaledVector(pullDir, 22.0 * delta);
      }

      this.nearCockpit = false;
      this.nearDoor = false;
      this.nearStorageDoor = false;
      this.nearCryoPod = false;
      this.nearAirlock = false;

    } else {
      this.isSpacewalk = false;
      this.nearExteriorAirlock = false;

      // Ladder Detection in Starship Interior:
      this.nearLadder = null;
      if (currentMode === 'interior') {
        if (this.position.x >= -7.5 && this.position.x <= -4.5 && this.position.z >= 43.2 && this.position.z <= 46.8 && this.position.y >= -0.5 && this.position.y <= 9.2) {
          this.nearLadder = 'upper';
        } else if (
          (this.position.x >= 4.5 && this.position.x <= 7.5 && this.position.z >= 43.2 && this.position.z <= 46.8 && this.position.y >= -7.2 && this.position.y <= 1.2) ||
          (this.position.x >= 0.8 && this.position.x <= 3.2 && this.position.z >= 45.5 && this.position.z <= 48.5 && this.position.y >= -7.2 && this.position.y <= 1.2)
        ) {
          this.nearLadder = 'lower';
        }
      }

      // Ladder climbing mechanics
      if (this.nearLadder) {
        const climbUp = this.input.isDown('KeyW') || this.input.isDown('ArrowUp') || this.input.isDown('Space');
        const climbDown = this.input.isDown('KeyS') || this.input.isDown('ArrowDown') || this.input.isDown('KeyC');

        if (climbUp) {
          this.isClimbing = true;
          this.velocity.y = 3.6;
          this.isGrounded = false;
        } else if (climbDown) {
          this.isClimbing = true;
          this.velocity.y = -3.6;
          this.isGrounded = false;
        } else {
          this.isClimbing = true;
          this.velocity.y = 0;
        }
      } else {
        this.isClimbing = false;
      }

      // Jump trigger (when not on ladder)
      if (this.input.isDown('Space') && this.isGrounded && !this.isClimbing) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        sounds.playJump();
        if (this.actions['jump']) {
          this.fadeToAction('jump', 0.12);
        }
      }

      // Horizontal velocity
      if (isMoving && !this.isClimbing) {
        this.velocity.x = moveDir.x * targetSpeed;
        this.velocity.z = moveDir.z * targetSpeed;

        // Footstep sound sync
        if (this.isGrounded) {
          this.footstepTimer += delta;
          const interval = this.isSprinting ? 0.28 : 0.44;
          if (this.footstepTimer >= interval) {
            sounds.playFootstep();
            this.footstepTimer = 0;
          }
        }
      } else if (this.isClimbing) {
        this.velocity.x = moveDir.x * 1.2;
        this.velocity.z = moveDir.z * 1.2;
        this.footstepTimer = 0;
      } else {
        this.velocity.x = 0;
        this.velocity.z = 0;
        this.footstepTimer = 0;
      }



      // Gravity (disabled while on ladder)
      if (!this.isGrounded && !this.isClimbing) {
        this.velocity.y -= this.gravity * delta;
      }
    }

    // Apply movement
    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.position.z += this.velocity.z * delta;

    // Always rotate player mesh smoothly towards target facing angle based on camera yaw & movement
    if (this.mesh && !this.isSeatedInCockpit) {
      let targetAngle;
      if (isMoving && !this.isClimbing) {
        targetAngle = Math.atan2(moveDir.x, moveDir.z);
      } else {
        targetAngle = this.cameraYaw + Math.PI;
      }
      let curAngle = this.mesh.rotation.y;
      let diff = targetAngle - curAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      const turnSpeed = isMoving ? (this.isSprinting ? 28.0 : 20.0) : 24.0;
      this.mesh.rotation.y += diff * Math.min(1.0, delta * turnSpeed);
    }

    if (currentMode !== 'eva') {
      // Dynamic stride compensation
      let dynamicStrideOffset = 0;
      if (this.isSprinting && isMoving && !this.isClimbing) {
        dynamicStrideOffset = 0.16;
      } else if (isMoving && !this.isClimbing) {
        dynamicStrideOffset = 0.04;
      }

      // Base floor height determination with ROCK-SOLID floor stability
      let baseFloorY = (currentMode === 'starbase') ? 0.30 : 0.08;

      if (currentMode === 'interior') {
        if (this.deckLevel === 'upper') {
          baseFloorY = 8.5;
          if (this.position.y < 4.0) {
            this.deckLevel = 'main';
            baseFloorY = 0.08;
          }
        } else if (this.deckLevel === 'upper') {
        // Upper Mezzanine Storage & Cargo Cathedral Deck:
        this.position.x = Math.max(-25.5, Math.min(25.5, this.position.x));
        this.position.z = Math.max(43.5, Math.min(115.0, this.position.z));
      } else if (this.deckLevel === 'lower') {
          baseFloorY = -6.28;
          if (this.position.y > -0.2) {
            this.deckLevel = 'main';
            baseFloorY = 0.08;
          }
        } else {
          // Main Deck: RIGID solid floor plate at Y = 0.08
          baseFloorY = 0.08;
          this.deckLevel = 'main';

          // Strictly require ladder climb or hatch descent to change deck levels
          if (this.position.y >= 7.5 && this.position.z >= 38.0 && this.position.z <= 118.0 && Math.abs(this.position.x) <= 28.0) {
            this.deckLevel = 'upper';
            baseFloorY = 8.5;
          } else if (
            (this.isClimbing && this.nearLadder === 'lower' && this.position.y < -0.6) ||
            (this.position.y < -1.5 && (
              (Math.abs(this.position.x - 6.0) < 1.3 && Math.abs(this.position.z - 45.0) < 1.3) ||
              (Math.abs(this.position.x - 2.0) < 1.1 && Math.abs(this.position.z - 47.0) < 1.1)
            ))
          ) {
            this.deckLevel = 'lower';
            baseFloorY = -6.28;
          }
        }
      }

      const targetFloorY = baseFloorY + dynamicStrideOffset;

      if (this.position.y <= targetFloorY && !this.isClimbing) {
        if (!this.isGrounded && this.velocity.y < -2.0) {
          sounds.playLand();
        }
        this.position.y = targetFloorY;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }

    if (currentMode === 'starbase') {
      // Starbase station walking bounds (X in [-18.5, 18.5], Z in [-34.0, 42.0])
      this.position.x = Math.max(-18.5, Math.min(18.5, this.position.x));
      this.position.z = Math.max(-34.0, Math.min(42.0, this.position.z));

      // Starship boarding departure gate check at Z = 32.0
      this.nearDepartureGate = (this.position.z >= 25.0 && this.position.z <= 38.0 && Math.abs(this.position.x) <= 4.8);
      if (this.nearDepartureGate && this.input.isDown('KeyE')) {
        if (this.onInteract) this.onInteract('board_starship');
      }
      this.nearCockpit = false;
      this.nearDoor = false;
      this.nearStorageDoor = false;
      this.nearCryoPod = false;
    } else {
      // Starship Interior Mode
      this.nearDepartureGate = false;
      const doorOpen = this.environment ? this.environment.isDoorOpen('blastDoor') : true;

      if (this.deckLevel === 'lower') {
        // Lower Sub-Deck: Cryo-Stasis, Engineering Bay & Compartment Walkways
        this.position.x = Math.max(-5.5, Math.min(14.5, this.position.x));
        this.position.z = Math.max(34.8, Math.min(62.0, this.position.z));

        // Cryo bulkhead door seal collision when closed
        const cryoBulkheadOpen = this.environment ? this.environment.isLowerDoorOpen('cryo_bulkhead') : true;
        if (!cryoBulkheadOpen && this.position.z < 39.8 && this.position.z > 39.0 && Math.abs(this.position.x - 6.0) < 1.4) {
          this.position.z = 39.8;
        }

        // Port compartment door seal collision when closed
        const portDoorOpen = this.environment ? this.environment.isLowerDoorOpen('port_compartment') : true;
        if (!portDoorOpen && this.position.x < 4.2 && this.position.x > 3.8 && Math.abs(this.position.z - 45.0) < 1.2) {
          this.position.x = 4.2;
        }

        // Starboard compartment door seal collision when closed
        const starDoorOpen = this.environment ? this.environment.isLowerDoorOpen('starboard_compartment') : true;
        if (!starDoorOpen && this.position.x > 7.8 && this.position.x < 8.2 && Math.abs(this.position.z - 45.0) < 1.2) {
          this.position.x = 7.8;
        }
      } else if (this.position.z <= -17.5) {
        // Zone 0: Cockpit Bridge Deck (Z in [-31.5, -17.5], X in [-4.2, 4.2])
        this.position.x = Math.max(-4.2, Math.min(4.2, this.position.x));
        this.position.z = Math.max(-26.8, this.position.z);
      } else if (this.position.z <= 17.4) {
        // Zone 1: Central Corridor (Z in [-17.5, 17.4], width ~6.3m)
        this.position.x = Math.max(-2.65, Math.min(2.65, this.position.x));
        if (!doorOpen) {
          this.position.z = Math.min(17.3, this.position.z);
        }
      } else if (this.position.z <= 18.6) {
        // Zone 2: Blast Doorway Opening Threshold
        this.position.x = Math.max(-2.4, Math.min(2.4, this.position.x));
      } else {
        // Zone 3: Grand Sci-Fi Hall (Z in [18.6, 134.0], width ~50m)
        this.position.x = Math.max(-23.5, Math.min(23.5, this.position.x));
        this.position.z = Math.min(134.0, this.position.z);
        if (!doorOpen && this.position.z < 18.2) {
          this.position.z = 18.2;
        }
      }

      // Pilot Seat Interaction (at X = 0, Z = -23.8 in Cockpit Bridge Deck)
      const distToPilotSeat = Math.hypot(this.position.x, this.position.z - (-19.50));
      this.nearPilotSeat = (distToPilotSeat <= 1.5 && this.deckLevel === 'main');
      this.nearCockpit = this.nearPilotSeat;
      const sitKeyDown = this.input.isDown('KeyE');
      if (this.nearPilotSeat && sitKeyDown && !this.prevKeyE && !this.isSeatedInCockpit) {
        this.sitInPilotSeat();
      }
      this.prevKeyE = sitKeyDown;

      // Proximity to blast doors indicator
      this.nearDoor = (this.position.z > 12.0 && this.position.z < 23.0 && Math.abs(this.position.x) < 4.0);

      // Upper Deck Storage door sensor: automatic opening when approaching
      this.nearStorageDoor = (this.deckLevel === 'upper' && this.position.z >= 43.0 && this.position.z <= 65.0);
      if (this.environment && this.environment.setStorageDoorsOpen) {
        this.environment.setStorageDoorsOpen(this.nearStorageDoor);
      }

      // Lower Deck CryoPod canopy sensor: automatic opening when approaching cryo pods
      const inForwardCryo = (this.deckLevel === 'lower' && this.position.z >= 34.0 && this.position.z <= 41.5 && Math.abs(this.position.x - 6.0) <= 5.0);
      const inPortCryo = (this.deckLevel === 'lower' && this.position.x <= 3.2 && this.position.z >= 43.0 && this.position.z <= 54.0);
      this.nearCryoPod = (inForwardCryo || inPortCryo);
      if (this.environment && this.environment.setCryoDoorsOpen) {
        this.environment.setCryoDoorsOpen(this.nearCryoPod);
      }

      // Interior EVA Airlock Chamber Trigger (Grand Hall Port Wall at X = -18.2, Z = 50.0)
      this.nearAirlock = (this.deckLevel === 'main' && Math.abs(this.position.x - (-18.2)) < 3.2 && Math.abs(this.position.z - 50.0) < 3.2);
      if (this.nearAirlock && this.input.isDown('KeyE')) {
        if (this.onInteract) this.onInteract('exit_to_space');
      }
    }
  }

  updateAnimationState(isMoving = false) {
    if (this.hasGunInHand()) {
      // Layered Animation Mode: Upper Body (Hold Gun / Reload) + Lower Body (Walk / Run / Idle)
      if (this.isReloading && this.actions['reload']) {
        this.fadeToUpperAction('reload', 0.12);
      } else if (this.actions['hold_gun']) {
        this.fadeToUpperAction('hold_gun', 0.15);
      }

      // Lower Body Locomotion Layer
      let lowerTarget = 'idle_lower';
      if (this.isClimbing || this.isCrouching) {
        lowerTarget = 'crouch_lower';
      } else if (!this.isGrounded) {
        lowerTarget = 'jump_lower';
      } else if (isMoving) {
        lowerTarget = this.isSprinting ? 'run_lower' : 'walk_lower';
      } else {
        lowerTarget = 'idle_lower';
      }
      this.fadeToLowerAction(lowerTarget, 0.15);

      // Fade out full-body action if still active
      if (this.currentAction) {
        this.currentAction.fadeOut(0.15);
        this.currentAction = null;
      }
      return;
    }

    // Unarmed / Melee / Full-Body Mode:
    if (this.currentUpperAction) {
      this.currentUpperAction.fadeOut(0.15);
      this.currentUpperAction = null;
    }
    if (this.currentLowerAction) {
      this.currentLowerAction.fadeOut(0.15);
      this.currentLowerAction = null;
    }

    if (this.isAttacking) return;

    if (this.isClimbing) {
      if (isMoving && this.actions['crouch']) {
        this.fadeToAction('crouch', 0.15);
      } else if (this.actions['idle']) {
        this.fadeToAction('idle', 0.2);
      }
      return;
    }

    if (!this.isGrounded) {
      if (this.actions['jump']) {
        this.fadeToAction('jump', 0.15);
      }
      return;
    }

    if (this.isCrouching) {
      if (this.actions['crouch']) {
        this.fadeToAction('crouch', 0.2);
      }
      return;
    }

    if (isMoving) {
      if (this.isSprinting && this.actions['run']) {
        this.fadeToAction('run', 0.15);
      } else if (this.actions['walk']) {
        this.fadeToAction('walk', 0.15);
      } else if (this.actions['run']) {
        this.fadeToAction('run', 0.15);
      }
    } else {
      if (this.actions['idle']) {
        this.fadeToAction('idle', 0.2);
      }
    }
  }

  updateCamera(delta) {
    if (this.isSeatedInCockpit) {
      // Sitting in the pilot seat looking out at the panoramic screens and flight controls
      const eyePos = new THREE.Vector3(0, 1.28, -19.50);

      const lookDir = new THREE.Vector3(0, 0, -1);
      lookDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.cameraPitch);
      lookDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

      this.camera.position.copy(eyePos);
      this.camera.lookAt(eyePos.clone().add(lookDir));
      this.camera.near = 0.03;
      this.camera.fov = 74.0;
      this.camera.updateProjectionMatrix();

      if (this.mesh) {
        this.mesh.visible = true;
        this.mesh.position.set(0, 0.52, -19.50);
        this.mesh.rotation.set(0, 0, 0);
      }
      return;
    }

    const isFirstPerson = this.viewMode === 'firstPerson';

    // In true first-person and third-person, character avatar mesh is always visible!
    // When looking down, player sees their arms, chest, legs, and feet
    if (this.mesh) {
      this.mesh.visible = true;
    }

    // Hide detached camera viewmodel so we don't have duplicate floating weapons
    if (this.viewmodelGroup) {
      this.viewmodelGroup.visible = false;
    }
    // Real 3D weapon in hands is visible
    if (this.heldGunGroup) {
      this.heldGunGroup.visible = this.hasGunInHand();
    }

    // Smooth viewmodel recoil decay
    this.viewmodelRecoil = THREE.MathUtils.lerp(this.viewmodelRecoil, 0, (delta || 0.016) * 14.0);

    if (isFirstPerson) {
      // True First Person Camera: Placed just outside the head/visor with clear forward sightline
      const headBone = this.mesh ? this.mesh.getObjectByName('CC_Base_Head') : null;
      let eyePos;
      if (headBone) {
        const headPos = new THREE.Vector3();
        headBone.getWorldPosition(headPos);
        // Offset 0.26m forward along facing yaw so camera sits just outside the helmet visor glass
        const forwardYaw = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
        eyePos = headPos.clone()
          .add(forwardYaw.clone().multiplyScalar(0.26))
          .add(new THREE.Vector3(0, 0.075, 0));
      } else {
        const eyeHeight = this.isCrouching ? 1.25 : 1.72;
        const forwardYaw = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
        eyePos = this.position.clone()
          .add(new THREE.Vector3(0, eyeHeight, 0))
          .add(forwardYaw.clone().multiplyScalar(0.26));
      }

      // Calculate look direction directly from cameraYaw and cameraPitch
      const lookDir = new THREE.Vector3(0, 0, -1);
      lookDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.cameraPitch);
      lookDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

      const lookTarget = eyePos.clone().add(lookDir);

      this.camera.position.copy(eyePos);
      this.camera.lookAt(lookTarget);
      this.camera.near = 0.03; // Crisp near-plane: prevents clipping face while looking down at chest/arms/legs/feet
      this.camera.updateProjectionMatrix();

      // Reset third-person smoothing buffers for seamless switching
      this.smoothedCamPos = null;
      this.smoothedLookTarget = null;

      // Dynamic sprint FOV sync for high speed immersion
      const targetFov = this.isSprinting ? 78.0 : 70.0;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, (delta || 0.016) * 10.0);
      this.camera.updateProjectionMatrix();

    } else {
      // 3rd Person Over-the-shoulder camera calculation
      const currentCamDistance = this.isSprinting ? this.cameraDistance + 0.45 : this.cameraDistance;
      const offset = new THREE.Vector3(0, 0, currentCamDistance);
      offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.cameraPitch);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

      const shoulderOffset = new THREE.Vector3(this.cameraTargetOffset.x, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

      const targetPos = this.position.clone()
        .add(new THREE.Vector3(0, this.cameraTargetOffset.y, 0))
        .add(shoulderOffset);

      const camPos = targetPos.clone().add(offset);

      // Clamp camera above floor
      if (camPos.y < 0.3) camPos.y = 0.3;

      // Smooth dual tracking: camera position and look target stay in lockstep without jitter
      if (!this.smoothedCamPos) {
        this.smoothedCamPos = camPos.clone();
        this.smoothedLookTarget = targetPos.clone();
      }

      const followSpeed = this.isSprinting ? 28.0 : 20.0;
      const followLerp = 1.0 - Math.exp(-followSpeed * (delta || 0.016));
      this.smoothedCamPos.lerp(camPos, followLerp);
      this.smoothedLookTarget.lerp(targetPos, followLerp);

      this.camera.position.copy(this.smoothedCamPos);
      this.camera.lookAt(this.smoothedLookTarget);
      this.camera.near = 0.1;

      // Dynamic sprint FOV sync
      const targetFov = this.isSprinting ? 68.0 : 60.0;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, (delta || 0.016) * 8.0);
      this.camera.updateProjectionMatrix();
    }
  }

  triggerAbility() {
    if (this.abilityCooldown > 0) {
      return { success: false, reason: 'cooldown', remaining: Math.ceil(this.abilityCooldown) };
    }

    if (this.currentCharacter === 'pilot1') {
      // Captain: Tactical Rally Aura (+50 Shield, +35% sprint boost for 8s)
      this.abilityCooldown = 25.0;
      this.abilityMaxCooldown = 25.0;
      this.rallyTimer = 8.0;
      if (this.combat) {
        this.combat.shield = Math.min(100, (this.combat.shield || 0) + 50);
      }
      sounds.playRally();
      const res = {
        success: true,
        type: 'rally',
        name: 'TACTICAL RALLY',
        message: '⭐ TACTICAL RALLY: SHIELDS RESTORED (+50) & SPRINT OVERDRIVE!'
      };
      if (this.onAbilityTriggered) this.onAbilityTriggered(res);
      return res;
    } else if (this.currentCharacter === 'pilot2') {
      // Mechanic: Nanite Field Repair & Munitions (+40 Hull, refill all weapon ammo)
      this.abilityCooldown = 20.0;
      this.abilityMaxCooldown = 20.0;
      if (this.combat) {
        this.combat.hull = Math.min(100, (this.combat.hull || 0) + 40);
      }
      Object.values(WEAPON_DEFS).forEach(def => {
        if (def.magSize && def.magSize !== Infinity) {
          def.currentAmmo = def.magSize;
        }
      });
      sounds.playRepair();
      const res = {
        success: true,
        type: 'repair',
        name: 'NANITE FIELD REPAIR',
        message: '🔧 NANITE REPAIR: HULL RESTORED (+40) & WEAPONS RE-ARMED!'
      };
      if (this.onAbilityTriggered) this.onAbilityTriggered(res);
      return res;
    } else if (this.currentCharacter === 'pilot3') {
      // Scout: Dual Kinetic Wrist Grapplers Slingshot
      this.abilityCooldown = 4.0;
      this.abilityMaxCooldown = 4.0;
      if (this.isAnyHookAnchored()) {
        this.slingshotLeap();
      } else {
        if (this.equippedWeapon !== 'dual_grapplers') {
          this.equipWeapon('dual_grapplers');
        }
        this.firePhysicalHook('left');
        this.firePhysicalHook('right');
      }
      const res = {
        success: true,
        type: 'grapple',
        name: 'DUAL WRIST GRAPPLERS',
        message: '⚡ DUAL WRIST GRAPPLERS: KINETIC HOOKS ENGAGED!'
      };
      if (this.onAbilityTriggered) this.onAbilityTriggered(res);
      return res;
    }
  }

  fireDualGrapple() {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    const raycaster = new THREE.Raycaster();
    raycaster.set(this.camera.position, forward);
    raycaster.far = 90.0;

    let targets = [];
    if (this.environment && this.environment.scene) {
      targets.push(this.environment.scene);
    } else {
      targets.push(this.scene);
    }

    const intersects = raycaster.intersectObjects(targets, true).filter(hit => {
      let obj = hit.object;
      while (obj) {
        if (obj === this.mesh || obj === this.grappleBeamGroup || obj === this.heldGunGroup) return false;
        obj = obj.parent;
      }
      return true;
    });

    if (intersects.length > 0) {
      const hitPoint = intersects[0].point.clone();
      this.grappleAnchorLeft = hitPoint.clone().add(new THREE.Vector3(-0.25, 0, 0));
      this.grappleAnchorRight = hitPoint.clone().add(new THREE.Vector3(0.25, 0, 0));
      this.isGrappling = true;
      this.grappleTimer = 0;

      sounds.playGrapple();
      sounds.playGrappleHit();

      this.rebuildGrappleLines();

      // Kinetic pull velocity
      const pullDir = hitPoint.clone().sub(this.position).normalize();
      this.velocity.add(pullDir.multiplyScalar(22.0));
      this.velocity.y = Math.max(this.velocity.y, 4.0);
      this.isGrounded = false;
    } else {
      // Slingshot air impulse if no anchor in range
      this.velocity.add(forward.clone().multiplyScalar(15.0));
      this.velocity.y += 3.5;
      sounds.playGrapple();
    }
  }

  releaseGrapple(slingshotBoost = false) {
    if (!this.isGrappling) return;
    this.isGrappling = false;
    this.grappleAnchorLeft = null;
    this.grappleAnchorRight = null;
    this.grappleBeamGroup.clear();

    if (slingshotBoost) {
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      this.velocity.add(forward.multiplyScalar(16.0));
      this.velocity.y = Math.max(this.velocity.y, 5.0);
      sounds.playGrapple();
    }
  }

  rebuildGrappleLines() {
    this.grappleBeamGroup.clear();
    if (!this.grappleAnchorLeft || !this.grappleAnchorRight) return;

    const startLeft = this.position.clone().add(new THREE.Vector3(-0.35, 1.2, 0));
    const startRight = this.position.clone().add(new THREE.Vector3(0.35, 1.2, 0));

    const mat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.9
    });

    const geoLeft = new THREE.BufferGeometry().setFromPoints([startLeft, this.grappleAnchorLeft]);
    const geoRight = new THREE.BufferGeometry().setFromPoints([startRight, this.grappleAnchorRight]);

    this.grappleLineLeft = new THREE.Line(geoLeft, mat);
    this.grappleLineRight = new THREE.Line(geoRight, mat);

    this.grappleBeamGroup.add(this.grappleLineLeft);
    this.grappleBeamGroup.add(this.grappleLineRight);
  }

  updateGrapple(delta) {
    if (!this.isGrappling || !this.grappleAnchorLeft) return;

    this.grappleTimer += delta;
    const toAnchor = this.grappleAnchorLeft.clone().sub(this.position);
    const dist = toAnchor.length();

    if (dist < 2.8 || this.grappleTimer > 4.2) {
      this.releaseGrapple(true);
      return;
    }

    const pullDir = toAnchor.clone().normalize();
    this.velocity.add(pullDir.multiplyScalar(44.0 * delta));
    // Counter gravity while grappling to allow ascending
    this.velocity.y += (this.gravity * 0.92) * delta;

    // Slingshot release if pressing Jump [Space]
    if (this.input.isDown('Space')) {
      this.releaseGrapple(true);
      return;
    }

    // Update lines
    if (this.grappleLineLeft && this.grappleLineRight) {
      let startLeft, startRight;
      if (this.viewMode === 'firstPerson') {
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        startLeft = this.camera.position.clone().add(forward.clone().multiplyScalar(0.4)).add(right.clone().multiplyScalar(-0.25)).add(new THREE.Vector3(0, -0.2, 0));
        startRight = this.camera.position.clone().add(forward.clone().multiplyScalar(0.4)).add(right.clone().multiplyScalar(0.25)).add(new THREE.Vector3(0, -0.2, 0));
      } else {
        startLeft = this.position.clone().add(new THREE.Vector3(-0.35, 1.25, 0));
        startRight = this.position.clone().add(new THREE.Vector3(0.35, 1.25, 0));
      }
      this.grappleLineLeft.geometry.setFromPoints([startLeft, this.grappleAnchorLeft]);
      this.grappleLineRight.geometry.setFromPoints([startRight, this.grappleAnchorRight]);
    }
  }

  toggleHook(side) {
    const hook = this.grappleHooks[side];
    if (!hook) return;

    if (hook.state !== 'idle') {
      this.retractHook(side);
    } else {
      this.firePhysicalHook(side);
    }
  }

  firePhysicalHook(side) {
    const hook = this.grappleHooks[side];
    if (!hook) return;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const lateralOffset = (side === 'left') ? -0.28 : 0.28;
    let origin;
    if (this.viewMode === 'firstPerson') {
      origin = this.camera.position.clone()
        .add(forward.clone().multiplyScalar(0.35))
        .add(right.clone().multiplyScalar(lateralOffset))
        .add(new THREE.Vector3(0, -0.16, 0));
    } else {
      const bone = (side === 'left') ? this.leftHandBone : this.rightHandBone;
      if (bone) {
        origin = new THREE.Vector3();
        bone.getWorldPosition(origin);
      } else {
        origin = this.position.clone().add(new THREE.Vector3(lateralOffset, 1.25, 0));
      }
    }

    // Direct trajectory aligned with player aim crosshair
    const aimTarget = this.camera.position.clone().add(forward.clone().multiplyScalar(75.0));
    const aimDir = aimTarget.clone().sub(origin).normalize();
    const initialVel = aimDir.multiplyScalar(92.0);

    hook.state = 'flying';
    hook.pos.copy(origin);
    hook.prevPos.copy(origin);
    hook.vel.copy(initialVel);
    hook.flightTime = 0;
    hook.line.visible = true;
    hook.head.visible = true;
    hook.head.position.copy(origin);

    sounds.playGrapple();
  }

  retractHook(side) {
    const hook = this.grappleHooks[side];
    if (!hook) return;
    hook.state = 'idle';
    hook.line.visible = false;
    hook.head.visible = false;
    hook.restLength = 0;
  }

  isAnyHookAnchored() {
    return (this.grappleHooks.left && this.grappleHooks.left.state === 'anchored') ||
           (this.grappleHooks.right && this.grappleHooks.right.state === 'anchored');
  }

  slingshotLeap() {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    this.velocity.add(forward.multiplyScalar(24.0));
    this.velocity.y = Math.max(this.velocity.y + 6.0, 8.5);
    this.retractHook('left');
    this.retractHook('right');
    sounds.playGrapple();
    this.isGrounded = false;
  }

  updateHookPhysics(delta) {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    ['left', 'right'].forEach(side => {
      const hook = this.grappleHooks[side];
      if (!hook || hook.state === 'idle') return;

      const lateralOffset = (side === 'left') ? -0.28 : 0.28;
      let wristPos;
      if (this.viewMode === 'firstPerson') {
        wristPos = this.camera.position.clone()
          .add(forward.clone().multiplyScalar(0.35))
          .add(right.clone().multiplyScalar(lateralOffset))
          .add(new THREE.Vector3(0, -0.16, 0));
      } else {
        const bone = (side === 'left') ? this.leftHandBone : this.rightHandBone;
        if (bone) {
          wristPos = new THREE.Vector3();
          bone.getWorldPosition(wristPos);
        } else {
          wristPos = this.position.clone().add(new THREE.Vector3(lateralOffset, 1.25, 0));
        }
      }

      if (hook.state === 'flying') {
        hook.flightTime += delta;
        hook.vel.y -= 9.8 * delta; // Realistic ballistic gravity drop

        hook.prevPos.copy(hook.pos);
        hook.pos.addScaledVector(hook.vel, delta);
        hook.head.position.copy(hook.pos);
        if (hook.vel.lengthSq() > 0.1) {
          hook.head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), hook.vel.clone().normalize());
        }

        const segVec = hook.pos.clone().sub(hook.prevPos);
        const segDist = segVec.length();
        if (segDist > 0.001) {
          const raycaster = new THREE.Raycaster(hook.prevPos, segVec.clone().normalize(), 0, segDist);
          let targets = [];
          if (this.environment && this.environment.scene) targets.push(this.environment.scene);
          targets.push(this.scene);

          const hits = raycaster.intersectObjects(targets, true).filter(hit => {
            let o = hit.object;
            while (o) {
              if (o === this.mesh || o === this.grappleGroup || o === this.heldGunGroup) return false;
              o = o.parent;
            }
            return hit.point !== undefined;
          });

          if (hits.length > 0) {
            hook.state = 'anchored';
            hook.pos.copy(hits[0].point);
            hook.anchor.copy(hits[0].point);
            hook.head.position.copy(hits[0].point);
            hook.restLength = Math.max(2.5, hook.pos.distanceTo(this.position) * 0.95);
            sounds.playGrappleHit();
          } else if (hook.pos.distanceTo(this.position) > 110.0 || hook.flightTime > 1.6) {
            this.retractHook(side);
            return;
          }
        }
      } else if (hook.state === 'anchored') {
        const toAnchor = hook.anchor.clone().sub(this.position);
        const d = toAnchor.length();
        const dir = toAnchor.clone().normalize();

        // Active automatic reeling + boosted reeling on holding W or mouse triggers
        const isFastReel = this.input.isDown('KeyW') || 
                           (side === 'left' && this.input.mouse.leftButton) || 
                           (side === 'right' && this.input.mouse.rightButton);
        const reelSpeed = isFastReel ? 32.0 : 20.0;
        hook.restLength = Math.max(1.8, hook.restLength - reelSpeed * delta);

        // Directional kinetic tension pulling avatar toward anchor
        const stretch = Math.max(0, d - hook.restLength);
        const tensionForce = stretch * 55.0 + 38.0;
        this.velocity.add(dir.clone().multiplyScalar(tensionForce * delta));

        // Pendulum constraint away from anchor point
        const radialVel = this.velocity.dot(dir);
        if (radialVel < 0) {
          this.velocity.sub(dir.clone().multiplyScalar(radialVel * 0.96));
        }

        // Counteract downward gravity for effortless swinging & climbing
        this.velocity.y += (this.gravity * 0.94) * delta;
        this.isGrounded = false;

        // Auto-vault upon reaching grapple anchor point
        if (d < 2.2) {
          this.velocity.y = Math.max(this.velocity.y, 5.5);
          this.velocity.add(forward.clone().multiplyScalar(7.0));
          this.retractHook(side);
          return;
        }
      }

      // Update line vertex buffer
      const posAttr = hook.line.geometry.attributes.position;
      posAttr.setXYZ(0, wristPos.x, wristPos.y, wristPos.z);
      posAttr.setXYZ(1, hook.pos.x, hook.pos.y, hook.pos.z);
      posAttr.needsUpdate = true;
      hook.line.geometry.computeBoundingSphere();
    });
  }

  update(delta) {
    // Shield regeneration after 4 seconds of taking no damage
    if (!this.isDead && this.shield < this.maxShield) {
      this.shieldRegenTimer += delta;
      if (this.shieldRegenTimer >= 4.0) {
        this.shield = Math.min(this.maxShield, this.shield + delta * 15.0);
      }
    }

    // Downed / Death handling (freeze controls while downed)
    if (this.isDead) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
      return;
    }

    this.updateHookPhysics(delta);
    if (this.abilityCooldown > 0) {
      this.abilityCooldown = Math.max(0, this.abilityCooldown - delta);
    }
    if (this.rallyTimer > 0) {
      this.rallyTimer = Math.max(0, this.rallyTimer - delta);
    }
    this.updateGrapple(delta);

    if (this.fireCooldown > 0) {
      this.fireCooldown -= delta;
    }
    if (this.equippedMixer) {
      this.equippedMixer.update(delta);
    }

    this.handleInput(delta);
    this.updateAnimationState(this.isMoving);

    // Keep 3D player avatar locked directly to player physics position
    if (this.mesh) {
      this.mesh.position.copy(this.position);
    }

    if (this.mixer) {
      this.mixer.update(delta);
    }
    if (this.mesh) {
      const headBone = this.mesh.getObjectByName('CC_Base_Head');
      if (headBone) {
        headBone.rotation.x = -this.cameraPitch * 0.65;
      }
      this.mesh.updateMatrixWorld(true);
    }
    this.updateHeldGunPosition(delta);
    this.updateCamera(delta);
  }

  updateHeldGunPosition(delta) {
    if (!this.equippedWeapon || this.equippedWeapon === 'unarmed') {
      this.heldGunGroup.visible = false;
      return;
    }

    this.heldGunGroup.visible = true;

    // Position gun right at right hand's real-time animated position
    const rHand = this.mesh ? this.mesh.getObjectByName('CC_Base_R_Hand') : null;
    if (rHand) {
      rHand.getWorldPosition(this._handWorldPos);
      this.heldGunGroup.position.copy(this._handWorldPos);
    } else {
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
      this.heldGunGroup.position.copy(this.position)
        .add(new THREE.Vector3(0, 1.42, 0))
        .add(forward.clone().multiplyScalar(0.30))
        .add(right.clone().multiplyScalar(0.12));
    }

    // Orient gun to face aiming direction
    this.heldGunGroup.rotation.set(0, this.cameraYaw, 0, 'YXZ');
    this.heldGunGroup.rotateX(this.cameraPitch * 0.72);

    if (this.equippedMixer) {
      this.equippedMixer.update(delta);
    }
  }


  checkMeleeHit() {
    const isKnife = (this.equippedWeapon === 'combat_knife');
    const punchDamage = isKnife ? 45 : 25;
    const punchRange = isKnife ? 2.4 : 2.0;

    const punchOrigin = this.position.clone().add(new THREE.Vector3(0, 1.35, 0));
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    let hitTarget = false;

    // A. Check Friendly Fire hits against remote peers
    if (this.multiplayer && this.multiplayer.peers) {
      this.multiplayer.peers.forEach((peer, peerId) => {
        if (!peer.mesh) return;

        const peerPos = peer.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const toPeer = peerPos.clone().sub(punchOrigin);
        const dist = toPeer.length();

        if (dist <= punchRange) {
          toPeer.normalize();
          const dot = forward.dot(toPeer);
          if (dot > 0.40) { // In front of player within ~65 degree cone
            hitTarget = true;
            console.log(`[Friendly Fire] Melee hit on squad operative ${peerId} for ${punchDamage} damage!`);

            sounds.playPunch();

            if (this.combat) {
              const hitPos = punchOrigin.clone().add(forward.clone().multiplyScalar(dist));
              this.combat.spawnSparks(hitPos, isKnife ? 0xef4444 : 0x00f0ff, 20);
            }

            // Immediately simulate local shield/hull reduction for instantaneous feedback
            if (peer.shield > 0) {
              peer.shield = Math.max(0, peer.shield - punchDamage);
            } else {
              peer.hull = Math.max(0, peer.hull - punchDamage);
            }
            if (this.multiplayer.updatePeerNameplate) {
              this.multiplayer.updatePeerNameplate(peer);
            }

            // Broadcast direct damage packet across WebRTC DataChannel & BroadcastChannel
            this.multiplayer.broadcastDamage({
              targetId: peer.id,
              attackerId: this.multiplayer.localId,
              damage: punchDamage,
              damageType: isKnife ? 'knife' : 'punch',
              direction: [forward.x, forward.y, forward.z]
            });
          }
        }
      });
    }

    // B. Check hits against space enemies if in melee range
    if (this.combat && this.combat.enemies) {
      for (const enemy of this.combat.enemies) {
        if (!enemy.alive) continue;
        const dist = punchOrigin.distanceTo(enemy.mesh.position);
        if (dist <= (punchRange + enemy.radius)) {
          enemy.health -= punchDamage;
          hitTarget = true;
          sounds.playPunch();
          this.combat.spawnSparks(enemy.mesh.position, 0xff5500, 20);
          if (enemy.health <= 0) {
            enemy.alive = false;
            this.combat.combatGroup.remove(enemy.mesh);
            this.combat.spawnSparks(enemy.mesh.position, 0xff5500, 35);
            sounds.playExplosion();
            this.combat.spawnLootCrate(enemy.mesh.position.clone());
          }
          break;
        }
      }
    }

    if (hitTarget) {
      this.viewmodelRecoil = isKnife ? 0.12 : 0.08;
    }
  }

  takeDamage(amount, attackerId = 'unknown', damageType = 'bullet', hitPos = null, hitDir = null) {
    if (this.isDead) return;
    this.shieldRegenTimer = 0; // Reset regen timer on hit

    let damageRemaining = amount;
    if (this.shield > 0) {
      if (this.shield >= damageRemaining) {
        this.shield -= damageRemaining;
        damageRemaining = 0;
      } else {
        damageRemaining -= this.shield;
        this.shield = 0;
      }
    }

    if (damageRemaining > 0) {
      this.health = Math.max(0, this.health - damageRemaining);
    }

    // Audio & screen impact feedback
    if (damageType === 'punch' || damageType === 'knife') {
      sounds.playPunch();
    } else {
      sounds.playLaser(false);
    }

    // Dynamic red damage flash overlay
    const flashEl = document.getElementById('damage-flash');
    if (flashEl) {
      flashEl.style.opacity = '1';
      setTimeout(() => { if (flashEl) flashEl.style.opacity = '0'; }, 180);
    }

    // Camera jolt & physical knockback impulse
    if (hitDir) {
      const impulseStrength = (damageType === 'punch' || damageType === 'knife') ? 7.5 : 4.0;
      this.velocity.addScaledVector(hitDir, impulseStrength);
    }
    this.cameraPitch += (Math.random() - 0.5) * 0.07;
    this.cameraYaw += (Math.random() - 0.5) * 0.07;

    // Hit sparks in 3D scene
    if (this.combat) {
      const sparkPos = hitPos || this.position.clone().add(new THREE.Vector3(0, 1.3, 0));
      this.combat.spawnSparks(sparkPos, (this.shield > 0 ? 0x00f0ff : 0xef4444), 18);
    }

    console.log(`[Combat] Took ${amount} damage from ${attackerId} (${damageType}). S: ${Math.round(this.shield)}% // H: ${Math.round(this.health)}%`);

    // Check for fatal casualty
    if (this.health <= 0) {
      this.handleDeath(attackerId);
    }
  }

  handleDeath(attackerId) {
    this.isDead = true;
    this.respawnTimer = 2.5;
    sounds.playExplosion();

    console.warn(`[Combat] OPERATIVE DOWN! Incapacitated by ${attackerId}. Resurrecting in Medical Pod...`);

    if (this.onDeath) {
      this.onDeath(attackerId);
    }
  }

  respawn() {
    this.isDead = false;
    this.health = 100.0;
    this.shield = 100.0;

    // Teleport to interior Bridge or Lower Cryo Deck respawn point
    this.teleport(new THREE.Vector3(0, 0.08, 0));
    sounds.playRally();

    console.log('[Combat] Operative fully revived and re-equipped with combat nanos.');

    if (this.onRespawn) {
      this.onRespawn();
    }
  }

  teleport(pos) {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    if (this.mesh) this.mesh.position.copy(pos);
    // Instantly snap smoothed camera on teleport to prevent drift across space
    this.smoothedCamPos = null;
    this.smoothedLookTarget = null;
  }

  sitInPilotSeat() {
    this.isSeatedInCockpit = true;
    this.flightViewMode = 'cockpit';
    this.position.set(0, 0.52, -19.50);
    this.velocity.set(0, 0, 0);
    this.cameraYaw = 0; // Look directly forward at panoramic view screens
    this.cameraPitch = 0.04;
    sounds.playDoor();
    if (this.onPilotSeatToggle) {
      this.onPilotSeatToggle(true);
    }
  }

  standUpFromPilotSeat() {
    this.isSeatedInCockpit = false;
    this.flightViewMode = 'cockpit';
    this.position.set(0, 0.08, -18.30);
    this.velocity.set(0, 0, 0);
    sounds.playDoor();
    if (this.onPilotSeatToggle) {
      this.onPilotSeatToggle(false);
    }
  }
}
