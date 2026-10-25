// Combat system: Laser Projectiles, Collision Physics, Sparks and Rogue Drone AI
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sounds } from './audio.js';

export class CombatManager {
  constructor(scene) {
    this.scene = scene;
    this.lasers = [];
    this.enemies = [];
    this.sparks = [];
    this.combatGroup = new THREE.Group();
    this.scene.add(this.combatGroup);
    this.sparkGeo = new THREE.SphereGeometry(0.1, 4, 4);

    this.laserGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.8, 6);
    this.laserGeo.rotateX(Math.PI / 2);

    this.playerLaserMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    this.enemyLaserMat = new THREE.MeshBasicMaterial({ color: 0xff3344 });

    // Loot Crate System
    this.lootCrates = [];
    this.onLootCollected = null;

    // Hyperspace Jammer System
    this.jammer = null;
    this.onJammerDestroyed = null;
    this.multiplayer = null;

    this.initEnemies();
    this.initJammer();
    this.initFloatingLoot();
    this.enemyShipGltf = null;
    this.loadEnemyShipModel();
  }

  initJammer() {
    const jammerGroup = new THREE.Group();
    jammerGroup.position.set(260, 160, -320); // Mounted on distant Jammer Outpost Asteroid

    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x1a1215,
      metalness: 0.9,
      roughness: 0.25
    });
    const emissiveRedMat = new THREE.MeshBasicMaterial({
      color: 0xff0033
    });

    // Central Jammer Transmitter Spire
    const spireGeo = new THREE.ConeGeometry(5.0, 42.0, 8);
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.y = 21.0;
    jammerGroup.add(spire);

    // Glowing emitter tip
    const tip = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 12), emissiveRedMat);
    tip.position.y = 42.0;
    jammerGroup.add(tip);

    const tipLight = new THREE.PointLight(0xff0044, 4.5, 60);
    tipLight.position.y = 42.0;
    jammerGroup.add(tipLight);

    // Menacing pulsating spherical interference forcefield ring
    const fieldGeo = new THREE.SphereGeometry(12.0, 24, 24);
    const fieldMat = new THREE.MeshBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0.25,
      wireframe: true
    });
    const forcefield = new THREE.Mesh(fieldGeo, fieldMat);
    forcefield.position.y = 42.0;
    jammerGroup.add(forcefield);

    // 3 Destructible Power Shield Cores mounted around the spire base
    const powerCores = [];
    for (let c = 0; c < 3; c++) {
      const angle = (c / 3) * Math.PI * 2;
      const coreGroup = new THREE.Group();
      coreGroup.position.set(Math.cos(angle) * 16.0, 8.0, Math.sin(angle) * 16.0);

      // Support pylon
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 12.0, 6), spireMat);
      coreGroup.add(pylon);

      // Glowing power core sphere
      const orb = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 16), emissiveRedMat);
      orb.position.y = 7.0;
      coreGroup.add(orb);

      const orbLight = new THREE.PointLight(0xff1133, 3.0, 25);
      orbLight.position.y = 7.0;
      coreGroup.add(orbLight);

      jammerGroup.add(coreGroup);

      powerCores.push({
        group: coreGroup,
        orbMesh: orb,
        light: orbLight,
        worldPos: new THREE.Vector3(),
        health: 75,
        maxHealth: 75,
        radius: 3.8,
        alive: true
      });
    }

    this.combatGroup.add(jammerGroup);

    this.jammer = {
      group: jammerGroup,
      tipLight: tipLight,
      forcefield: forcefield,
      powerCores: powerCores,
      position: new THREE.Vector3(260, 160, -320),
      radius: 320.0, // Inhibitor field radius
      destroyed: false,
      pulseTimer: 0
    };
  }

  initFloatingLoot() {
    // Seed initial salvage caches throughout the asteroid field
    const types = ['plasma', 'titanium', 'hyperdrive', 'ammo'];
    const positions = [
      new THREE.Vector3(-140, 115, 120),
      new THREE.Vector3(120, 140, 220),
      new THREE.Vector3(-210, 135, -160),
      new THREE.Vector3(180, 90, 80),
      new THREE.Vector3(-70, 160, 310)
    ];

    positions.forEach((pos, idx) => {
      this.spawnLootCrate(pos, types[idx % types.length]);
    });
  }

  spawnLootCrate(position, type = null) {
    if (!type) {
      const types = ['plasma', 'titanium', 'hyperdrive', 'ammo'];
      type = types[Math.floor(Math.random() * types.length)];
    }

    const crateGroup = new THREE.Group();
    crateGroup.position.copy(position);

    let color = 0x00ffff;
    let label = '[CRYO-PLASMA CACHE]';
    if (type === 'titanium') {
      color = 0xffaa00;
      label = '[TITANIUM REPAIR SLAB]';
    } else if (type === 'hyperdrive') {
      color = 0xa855f7;
      label = '[HYPERDRIVE STABILIZER]';
    } else if (type === 'ammo') {
      color = 0xef4444;
      label = '[PHOTON CHARGE CACHE]';
    }

    // High-tech container casing
    const boxGeo = new THREE.BoxGeometry(2.0, 1.4, 2.0);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.25
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    crateGroup.add(box);

    // Glowing magnetic containment ring
    const ringGeo = new THREE.TorusGeometry(1.8, 0.14, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: color });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    crateGroup.add(ring);

    // Pulsing central power core orb
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 12), ringMat);
    crateGroup.add(orb);

    // Glowing loot light beacon
    const light = new THREE.PointLight(color, 2.8, 20);
    crateGroup.add(light);

    this.combatGroup.add(crateGroup);

    this.lootCrates.push({
      mesh: crateGroup,
      ring: ring,
      light: light,
      type: type,
      name: label,
      color: color,
      rotSpeed: 1.2 + Math.random() * 0.8,
      baseY: position.y,
      bobOffset: Math.random() * Math.PI * 2,
      life: 180.0
    });
  }

  isHyperspaceJammed(queryPos) {
    if (!this.jammer || this.jammer.destroyed) return false;
    return queryPos.distanceTo(this.jammer.position) < this.jammer.radius;
  }

  initEnemies() {
    // Spawn patrolling rogue pirate drones
    const droneCount = 6;
    for (let i = 0; i < droneCount; i++) {
      this.spawnEnemyDrone(i);
    }
  }

  loadEnemyShipModel() {
    const loader = new GLTFLoader();
    loader.load(
      '/assets/ship_exterior.glb',
      (gltf) => {
        this.enemyShipGltf = gltf;
        this.enemies.forEach((enemy) => {
          this.applyWarshipModel(enemy);
        });
      },
      undefined,
      (err) => {
        console.warn('[Combat] Enemy warship exterior load notice:', err);
      }
    );
  }

  applyWarshipModel(enemy) {
    if (!this.enemyShipGltf || !enemy.mesh || enemy.hasGltfModel) return;
    try {
      const clonedScene = this.enemyShipGltf.scene.clone(true);
      // Imposing 60m Cruiser Scale for Pirate Warship
      clonedScene.scale.set(5.2, 5.2, 5.2);
      // Invert local -Z to +Z so that enemy.mesh.lookAt(waypoint) points nose forward!
      clonedScene.rotation.y = Math.PI;

      // Aggressive pirate crimson and burnt titanium combat armor livery
      const enemyHullMat = new THREE.MeshStandardMaterial({
        color: 0x881824,
        roughness: 0.32,
        metalness: 0.88
      });

      clonedScene.traverse((child) => {
        if (child.isMesh) {
          child.material = enemyHullMat;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Remove fallback geometry and add detailed warship
      while (enemy.mesh.children.length > 0) {
        enemy.mesh.remove(enemy.mesh.children[0]);
      }
      enemy.mesh.add(clonedScene);

      // Glowing twin heavy crimson thruster plumes at ship stern
      const thrusterPlumeMat = new THREE.MeshBasicMaterial({
        color: 0xff0033,
        transparent: true,
        opacity: 0.85
      });
      [-3.0, 3.0].forEach((xOffset) => {
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.8, 4.0, 8), thrusterPlumeMat);
        flame.rotation.x = -Math.PI / 2;
        flame.position.set(xOffset, 0.4, -9.5);
        enemy.mesh.add(flame);
      });

      const sternLight = new THREE.PointLight(0xff0044, 4.0, 35);
      sternLight.position.set(0, 0.4, -8.0);
      enemy.mesh.add(sternLight);

      enemy.hasGltfModel = true;
      enemy.radius = 6.5;
    } catch (e) {
      console.warn('[Combat] Error applying warship model to enemy:', e);
    }
  }

  spawnEnemyDrone(index) {
    const group = new THREE.Group();

    // Geometric predatory drone design
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x882222, metalness: 0.9, roughness: 0.2 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.8, 0), bodyMat);
    core.scale.set(1.5, 0.7, 2.2);
    group.add(core);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), eyeMat);
    eye.position.set(0, 0, -2.0);
    group.add(eye);

    // Drone red glow
    const light = new THREE.PointLight(0xff0044, 2.2, 18);
    light.position.set(0, 0, -2.0);
    group.add(light);

    // Initial position in asteroid orbit
    const angle = (index / 6) * Math.PI * 2;
    const dist = 140 + Math.random() * 90;
    group.position.set(Math.cos(angle) * dist, 100 + (Math.random() - 0.5) * 70, Math.sin(angle) * dist + 120);

    this.combatGroup.add(group);

    const enemy = {
      mesh: group,
      health: 65,
      maxHealth: 65,
      speed: 24.0,
      fireTimer: 1.5 + Math.random() * 2,
      orbitAngle: angle,
      orbitRadius: dist,
      orbitSpeed: 0.15 + Math.random() * 0.1,
      radius: 2.5,
      alive: true
    };

    this.enemies.push(enemy);
  }

  addLaser(data) {
    let mat = data.isPlayer ? this.playerLaserMat : this.enemyLaserMat;
    let lightColor = data.isPlayer ? 0x00ffff : 0xff3344;
    if (data.color !== undefined) {
      mat = new THREE.MeshBasicMaterial({ color: data.color });
      lightColor = data.color;
    }
    const mesh = new THREE.Mesh(this.laserGeo, mat);
    if (data.scale) {
      mesh.scale.set(data.scale.x || 1, data.scale.y || 1, data.scale.z || 1);
    }
    mesh.position.copy(data.position);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), data.direction.clone().normalize());

    // Light attached to laser bolt
    const light = new THREE.PointLight(lightColor, 2.2, 9);
    mesh.add(light);

    this.combatGroup.add(mesh);

    this.lasers.push({
      mesh: mesh,
      velocity: data.direction.clone().normalize().multiplyScalar(data.speed || 80),
      damage: data.damage || 25,
      isPlayer: !!data.isPlayer,
      isLocalPlayer: !!data.isLocalPlayer,
      senderId: data.senderId || (data.isLocalPlayer ? 'local' : 'unknown'),
      weaponId: data.weaponId || 'plasma_rifle',
      life: data.life || 2.5
    });
  }

  spawnSparks(position, color = 0x00ffff, count = 18) {
    for (let i = 0; i < count; i++) {
      const pGeo = this.sparkGeo || new THREE.SphereGeometry(0.1, 4, 4);
      const pMat = new THREE.MeshBasicMaterial({ color: color });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.copy(position);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 18
      );

      this.combatGroup.add(p);
      this.sparks.push({ mesh: p, velocity: vel, life: 0.5 });
    }
  }

  update(delta, playerShip, isFlightMode, playerAstronaut = null) {
    // Combat projectiles and hit sparks remain visible across all rooms and space
    if (!this.combatGroup.visible) this.combatGroup.visible = true;
    const time = performance.now() * 0.003;

    // 1. Update Projectiles & Friendly Fire Collision Physics
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.life -= delta;
      laser.mesh.position.addScaledVector(laser.velocity, delta);

      let hit = false;

      // A. FRIENDLY FIRE: Check if projectile hits any squad peer
      if (this.multiplayer && this.multiplayer.peers) {
        for (const [peerId, peer] of this.multiplayer.peers) {
          if (!peer.mesh || !peer.mesh.visible) continue;
          // Disregard hitting the peer that actually fired this bolt
          if (laser.senderId === peer.id || laser.senderId === peerId) continue;

          const peerCenter = peer.mesh.position.clone().add(new THREE.Vector3(0, 1.15, 0));
          const dist = laser.mesh.position.distanceTo(peerCenter);

          if (dist < 1.25) { // Hit peer!
            hit = true;
            this.spawnSparks(laser.mesh.position, 0xef4444, 20);
            sounds.playLaser(false);

            if (laser.isLocalPlayer) {
              console.log(`[Friendly Fire] Laser shot hit squad peer ${peerId} for ${laser.damage} damage!`);
              if (peer.shield > 0) {
                peer.shield = Math.max(0, peer.shield - laser.damage);
              } else {
                peer.hull = Math.max(0, peer.hull - laser.damage);
              }
              if (this.multiplayer.updatePeerNameplate) {
                this.multiplayer.updatePeerNameplate(peer);
              }

              this.multiplayer.broadcastDamage({
                targetId: peer.id,
                attackerId: this.multiplayer.localId,
                damage: laser.damage,
                damageType: laser.weaponId || 'gun',
                direction: [laser.velocity.x, laser.velocity.y, laser.velocity.z]
              });
            }
            break;
          }
        }
      }

      // B. FRIENDLY FIRE: Check if projectile hits the LOCAL player on foot
      if (!hit && playerAstronaut && !playerAstronaut.isDead) {
        const isRemoteShot = laser.senderId && laser.senderId !== 'local' && laser.senderId !== (this.multiplayer ? this.multiplayer.localId : 'local');
        const isEnemyShot = !laser.isPlayer;

        if (isRemoteShot || isEnemyShot) {
          const localCenter = playerAstronaut.position.clone().add(new THREE.Vector3(0, 1.15, 0));
          const dist = laser.mesh.position.distanceTo(localCenter);
          if (dist < 1.15) {
            hit = true;
            this.spawnSparks(laser.mesh.position, 0xef4444, 20);
            const hitDir = laser.velocity.clone().normalize();
            playerAstronaut.takeDamage(laser.damage, laser.senderId, laser.weaponId || 'gun', laser.mesh.position, hitDir);
          }
        }
      }

      // C. In flight mode: check if laser hits player ship
      if (!hit && isFlightMode && playerShip) {
        const isRemoteShot = laser.senderId && laser.senderId !== 'local' && laser.senderId !== (this.multiplayer ? this.multiplayer.localId : 'local');
        const isEnemyShot = !laser.isPlayer;
        if (isRemoteShot || isEnemyShot) {
          const dist = laser.mesh.position.distanceTo(playerShip.shipGroup.position);
          if (dist < 4.5) {
            playerShip.takeDamage(laser.damage);
            this.spawnSparks(laser.mesh.position, 0xff0044, 25);
            hit = true;
          }
        }
      }

      // D. Check hits against enemy pirate drones
      if (!hit && laser.isPlayer && isFlightMode) {
        for (let e = 0; e < this.enemies.length; e++) {
          const enemy = this.enemies[e];
          if (!enemy.alive) continue;

          const dist = laser.mesh.position.distanceTo(enemy.mesh.position);
          if (dist < enemy.radius) {
            enemy.health -= laser.damage;
            this.spawnSparks(laser.mesh.position, 0x00ffff);
            sounds.playExplosion();
            hit = true;

            if (enemy.health <= 0) {
              enemy.alive = false;
              this.combatGroup.remove(enemy.mesh);
              this.spawnSparks(enemy.mesh.position, 0xff5500, 35);
              sounds.playExplosion();
              console.log("Rogue Pirate Drone Destroyed! Dropping Loot Crate...");
              this.spawnLootCrate(enemy.mesh.position.clone());
            }
            break;
          }
        }

        // E. Check hits against Hyperspace Jammer Power Cores
        if (!hit && this.jammer && !this.jammer.destroyed) {
          for (let c = 0; c < this.jammer.powerCores.length; c++) {
            const core = this.jammer.powerCores[c];
            if (!core.alive) continue;

            core.group.getWorldPosition(core.worldPos);
            core.worldPos.y += 7.0;

            const dist = laser.mesh.position.distanceTo(core.worldPos);
            if (dist < core.radius) {
              core.health -= laser.damage;
              this.spawnSparks(laser.mesh.position, 0xff0044, 20);
              sounds.playLaser(false);
              hit = true;

              if (core.health <= 0) {
                core.alive = false;
                core.orbMesh.visible = false;
                core.light.intensity = 0;
                this.spawnSparks(core.worldPos, 0xff3300, 45);
                sounds.playExplosion();
                console.log(`[Jammer] Power Core ${c + 1} Destroyed!`);

                const allDead = this.jammer.powerCores.every(pc => !pc.alive);
                if (allDead) {
                  this.jammer.destroyed = true;
                  this.jammer.tipLight.intensity = 0;
                  this.jammer.forcefield.visible = false;
                  this.spawnSparks(this.jammer.position.clone().add(new THREE.Vector3(0, 30, 0)), 0x00ffff, 80);
                  sounds.playExplosion();
                  console.log("[Jammer] Hyperspace Jammer Array Neutralized! Warp Inhibitor OFFLINE!");
                  if (this.onJammerDestroyed) this.onJammerDestroyed();
                }
              }
              break;
            }
          }
        }
      }

      if (hit || laser.life <= 0) {
        this.combatGroup.remove(laser.mesh);
        this.lasers.splice(i, 1);
      }
    }

    // 2. Update Spark Particles
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life -= delta;
      sp.mesh.position.addScaledVector(sp.velocity, delta);
      sp.mesh.scale.multiplyScalar(0.92);

      if (sp.life <= 0) {
        this.combatGroup.remove(sp.mesh);
        this.sparks.splice(i, 1);
      }
    }

    // 3. Update Hyperspace Jammer Field Pulse
    if (this.jammer && !this.jammer.destroyed) {
      this.jammer.pulseTimer += delta;
      const s = 1.0 + (Math.sin(this.jammer.pulseTimer * 3.5) * 0.15);
      this.jammer.forcefield.scale.set(s, s, s);
      this.jammer.forcefield.material.opacity = 0.2 + (Math.sin(this.jammer.pulseTimer * 3.5) * 0.12);
    }

    // 4. Update Floating Loot Crates & Check Collection
    const targetPos = (isFlightMode && playerShip) 
      ? playerShip.shipGroup.position 
      : (playerAstronaut ? playerAstronaut.position : null);

    for (let i = this.lootCrates.length - 1; i >= 0; i--) {
      const crate = this.lootCrates[i];
      crate.life -= delta;

      // Bobbing and rotation in zero-g
      crate.mesh.rotation.y += crate.rotSpeed * delta;
      crate.ring.rotation.x += crate.rotSpeed * 1.4 * delta;
      crate.mesh.position.y = crate.baseY + Math.sin(time * 2.0 + crate.bobOffset) * 0.8;

      if (targetPos) {
        const dist = crate.mesh.position.distanceTo(targetPos);
        if (dist < 7.5) {
          // Collected!
          sounds.playLootPickup();
          this.spawnSparks(crate.mesh.position, crate.color, 30);
          console.log(`[Loot] Collected ${crate.name}!`);

          if (this.onLootCollected) {
            this.onLootCollected(crate);
          }

          // Apply player or ship bonuses
          if (isFlightMode && playerShip) {
            if (crate.type === 'plasma') playerShip.shield = Math.min(100, playerShip.shield + 40);
            if (crate.type === 'titanium') playerShip.hull = Math.min(100, playerShip.hull + 40);
            if (crate.type === 'hyperdrive') playerShip.boostEnergy = 100;
          } else if (playerAstronaut) {
            if (crate.type === 'plasma') playerAstronaut.jetpackFuel = 100;
            if (crate.type === 'titanium') playerAstronaut.oxygenLevel = 100;
          }

          this.combatGroup.remove(crate.mesh);
          this.lootCrates.splice(i, 1);
          continue;
        }
      }

      if (crate.life <= 0) {
        this.combatGroup.remove(crate.mesh);
        this.lootCrates.splice(i, 1);
      }
    }

    // 5. Update Enemy AI Drones
    const targetCombatPos = (isFlightMode && playerShip)
      ? playerShip.shipGroup.position
      : ((playerAstronaut && playerAstronaut.isSpacewalk) ? playerAstronaut.position : null);

    if (!targetCombatPos) return;

    this.enemies.forEach((enemy) => {
      if (!enemy.alive) return;

      const toTarget = targetCombatPos.clone().sub(enemy.mesh.position);
      const distToTarget = toTarget.length();

      if (distToTarget < 200) {
        // Combat state: Face target & pursue
        enemy.mesh.lookAt(targetCombatPos);

        const moveDir = toTarget.clone().normalize();
        if (distToTarget > 40) {
          enemy.mesh.position.addScaledVector(moveDir, enemy.speed * delta);
        }

        // Fire at player
        enemy.fireTimer -= delta;
        if (enemy.fireTimer <= 0) {
          enemy.fireTimer = 2.2 + Math.random() * 1.5;
          sounds.playLaser(false);

          this.addLaser({
            position: enemy.mesh.position.clone(),
            direction: moveDir,
            speed: 130.0,
            damage: 15,
            isPlayer: false
          });
        }
      } else {
        // Orbit patrol state
        enemy.orbitAngle += enemy.orbitSpeed * delta;
        enemy.mesh.position.x = Math.cos(enemy.orbitAngle) * enemy.orbitRadius;
        enemy.mesh.position.z = Math.sin(enemy.orbitAngle) * enemy.orbitRadius + 120;
        enemy.mesh.rotation.y += delta * 0.8;
      }
    });
  }

  getAliveEnemiesCount() {
    return this.enemies.filter(e => e.alive).length;
  }
}
