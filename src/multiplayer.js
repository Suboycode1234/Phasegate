// Advanced PeerJS Serverless WebRTC Multiplayer Manager for Space 3D
// High-Resilience Architecture: Triple Redundant Transport (WebRTC + BroadcastChannel + LocalStorage),
// Packet Deduplication & Sequencing, Dead-Reckoning Extrapolation, Multi-Tier Host Migration,
// Coordinate Sanitization, Full Skeletal Animation Synchronization across all pilot classes,
// Responsive View-Angle & Aim-Pitch Tracking, and Laser/Weapon Synchronization.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import PeerPkg from 'peerjs';

const Peer = PeerPkg.Peer || PeerPkg.default || PeerPkg;

// Safety sanitizer to prevent NaN or corrupted values from breaking Three.js scene graph
function sanitizeNum(n, fallback = 0, min = -5000, max = 5000) {
  if (typeof n !== 'number' || isNaN(n) || !isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export class MultiplayerManager {
  constructor(scene) {
    this.scene = scene;
    this.roomId = 'Alpha-1';
    this.localId = 'pilot_' + Math.random().toString(36).substring(2, 7);
    this.peer = null;
    this.isHost = false;
    this.maxPlayers = 4;
    this.seqCounter = 0;

    // Transport Connections & Mesh Maps
    this.connections = new Map(); // peerId -> WebRTC DataConnection
    this.peers = new Map();       // peerId -> peerState (3D mesh, targetPos, velocity, tag, etc.)
    this.broadcastChannel = null;
    this.storageKey = '';

    // Packet Deduplication Sliding Window (prevents duplicate processing across redundant channels)
    this.processedPackets = new Set();
    this.processedPacketQueue = [];
    this.maxDedupeHistory = 300;

    // Timers & Health Monitoring
    this.sendTimer = 0;
    this.pingTimer = 0;
    this.heartbeatTimer = 0;
    this.reconcileTimer = 0;
    this.hostCheckTimer = 0;
    this.lastHostHeartbeat = Date.now();
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;

    // Callbacks & Events
    this.statusMessage = 'INITIALIZING SQUAD LINK...';
    this.onStatusChanged = null;
    this.onPeerJoined = null;
    this.onPeerLeft = null;
    this.onRemoteLaser = null;
    this.onLocalDamage = null;

    // Bandwidth delta suppression cache
    this.lastBroadcast = null;

    // GLTF Loader & Preloaded Shared Humanoid Animation Clips Cache
    this.gltfLoader = new GLTFLoader();
    this.sharedClips = {};
    this.initSharedAnimations();

    // 1. Initialize Redundant Offline & Cross-Document Channels
    this.initRedundantTransports();

    // 2. Initialize PeerJS WebRTC P2P Mesh
    this.initPeerJS();
  }

  // -------------------------------------------------------------
  // Preload Shared Humanoid Animation Clips (Shared Across All Pilot Classes)
  // -------------------------------------------------------------
  initSharedAnimations() {
    const animConfigs = [
      { key: 'idle', url: '/assets/anim_idle.glb', loop: THREE.LoopRepeat, timeScale: 1.0 },
      { key: 'walk', url: '/assets/anim_walk.glb', loop: THREE.LoopRepeat, timeScale: 1.35 },
      { key: 'run', url: '/assets/anim_run.glb', loop: THREE.LoopRepeat, timeScale: 1.15 },
      { key: 'jump', url: '/assets/anim_jump.glb', loop: THREE.LoopOnce, clamp: true, timeScale: 1.25 },
      { key: 'crouch', url: '/assets/anim_crouch.glb', loop: THREE.LoopRepeat, timeScale: 1.0 },
      { key: 'punch', url: '/assets/anim_punch.glb', loop: THREE.LoopOnce, clamp: false, timeScale: 1.4 },
      { key: 'hold_gun', url: '/assets/anim_hold_gun.glb', loop: THREE.LoopRepeat, timeScale: 1.0 }
    ];

    animConfigs.forEach((cfg) => {
      this.gltfLoader.load(cfg.url, (gltf) => {
        if (gltf.animations && gltf.animations.length > 0) {
          const clip = gltf.animations[0].clone();
          clip.name = cfg.key;

          // Strip root bone translation to keep in-place movement (position is synced via network/physics)
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

          this.sharedClips[cfg.key] = { clip, cfg };

          // Automatically bind newly loaded clip to any active peers
          this.peers.forEach(peer => {
            if (peer.mixer && peer.actions && !peer.actions[cfg.key]) {
              const action = peer.mixer.clipAction(clip);
              action.setLoop(cfg.loop);
              action.clampWhenFinished = !!cfg.clamp;
              action.timeScale = cfg.timeScale || 1.0;
              peer.actions[cfg.key] = action;

              if (cfg.key === 'idle' && !peer.currentAction) {
                action.play();
                peer.currentAction = action;
              }
            }
          });
        }
      }, undefined, (err) => {
        console.warn(`[NetLift] Preload warning for ${cfg.key} animation:`, err);
      });
    });
  }

  // -------------------------------------------------------------
  // 1. Redundant Channel Initializers (BroadcastChannel + LocalStorage)
  // -------------------------------------------------------------
  getCleanRoom() {
    return (this.roomId || 'alpha1').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').substring(0, 16) || 'alpha1';
  }

  getHostId(cleanRoom) {
    return `sp3d_${cleanRoom}_host`;
  }

  getMemberId(cleanRoom) {
    return `sp3d_${cleanRoom}_${this.localId}`;
  }

  getIceConfig() {
    return {
      iceServers: [
        // Primary Global STUN Servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.services.mozilla.com' },
        // Public TURN Relays (OpenRelay Project by Metered.ca)
        {
          urls: [
            'turn:openrelay.metered.ca:80',
            'turn:openrelay.metered.ca:443',
            'turn:openrelay.metered.ca:443?transport=tcp'
          ],
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 6
    };
  }

  initRedundantTransports() {
    const cleanRoom = this.getCleanRoom();

    // Channel 2: BroadcastChannel (Ultra low latency within same browser instance)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        if (this.broadcastChannel) this.broadcastChannel.close();
        this.broadcastChannel = new BroadcastChannel(`sp3d_bc_${cleanRoom}`);
        this.broadcastChannel.onmessage = (e) => {
          this.handlePacket(e.data, 'broadcast_channel', 'broadcast');
        };
      } catch (err) {
        console.warn('[NetLift] BroadcastChannel unavailable:', err);
      }
    }

    // Channel 3: LocalStorage StorageEvent Channel
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        this.storageKey = `sp3d_ls_${cleanRoom}`;
        this.onStorageEvent = (e) => {
          if (e.key === this.storageKey && e.newValue) {
            try {
              const data = JSON.parse(e.newValue);
              this.handlePacket(data, 'local_storage', 'storage');
            } catch (err) {}
          }
        };
        window.addEventListener('storage', this.onStorageEvent);
      } catch (err) {
        console.warn('[NetLift] LocalStorage sync unavailable:', err);
      }
    }
  }

  // -------------------------------------------------------------
  // 2. PeerJS WebRTC P2P Mesh Network Initialization
  // -------------------------------------------------------------
  initPeerJS() {
    const cleanRoom = this.getCleanRoom();
    const hostId = this.getHostId(cleanRoom);
    const iceConfig = this.getIceConfig();

    this.setStatus(`ACQUIRING BROKER LINK: ${cleanRoom.toUpperCase()}...`);

    // Tier 1: Try acquiring the deterministic Host ID for this room
    this.peer = new Peer(hostId, {
      config: iceConfig,
      debug: 1,
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
      pingInterval: 5000
    });

    this.peer.on('open', (id) => {
      this.isHost = true;
      this.setStatus(`COMMANDER (HOST) // ROOM: ${this.roomId}`);
      console.log(`[NetLift] Successfully initialized as Commander Vanguard [HOST] with ID: ${id}`);
      this.lastHostHeartbeat = Date.now();
    });

    this.peer.on('connection', (conn) => {
      this.setupConnection(conn);
    });

    this.peer.on('error', (err) => {
      // If host ID is already taken by another client, join as squad member
      if (err.type === 'unavailable-id') {
        this.isHost = false;
        this.joinAsClient(cleanRoom, hostId, iceConfig);
      } else if (err.type === 'peer-unavailable') {
        console.log(`[NetLift] Peer unavailable. Waiting for squad link retry...`);
      } else {
        console.warn('[NetLift] PeerJS broker notice:', err.type, err.message);
        this.handleBrokerDisconnect();
      }
    });

    this.peer.on('disconnected', () => {
      this.handleBrokerDisconnect();
    });
  }

  joinAsClient(cleanRoom, hostId, iceConfig) {
    const memberId = this.getMemberId(cleanRoom);
    this.setStatus(`CONNECTING TO COMMANDER // ROOM: ${this.roomId}...`);

    if (this.peer && !this.peer.destroyed) {
      try { this.peer.destroy(); } catch (e) {}
    }

    this.peer = new Peer(memberId, {
      config: iceConfig,
      debug: 1,
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
      pingInterval: 5000
    });

    this.peer.on('open', (id) => {
      this.setStatus(`SQUAD MEMBER LINKED // ROOM: ${this.roomId}`);
      console.log(`[NetLift] Squad operative registered with ID: ${id}. Connecting to Commander: ${hostId}`);

      // Connect to the room Commander
      const conn = this.peer.connect(hostId, { reliable: true });
      this.setupConnection(conn);
    });

    this.peer.on('connection', (conn) => {
      this.setupConnection(conn);
    });

    this.peer.on('error', (err) => {
      console.warn('[NetLift] Member connection notice:', err.type, err.message);
      this.handleBrokerDisconnect();
    });

    this.peer.on('disconnected', () => {
      this.handleBrokerDisconnect();
    });
  }

  handleBrokerDisconnect() {
    if (this.reconnectTimer) return;
    this.reconnectAttempts++;
    const delay = Math.min(10000, 1500 * this.reconnectAttempts);
    console.log(`[NetLift] PeerJS broker disconnected. Reconnecting in ${delay}ms...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.peer && !this.peer.destroyed) {
        try { this.peer.reconnect(); } catch (e) { this.initPeerJS(); }
      } else {
        this.initPeerJS();
      }
    }, delay);
  }

  // -------------------------------------------------------------
  // 3. WebRTC DataConnection Setup & Event Handlers
  // -------------------------------------------------------------
  setupConnection(conn) {
    if (!conn) return;

    conn.on('open', () => {
      console.log(`[NetLift] WebRTC DataChannel OPENED with peer: ${conn.peer}`);
      this.connections.set(conn.peer, conn);

      if (this.onPeerJoined) {
        this.onPeerJoined(conn.peer);
      }

      // If this client is Host, broadcast the squad peer roster to mesh all peers
      if (this.isHost) {
        const peerList = Array.from(this.connections.keys()).concat(this.peer.id);
        try {
          conn.send({
            type: 'roster_sync',
            id: this.localId,
            peers: peerList
          });
        } catch (e) {}
      }
    });

    conn.on('data', (data) => {
      this.handlePacket(data, conn.peer, 'webrtc');
    });

    conn.on('close', () => {
      console.log(`[NetLift] Peer disconnected: ${conn.peer}`);
      this.removePeer(conn.peer);
    });

    conn.on('error', (err) => {
      console.warn(`[NetLift] Connection error on peer ${conn.peer}:`, err);
      this.removePeer(conn.peer);
    });
  }

  // -------------------------------------------------------------
  // 4. Room Management
  // -------------------------------------------------------------
  setRoom(newRoomId) {
    if (!newRoomId || newRoomId === this.roomId) return;

    this.connections.forEach(conn => {
      try { conn.close(); } catch (e) {}
    });
    this.connections.clear();

    this.peers.forEach(peer => {
      if (peer.mesh) this.scene.remove(peer.mesh);
    });
    this.peers.clear();

    if (this.peer && !this.peer.destroyed) {
      try { this.peer.destroy(); } catch (e) {}
    }

    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch (e) {}
    }
    if (this.onStorageEvent && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.onStorageEvent);
    }

    this.roomId = newRoomId;
    this.isHost = false;
    this.lastHostHeartbeat = Date.now();
    this.processedPackets.clear();
    this.processedPacketQueue = [];

    this.initRedundantTransports();
    this.initPeerJS();
  }

  setStatus(msg) {
    this.statusMessage = msg;
    if (this.onStatusChanged) this.onStatusChanged(msg);
  }

  // -------------------------------------------------------------
  // 5. Incoming Packet Processing with Deduplication & Sequencing
  // -------------------------------------------------------------
  handlePacket(data, senderPeerId, transportSource = 'unknown') {
    if (!data || data.id === this.localId) return;

    // Deduplication check: Discard packet if already processed via another transport channel
    if (data.seq !== undefined) {
      const packetKey = `${data.id}_${data.seq}`;
      if (this.processedPackets.has(packetKey)) {
        return; // Duplicate packet dropped
      }
      this.processedPackets.add(packetKey);
      this.processedPacketQueue.push(packetKey);
      if (this.processedPacketQueue.length > this.maxDedupeHistory) {
        const oldest = this.processedPacketQueue.shift();
        this.processedPackets.delete(oldest);
      }
    }

    // A. Full Mesh Roster Sync (Host introduces member to others)
    if (data.type === 'roster_sync') {
      if (Array.isArray(data.peers) && this.peer && !this.peer.destroyed) {
        data.peers.forEach(peerId => {
          if (peerId !== this.peer.id && !this.connections.has(peerId)) {
            console.log(`[NetLift] Mesh connecting to squad peer: ${peerId}`);
            const conn = this.peer.connect(peerId, { reliable: true });
            this.setupConnection(conn);
          }
        });
      }
      return;
    }

    // B. Host Heartbeat (Liveness & Health)
    if (data.type === 'host_heartbeat') {
      this.lastHostHeartbeat = Date.now();
      return;
    }

    // C. Host Migrated Announcement
    if (data.type === 'host_migrated') {
      console.log(`[NetLift] Host migration confirmed. New Commander is ${data.newHostId}`);
      this.lastHostHeartbeat = Date.now();
      if (this.peer && data.newHostId === this.peer.id) {
        this.isHost = true;
        this.setStatus(`COMMANDER (HOST PROMOTED) // ROOM: ${this.roomId}`);
      } else {
        this.isHost = false;
        const callsign = (data.newHostId || '').replace(/.*_/, '').toUpperCase();
        this.setStatus(`SQUAD MEMBER [HOST: ${callsign}] // ROOM: ${this.roomId}`);
      }
      return;
    }

    // D. Ping / Pong Round-Trip Latency
    if (data.type === 'ping') {
      const conn = this.connections.get(senderPeerId);
      if (conn && conn.open) {
        try { conn.send({ type: 'pong', sendTime: data.sendTime, id: this.localId }); } catch (e) {}
      }
      return;
    }

    if (data.type === 'pong') {
      const rtt = Math.max(1, Date.now() - (data.sendTime || Date.now()));
      const peer = this.peers.get(senderPeerId);
      if (peer) {
        peer.ping = rtt;
        peer.lastSeen = Date.now();
        this.updatePeerNameplate(peer);
      }
      return;
    }

    // E. Remote Weapon Fired (Laser sync across network)
    if (data.type === 'laser_fired') {
      if (this.onRemoteLaser && Array.isArray(data.position) && Array.isArray(data.direction)) {
        const posX = sanitizeNum(data.position[0], 0);
        const posY = sanitizeNum(data.position[1], 1);
        const posZ = sanitizeNum(data.position[2], 0);
        const dirX = sanitizeNum(data.direction[0], 0, -1, 1);
        const dirY = sanitizeNum(data.direction[1], 0, -1, 1);
        const dirZ = sanitizeNum(data.direction[2], -1, -1, 1);

        this.onRemoteLaser({
          senderId: data.id,
          weaponId: data.weaponId || 'plasma_rifle',
          position: new THREE.Vector3(posX, posY, posZ),
          direction: new THREE.Vector3(dirX, dirY, dirZ).normalize(),
          speed: sanitizeNum(data.speed, 100, 10, 500),
          damage: sanitizeNum(data.damage, 35, 1, 300),
          color: (typeof data.color === 'number') ? data.color : 0x00ffff,
          scale: data.scale,
          life: sanitizeNum(data.life, 2.5, 0.5, 6.0)
        });
      }
      return;
    }

    // E2. Direct Friendly Fire & Melee Damage Synchronization
    if (data.type === 'damage_dealt') {
      const isTargetMe = (data.targetId === this.localId || (this.peer && data.targetId === this.peer.id) || data.targetId === 'all');
      if (isTargetMe) {
        if (this.onLocalDamage) {
          this.onLocalDamage(data);
        }
      } else {
        const targetPeer = this.peers.get(data.targetId);
        if (targetPeer) {
          const dmg = sanitizeNum(data.damage, 25, 0, 500);
          if (targetPeer.shield > 0) {
            targetPeer.shield = Math.max(0, targetPeer.shield - dmg);
          } else {
            targetPeer.hull = Math.max(0, targetPeer.hull - dmg);
          }
          this.updatePeerNameplate(targetPeer);
        }
      }
      return;
    }

    // F. Locomotion & State Synchronization with Dead-Reckoning
    if (data.type === 'sync' || data.type === 'reconcile') {
      let peer = this.peers.get(data.id);
      if (!peer) {
        peer = this.createPeerAvatar(data.id, data.mode, data.characterId);
        this.peers.set(data.id, peer);
      }

      // Out-of-order packet safeguard
      if (data.seq !== undefined && peer.lastSeq !== undefined && data.seq < peer.lastSeq) {
        return; // Discard outdated packet
      }
      if (data.seq !== undefined) peer.lastSeq = data.seq;

      if (Array.isArray(data.position)) {
        const newX = sanitizeNum(data.position[0], peer.targetPos.x);
        const newY = sanitizeNum(data.position[1], peer.targetPos.y);
        const newZ = sanitizeNum(data.position[2], peer.targetPos.z);

        const now = Date.now();
        const dt = Math.max(0.016, (now - peer.lastPacketTime) / 1000);
        peer.lastPacketTime = now;

        // Calculate velocity for dead-reckoning extrapolation
        const vx = (newX - peer.targetPos.x) / dt;
        const vy = (newY - peer.targetPos.y) / dt;
        const vz = (newZ - peer.targetPos.z) / dt;
        const speed = Math.hypot(vx, vy, vz);

        if (speed < 55.0) { // Discard anomalous teleport spikes
          peer.velocity.set(vx, vy, vz);
        } else {
          peer.velocity.set(0, 0, 0);
        }

        peer.targetPos.set(newX, newY, newZ);
      }

      // High-Fidelity Facing Angle & Camera Aim Pitch Synchronization
      if (data.facingYaw !== undefined) {
        peer.targetFacingYaw = sanitizeNum(data.facingYaw, 0, -100, 100);
      } else if (data.yaw !== undefined) {
        peer.targetFacingYaw = sanitizeNum(data.yaw + Math.PI, 0, -100, 100);
      }
      if (data.pitch !== undefined) {
        peer.targetPitch = sanitizeNum(data.pitch, 0, -2, 2);
      }

      // Normalized Quaternion Orientation (primarily for flight mode)
      if (Array.isArray(data.rotation) && data.rotation.length === 4) {
        peer.targetQuat.set(
          sanitizeNum(data.rotation[0], 0),
          sanitizeNum(data.rotation[1], 0),
          sanitizeNum(data.rotation[2], 0),
          sanitizeNum(data.rotation[3], 1)
        ).normalize();
      }

      peer.mode = data.mode || 'interior';

      // Skeletal Animation State Update
      const newAnim = data.animation || 'idle';
      if (peer.animation !== newAnim) {
        peer.animation = newAnim;
        if (peer.fadeToAction) {
          peer.fadeToAction(newAnim, 0.2);
        }
      }

      // Character Class Switch Verification
      if (data.characterId && data.characterId !== peer.characterId) {
        peer.characterId = data.characterId;
        this.loadPeer3DModel(peer, data.characterId);
        this.updatePeerNameplate(peer);
      } else {
        peer.characterId = data.characterId || 'pilot1';
      }

      peer.equippedWeapon = data.equippedWeapon || 'unarmed';
      peer.isSeatedInCockpit = !!data.isSeatedInCockpit;
      peer.shield = sanitizeNum(data.shield, 100, 0, 100);
      peer.hull = sanitizeNum(data.hull, 100, 0, 100);
      peer.lastSeen = Date.now();

      if (data.isHost) {
        this.lastHostHeartbeat = Date.now();
      }

      this.updatePeerWeapon(peer, data.equippedWeapon);
      this.updatePeerNameplate(peer);
    }
  }

  // -------------------------------------------------------------
  // 6. Multi-Tier Automatic Host Migration with Consensus
  // -------------------------------------------------------------
  checkHostMigration(delta) {
    if (this.isHost) return; // Current peer is already the host

    this.hostCheckTimer += delta;
    if (this.hostCheckTimer < 0.5) return;
    this.hostCheckTimer = 0;

    const now = Date.now();
    // If the host hasn't broadcast heartbeat for > 3.2 seconds, initiate election
    if (now - this.lastHostHeartbeat > 3200 && this.peer && this.peer.id) {
      const candidates = Array.from(this.connections.keys()).concat(this.peer.id);
      candidates.sort(); // Lexicographically identical sorting across all clients

      const electedHostId = candidates[0];
      if (electedHostId === this.peer.id) {
        console.log(`[NetLift] Host timeout detected! Promoting this client to Commander: ${this.peer.id}`);
        this.isHost = true;
        this.lastHostHeartbeat = now;
        this.setStatus(`COMMANDER (HOST MIGRATED) // ROOM: ${this.roomId}`);

        // Broadcast promotion to all squad members
        this.broadcast({
          type: 'host_migrated',
          id: this.localId,
          newHostId: this.peer.id,
          time: now
        });
      } else {
        // Redundant tier-2 check: If primary candidate fails to send heartbeat for > 5.0s, elect 2nd candidate
        if (now - this.lastHostHeartbeat > 5000 && candidates.length > 1 && candidates[1] === this.peer.id) {
          console.log(`[NetLift] Tier-1 candidate unresponsive. Promoting Tier-2 Commander: ${this.peer.id}`);
          this.isHost = true;
          this.lastHostHeartbeat = now;
          this.setStatus(`COMMANDER (TIER-2 HOST MIGRATED) // ROOM: ${this.roomId}`);
          this.broadcast({
            type: 'host_migrated',
            id: this.localId,
            newHostId: this.peer.id,
            time: now
          });
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 7. Remote 3D Avatar Creation with Live PBR Armor & Skeletal Animations
  // -------------------------------------------------------------
  bindPeerActions(peer) {
    if (!peer || !peer.mixer) return;
    peer.actions = {};

    Object.entries(this.sharedClips).forEach(([animKey, item]) => {
      const action = peer.mixer.clipAction(item.clip);
      action.setLoop(item.cfg.loop);
      action.clampWhenFinished = !!item.cfg.clamp;
      action.timeScale = item.cfg.timeScale || 1.0;
      peer.actions[animKey] = action;
    });

    peer.fadeToAction = (name, duration = 0.2) => {
      if (!peer.actions) return;
      const nextAction = peer.actions[name] || peer.actions['idle'];
      if (!nextAction) return;

      if (peer.currentAction === nextAction) {
        if (!nextAction.isRunning()) {
          nextAction.enabled = true;
          nextAction.reset().play();
        }
        return;
      }

      const prevAction = peer.currentAction;
      peer.currentAction = nextAction;

      if (prevAction && prevAction !== nextAction) {
        prevAction.fadeOut(duration);
      }

      nextAction
        .reset()
        .setEffectiveTimeScale(nextAction.timeScale || 1.0)
        .setEffectiveWeight(1.0)
        .fadeIn(duration);
      nextAction.enabled = true;
      nextAction.play();
    };
  }

  loadPeer3DModel(peer, characterId = 'pilot1') {
    if (!peer || !peer.mesh) return;
    if (peer.loadedModelId === characterId && peer.avatarModel) return;
    peer.loadedModelId = characterId;

    const url = (characterId === 'pilot2')
      ? '/assets/player2/player2.glb'
      : (characterId === 'pilot3')
      ? '/assets/player3/player3.glb'
      : '/assets/anim_idle.glb';

    this.gltfLoader.load(url, (gltf) => {
      if (!peer.mesh) return;

      // Clean up previous 3D model and mixer
      if (peer.avatarModel) {
        peer.mesh.remove(peer.avatarModel);
        peer.avatarModel = null;
      }
      if (peer.mixer) {
        peer.mixer.stopAllAction();
        peer.mixer = null;
      }

      const model = gltf.scene;
      model.scale.set(1.0, 1.0, 1.0);
      model.position.set(0, 0, 0);

      // PBR Texture validation & redundant fallback loader
      const texLoader = new THREE.TextureLoader();
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.frustumCulled = false;
          if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(mat => {
              mat.roughness = 0.45;
              mat.metalness = 0.55;
              if (!mat.map && characterId === 'pilot2') {
                texLoader.load('/assets/player2/extracted_Material_001_Diffuse.jpg', t => {
                  t.colorSpace = THREE.SRGBColorSpace;
                  t.flipY = false;
                  mat.map = t;
                  mat.needsUpdate = true;
                });
              } else if (!mat.map && characterId === 'pilot3') {
                texLoader.load('/assets/player3/extracted_Material_001_Diffuse.jpg', t => {
                  t.colorSpace = THREE.SRGBColorSpace;
                  t.flipY = false;
                  mat.map = t;
                  mat.needsUpdate = true;
                });
              }
              mat.needsUpdate = true;
            });
          }
        }
      });

      // Find bones for dynamic aiming pitch
      peer.headBone = model.getObjectByName('CC_Base_Head') || model.getObjectByName('Head');
      peer.spineBone = model.getObjectByName('CC_Base_Spine02') || model.getObjectByName('CC_Base_Spine01');

      peer.avatarModel = model;
      peer.mesh.add(model);

      // Initialize Animation Mixer with all preloaded skeletal animations
      peer.mixer = new THREE.AnimationMixer(model);
      this.bindPeerActions(peer);

      // Immediately play idle or requested animation
      const initAnim = peer.animation || 'idle';
      if (peer.fadeToAction) {
        peer.fadeToAction(initAnim, 0.1);
      }

      console.log(`[NetLift] Successfully loaded real 3D operative model for peer ${peer.id} (${characterId})`);
    }, undefined, (err) => {
      console.warn(`[NetLift] Peer model load error for ${characterId}:`, err);
    });
  }

  createPeerAvatar(id, mode, characterId = 'pilot1') {
    const group = new THREE.Group();

    // Weapon Attachment Mount (positioned near character's right hand)
    const weaponSlot = new THREE.Group();
    weaponSlot.position.set(0.35, 0.82, 0.28);
    group.add(weaponSlot);

    // Floating Holographic Squad Tag & Status Plate
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 256;
    tagCanvas.height = 64;
    const tagTex = new THREE.CanvasTexture(tagCanvas);
    const tagSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tagTex,
      transparent: true,
      depthTest: true,
      depthWrite: false
    }));
    tagSprite.position.y = 2.30; // Elevated high above helmet
    tagSprite.scale.set(1.4, 0.35, 1);
    group.add(tagSprite);

    this.scene.add(group);

    const peerObj = {
      id: id,
      mesh: group,
      targetPos: new THREE.Vector3(),
      targetRot: new THREE.Vector3(),
      targetQuat: new THREE.Quaternion(),
      targetFacingYaw: 0,
      targetPitch: 0,
      velocity: new THREE.Vector3(),
      lastPacketTime: Date.now(),
      mode: mode,
      characterId: characterId,
      equippedWeapon: 'unarmed',
      weaponSlot: weaponSlot,
      lastSeen: Date.now(),
      lastSeq: -1,
      ping: 25,
      tagCanvas: tagCanvas,
      tagTex: tagTex,
      shield: 100,
      hull: 100,
      avatarModel: null,
      mixer: null,
      actions: {},
      currentAction: null,
      headBone: null,
      spineBone: null
    };

    // Load actual 3D character model (NO dummy boxes, NO black cubes!)
    this.loadPeer3DModel(peerObj, characterId);

    this.updatePeerNameplate(peerObj);
    return peerObj;
  }

  updatePeerNameplate(peer) {
    if (!peer.tagCanvas || !peer.tagTex) return;
    const ctx = peer.tagCanvas.getContext('2d');
    const isP2 = (peer.characterId === 'pilot2');
    const isP3 = (peer.characterId === 'pilot3');
    const roleTag = isP2 ? 'MECH' : isP3 ? 'SCOUT' : 'CAPT';
    const primaryColor = isP2 ? '#f59e0b' : isP3 ? '#10b981' : '#00f0ff';

    ctx.clearRect(0, 0, 256, 64);

    // Clean semi-transparent pill badge with smooth rounded corners
    ctx.fillStyle = 'rgba(8, 14, 26, 0.78)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(6, 6, 244, 52, 10);
    } else {
      ctx.rect(6, 6, 244, 52);
    }
    ctx.fill();

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2.0;
    ctx.stroke();

    const shortId = (peer.id || '').replace(/.*_/, '').toUpperCase();
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`${roleTag} [${shortId}]`, 18, 28);

    const ping = peer.ping || 25;
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = (ping > 300) ? '#ef4444' : (ping > 120) ? '#f59e0b' : '#4ade80';
    ctx.fillText(`${ping}ms`, 185, 28);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px monospace';
    ctx.fillText(`S: ${Math.round(peer.shield)}% // H: ${Math.round(peer.hull)}%`, 18, 48);

    peer.tagTex.needsUpdate = true;
  }

  updatePeerWeapon(peer, weaponId) {
    if (!peer.weaponSlot) return;
    if (peer.currentWeaponId === weaponId) return;
    peer.currentWeaponId = weaponId;

    while (peer.weaponSlot.children.length > 0) {
      peer.weaponSlot.remove(peer.weaponSlot.children[0]);
    }

    if (!weaponId || weaponId === 'unarmed') return;

    const gunGroup = new THREE.Group();
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    if (weaponId === 'combat_knife') {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.08), glowMat);
      blade.rotation.x = Math.PI / 4;
      gunGroup.add(blade);
    } else if (weaponId === 'dual_grapplers') {
      // Sleek wrist gauntlets without bulky black boxes
      const gauntlet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 0.18, 8),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
      );
      gauntlet.rotation.x = Math.PI / 2;
      const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), glowMat);
      emitter.position.set(0, 0, 0.1);
      gunGroup.add(gauntlet, emitter);
    } else {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.42), gunMat);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.30, 8), glowMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, 0.20);
      gunGroup.add(body);
      gunGroup.add(barrel);
    }

    peer.weaponSlot.add(gunGroup);
  }

  removePeer(peerId) {
    const peer = this.peers.get(peerId);
    if (peer && peer.mesh) {
      this.scene.remove(peer.mesh);
    }
    this.peers.delete(peerId);
    this.connections.delete(peerId);
    if (this.onPeerLeft) this.onPeerLeft(peerId);
  }

  // -------------------------------------------------------------
  // 8. Broadcast Across Redundant Transports (WebRTC + BroadcastChannel + LocalStorage)
  // -------------------------------------------------------------
  broadcast(packet) {
    packet.seq = ++this.seqCounter;

    // A. WebRTC P2P DataChannels
    this.connections.forEach((conn) => {
      if (conn.open) {
        try { conn.send(packet); } catch (e) {}
      }
    });

    // B. Redundant BroadcastChannel
    if (this.broadcastChannel) {
      try { this.broadcastChannel.postMessage(packet); } catch (e) {}
    }

    // C. Redundant LocalStorage Event Channel (for sandboxed or multi-tab contexts)
    if (this.storageKey && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(this.storageKey, JSON.stringify(packet));
      } catch (e) {}
    }
  }


  broadcastDamage(damageData) {
    const packet = {
      type: 'damage_dealt',
      id: this.localId,
      targetId: damageData.targetId,
      attackerId: damageData.attackerId || this.localId,
      damage: sanitizeNum(damageData.damage, 25, 0, 500),
      damageType: damageData.damageType || 'punch',
      direction: damageData.direction || [0, 0, -1],
      time: Date.now()
    };
    this.broadcast(packet);
  }

  broadcastLaser(laserData) {
    const packet = {
      type: 'laser_fired',
      id: this.localId,
      time: Date.now(),
      weaponId: laserData.weaponId || 'plasma_rifle',
      position: [
        Math.round(laserData.position.x * 100) / 100,
        Math.round(laserData.position.y * 100) / 100,
        Math.round(laserData.position.z * 100) / 100
      ],
      direction: [
        Math.round(laserData.direction.x * 1000) / 1000,
        Math.round(laserData.direction.y * 1000) / 1000,
        Math.round(laserData.direction.z * 1000) / 1000
      ],
      speed: laserData.speed || 100,
      damage: laserData.damage || 35,
      color: laserData.color || 0x00ffff,
      scale: laserData.scale,
      life: laserData.life || 2.5
    };
    this.broadcast(packet);
  }

  broadcastState(localState, isFullReconcile = false) {
    const posX = Math.round(localState.position.x * 100) / 100;
    const posY = Math.round(localState.position.y * 100) / 100;
    const posZ = Math.round(localState.position.z * 100) / 100;

    const facingYaw = Math.round((localState.facingYaw !== undefined ? localState.facingYaw : 0) * 100) / 100;
    const yaw = Math.round((localState.yaw !== undefined ? localState.yaw : 0) * 100) / 100;
    const pitch = Math.round((localState.pitch !== undefined ? localState.pitch : 0) * 100) / 100;

    let rotArray = [0, 0, 0, 1];
    if (Array.isArray(localState.rotation) && localState.rotation.length === 4) {
      rotArray = [
        Math.round(localState.rotation[0] * 1000) / 1000,
        Math.round(localState.rotation[1] * 1000) / 1000,
        Math.round(localState.rotation[2] * 1000) / 1000,
        Math.round(localState.rotation[3] * 1000) / 1000
      ];
    }

    const now = Date.now();
    // Delta suppression: only send when moved or turned view, or during periodic full state reconciliation
    if (!isFullReconcile && this.lastBroadcast) {
      const isStationary = this.lastBroadcast.posX === posX &&
        this.lastBroadcast.posY === posY &&
        this.lastBroadcast.posZ === posZ &&
        Math.abs(this.lastBroadcast.facingYaw - facingYaw) < 0.03 &&
        Math.abs(this.lastBroadcast.pitch - pitch) < 0.03 &&
        this.lastBroadcast.mode === localState.mode &&
        this.lastBroadcast.anim === localState.animation;

      if (isStationary && (now - this.lastBroadcast.time < 500)) {
        return; // Suppress redundant packet
      }
    }

    this.lastBroadcast = { posX, posY, posZ, facingYaw, pitch, mode: localState.mode, anim: localState.animation, time: now };

    const packet = {
      type: isFullReconcile ? 'reconcile' : 'sync',
      id: this.localId,
      time: now,
      isHost: this.isHost,
      mode: localState.mode,
      characterId: localState.characterId || 'pilot1',
      equippedWeapon: localState.equippedWeapon || 'unarmed',
      isSeatedInCockpit: !!localState.isSeatedInCockpit,
      position: [posX, posY, posZ],
      facingYaw: facingYaw,
      yaw: yaw,
      pitch: pitch,
      rotation: rotArray,
      animation: localState.animation || 'idle',
      shield: Math.round(localState.shield !== undefined ? localState.shield : 100),
      hull: Math.round(localState.hull !== undefined ? localState.hull : 100)
    };

    this.broadcast(packet);
  }

  // -------------------------------------------------------------
  // 9. Frame-by-Frame Update Loop with Dead-Reckoning & Dynamic Aiming
  // -------------------------------------------------------------
  update(delta, localState) {
    // A. 20 Hz State Broadcast
    this.sendTimer += delta;
    if (this.sendTimer >= 0.05) {
      this.broadcastState(localState, false);
      this.sendTimer = 0;
    }

    // B. Periodic Full State Reconciliation (every 2.5s to heal desyncs)
    this.reconcileTimer += delta;
    if (this.reconcileTimer >= 2.5) {
      this.broadcastState(localState, true);
      this.reconcileTimer = 0;
    }

    // C. Host Heartbeat Broadcast (every 1.0s)
    if (this.isHost) {
      this.heartbeatTimer += delta;
      if (this.heartbeatTimer >= 1.0) {
        this.broadcast({
          type: 'host_heartbeat',
          id: this.localId,
          hostId: this.peer ? this.peer.id : '',
          time: Date.now()
        });
        this.heartbeatTimer = 0;
      }
    }

    // D. Latency Ping Check (every 1.5s)
    this.pingTimer += delta;
    if (this.pingTimer >= 1.5) {
      this.broadcast({ type: 'ping', sendTime: Date.now(), id: this.localId });
      this.pingTimer = 0;
    }

    // E. Host Migration Check
    this.checkHostMigration(delta);

    // F. Dead Reckoning, Rotation & Animation Processing for Remote Peers
    const now = Date.now();
    this.peers.forEach((peer, id) => {
      // Disconnect timeout if no packet received for > 6 seconds
      if (now - peer.lastSeen > 6000) {
        console.log(`[NetLift] Peer timed out: ${id}`);
        this.removePeer(id);
        return;
      }

      // Dead-reckoning: if packet is delayed (> 45ms), extrapolate forward with velocity
      const timeSincePacket = (now - peer.lastPacketTime) / 1000;
      if (timeSincePacket > 0.045 && timeSincePacket < 0.8) {
        peer.targetPos.addScaledVector(peer.velocity, delta);
        peer.velocity.multiplyScalar(0.92); // Smooth friction damping
      }

      // Smooth position interpolation
      peer.mesh.position.lerp(peer.targetPos, 0.22);

      // Smooth rotation interpolation
      if (peer.mode === 'flight') {
        peer.mesh.quaternion.slerp(peer.targetQuat, 0.22);
      } else {
        // Humanoid body rotation: smoothly turn towards player's facing angle
        const targetAngle = (peer.targetFacingYaw !== undefined) ? peer.targetFacingYaw : 0;
        let diff = targetAngle - peer.mesh.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        peer.mesh.rotation.y += diff * Math.min(1.0, delta * 20.0);

        // Apply pitch aim (looking up / down) to head bone
        if (peer.headBone && peer.targetPitch !== undefined) {
          peer.headBone.rotation.x = -peer.targetPitch * 0.65;
        }
      }

      // Dynamic animation state fallback
      const horizontalSpeed = Math.hypot(peer.velocity.x, peer.velocity.z);
      let targetAnim = peer.animation || 'idle';

      if (horizontalSpeed > 4.5) {
        targetAnim = 'run';
      } else if (horizontalSpeed > 0.35) {
        if (targetAnim === 'idle') targetAnim = 'walk';
      } else if (horizontalSpeed < 0.18 && (targetAnim === 'walk' || targetAnim === 'run')) {
        targetAnim = 'idle';
      }

      if (peer.fadeToAction) {
        peer.fadeToAction(targetAnim, 0.2);
      }

      // Update skeletal animation mixer for real 3D model
      if (peer.mixer) {
        peer.mixer.update(delta);
      }

      if (peer.mesh) {
        peer.mesh.updateMatrixWorld(true);
      }

      // Visibility: visible if both in interior, or both in flight/eva
      const isBothInterior = (localState.mode === 'interior' || !localState.mode) && (peer.mode === 'interior' || !peer.mode);
      peer.mesh.visible = isBothInterior || (peer.mode === localState.mode);
    });
  }

  getPeerCount() {
    return this.peers.size;
  }
}
