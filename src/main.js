// Main Application Entry Point & Game Loop Orchestrator
import * as THREE from 'three';
import { InputManager } from './controls.js';
import { sounds } from './audio.js';
import { PlayerController, WEAPON_DEFS } from './player.js';
import { ShipController } from './ship.js';
import { EnvironmentManager } from './environment.js';
import { CombatManager } from './combat.js';
import { MultiplayerManager } from './multiplayer.js';

// Smart Asset Loader: On cloud deployments (Vercel / Netlify / Web) where Git LFS binary assets
// are not cloned by the CI runner, route /assets/*.glb directly to GitHub's global media CDN with CORS!
const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.'));

THREE.DefaultLoadingManager.setURLModifier((url) => {
  if (typeof window !== 'undefined' && window.__STANDALONE_BUNDLE__ && window.__GET_ASSET_URL__) {
    const standaloneUrl = window.__GET_ASSET_URL__(url);
    if (standaloneUrl) return standaloneUrl;
  }
  return url;
});

// Bottom-Left Rendering & Asset Streaming Progress Controller
let renderLoadingTimer = null;
if (typeof window !== 'undefined') window.updateRenderProgress = updateRenderProgress;
export function updateRenderProgress(label, percent, isComplete = false) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('render-loading-indicator');
  const statusEl = document.getElementById('render-loading-status');
  const percentEl = document.getElementById('render-loading-percent');
  const fillEl = document.getElementById('render-loading-fill');
  if (!container || !statusEl || !percentEl || !fillEl) return;

  if (renderLoadingTimer) clearTimeout(renderLoadingTimer);
  container.style.opacity = '1';
  container.style.transform = 'translateY(0)';
  statusEl.innerText = label;
  const p = Math.min(100, Math.max(0, Math.round(percent)));
  percentEl.innerText = `${p}%`;
  fillEl.style.width = `${p}%`;

  if (isComplete) {
    fillEl.style.background = 'linear-gradient(90deg, #00ffaa, #38bdf8)';
    renderLoadingTimer = setTimeout(() => {
      container.style.opacity = '0';
      container.style.transform = 'translateY(8px)';
    }, 2200);
  } else {
    fillEl.style.background = 'linear-gradient(90deg, #00d4ff, #38bdf8, #00ffcc)';
  }
}

THREE.DefaultLoadingManager.onStart = (url, loaded, total) => {
  const shortName = (url.split('/').pop().split('?')[0] || 'ASSET').replace('.glb', '');
  updateRenderProgress(`STREAMING: ${shortName.toUpperCase()}`, (loaded / (total || 1)) * 100);
};

THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
  const shortName = (url.split('/').pop().split('?')[0] || 'GEOMETRY').replace('.glb', '');
  updateRenderProgress(`RENDERING: ${shortName.toUpperCase()}`, (loaded / (total || 1)) * 100);
};

THREE.DefaultLoadingManager.onLoad = () => {
  updateRenderProgress('PIPELINE: ASSETS STABILIZED', 100, true);
};

class GameApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.mode = 'interior'; // 'interior' or 'flight'

    // Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020408);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = false; // Disable heavy multi-light shadow maps for smooth 60 FPS
    this.container.appendChild(this.renderer.domElement);

    // Global Radiant Illumination (guarantees crystal-clear lighting across all rooms & modes!)
    const globalHemi = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 3.2);
    this.scene.add(globalHemi);
    const globalAmb = new THREE.AmbientLight(0xffffff, 2.8);
    this.scene.add(globalAmb);

    // Clock
    this.clock = new THREE.Clock();

    // DOM UI elements
    this.dom = {
      modeBadge: document.getElementById('mode-badge'),
      mpStatus: document.getElementById('mp-status'),
      interactPrompt: document.getElementById('interact-prompt'),
      promptText: document.getElementById('prompt-text'),
      shieldVal: document.getElementById('shield-val'),
      shieldFill: document.getElementById('shield-fill'),
      hullVal: document.getElementById('hull-val'),
      hullFill: document.getElementById('hull-fill'),
      boostVal: document.getElementById('boost-val'),
      boostFill: document.getElementById('boost-fill'),
      boostLabel: document.getElementById('boost-label'),
      controlsCard: document.getElementById('controls-card'),
      controlsTitle: document.getElementById('controls-title'),
      ctrlActionName: document.getElementById('ctrl-action-name'),
      ctrlInteractName: document.getElementById('ctrl-interact-name'),
      btnToggleMode: document.getElementById('btn-toggle-mode'),
      btnAudio: document.getElementById('btn-audio'),
      btnMultiplayer: document.getElementById('btn-multiplayer'),
      modalMp: document.getElementById('modal-multiplayer'),
      btnCloseModal: document.getElementById('btn-close-modal'),
      btnJoinRoom: document.getElementById('btn-join-room'),
      btnCopyInvite: document.getElementById('btn-copy-invite'),
      roomInput: document.getElementById('room-input'),
      weaponVal: document.getElementById('weapon-val'),
      ctrlActionName: document.getElementById('ctrl-action-name'),
      btnCharSelect: document.getElementById('btn-character-select'),
      modalCharSelect: document.getElementById('modal-character-select'),
      btnCloseCharModal: document.getElementById('btn-close-char-modal'),
      btnSelectPilot1: document.getElementById('btn-select-pilot1'),
      btnSelectPilot2: document.getElementById('btn-select-pilot2'),
      cardPilot1: document.getElementById('card-pilot1'),
      cardPilot2: document.getElementById('card-pilot2'),
      badgePilot1: document.getElementById('badge-pilot1'),
      badgePilot2: document.getElementById('badge-pilot2'),
      btnSelectPilot3: document.getElementById('btn-select-pilot3'),
      cardPilot3: document.getElementById('card-pilot3'),
      badgePilot3: document.getElementById('badge-pilot3'),
      abilityPill: document.getElementById('ability-pill'),
      abilityVal: document.getElementById('ability-val')
    };

    // Subsystems
    this.input = new InputManager(this.renderer.domElement);
    this.environment = new EnvironmentManager(this.scene);
    this.combat = new CombatManager(this.scene);
    this.multiplayer = new MultiplayerManager(this.scene);

    this.player = new PlayerController(this.scene, this.camera, this.input, this.environment);
    this.player.combat = this.combat;
    this.player.multiplayer = this.multiplayer;
    this.combat.multiplayer = this.multiplayer;
    this.ship = new ShipController(this.scene, this.camera, this.input);
    this.player.ship = this.ship;
    if (this.ship.prowTexture && this.environment.setCockpitScreenTexture) {
      this.environment.setCockpitScreenTexture(this.ship.prowTexture);
    }

    // Initial positioning & mode setup (Game begins inside starship main corridor)
    this.mode = 'starbase';
    this.player.position.set(0, 0.30, 0);
    this.ship.shipGroup.visible = false;
    this.environment.setMode('starbase');

    this.setupInteractions();
    this.setupUI();
    this.bindEvents();

    // Auto-join squad from URL invite link (?room=Alpha-1 or #room=Alpha-1)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let roomFromUrl = urlParams.get('room');
      if (!roomFromUrl && window.location.hash.includes('room=')) {
        roomFromUrl = window.location.hash.split('room=')[1].split('&')[0];
      }
      if (roomFromUrl) {
        const cleanRoom = decodeURIComponent(roomFromUrl).trim();
        if (this.dom.roomInput) this.dom.roomInput.value = cleanRoom;
        this.multiplayer.setRoom(cleanRoom);
        this.showNotification(`🚀 JOINED SQUAD [${cleanRoom.toUpperCase()}] VIA INVITE LINK`, 0x00f0ff);
      }
    } catch (e) {
      console.warn("[NetLift] URL invite parse notice:", e);
    }

    // Spacewalk Tether Cable Line in Space
    const tetherGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-18.2, 101.8, 250),
      new THREE.Vector3(-18.2, 101.8, 250)
    ]);
    const tetherMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85
    });
    this.tetherLine = new THREE.Line(tetherGeo, tetherMat);
    this.scene.add(this.tetherLine);
    this.tetherLine.visible = false;

    // Start loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  showNotification(text, color = 0x00f0ff) {
    let notif = document.getElementById('hud-notification');
    if (!notif) {
      notif = document.createElement('div');
      notif.id = 'hud-notification';
      notif.style.position = 'fixed';
      notif.style.top = '72px';
      notif.style.left = '50%';
      notif.style.transform = 'translateX(-50%)';
      notif.style.padding = '8px 24px';
      notif.style.background = 'rgba(15, 23, 42, 0.92)';
      notif.style.border = '1px solid #38bdf8';
      notif.style.borderRadius = '6px';
      notif.style.color = '#38bdf8';
      notif.style.fontFamily = 'monospace';
      notif.style.fontSize = '14px';
      notif.style.fontWeight = 'bold';
      notif.style.zIndex = '9999';
      notif.style.pointerEvents = 'none';
      notif.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.3)';
      notif.style.transition = 'opacity 0.35s ease';
      document.body.appendChild(notif);
    }
    const hex = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color;
    notif.style.borderColor = hex;
    notif.style.color = hex;
    notif.innerText = text;
    notif.style.opacity = '1';
    clearTimeout(this._notifTimeout);
    this._notifTimeout = setTimeout(() => {
      notif.style.opacity = '0';
    }, 3200);
  }

  setupInteractions() {
    this.ship.combat = this.combat;
    this.player.combat = this.combat;

    // When player presses E at key stations
    this.player.onInteract = (type) => {
      if (type === 'board_starship' && this.mode === 'starbase') {
        this.switchMode('interior');
      } else if (type === 'cockpit' && this.mode === 'interior') {
        this.switchMode('flight');
      } else if (type === 'exit_to_space' && this.mode === 'interior') {
        sounds.playAirlockCycle();
        this.switchMode('eva');
      } else if (type === 'enter_interior' && this.mode === 'eva') {
        sounds.playAirlockCycle();
        this.switchMode('interior');
      }
    };

    // Pilot Helm Seat State Sync & Dynamic Views
    this.player.onPilotSeatToggle = (isSeated) => {
      this.ship.isPiloted = isSeated;
      if (isSeated) {
        // Default to 3rd person flight viewing ship from the outside
        this.player.flightViewMode = 'exterior';
        this.ship.viewMode = 'exterior';
        this.ship.cameraSnapNeeded = true;
        this.ship.shipGroup.visible = true;
        this.environment.interiorGroup.visible = false;
        this.environment.spaceGroup.visible = true;
        if (this.player.mesh) this.player.mesh.visible = false;
        if (sounds && sounds.playClick) sounds.playClick();
        this.showNotification('🚀 HELM ENGAGED // 3RD PERSON FLIGHT // PRESS [V] TO TOGGLE COCKPIT VIEW', 0x00f0ff);
      } else {
        this.player.flightViewMode = 'cockpit';
        this.ship.viewMode = 'cockpit';
        this.ship.shipGroup.visible = false;
        this.environment.interiorGroup.visible = true;
        if (this.player.mesh) this.player.mesh.visible = true;
        if (sounds && sounds.playClick) sounds.playClick();
        this.showNotification('STANDBY // STARSHIP HELM DISENGAGED // FOOT EXPLORATION RESTORED', 0xffaa00);
      }
      this.updateControlsCard();
    };

    this.player.onFlightViewModeChanged = (mode) => {
      this.ship.viewMode = mode;
      if (mode === 'exterior') {
        this.ship.cameraSnapNeeded = true;
        this.ship.shipGroup.visible = true;
        this.environment.interiorGroup.visible = false;
        this.environment.spaceGroup.visible = true;
        if (this.player.mesh) this.player.mesh.visible = false;
        this.showNotification('3RD PERSON FLIGHT // [T] TO RETURN TO SEATED COCKPIT', 0x00f0ff);
      } else {
        this.ship.shipGroup.visible = false;
        this.environment.interiorGroup.visible = true;
        this.environment.spaceGroup.visible = true;
        if (this.player.mesh) this.player.mesh.visible = true;
        this.showNotification('SEATED COCKPIT FLYING // [T] TO SWAP TO 3RD PERSON', 0x00f0ff);
      }
      this.updateControlsCard();
    };

    // Instant global keys for Esc (Exit pilot) and T (Toggle 1st/3rd view)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.key === 'Escape') {
        if (this.player && this.player.isSeatedInCockpit) {
          this.player.standUpFromPilotSeat();
        }
      }
      if (e.code === 'KeyT') {
        if (this.player && this.player.isSeatedInCockpit) {
          this.player.toggleFlightViewMode();
        }
      }
    });

    // When player handheld weapon fires -> broadcast to squad
    this.player.onFireLaser = (laserData) => {
      this.multiplayer.broadcastLaser(laserData);
    };

    // When ship laser fires -> broadcast to squad
    this.ship.onFireLaser = (laserData) => {
      this.combat.addLaser(laserData);
      this.multiplayer.broadcastLaser(laserData);
    };

    // When remote peer fires laser -> render in scene
    this.multiplayer.onRemoteLaser = (laserData) => {
      this.combat.addLaser({
        ...laserData,
        isPlayer: false, // remote peer shot
        isLocalPlayer: false,
        senderId: laserData.senderId
      });
      sounds.playLaser(false);
    };

    // When local player is struck by friendly fire or melee
    this.multiplayer.onLocalDamage = (dmgData) => {
      const hitDir = (Array.isArray(dmgData.direction) && dmgData.direction.length === 3)
        ? new THREE.Vector3(dmgData.direction[0], dmgData.direction[1], dmgData.direction[2]).normalize()
        : new THREE.Vector3(0, 0, 1);
      this.player.takeDamage(dmgData.damage, dmgData.attackerId, dmgData.damageType, null, hitDir);
    };

    this.player.onDeath = (attackerId) => {
      const killer = (attackerId || 'SQUAD').replace(/.*_/, '').toUpperCase();
      this.showNotification(`⚠️ CASUALTY DOWN! INCAPACITATED BY [${killer}]! RESPAWNING...`, 0xef4444);
    };

    this.player.onRespawn = () => {
      this.showNotification('OPERATIVE RESTORED // ALL COMBAT NANOS ONLINE', 0x00f0ff);
    };

    // Multiplayer squad notifications
    this.multiplayer.onStatusChanged = (msg) => {
      this.showNotification(msg, 0x00f0ff);
      if (this.dom.abilityVal && this.player) {
      if (this.player.abilityCooldown > 0) {
        this.dom.abilityVal.innerText = Math.ceil(this.player.abilityCooldown) + 's';
        this.dom.abilityVal.style.color = '#f59e0b';
      } else {
        const labels = { pilot1: 'RALLY', pilot2: 'REPAIR', pilot3: 'GRAPPLE' };
        this.dom.abilityVal.innerText = labels[this.player.currentCharacter] || 'READY';
        this.dom.abilityVal.style.color = '#00f0ff';
      }
    }

    this.updateMultiplayerBadge();
    };

    this.multiplayer.onPeerJoined = (peerId) => {
      const shortId = (peerId || '').replace(/.*_/, '').toUpperCase();
      this.showNotification(`SQUAD RECON: PILOT [${shortId}] CONNECTED`, 0x00ffaa);
      this.updateMultiplayerBadge();
    };

    this.multiplayer.onPeerLeft = (peerId) => {
      const shortId = (peerId || '').replace(/.*_/, '').toUpperCase();
      this.showNotification(`SQUAD ALERT: PILOT [${shortId}] DISCONNECTED`, 0xf59e0b);
      this.updateMultiplayerBadge();
    };

    // Loot collection & Jammer destruction callbacks
    this.combat.onLootCollected = (crate) => {
      this.showNotification(`+ RETRIEVED: ${crate.name}`, crate.color);
    };

    this.combat.onJammerDestroyed = () => {
      this.showNotification('💥 HYPERSPACE JAMMER DESTROYED // WARP ONLINE', 0x00ff88);
    };

    this.ship.onHyperjumpStatus = (status) => {
      if (status === 'jammed') {
        this.showNotification('⚠️ HYPERSPACE INHIBITED BY ENEMY JAMMER!', 0xff3344);
      } else if (status === 'spooling') {
        this.showNotification('⚡ SPOOLING WARP DRIVE... ENTERING HYPERSPACE', 0x00f0ff);
      } else if (status === 'complete') {
        this.showNotification('🌟 HYPERJUMP SUCCESSFUL // SECTOR TRANSLOCATED', 0x4ade80);
      }
    };
  }

  setupUI() {
    // Character selection modal
    if (this.dom.btnCharSelect) {
      this.dom.btnCharSelect.addEventListener('click', () => {
        this.dom.modalCharSelect.classList.add('active');
      });
    }

    if (this.dom.btnCloseCharModal) {
      this.dom.btnCloseCharModal.addEventListener('click', () => {
        this.dom.modalCharSelect.classList.remove('active');
      });
    }

    const setPilotUI = (pId) => {
      const isP1 = (pId === 'pilot1');
      const isP2 = (pId === 'pilot2');
      const isP3 = (pId === 'pilot3');

      if (this.dom.cardPilot1) {
        this.dom.cardPilot1.style.border = isP1 ? '2px solid #00f0ff' : '2px solid rgba(255, 255, 255, 0.15)';
        this.dom.cardPilot1.style.boxShadow = isP1 ? '0 0 20px rgba(0, 240, 255, 0.3)' : 'none';
      }
      if (this.dom.badgePilot1) {
        this.dom.badgePilot1.innerText = isP1 ? 'DEPLOYED' : 'RESERVE';
        this.dom.badgePilot1.style.background = isP1 ? '#00f0ff' : 'rgba(255,255,255,0.15)';
        this.dom.badgePilot1.style.color = isP1 ? '#000' : '#94a3b8';
      }

      if (this.dom.cardPilot2) {
        this.dom.cardPilot2.style.border = isP2 ? '2px solid #f59e0b' : '2px solid rgba(255, 255, 255, 0.15)';
        this.dom.cardPilot2.style.boxShadow = isP2 ? '0 0 20px rgba(245, 158, 11, 0.3)' : 'none';
      }
      if (this.dom.badgePilot2) {
        this.dom.badgePilot2.innerText = isP2 ? 'DEPLOYED' : 'RESERVE';
        this.dom.badgePilot2.style.background = isP2 ? '#f59e0b' : 'rgba(255,255,255,0.15)';
        this.dom.badgePilot2.style.color = isP2 ? '#000' : '#94a3b8';
      }

      if (this.dom.cardPilot3) {
        this.dom.cardPilot3.style.border = isP3 ? '2px solid #10b981' : '2px solid rgba(255, 255, 255, 0.15)';
        this.dom.cardPilot3.style.boxShadow = isP3 ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none';
      }
      if (this.dom.badgePilot3) {
        this.dom.badgePilot3.innerText = isP3 ? 'DEPLOYED' : 'RESERVE';
        this.dom.badgePilot3.style.background = isP3 ? '#10b981' : 'rgba(255,255,255,0.15)';
        this.dom.badgePilot3.style.color = isP3 ? '#000' : '#94a3b8';
      }

      if (this.dom.btnSelectPilot1) this.dom.btnSelectPilot1.className = isP1 ? 'btn-primary' : 'btn-secondary';
      if (this.dom.btnSelectPilot2) this.dom.btnSelectPilot2.className = isP2 ? 'btn-primary' : 'btn-secondary';
      if (this.dom.btnSelectPilot3) this.dom.btnSelectPilot3.className = isP3 ? 'btn-primary' : 'btn-secondary';
    };

    const selectPilot = async (pilotId) => {
      // 1. Immediately update UI and dismiss modal for zero latency
      setPilotUI(pilotId);
      const names = {
        pilot1: 'CAPTAIN VANGUARD [FLEET COMMANDER]',
        pilot2: 'CHIEF MECHANIC COG [ENGINEER]',
        pilot3: 'SPECTRE SCOUT [DUAL GRAPPLERS]'
      };
      this.showNotification(`👤 DEPLOYED: ${names[pilotId] || pilotId}`, 0x00f0ff);
      if (this.dom.modalCharSelect) {
        this.dom.modalCharSelect.classList.remove('active');
      }

      // 2. Load character model smoothly
      try {
        await this.player.setCharacter(pilotId);
        if (pilotId === 'pilot3') {
          this.player.equipWeapon('dual_grapplers');
        }
      } catch (err) {
        console.warn('Error switching character:', err);
      }
    };

    if (this.dom.btnSelectPilot1) this.dom.btnSelectPilot1.addEventListener('click', () => selectPilot('pilot1'));
    if (this.dom.btnSelectPilot2) this.dom.btnSelectPilot2.addEventListener('click', () => selectPilot('pilot2'));
    if (this.dom.btnSelectPilot3) this.dom.btnSelectPilot3.addEventListener('click', () => selectPilot('pilot3'));

    if (this.dom.cardPilot1) this.dom.cardPilot1.addEventListener('click', (e) => {
      if (e.target !== this.dom.btnSelectPilot1) selectPilot('pilot1');
    });
    if (this.dom.cardPilot2) this.dom.cardPilot2.addEventListener('click', (e) => {
      if (e.target !== this.dom.btnSelectPilot2) selectPilot('pilot2');
    });
    if (this.dom.cardPilot3) this.dom.cardPilot3.addEventListener('click', (e) => {
      if (e.target !== this.dom.btnSelectPilot3) selectPilot('pilot3');
    });

    // Wire ability triggers and notification
    this.player.onAbilityTriggered = (res) => {
      this.showNotification(res.message, 0x00f0ff);
    };
    if (this.dom.abilityPill) {
      this.dom.abilityPill.addEventListener('click', () => {
        this.player.triggerAbility();
      });
    }

    // Audio toggle button
    this.dom.btnAudio.addEventListener('click', () => {
      const enabled = sounds.toggleSound();
      this.dom.btnAudio.innerText = `AUDIO: ${enabled ? 'ON' : 'MUTED'}`;
      this.dom.btnAudio.style.borderColor = enabled ? 'var(--primary)' : 'var(--danger)';
    });

    // Multiplayer Modal
    this.dom.btnMultiplayer.addEventListener('click', () => {
      this.dom.modalMp.classList.add('active');
    });

    this.dom.btnCloseModal.addEventListener('click', () => {
      this.dom.modalMp.classList.remove('active');
    });

    if (this.dom.btnCopyInvite) {
      this.dom.btnCopyInvite.addEventListener('click', () => {
        const code = (this.dom.roomInput ? this.dom.roomInput.value.trim() : null) || this.multiplayer.roomId || 'Alpha-1';
        let inviteUrl = window.location.origin + window.location.pathname;
        if (inviteUrl.startsWith('file://')) {
          inviteUrl += '#room=' + encodeURIComponent(code);
        } else {
          inviteUrl += '?room=' + encodeURIComponent(code);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(inviteUrl).then(() => {
            this.showNotification(`📋 INVITE LINK COPIED! SQUAD: [${code.toUpperCase()}]`, 0x00f0ff);
          }).catch(() => {
            prompt("Copy Squad Invite Link to Share with Friends:", inviteUrl);
          });
        } else {
          prompt("Copy Squad Invite Link to Share with Friends:", inviteUrl);
        }
      });
    }

    this.dom.btnJoinRoom.addEventListener('click', () => {
      const code = this.dom.roomInput.value.trim() || 'Alpha-1';
      this.multiplayer.setRoom(code);
      this.dom.modalMp.classList.remove('active');
      this.updateMultiplayerBadge();
    });

    // Toggle mode button click
    if (this.dom.btnToggleMode) {
      this.dom.btnToggleMode.addEventListener('click', () => {
        let nextMode = 'interior';
        if (this.mode === 'starbase') nextMode = 'interior';
        else if (this.mode === 'interior') nextMode = 'flight';
        else if (this.mode === 'flight') nextMode = 'eva';
        else if (this.mode === 'eva') nextMode = 'interior';
        this.switchMode(nextMode);
      });
    }

    // Mode badge click toggle
    this.dom.modeBadge.style.cursor = 'pointer';
    this.dom.modeBadge.title = 'Click to switch mode';
    this.dom.modeBadge.addEventListener('click', () => {
      let nextMode = 'interior';
      if (this.mode === 'starbase') nextMode = 'interior';
      else if (this.mode === 'interior') nextMode = 'flight';
      else if (this.mode === 'flight') nextMode = 'eva';
      else if (this.mode === 'eva') nextMode = 'interior';
      this.switchMode(nextMode);
    });

    // User interaction init audio context
    window.addEventListener('click', () => {
      sounds.init();
      sounds.setInteriorMode(this.mode !== 'flight' && this.mode !== 'eva');
    }, { once: true });
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  switchMode(newMode) {
    if (this.mode === newMode) return;
    const oldMode = this.mode;
    this.mode = newMode;
    sounds.playTransition();

    if (this.mode === 'flight') {
      // Space flight combat
      this.environment.setMode('flight');
      sounds.setInteriorMode(false);

      if (this.player.mesh) this.player.mesh.visible = false;
      this.ship.shipGroup.visible = true;
      if (this.tetherLine) this.tetherLine.visible = false;

      // Update HUD
      this.dom.modeBadge.innerText = '3RD PERSON FLIGHT COMBAT';
      this.dom.modeBadge.classList.add('combat');
      this.dom.controlsTitle.innerText = 'CONTROLS [SPACE FLIGHT]';
      this.dom.ctrlActionName.innerText = 'Fire Plasma Lasers';
      this.dom.ctrlInteractName.innerText = 'Dock / Disembark';
      this.dom.boostLabel.innerText = 'AFTERBURNER BOOST';
    } else if (this.mode === 'eva') {
      // EVA Spacewalk Mode (Jump Space Style Zero-G Floating)
      this.environment.setMode('eva');
      sounds.setInteriorMode(false);

      if (this.player.mesh) this.player.mesh.visible = true;
      this.ship.shipGroup.position.set(0, 100, 250);
      this.ship.shipGroup.visible = true; // Starship capital exterior (105m) fully visible!
      if (this.tetherLine) this.tetherLine.visible = true;

      // Teleport player to exterior airlock platform alongside the starship hull
      this.player.teleport(new THREE.Vector3(-14.0, 103.5, 252.0));
      this.player.isSpacewalk = true;
      this.player.isTethered = false; // Authentic Zero-G floating by default!
      this.player.jetpackActive = true;
      this.player.velocity.set(0, 0, 0);

      // Update HUD
      this.dom.modeBadge.innerText = 'EVA SPACEWALK [ZERO-G]';
      this.dom.modeBadge.classList.add('combat');
      this.dom.controlsTitle.innerText = 'CONTROLS [EVA ZERO-G]';
      this.dom.ctrlActionName.innerText = 'Fire Weapon / Grapple';
      this.dom.ctrlInteractName.innerText = 'Re-enter Airlock';
      this.dom.boostLabel.innerText = 'RCS THRUST AFTERBURNER';
    } else if (this.mode === 'interior') {
      // Inside starship interior
      this.environment.setMode('interior');
      sounds.setInteriorMode(true);

      if (this.player.mesh) this.player.mesh.visible = true;
      this.ship.shipGroup.visible = false;
      if (this.tetherLine) this.tetherLine.visible = false;

      // Teleport player inside ship
      if (oldMode === 'starbase') {
        this.player.teleport(new THREE.Vector3(0, 0.08, 0.0)); // Enter in central corridor
      } else if (oldMode === 'eva') {
        this.player.teleport(new THREE.Vector3(-16.5, 0.08, 50.0)); // Inside Grand Hall airlock chamber
        this.player.isSpacewalk = false;
        this.player.isTethered = false;
        this.player.jetpackActive = false;
      }

      // Update HUD
      this.dom.modeBadge.innerText = 'STARSHIP INTERIOR';
      this.dom.modeBadge.classList.remove('combat');
      this.dom.controlsTitle.innerText = 'CONTROLS [STARSHIP]';
      this.dom.ctrlActionName.innerText = 'Melee Strike';
      this.dom.ctrlInteractName.innerText = 'Cockpit Launch';
      this.dom.boostLabel.innerText = 'SPRINT STAMINA';
    } else {
      // Starbase station
      this.environment.setMode('starbase');
      sounds.setInteriorMode(true);

      if (this.player.mesh) this.player.mesh.visible = true;
      this.ship.shipGroup.visible = false;
      if (this.tetherLine) this.tetherLine.visible = false;

      // Teleport to Starbase departure platform
      this.player.teleport(new THREE.Vector3(0, 0.30, 18.0));

      // Update HUD
      this.dom.modeBadge.innerText = 'STARBASE STATION';
      this.dom.modeBadge.classList.remove('combat');
      this.dom.controlsTitle.innerText = 'CONTROLS [STARBASE]';
      this.dom.ctrlActionName.innerText = 'Melee Strike';
      this.dom.ctrlInteractName.innerText = 'Board Starship';
      this.dom.boostLabel.innerText = 'SPRINT STAMINA';
    }
  }


  updateControlsCard() {
    if (!this.dom.controlsCard) return;
    const isSeated = this.player && this.player.isSeatedInCockpit;
    const isExterior = isSeated && this.player.flightViewMode === 'exterior';
    const isEva = this.mode === 'eva';

    if (isSeated) {
      this.dom.controlsCard.classList.add('pilot-active');
      this.dom.controlsCard.innerHTML = `
        <div class="title" style="color: #00f0ff; text-shadow: 0 0 10px rgba(0,240,255,0.6);">
          ${isExterior ? 'FLIGHT CONTROLS [3RD PERSON]' : 'FLIGHT CONTROLS [SEATED FLYING]'}
        </div>
        <div class="control-item"><span>Steer Pitch / Yaw</span><span class="control-key">MOUSE</span></div>
        <div class="control-item"><span>Thrust (Forward / Rev)</span><span class="control-key">W / S</span></div>
        <div class="control-item"><span>Lateral Strafe</span><span class="control-key">A / D</span></div>
        <div class="control-item"><span>Vertical Strafe</span><span class="control-key">SPACE / C</span></div>
        <div class="control-item"><span>Roll Left / Right</span><span class="control-key">Q / E</span></div>
        <div class="control-item"><span>Afterburner Boost</span><span class="control-key">SHIFT</span></div>
        <div class="control-item"><span>Fire Plasma Lasers</span><span class="control-key">LMB</span></div>
        <div class="control-item" style="border-top: 1px solid rgba(0,240,255,0.3); padding-top: 5px; margin-top: 4px;">
          <span style="color: #38bdf8; font-weight: bold;">Swap 1st / 3rd View</span><span class="control-key" style="background: rgba(0,240,255,0.25); border-color: #00f0ff;">T</span>
        </div>
        <div class="control-item">
          <span style="color: #f87171; font-weight: bold;">Exit Pilot Mode</span><span class="control-key" style="background: rgba(239,68,68,0.25); border-color: #f87171;">ESC</span>
        </div>
      `;
    } else if (isEva) {
      this.dom.controlsCard.classList.remove('pilot-active');
      this.dom.controlsCard.innerHTML = `
        <div class="title" style="color: #f59e0b;">EVA SPACEWALK CONTROLS</div>
        <div class="control-item"><span>EVA Jetpack Move</span><span class="control-key">W A S D</span></div>
        <div class="control-item"><span>Jetpack Boost</span><span class="control-key">SHIFT</span></div>
        <div class="control-item"><span>Ascend / Descend</span><span class="control-key">SPACE / C</span></div>
        <div class="control-item"><span>Laser Cannon</span><span class="control-key">LMB</span></div>
        <div class="control-item"><span>Airlock Tether / Winch</span><span class="control-key">F</span></div>
        <div class="control-item"><span>Re-enter Airlock</span><span class="control-key">E</span></div>
      `;
    } else {
      this.dom.controlsCard.classList.remove('pilot-active');
      this.dom.controlsCard.innerHTML = `
        <div class="title" id="controls-title">CONTROLS [INTERIOR]</div>
        <div class="control-item"><span>Move</span><span class="control-key">W A S D</span></div>
        <div class="control-item"><span>Sprint</span><span class="control-key">SHIFT</span></div>
        <div class="control-item"><span>Jump (Combined)</span><span class="control-key">SPACE</span></div>
        <div class="control-item"><span>Crouch</span><span class="control-key">C</span></div>
        <div class="control-item"><span id="ctrl-action-name">${(this.player && this.player.equippedWeapon && this.player.equippedWeapon !== 'unarmed') ? 'Fire Weapon' : 'Melee Strike'}</span><span class="control-key">LMB</span></div>
        <div class="control-item"><span>Airlock Tether</span><span class="control-key">F</span></div>
        <div class="control-item"><span>Climb Ladder</span><span class="control-key">W / S</span></div>
        <div class="control-item"><span>Switch Weapon</span><span class="control-key">1 - 6</span></div>
        <div class="control-item"><span>Reload Ammo</span><span class="control-key">R</span></div>
        <div class="control-item"><span id="ctrl-interact-name">Sit in Pilot Helm</span><span class="control-key">E</span></div>
        <div class="control-item"><span>Toggle 1st/3rd View</span><span class="control-key">V</span></div>
      `;
    }
  }

  updateHUD() {
    // 1. Context prompts and button styling
    if (this.mode === 'starbase') {
      if (this.dom.btnToggleMode) {
        this.dom.btnToggleMode.innerText = '🚀 BOARD STARSHIP';
        this.dom.btnToggleMode.classList.remove('flight-mode');
      }

      if (this.player.nearDepartureGate) {
        this.dom.interactPrompt.classList.add('visible');
        this.dom.promptText.innerText = 'BOARD STARSHIP FOR DEPARTURE';
      } else {
        this.dom.interactPrompt.classList.remove('visible');
      }

      this.dom.shieldVal.innerText = '100%';
      this.dom.shieldFill.style.width = '100%';
      this.dom.hullVal.innerText = '100%';
      this.dom.hullFill.style.width = '100%';
      this.dom.boostVal.innerText = this.player.isSprinting ? '75%' : '100%';
      this.dom.boostFill.style.width = this.player.isSprinting ? '75%' : '100%';

    } else if (this.mode === 'interior') {
      if (this.dom.btnToggleMode) {
        this.dom.btnToggleMode.innerText = '🚀 PILOT STARSHIP';
        this.dom.btnToggleMode.classList.remove('flight-mode');
      }

      if (this.player.nearWeaponPedestal) {
        this.dom.interactPrompt.classList.add('visible');
        const wp = this.player.nearWeaponPedestal;
        this.dom.promptText.innerText = `EQUIP ${wp.name.toUpperCase()} [${wp.type.toUpperCase()}]`;
      } else if (this.player.nearLadder === 'upper') {
        this.dom.interactPrompt.classList.add('visible');
        this.dom.promptText.innerText = (this.player.deckLevel === 'upper')
          ? 'CLIMB LADDER [W / S] -> MAIN DECK'
          : 'CLIMB LADDER [W / S] -> UPPER STORAGE DECK';
      } else if (this.player.nearLadder === 'lower') {
        this.dom.interactPrompt.classList.add('visible');
        this.dom.promptText.innerText = (this.player.deckLevel === 'lower')
          ? 'CLIMB LADDER [W / S] -> MAIN DECK'
          : 'CLIMB LADDER [W / S] -> LOWER CRYO DECK';
      } else if (this.player.isSeatedInCockpit) {
        this.dom.interactPrompt.classList.add('visible');
        this.dom.promptText.innerText = (this.player.flightViewMode === 'exterior')
          ? '3RD PERSON FLIGHT // [T] SEATED COCKPIT // [ESC] EXIT HELM'
          : 'COCKPIT HELM ACTIVE // [T] 3RD PERSON CHASE // [ESC] EXIT HELM';
        this.dom.modeBadge.innerText = (this.player.flightViewMode === 'exterior')
          ? 'STARSHIP HELM [3RD PERSON]'
          : 'COCKPIT HELM [SEATED FLYING]';
        this.dom.modeBadge.classList.add('combat');
        this.updateControlsCard();
      } else if (this.player.nearPilotSeat || this.player.nearCockpit) {
        this.dom.interactPrompt.classList.add('visible');
        this.dom.promptText.innerText = 'SIT IN PILOT SEAT [E] // ENGAGE STARSHIP HELM';
      } else if (this.player.nearAirlock) {
        this.dom.interactPrompt.classList.add('visible');
        this.dom.promptText.innerText = 'CYCLE AIRLOCK -> EVA SPACEWALK';
      } else if (this.player.nearDoor) {
        this.dom.interactPrompt.classList.add('visible');
        this.dom.promptText.innerText = 'BLAST DOOR AUTOMATION ACTIVE';
      } else if (this.player.deckLevel === 'upper') {
        this.dom.interactPrompt.classList.add('visible');
        this.dom.promptText.innerText = this.player.nearStorageDoor ? 'STORAGE PNEUMATIC DOORS UNLOCKED' : 'UPPER MEZZANINE: CARGO & STORAGE DECK';
      } else if (this.player.deckLevel === 'lower') {
        this.dom.interactPrompt.classList.add('visible');
        this.dom.promptText.innerText = this.player.nearCryoPod ? 'CRYOSTASIS POD: BIOMETRIC CANOPY ENGAGED' : 'SUB-DECK: CRYO-STASIS & REACTOR ENGINEERING';
      } else {
        this.dom.interactPrompt.classList.remove('visible');
      }

      // Weapon Status Badge Sync
      if (this.dom.weaponVal) {
        if (this.player.equippedWeapon && WEAPON_DEFS[this.player.equippedWeapon]) {
          const def = WEAPON_DEFS[this.player.equippedWeapon];
          let ammoSuffix = '';
          if (this.player.isReloading) {
            ammoSuffix = ' [RELOADING...]';
          } else if (def.magSize !== Infinity && def.currentAmmo !== undefined) {
            ammoSuffix = ` [${def.currentAmmo} / ${def.magSize}]`;
          }
          this.dom.weaponVal.innerText = `${def.name.toUpperCase()}${ammoSuffix}`;
          this.dom.weaponVal.style.color = '#' + def.color.toString(16).padStart(6, '0');
        } else {
          this.dom.weaponVal.innerText = 'UNARMED [FISTS]';
          this.dom.weaponVal.style.color = '#38bdf8';
        }
      }
      if (this.dom.ctrlActionName && !this.player.isSeatedInCockpit) {
        if (this.player.equippedWeapon === 'dual_grapplers') {
          this.dom.ctrlActionName.innerText = 'LMB: Left // RMB: Right Grapple';
        } else {
          this.dom.ctrlActionName.innerText = (this.player.equippedWeapon && this.player.equippedWeapon !== 'unarmed') ? 'Fire Weapon' : 'Melee Strike';
        }
      }

      // Telemetry gauges (reflect ship stats when seated at helm)
      if (this.player.isSeatedInCockpit) {
        const s = Math.round(this.ship.shield);
        this.dom.shieldVal.innerText = `${s}%`;
        this.dom.shieldFill.style.width = `${s}%`;
        const h = Math.round(this.ship.hull);
        this.dom.hullVal.innerText = `${h}%`;
        this.dom.hullFill.style.width = `${h}%`;
        const b = Math.round(this.ship.boostEnergy);
        this.dom.boostVal.innerText = `${b}%`;
        this.dom.boostFill.style.width = `${b}%`;
      } else {
        const s = Math.round(this.player.shield);
        const h = Math.round(this.player.health);
        this.dom.shieldVal.innerText = `${s}%`;
        this.dom.shieldFill.style.width = `${s}%`;
        this.dom.hullVal.innerText = `${h}%`;
        this.dom.hullFill.style.width = `${h}%`;
        this.dom.boostVal.innerText = this.player.isSprinting ? '75%' : '100%';
        this.dom.boostFill.style.width = this.player.isSprinting ? '75%' : '100%';
      }

    } else if (this.mode === 'eva') {
      // EVA Spacewalk telemetry
      if (this.dom.btnToggleMode) {
        this.dom.btnToggleMode.innerText = '🚪 RE-ENTER SHIP';
        this.dom.btnToggleMode.classList.remove('flight-mode');
      }

      const distToAirlock = Math.round(this.player.position.distanceTo(this.player.tetherAnchor));
      this.dom.interactPrompt.classList.add('visible');
      if (this.player.nearExteriorAirlock) {
        this.dom.promptText.innerText = 'CYCLE AIRLOCK & RE-ENTER STARSHIP [E]';
      } else {
        this.dom.promptText.innerText = `🛸 FRIENDLY MOTHERSHIP AIRLOCK: ${distToAirlock}m | [HOLD F] TO REEL WINCH`;
      }

      const bootsStatus = this.player.isTethered ? 'MAG-BOOTS [LOCKED]' : 'JETPACK [6DOF RCS]';
      this.dom.shieldVal.innerText = bootsStatus;
      this.dom.shieldFill.style.width = this.player.isTethered ? '100%' : '65%';

      const oxy = Math.round(this.player.oxygenLevel || 100);
      this.dom.hullVal.innerText = `${oxy}%`;
      this.dom.hullFill.style.width = `${oxy}%`;

      const fuel = Math.round(this.player.jetpackFuel || 100);
      this.dom.boostVal.innerText = `${fuel}%`;
      this.dom.boostFill.style.width = `${fuel}%`;

    } else {
      // Flight mode telemetry
      if (this.dom.btnToggleMode) {
        this.dom.btnToggleMode.innerText = '🚪 ENTER INTERIOR';
        this.dom.btnToggleMode.classList.add('flight-mode');
      }

      // Hyperspace Jammer or Docking prompt check
      const isJammed = this.combat.isHyperspaceJammed(this.ship.shipGroup.position);
      if (isJammed) {
        this.dom.interactPrompt.classList.add('visible');
        this.dom.promptText.innerText = '⚠️ HYPERSPACE JAMMER ACTIVE [DESTROY 3 CORES]';
      } else if (this.environment.dockingPosition && this.ship.shipGroup.position.distanceTo(this.environment.dockingPosition) < 110) {
        this.dom.interactPrompt.classList.add('visible');
        this.dom.promptText.innerText = 'DOCK AT STARBASE STATION';
      } else {
        this.dom.interactPrompt.classList.add('visible');
        this.dom.promptText.innerText = '[J] ENGAGE HYPERJUMP // [E] ENTER SHIP';
      }

      const s = Math.round(this.ship.shield);
      this.dom.shieldVal.innerText = `${s}%`;
      this.dom.shieldFill.style.width = `${s}%`;

      const h = Math.round(this.ship.hull);
      this.dom.hullVal.innerText = `${h}%`;
      this.dom.hullFill.style.width = `${h}%`;

      const b = Math.round(this.ship.boostEnergy);
      this.dom.boostVal.innerText = `${b}%`;
      this.dom.boostFill.style.width = `${b}%`;
    }

    this.updateMultiplayerBadge();
  }

  updateMultiplayerBadge() {
    const count = this.multiplayer.getPeerCount();
    const role = this.multiplayer.isHost ? 'CMD' : 'SQUAD';
    if (count > 0) {
      this.dom.mpStatus.innerText = `[${role}] SQUAD: ${count + 1} PILOTS`;
    } else {
      this.dom.mpStatus.innerText = `[${role}] ROOM: ${this.multiplayer.roomId}`;
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Update environments (with player position and deck level for occlusion culling)
    this.environment.update(delta, this.player.position, this.player.deckLevel);

    // 1. Live Forward Prow Camera Sensor Feed (Performance Optimized: only renders when actively seated in cockpit helm)
    const shouldRenderProw = this.player.isSeatedInCockpit && this.player.flightViewMode === 'cockpit';
    if (shouldRenderProw && this.ship && this.ship.renderProwCamera) {
      this.prowFrameCount = (this.prowFrameCount || 0) + 1;
      if (this.prowFrameCount % 5 === 0) {
        this.ship.renderProwCamera(this.renderer, this.scene, this.environment);
      }
    }

    // 2. Mode-specific updates
    if (this.mode === 'flight') {
      this.ship.update(delta, true);
    } else if (this.player.isSeatedInCockpit) {
      // Piloting while seated inside the starship cockpit!
      this.ship.viewMode = this.player.flightViewMode;
      this.ship.update(delta, false);
      this.player.update(delta);
    } else {
      // Not seated: ship thrusters idle / stationary
      this.ship.update(delta, false);
      this.player.update(delta);
    }

    // Combat projectiles, enemies, jammer, and loot crates
    this.combat.update(delta, this.ship, (this.mode === 'flight' || this.player.isSeatedInCockpit), this.player);

    // Update spacewalk tether cable line & airlock winch pull
    const isTetherActive = (this.mode === 'eva' || (this.player && this.player.isTetherPulling));
    if (isTetherActive && this.tetherLine && this.player) {
      const anchorPos = (this.player.isTetherPulling && this.player.tetherTarget)
        ? this.player.tetherTarget
        : (this.player.tetherAnchor || new THREE.Vector3(-18.2, 101.8, 250));
      const playerPos = this.player.position.clone().add(new THREE.Vector3(0, 0.9, 0)); // Waist
      const posAttr = this.tetherLine.geometry.attributes.position;
      posAttr.setXYZ(0, anchorPos.x, anchorPos.y, anchorPos.z);
      posAttr.setXYZ(1, playerPos.x, playerPos.y, playerPos.z);
      posAttr.needsUpdate = true;
      this.tetherLine.visible = true;
    } else if (this.tetherLine) {
      this.tetherLine.visible = false;
    }

    // Multiplayer sync (Full High-Fidelity Orientation & Animation State)
    const playerMesh = (this.player && this.player.mesh) ? this.player.mesh : null;
    const cameraYaw = this.player ? this.player.cameraYaw : 0;
    const cameraPitch = this.player ? this.player.cameraPitch : 0;
    const facingYaw = playerMesh ? playerMesh.rotation.y : (cameraYaw + Math.PI);

    const localQuat = new THREE.Quaternion();
    if (this.mode === 'flight' && this.ship && this.ship.shipGroup) {
      localQuat.copy(this.ship.shipGroup.quaternion);
    } else if (playerMesh) {
      localQuat.copy(playerMesh.quaternion);
    }

    const localState = {
      mode: this.mode,
      position: (this.mode === 'flight' && this.ship && this.ship.shipGroup) ? this.ship.shipGroup.position : this.player.position,
      rotation: [localQuat.x, localQuat.y, localQuat.z, localQuat.w],
      facingYaw: facingYaw,
      yaw: cameraYaw,
      pitch: cameraPitch,
      animation: (this.player && this.player.currentAction) ? this.player.currentAction.getClip().name : 'idle',
      characterId: (this.player && this.player.currentCharacter) ? this.player.currentCharacter : 'pilot1',
      equippedWeapon: (this.player && this.player.equippedWeapon) ? this.player.equippedWeapon : 'unarmed',
      isSeatedInCockpit: !!(this.player && this.player.isSeatedInCockpit),
      shield: (this.mode === 'flight' && this.ship) ? Math.round(this.ship.shield) : Math.round(this.player.shield),
      hull: (this.mode === 'flight' && this.ship) ? Math.round(this.ship.hull) : Math.round(this.player.health)
    };
    this.multiplayer.update(delta, localState);

    // Refresh HUD (throttled to avoid DOM reflow bottleneck)
    this.hudThrottle = (this.hudThrottle || 0) + 1;
    if (this.hudThrottle % 3 === 0) {
      this.updateHUD();
    }

    // Render
    this.renderer.render(this.scene, this.camera);

    // Auto-dismiss loading screen once scene is active
    if (!this.hasDismissedLoading) {
      this.hasDismissedLoading = true;
      const ls = document.getElementById('loading-screen');
      if (ls) {
        setTimeout(() => {
          ls.style.opacity = '0';
          setTimeout(() => { ls.style.display = 'none'; }, 600);
        }, 300);
      }
    }

  }
}

// Start game when page loads (supports both standard loading and deferred standalone script)
function bootGame() {
  if (window.__GAME_BOOTED__) return;
  window.__GAME_BOOTED__ = true;
  new GameApp();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootGame);
  window.addEventListener('load', bootGame);
} else {
  // DOM is already parsed (interactive or complete), boot immediately!
  bootGame();
}
