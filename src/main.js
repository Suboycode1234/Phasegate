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
    this.ship.shipGroup.visible = true;
    this.ship.shipGroup.position.set(0, 1.2, 58.0);
    this.ship.shipGroup.rotation.set(0, Math.PI, 0);
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
      this.ship.update(delta, true);
    } else if (this.player.isSeatedInCockpit) {
      // Piloting while seated inside the starship cockpit!
      this.ship.viewMode = this.player.flightViewMode;
      if (this.player.flightViewMode === 'exterior') {
        this.ship.update(delta, true); // Update ship flight physics & 3rd person trailing camera
        this.player.update(delta);
      } else {
        this.ship.update(delta, false); // Cockpit seated first person view
        this.player.update(delta);
      }
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
