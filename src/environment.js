
function reportStreaming(label, xhr) {
  if (typeof window !== 'undefined' && window.updateRenderProgress) {
    if (xhr && xhr.lengthComputable && xhr.total > 0) {
      const pct = Math.round((xhr.loaded / xhr.total) * 100);
      const loadedMb = (xhr.loaded / (1024 * 1024)).toFixed(1);
      const totalMb = (xhr.total / (1024 * 1024)).toFixed(1);
      window.updateRenderProgress(`STREAMING: ${label} [${loadedMb}/${totalMb}MB]`, pct, pct >= 100);
    } else if (xhr && xhr.loaded > 0) {
      const loadedMb = (xhr.loaded / (1024 * 1024)).toFixed(1);
      window.updateRenderProgress(`STREAMING: ${label} [${loadedMb}MB]`, 65);
    }
  }
}
// Space and Interior Environment Loader & Dynamic Scene Elements
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sounds } from './audio.js';

// Procedural High-Fidelity Sci-Fi Texture Generators
function createRedNebulaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  // Deep space dark void
  ctx.fillStyle = '#060205';
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Crimson & ruby cosmic nebula clouds
  const clouds = [
    { x: 350, y: 400, r: 440, c1: 'rgba(220, 30, 20, 0.48)', c2: 'rgba(120, 10, 30, 0.0)' },
    { x: 740, y: 320, r: 500, c1: 'rgba(255, 65, 20, 0.38)', c2: 'rgba(80, 5, 20, 0.0)' },
    { x: 500, y: 760, r: 540, c1: 'rgba(190, 20, 45, 0.42)', c2: 'rgba(40, 5, 15, 0.0)' },
    { x: 180, y: 820, r: 380, c1: 'rgba(255, 95, 45, 0.28)', c2: 'rgba(50, 0, 10, 0.0)' },
    { x: 880, y: 680, r: 420, c1: 'rgba(170, 15, 30, 0.32)', c2: 'rgba(20, 0, 10, 0.0)' }
  ];
  
  clouds.forEach(cl => {
    const grad = ctx.createRadialGradient(cl.x, cl.y, 10, cl.x, cl.y, cl.r);
    grad.addColorStop(0, cl.c1);
    grad.addColorStop(0.5, cl.c1.replace(/[\d\.]+\)$/, '0.15)'));
    grad.addColorStop(1, cl.c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);
  });
  
  // Stellar stars & warm dust speckles
  for (let i = 0; i < 950; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const size = Math.random() * 1.8 + 0.3;
    const r = Math.random();
    ctx.fillStyle = (r > 0.8) ? '#ffeedd' : (r > 0.5 ? '#ff8866' : '#ff4433');
    ctx.globalAlpha = Math.random() * 0.85 + 0.15;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createRedStarPhotosphereTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  // Core incandescent plasma gradient
  const grad = ctx.createRadialGradient(512, 512, 40, 512, 512, 512);
  grad.addColorStop(0.0, '#ffffff');
  grad.addColorStop(0.12, '#ffe588');
  grad.addColorStop(0.35, '#ff5500');
  grad.addColorStop(0.70, '#cc1100');
  grad.addColorStop(1.0, '#4a0000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Turbulent convective granulation cells
  for (let i = 0; i < 650; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const rad = 8 + Math.random() * 45;
    const g = ctx.createRadialGradient(x, y, 2, x, y, rad);
    const bright = Math.random() > 0.6;
    g.addColorStop(0, bright ? 'rgba(255, 240, 150, 0.6)' : 'rgba(190, 25, 0, 0.4)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Magnetic sunspots / solar flare depressions
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const rad = 5 + Math.random() * 24;
    const g = ctx.createRadialGradient(x, y, 2, x, y, rad);
    g.addColorStop(0, 'rgba(35, 0, 0, 0.88)');
    g.addColorStop(0.7, 'rgba(130, 10, 0, 0.45)');
    g.addColorStop(1, 'rgba(255, 60, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createHighFidelityAsteroidTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Basalt dark silicate base
  ctx.fillStyle = '#22252b';
  ctx.fillRect(0, 0, 512, 512);
  
  // Craggy rock grain and pitted surface
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const val = 20 + Math.floor(Math.random() * 42);
    ctx.fillStyle = `rgb(${val}, ${val + 2}, ${val + 6})`;
    ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  
  // Impact crater rings
  for (let i = 0; i < 38; i++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 512;
    const cr = 7 + Math.random() * 30;
    
    ctx.strokeStyle = 'rgba(12, 14, 18, 0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = 'rgba(85, 90, 102, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, cr, 0, Math.PI);
    ctx.stroke();
  }
  
  // Crystalline ruby-red & cyan mineral veins embedded in rock fissures
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 9; i++) {
    ctx.strokeStyle = (i % 2 === 0) ? 'rgba(255, 45, 20, 0.88)' : 'rgba(0, 230, 255, 0.78)';
    ctx.beginPath();
    let px = Math.random() * 512;
    let py = Math.random() * 512;
    ctx.moveTo(px, py);
    for (let s = 0; s < 6; s++) {
      px += (Math.random() - 0.5) * 80;
      py += (Math.random() - 0.5) * 80;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createConsoleUITexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Dark terminal monitor frame
  ctx.fillStyle = '#0a1018';
  ctx.fillRect(0, 0, 512, 512);
  
  // Cyan grid scanlines
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 512; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  
  // Circular radar sweep
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(256, 200, 110, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 200, 60, 0, Math.PI * 2);
  ctx.stroke();
  
  // Sweep line
  ctx.beginPath();
  ctx.moveTo(256, 200);
  ctx.lineTo(330, 120);
  ctx.stroke();
  
  // Telemetry Text Readouts
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('CRYO-CORE: STABLE [101.3 kPa]', 40, 50);
  ctx.fillStyle = '#4ade80';
  ctx.font = '16px monospace';
  ctx.fillText('STASIS POD PODS 01-12: SYNCHRONIZED', 40, 80);
  ctx.fillText('LIFE SUPPORT: NOMINAL // O2: 98.4%', 40, 105);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('HYPERSPACE VECTOR: CALIBRATED', 40, 360);
  
  // Keyboard keys array at bottom
  ctx.fillStyle = '#1e293b';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 12; c++) {
      ctx.fillRect(40 + c * 36, 400 + r * 30, 30, 22);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(44 + c * 36, 404 + r * 30, 4, 4);
      ctx.fillStyle = '#1e293b';
    }
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createCryoPodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Dark titanium casing
  ctx.fillStyle = '#181e28';
  ctx.fillRect(0, 0, 512, 512);
  
  // Brushed metal grooves
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let y = 0; y < 512; y += 4) {
    ctx.fillRect(0, y, 512, 2);
  }
  
  // Cyan glowing coolant conduits
  ctx.fillStyle = '#00d4ff';
  ctx.fillRect(40, 20, 24, 472);
  ctx.fillRect(448, 20, 24, 472);
  
  // Central glass stasis window with cyan frost
  const winGrad = ctx.createLinearGradient(100, 60, 412, 450);
  winGrad.addColorStop(0, 'rgba(0, 210, 255, 0.85)');
  winGrad.addColorStop(0.5, 'rgba(0, 110, 190, 0.7)');
  winGrad.addColorStop(1, 'rgba(0, 230, 255, 0.9)');
  ctx.fillStyle = winGrad;
  ctx.fillRect(100, 60, 312, 390);
  
  // Hazard warning chevron stripes
  ctx.fillStyle = '#f59e0b';
  for (let x = 110; x < 390; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 460);
    ctx.lineTo(x + 18, 460);
    ctx.lineTo(x + 28, 490);
    ctx.lineTo(x + 10, 490);
    ctx.closePath();
    ctx.fill();
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createCapitalHullTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Dark gunmetal armor plates
  ctx.fillStyle = '#1b232f';
  ctx.fillRect(0, 0, 512, 512);
  
  // Armor plate seams
  ctx.strokeStyle = '#0d131a';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 244, 244);
  ctx.strokeRect(260, 8, 244, 244);
  ctx.strokeRect(8, 260, 244, 244);
  ctx.strokeRect(260, 260, 244, 244);
  
  // Rivets on plate corners
  ctx.fillStyle = '#4b5563';
  const corners = [24, 236, 276, 488];
  corners.forEach(cx => {
    corners.forEach(cy => {
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  
  // Warning decals and markings
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(40, 40, 180, 8);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('USS ODYSSEY // FLEET FLAGSHIP', 40, 70);
  ctx.fillText('AIRLOCK EGRESS PLATFORM [PORT]', 40, 88);
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export class EnvironmentManager {
  constructor(scene) {
    this.scene = scene;
    this.mode = 'starbase'; // Game begins at the Starbase station before ship departure
    this.starbaseGroup = new THREE.Group();
    this.interiorGroup = new THREE.Group();
    this.spaceGroup = new THREE.Group();

    // Isolated ship deck/room sub-zones for occlusion culling
    this.interiorLightingGroup = new THREE.Group();
    this.interiorGroup.add(this.interiorLightingGroup);
    this.zoneCockpit = new THREE.Group();
    this.zoneCorridor = new THREE.Group();
    this.zoneGrandHall = new THREE.Group();
    this.zoneLowerDeck = new THREE.Group();
    this.zoneUpperDeck = new THREE.Group();

    this.interiorGroup.add(this.zoneCockpit);
    this.interiorGroup.add(this.zoneCorridor);
    this.interiorGroup.add(this.zoneGrandHall);
    this.interiorGroup.add(this.zoneLowerDeck);
    this.interiorGroup.add(this.zoneUpperDeck);

    this.scene.add(this.starbaseGroup);
    this.scene.add(this.interiorGroup);
    this.scene.add(this.spaceGroup);

    this.asteroids = [];
    this.interactiveConsoles = [];
    this.spaceDust = null;
    this.planet = null;
    this.pulsingLights = [];
    this.armoryPedestals = [];
    this.armoryMixers = [];

    this.setupInteriorLighting(); // Synchronously illuminate all rooms on frame 1!
    this.initSpace();
    this.initStarbase();
    this.initInterior();
  }

  initSpace() {
    // 1. Red Nebula Skybox Sphere
    const skyGeo = new THREE.SphereGeometry(1800, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
      map: createRedNebulaTexture(),
      side: THREE.BackSide
    });
    const skySphere = new THREE.Mesh(skyGeo, skyMat);
    this.spaceGroup.add(skySphere);

    // 2. Massive Glowing Red Supergiant Star
    const starGroup = new THREE.Group();
    starGroup.position.set(750, 180, -1100);

    const starGeo = new THREE.SphereGeometry(260, 48, 48);
    const starTex = createRedStarPhotosphereTexture();
    const starMat = new THREE.MeshBasicMaterial({
      map: starTex,
      color: 0xff3311
    });
    this.redStar = new THREE.Mesh(starGeo, starMat);
    starGroup.add(this.redStar);

    // Inner pulsating solar corona
    const coronaGeo = new THREE.SphereGeometry(285, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    this.starCorona = new THREE.Mesh(coronaGeo, coronaMat);
    starGroup.add(this.starCorona);

    // Outer solar flare prominence halo
    const flareGeo = new THREE.RingGeometry(290, 420, 48);
    const flareMat = new THREE.MeshBasicMaterial({
      color: 0xff2200,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    this.starFlareRing = new THREE.Mesh(flareGeo, flareMat);
    this.starFlareRing.rotation.x = Math.PI / 3;
    starGroup.add(this.starFlareRing);

    this.spaceGroup.add(starGroup);

    // 3. Stellar Red Radiation Lighting
    const starLight = new THREE.DirectionalLight(0xff3818, 4.6);
    starLight.position.set(750, 180, -1100);
    starLight.target.position.set(0, 100, 250);
    this.spaceGroup.add(starLight);
    this.spaceGroup.add(starLight.target);

    const spaceHemi = new THREE.HemisphereLight(0xff3820, 0x150406, 1.4);
    this.spaceGroup.add(spaceHemi);

    // 4. High-Fidelity Craggy Asteroids Field
    this.createHighFidelityAsteroids();

    // 5. Space Solar Wind & Embers particle stream
    const dustCount = 1000;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 800;
      dustPositions[i + 1] = (Math.random() - 0.5) * 500 + 100;
      dustPositions[i + 2] = (Math.random() - 0.5) * 800 + 150;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xff6622,
      size: 2.2,
      transparent: true,
      opacity: 0.8
    });
    this.spaceDust = new THREE.Points(dustGeo, dustMat);
    this.spaceGroup.add(this.spaceDust);

    // 6. Colossal Capital Mothership Exterior & Exterior Airlock Gantry Platform
    this.setupCapitalMothershipExterior();
  }

  createHighFidelityAsteroids() {
    const rockTex = createHighFidelityAsteroidTexture();

    // 3 distinct procedural asteroid meshes with craters and crags
    const geos = [];
    for (let g = 0; g < 3; g++) {
      const geo = new THREE.IcosahedronGeometry(1.0, 3);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let vx = pos.getX(i);
        let vy = pos.getY(i);
        let vz = pos.getZ(i);
        
        const n1 = Math.sin(vx * 2.5 + g) * Math.cos(vy * 2.5) * Math.sin(vz * 2.5);
        const n2 = Math.sin(vx * 5.0) * Math.cos(vz * 5.0) * 0.35;
        const crater = -Math.max(0, Math.sin(vx * 3.5 + vy * 3.5) - 0.5) * 0.4;
        const total = 1.0 + n1 * 0.28 + n2 * 0.15 + crater;
        
        pos.setXYZ(i, vx * total, vy * total, vz * total);
      }
      geo.computeVertexNormals();
      geos.push(geo);
    }

    const silicateMat = new THREE.MeshStandardMaterial({
      map: rockTex,
      roughness: 0.85,
      metalness: 0.2,
      color: 0x8a7f7d
    });

    const metallicMat = new THREE.MeshStandardMaterial({
      map: rockTex,
      roughness: 0.38,
      metalness: 0.85,
      color: 0xaa9995
    });

    const crystalVeinMat = new THREE.MeshStandardMaterial({
      map: rockTex,
      roughness: 0.7,
      metalness: 0.3,
      emissive: 0xff3300,
      emissiveIntensity: 0.8,
      color: 0x775555
    });

    const asteroidMats = [silicateMat, metallicMat, crystalVeinMat];

    const count = 48;
    for (let i = 0; i < count; i++) {
      const geo = geos[i % geos.length];
      const mat = asteroidMats[i % asteroidMats.length];
      const rock = new THREE.Mesh(geo, mat);

      const distance = 85 + Math.random() * 700;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 320 + 100;
      const scale = 3.0 + Math.random() * 22.0;

      rock.scale.set(
        scale,
        scale * (0.75 + Math.random() * 0.5),
        scale * (0.75 + Math.random() * 0.5)
      );

      rock.position.set(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance + 200
      );

      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.userData.rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25
      );
      rock.userData.radius = scale * 1.15;

      this.spaceGroup.add(rock);
      this.asteroids.push(rock);
    }

    // Megalith Hollow Cavern Asteroid (85m behemoth with fly-through tunnel)
    const cavernGroup = new THREE.Group();
    cavernGroup.position.set(-220, 130, -180);
    cavernGroup.userData.rotSpeed = new THREE.Vector3(0.015, 0.02, 0.008);
    cavernGroup.userData.radius = 65.0;

    const megalithBody = new THREE.Mesh(
      new THREE.TorusGeometry(55, 22, 16, 32),
      silicateMat
    );
    megalithBody.rotation.x = Math.PI / 4;
    cavernGroup.add(megalithBody);

    // Glowing interior crystals inside cavern
    const crystalGeo = new THREE.ConeGeometry(3.5, 14.0, 6);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.9
    });
    for (let c = 0; c < 8; c++) {
      const ang = (c / 8) * Math.PI * 2;
      const sp = new THREE.Mesh(crystalGeo, crystalMat);
      sp.position.set(Math.cos(ang) * 45, (Math.random() - 0.5) * 15, Math.sin(ang) * 45);
      sp.rotation.set(Math.random(), Math.random(), Math.random());
      cavernGroup.add(sp);
    }

    this.spaceGroup.add(cavernGroup);
    this.asteroids.push(cavernGroup);
  }

  setupCapitalMothershipExterior() {
    const shipExt = new THREE.Group();
    shipExt.position.set(0, 100, 250);

    const hullTex = createCapitalHullTexture();
    const hullMat = new THREE.MeshStandardMaterial({
      map: hullTex,
      metalness: 0.85,
      roughness: 0.35,
      color: 0xcccccc
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2
    });
    const conduitMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 2.5
    });

    // Main Armored Hull Spine (150m length, 45m width, 24m height)
    const spineGeo = new THREE.BoxGeometry(45, 24, 150);
    const spine = new THREE.Mesh(spineGeo, hullMat);
    shipExt.add(spine);

    // Command Tower Superstructure
    const bridgeGeo = new THREE.BoxGeometry(28, 14, 40);
    const bridge = new THREE.Mesh(bridgeGeo, frameMat);
    bridge.position.set(0, 18, -25);
    shipExt.add(bridge);

    // Glowing Bridge Viewport Strip
    const viewGeo = new THREE.BoxGeometry(26, 2.5, 3);
    const viewMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const viewStrip = new THREE.Mesh(viewGeo, viewMat);
    viewStrip.position.set(0, 21, -44);
    shipExt.add(viewStrip);

    // Forward Heavy Prow
    const prowGeo = new THREE.ConeGeometry(24, 45, 4);
    prowGeo.rotateX(-Math.PI / 2);
    prowGeo.rotateY(Math.PI / 4);
    const prow = new THREE.Mesh(prowGeo, hullMat);
    prow.position.set(0, 0, -95);
    shipExt.add(prow);

    // Heavy Plasma Thruster Manifolds (Aft Z = 75)
    for (let t = -1; t <= 1; t += 2) {
      const engineGeo = new THREE.CylinderGeometry(7.0, 8.5, 25, 16);
      engineGeo.rotateX(Math.PI / 2);
      const engine = new THREE.Mesh(engineGeo, frameMat);
      engine.position.set(t * 18, 0, 80);
      shipExt.add(engine);

      const exhGeo = new THREE.CircleGeometry(6.5, 16);
      const exhMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, side: THREE.DoubleSide });
      const exh = new THREE.Mesh(exhGeo, exhMat);
      exh.position.set(t * 18, 0, 93);
      shipExt.add(exh);
    }

    // Glowing Plasma Conduits running along the hull
    const conduitGeo = new THREE.BoxGeometry(1.2, 0.8, 130);
    const cL = new THREE.Mesh(conduitGeo, conduitMat);
    cL.position.set(-23.0, 5.0, 0);
    shipExt.add(cL);

    const cR = new THREE.Mesh(conduitGeo, conduitMat);
    cR.position.set(23.0, 5.0, 0);
    shipExt.add(cR);

    // --- EXTERIOR AIRLOCK GANTRY PLATFORM ---
    // Located at Port Hull (X = -18.2, Y = 1.8, Z = 0 relative to ship origin, meaning world (-18.2, 101.8, 250))
    const gantry = new THREE.Group();
    gantry.position.set(-18.2, 1.8, 0);

    // Magnetic Walkway Platform
    const walkGeo = new THREE.BoxGeometry(10, 0.4, 20);
    const walkMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.9
    });
    const walkway = new THREE.Mesh(walkGeo, walkMat);
    gantry.add(walkway);

    // Safety Railings with hazard yellow chevrons
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      roughness: 0.3
    });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 20), railMat);
    railL.position.set(-4.8, 0.8, 0);
    gantry.add(railL);

    // Exterior Airlock Hatch Doorway (leading into ship)
    const hatchFrame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.0, 4.0), frameMat);
    hatchFrame.position.set(4.5, 2.0, 0);
    gantry.add(hatchFrame);

    const hatchDoor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.4, 3.4), conduitMat);
    hatchDoor.position.set(4.3, 2.0, 0);
    gantry.add(hatchDoor);

    // Tether Anchor Winch Post & Strobe Beacon
    const postGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.8, 8);
    const post = new THREE.Mesh(postGeo, railMat);
    post.position.set(-3.5, 1.0, 6.0);
    gantry.add(post);

    const beaconGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(-3.5, 2.0, 6.0);
    gantry.add(beacon);

    const beaconLight = new THREE.PointLight(0x00ff88, 3.0, 15);
    beaconLight.position.set(-3.5, 2.0, 6.0);
    gantry.add(beaconLight);

    shipExt.add(gantry);

    this.spaceGroup.add(shipExt);
    this.capitalMothership = shipExt;
    this.exteriorAirlockAnchor = new THREE.Vector3(-18.2, 101.8, 250);
  }

  loadModelWithProgress(url, label, onLoad, onError) {
    if (!this.gltfLoader) {
      this.gltfLoader = new GLTFLoader();
    }
    this.gltfLoader.load(
      url,
      (gltf) => {
        if (typeof window !== 'undefined' && window.updateRenderProgress) {
          window.updateRenderProgress(`RENDERED: ${label}`, 100, true);
        }
        if (onLoad) onLoad(gltf);
      },
      (xhr) => {
        if (typeof window !== 'undefined' && window.updateRenderProgress) {
          if (xhr.lengthComputable && xhr.total > 0) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            const loadedMb = (xhr.loaded / (1024 * 1024)).toFixed(1);
            const totalMb = (xhr.total / (1024 * 1024)).toFixed(1);
            window.updateRenderProgress(`STREAMING: ${label} [${loadedMb}/${totalMb}MB]`, pct, pct >= 100);
          } else if (xhr && xhr.loaded > 0) {
            const loadedMb = (xhr.loaded / (1024 * 1024)).toFixed(1);
            window.updateRenderProgress(`STREAMING: ${label} [${loadedMb}MB]`, 65);
          }
        }
      },
      (err) => {
        console.warn(`[Environment] Error loading ${label} (${url}):`, err);
        if (onError) onError(err);
      }
    );
  }

  setupInteriorAirlock() {
    const airlockGroup = new THREE.Group();
    airlockGroup.position.set(-18.2, 0.0, 50.0);

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.35
    });
    const hazardMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.4
    });

    // Bulkhead Portal Frame
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.8, 0.6), frameMat);
    frameL.position.set(0, 1.9, -1.8);
    airlockGroup.add(frameL);

    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.8, 0.6), frameMat);
    frameR.position.set(0, 1.9, 1.8);
    airlockGroup.add(frameR);

    const header = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 4.2), frameMat);
    header.position.set(0, 3.7, 0);
    airlockGroup.add(header);

    // Hazard Stripes threshold
    const thresh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 3.6), hazardMat);
    thresh.position.set(0, 0.02, 0);
    airlockGroup.add(thresh);

    // Illuminated EVA Airlock Digital Status Display
    const statusGeo = new THREE.PlaneGeometry(2.4, 0.5);
    const statusCanvas = document.createElement('canvas');
    statusCanvas.width = 512;
    statusCanvas.height = 128;
    const sctx = statusCanvas.getContext('2d');
    sctx.fillStyle = '#0f172a';
    sctx.fillRect(0, 0, 512, 128);
    sctx.fillStyle = '#00f0ff';
    sctx.font = 'bold 24px monospace';
    sctx.fillText('EVA AIRLOCK // SYSTEM READY', 24, 45);
    sctx.fillStyle = '#4ade80';
    sctx.font = '18px monospace';
    sctx.fillText('PRESS [E] TO CYCLE & DEPRESSURIZE', 24, 85);
    const statusTex = new THREE.CanvasTexture(statusCanvas);
    const statusMat = new THREE.MeshBasicMaterial({ map: statusTex, side: THREE.DoubleSide });
    const statusDisplay = new THREE.Mesh(statusGeo, statusMat);
    statusDisplay.position.set(0.3, 3.1, 0);
    statusDisplay.rotation.y = Math.PI / 2;
    airlockGroup.add(statusDisplay);

    // Rotating Amber Beacon Light
    const amberBeacon = new THREE.PointLight(0xf59e0b, 3.5, 12);
    amberBeacon.position.set(0, 3.4, 0);
    airlockGroup.add(amberBeacon);
    this.airlockBeacon = amberBeacon;

    // Outer Viewport looking into glowing space
    const viewPort = new THREE.Mesh(
      new THREE.CircleGeometry(1.0, 16),
      new THREE.MeshBasicMaterial({ color: 0xff3311, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
    );
    viewPort.position.set(-0.8, 2.0, 0);
    viewPort.rotation.y = Math.PI / 2;
    airlockGroup.add(viewPort);

    this.zoneGrandHall.add(airlockGroup);
    this.airlockChamber = airlockGroup;
  }

  enhanceLowerDeckMaterials(lowerDeck) {
    const cryoPodTex = createCryoPodTexture();
    const consoleTex = createConsoleUITexture();
    const hullTex = createCapitalHullTexture();

    const podShellMat = new THREE.MeshStandardMaterial({
      map: cryoPodTex,
      metalness: 0.85,
      roughness: 0.28,
      color: 0xcccccc
    });

    const stasisFluidMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00a3cc,
      emissiveIntensity: 1.6,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.8
    });

    const consoleDisplayMat = new THREE.MeshBasicMaterial({
      map: consoleTex
    });

    const vitalsAliveMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88
    });

    const vitalsDeadMat = new THREE.MeshBasicMaterial({
      color: 0xff3344
    });

    const metalDeckMat = new THREE.MeshStandardMaterial({
      map: hullTex,
      metalness: 0.7,
      roughness: 0.4,
      color: 0x8899aa
    });

    lowerDeck.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;

      const matNames = Array.isArray(child.material) 
        ? child.material.map(m => m.name) 
        : [child.material ? child.material.name : ''];

      const isPod = matNames.some(n => n.includes('CryoPod')) || child.name.includes('CryoPod');
      const isScreen = matNames.some(n => n.includes('Console') || n.includes('Emergency') || n.includes('Codes') || n.includes('Icon') || n.includes('Keyboard'));
      const isDead = matNames.some(n => n.includes('Dead'));
      const isAlive = matNames.some(n => n.includes('LifeSigns') || n.includes('Empty'));
      const isMetal = matNames.some(n => n.startsWith('Misc') || n.startsWith('Furniture') || n.startsWith('Wall') || n.startsWith('Floor') || n.startsWith('Draw') || n.startsWith('Locker'));

      if (isPod) {
        if (child.name.toLowerCase().includes('glass') || child.name.toLowerCase().includes('liquid') || child.name.toLowerCase().includes('fluid')) {
          child.material = stasisFluidMat;
        } else {
          child.material = podShellMat;
        }
      } else if (isScreen) {
        child.material = consoleDisplayMat;
      } else if (isDead) {
        child.material = vitalsDeadMat;
      } else if (isAlive) {
        child.material = vitalsAliveMat;
      } else if (isMetal) {
        child.material = metalDeckMat;
      } else if (child.material) {
        child.material.roughness = 0.35;
        child.material.metalness = 0.75;
      }
    });
    console.log("Lower Cryo & Engineering Deck textures and PBR materials fully upgraded!");
  }

  async initInterior() {
    const gltfLoader = new GLTFLoader();

    // Functional Doors State
    this.doors = {
      blastDoor: {
        leftMesh: null,
        rightMesh: null,
        baseLeftX: -205.067,
        baseRightX: 181.290,
        closedOffset: 195.0, // Calibrated offset to meet at X = 0 (sealed shut)
        openOffset: -120.0,  // Retracts fully into wall pockets (6.3m clear opening)
        currentOpen: 0.0,    // 0 = closed, 1 = open
        targetOpen: 0.0,
        isOpen: false
      }
    };

    // Functional Lower Deck (Cryo Chamber & Compartments) Sliding Doors
    this.lowerDeckDoors = [
      {
        id: 'port_compartment',
        name: 'Port Compartment Door',
        center: new THREE.Vector3(4.04, -5.25, 45.0),
        panel1: null,
        panel2: null,
        panel1Name: 'Misc01.001',
        panel2Name: 'Misc01.002',
        basePos1: -4.27,
        basePos2: -3.78,
        axis: 'z',
        dir1: -1,
        dir2: 1,
        slideDist: 0.88,
        currentOpen: 0.0,
        targetOpen: 0.0,
        isOpen: false,
        statusLight: null
      },
      {
        id: 'starboard_compartment',
        name: 'Starboard Compartment Door',
        center: new THREE.Vector3(7.96, -5.25, 45.0),
        panel1: null,
        panel2: null,
        panel1Name: 'Misc01.003',
        panel2Name: 'Misc01.004',
        basePos1: -4.27,
        basePos2: -3.78,
        axis: 'z',
        dir1: -1,
        dir2: 1,
        slideDist: 0.88,
        currentOpen: 0.0,
        targetOpen: 0.0,
        isOpen: false,
        statusLight: null
      },
      {
        id: 'cryo_bulkhead',
        name: 'Cryo Chamber Bulkhead Door',
        center: new THREE.Vector3(6.0, -5.25, 39.5),
        panel1: null,
        panel2: null,
        panel1Name: 'Misc01.005',
        panel2Name: 'Misc01.006',
        basePos1: 0.217,
        basePos2: -0.273,
        axis: 'x',
        dir1: 1,
        dir2: -1,
        slideDist: 0.88,
        currentOpen: 0.0,
        targetOpen: 0.0,
        isOpen: false,
        statusLight: null
      }
    ];

    // =========================================================================
    // FRAME 1 IMMEDIATE FOUNDATIONS & INTERACTIVE STRUCTURES
    // All portals, consoles, ladders, armory pedestals, and lighting exist immediately!
    // =========================================================================

    // Solid procedural floor plates so player NEVER falls into void while streaming
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.75 });
    
    // Cockpit Bridge Deck Floor Plate (Z: -17 to -27)
    const cockpitFloor = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.4, 12.0), deckMat);
    cockpitFloor.position.set(0, -0.2, -22.5);
    cockpitFloor.receiveShadow = false;
    this.zoneCockpit.add(cockpitFloor);

    // Lower Deck Engineering / Cryo Floor Plate (X: 6, Z: 49, Y: -6.28)
    const lowerFloor = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.4, 24.0), deckMat);
    lowerFloor.position.set(6.0, -6.48, 49.0);
    lowerFloor.receiveShadow = false;
    this.zoneLowerDeck.add(lowerFloor);

    // Upper Mezzanine Floor Plate (Y: 8.35, Z: 68)
    const upperFloor = new THREE.Mesh(new THREE.BoxGeometry(20.0, 0.4, 40.0), deckMat);
    upperFloor.position.set(0, 8.15, 68.0);
    upperFloor.receiveShadow = false;
    this.zoneUpperDeck.add(upperFloor);

    // Immediately generate fully illuminated procedural corridor on frame 1
    this.createProceduralCorridor();

    // Synchronously build all interactive decks and apparatus
    this.setupDoorwayPortal();
    this.createAftBulkhead();
    this.setupCockpitConsole();
    this.createInteriorLaddersAndGantries();
    this.createArmoryDeck();
    this.setupInteriorAirlock();
    this.setupInteriorLighting();

    // =========================================================================
    // PARALLEL ASYNCHRONOUS GLTF ASSET STREAMING
    // None of these models block each other. Lightweight models pop in immediately!
    // =========================================================================

    // 1. Corridor (10.6 MB)
    this.loadModelWithProgress('/assets/ship_corridor.glb', 'MAIN CORRIDOR', (gltfCorridor) => {
      const corridor = gltfCorridor.scene;
      corridor.position.set(0, -0.31, 0);
      corridor.scale.set(1.0, 1.0, 1.0);
      corridor.traverse((child) => {
        if (child.isMesh) {
          child.receiveShadow = false; child.frustumCulled = true;
          child.castShadow = false; child.frustumCulled = true;
          if (child.material) {
            child.material.roughness = 0.35;
            child.material.metalness = 0.75;
          }
        }
      });
      this.zoneCorridor.add(corridor);
      console.log("✔ Corridor model loaded!");
    }, undefined, (e) => {
      console.warn("Corridor asset error, building procedural corridor fallback:", e);
      this.createProceduralCorridor();
    });

    // 2. Grand Sci-Fi Room (1.7 MB - finishes in <300ms!)
    this.loadModelWithProgress('/assets/ship_interior_room.glb', 'GRAND HALL', (gltfRoom) => {
      const room = gltfRoom.scene;
      room.position.set(0, 4.25, 129.52);
      room.scale.set(1.0, 1.0, 1.0);
      room.traverse((child) => {
        if (child.name.includes('Space') || child.name.includes('Camera')) {
          child.visible = false;
        }
        if (child.name === 'Left_Door') {
          this.doors.blastDoor.leftMesh = child;
          this.doors.blastDoor.baseLeftX = child.position.x;
          child.position.x = child.position.x + this.doors.blastDoor.closedOffset;
        }
        if (child.name === 'Right_Door') {
          this.doors.blastDoor.rightMesh = child;
          this.doors.blastDoor.baseRightX = child.position.x;
          child.position.x = child.position.x - this.doors.blastDoor.closedOffset;
        }
        if (child.isMesh) {
          child.receiveShadow = false; child.frustumCulled = true;
          child.castShadow = false; child.frustumCulled = true;
          if (child.material) {
            child.material.roughness = 0.35;
            child.material.metalness = 0.65;
          }
        }
      });
      this.zoneGrandHall.add(room);
      console.log("✔ Grand Sci-Fi Room model loaded!");
    }, undefined, (e) => {
      console.warn("Could not load ship_interior_room.glb:", e);
    });

    // 3. Command Nexus Cockpit (23.8 MB - finishes in ~2s!)
    this.loadModelWithProgress('/assets/ship_cockpit.glb', 'COMMAND COCKPIT', (gltfCockpit) => {
      const cockpit = gltfCockpit.scene;
      cockpit.position.set(0, 1.138, -19.256);
      cockpit.rotation.set(0, 0, 0);
      cockpit.scale.set(1.85, 2.30, 1.85);
      this.cockpitScreenMats = [];
      cockpit.traverse((child) => {
        if (child.isMesh) {
          child.receiveShadow = false; child.frustumCulled = true;
          child.castShadow = false;
          const mat = child.material;
          if (mat) {
            mat.roughness = 0.45;
            mat.metalness = 0.82;
            mat.side = THREE.DoubleSide;
          }
        }
      });
      this.zoneCockpit.add(cockpit);
      console.log("✔ Starship Command Nexus Cockpit model loaded!");
    }, undefined, (e) => {
      console.warn("Could not load ship_cockpit.glb:", e);
    });

    // 4. Storage + Cargo Bay Mezzanine (119.7 MB - streams in background)
    this.loadModelWithProgress('/assets/ship_storage_corridor.glb', 'STORAGE DECK', (gltfStorage) => {
      const storageBay = gltfStorage.scene;
      storageBay.position.set(0, 8.35, 68.0);
      storageBay.scale.set(0.26, 0.26, 0.26);
      storageBay.traverse((child) => {
        if (child.isMesh) {
          child.receiveShadow = false;
          child.castShadow = false;
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (!mat) return;
            if (mat.emissive && (mat.emissive.r > 0.05 || mat.emissive.g > 0.05 || mat.emissive.b > 0.05)) {
              mat.emissiveIntensity = 2.5;
            } else {
              mat.roughness = Math.min(mat.roughness !== undefined ? mat.roughness : 0.5, 0.6);
              mat.metalness = Math.max(mat.metalness !== undefined ? mat.metalness : 0.3, 0.5);
            }
          });
        }
      });
      this.zoneUpperDeck.add(storageBay);

      if (gltfStorage.animations && gltfStorage.animations.length > 0) {
        this.storageMixer = new THREE.AnimationMixer(storageBay);
        this.storageDoorActions = [];
        gltfStorage.animations.forEach((clip) => {
          if (clip.name.includes('Side_') || clip.name.includes('Center') || clip.name.includes('Bot') || clip.name.includes('Top') || clip.name.includes('Symmetry')) {
            const action = this.storageMixer.clipAction(clip);
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            this.storageDoorActions.push(action);
          }
        });
      }
      console.log("✔ Starship Storage Bay model loaded and integrated!");
    }, undefined, (e) => {
      console.warn("Could not load ship_storage_corridor.glb:", e);
    });

    // 5. Lower Deck Cryo & Engineering Bay (99.4 MB - streams in background)
    this.loadModelWithProgress('/assets/ship_lower_deck.glb', 'ENGINEERING DECK', (gltfLower) => {
      const lowerDeck = gltfLower.scene;
      lowerDeck.position.set(6.0, -6.35, 49.0);
      lowerDeck.scale.set(1.0, 1.05, 1.0);

      lowerDeck.traverse((child) => {
        this.lowerDeckDoors.forEach((door) => {
          if (child.name === door.panel1Name) {
            door.panel1 = child;
            door.basePos1 = (door.axis === 'z') ? child.position.z : child.position.x;
          }
          if (child.name === door.panel2Name) {
            door.panel2 = child;
            door.basePos2 = (door.axis === 'z') ? child.position.z : child.position.x;
          }
        });
      });

      this.enhanceLowerDeckMaterials(lowerDeck);

      this.lowerDeckDoors.forEach((door) => {
        const indMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
        const indGeom = (door.axis === 'z') 
          ? new THREE.BoxGeometry(0.08, 0.08, 0.7) 
          : new THREE.BoxGeometry(0.7, 0.08, 0.08);
        const statusMesh = new THREE.Mesh(indGeom, indMat);
        statusMesh.position.set(door.center.x, -4.18, door.center.z);
        this.zoneLowerDeck.add(statusMesh);
        door.statusLight = statusMesh;

        const threshMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.65 });
        const threshGeom = (door.axis === 'z') 
          ? new THREE.BoxGeometry(0.35, 0.02, 1.2) 
          : new THREE.BoxGeometry(1.2, 0.02, 0.35);
        const threshMesh = new THREE.Mesh(threshGeom, threshMat);
        threshMesh.position.set(door.center.x, -6.27, door.center.z);
        this.zoneLowerDeck.add(threshMesh);
      });

      this.zoneLowerDeck.add(lowerDeck);
      this.lowerDeckScene = lowerDeck;

      if (gltfLower.animations && gltfLower.animations.length > 0) {
        this.cryoMixer = new THREE.AnimationMixer(lowerDeck);
        this.cryoDoorActions = [];
        gltfLower.animations.forEach((clip) => {
          if (clip.name.includes('ArmatureAction')) {
            const action = this.cryoMixer.clipAction(clip);
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            this.cryoDoorActions.push(action);
          }
        });
      }
      console.log("✔ Lower Deck Cryo & Engineering model loaded and integrated!");
    }, undefined, (e) => {
      console.warn("Could not load ship_lower_deck.glb:", e);
    });
  }

  setupDoorwayPortal() {
    // Door status light above the blast doors (Z = 17.6)
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xff3344 }); // Starts Red (Closed)

    const statusPill = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.3), lightMat);
    statusPill.position.set(0, 4.0, 17.6);
    this.zoneCorridor.add(statusPill);
    this.doorStatusLight = statusPill;

    // Point light on doorway
    const doorLight = new THREE.PointLight(0xff3344, 2.5, 9);
    doorLight.position.set(0, 3.8, 17.6);
    this.zoneCorridor.add(doorLight);
    this.doorPointLight = doorLight;

    // Glowing threshold floor transition strip
    const thresholdMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.0 });
    const thresholdStrip = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.05, 0.5), thresholdMat);
    thresholdStrip.position.set(0, 0.02, 17.6);
    this.zoneCorridor.add(thresholdStrip);
  }

  createProceduralCorridor() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x141a24, roughness: 0.3, metalness: 0.8 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0d1219, roughness: 0.2, metalness: 0.9 });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.4, 35), floorMat);
    floor.position.set(0, -0.2, 0);
    floor.receiveShadow = false;
    this.zoneCorridor.add(floor);

    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.4, 35), wallMat);
    ceiling.position.set(0, 3.9, 0);
    this.zoneCorridor.add(ceiling);

    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.0, 35), wallMat);
    wallL.position.set(-3.15, 1.95, 0);
    this.zoneCorridor.add(wallL);

    const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.0, 35), wallMat);
    wallR.position.set(3.15, 1.95, 0);
    this.zoneCorridor.add(wallR);
  }

  createAftBulkhead() {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4, metalness: 0.8 });
    const bridgeGlowMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 0.8 });

    // Open Doorway Portal Frame leading to Cockpit Bridge Deck (Z = -17.5)
    // Left jamb
    const jambL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.0, 0.4), frameMat);
    jambL.position.set(-2.5, 2.0, -17.5);
    this.zoneCorridor.add(jambL);

    // Right jamb
    const jambR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.0, 0.4), frameMat);
    jambR.position.set(2.5, 2.0, -17.5);
    this.zoneCorridor.add(jambR);

    // Header lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.8, 0.4), frameMat);
    lintel.position.set(0, 3.6, -17.5);
    this.zoneCorridor.add(lintel);

    // Illuminated Command Bridge Header indicator
    const bridgeStrip = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 0.45), bridgeGlowMat);
    bridgeStrip.position.set(0, 3.25, -17.5);
    this.zoneCorridor.add(bridgeStrip);

    // Glowing cyan threshold floor transition strip to Cockpit Bridge
    const thresholdMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 1.0 });
    const threshold = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.04, 0.5), thresholdMat);
    threshold.position.set(0, 0.02, -17.5);
    this.zoneCorridor.add(threshold);
  }

  setupCockpitConsole() {
    const consoleGroup = new THREE.Group();
    // Positioned in the enlarged Cockpit Flight Deck (Z in [-21, -27])
    consoleGroup.position.set(0, 0, 0);

    // Initial standby boot texture for cockpit screens
    const standbyCanvas = document.createElement('canvas');
    standbyCanvas.width = 1024;
    standbyCanvas.height = 576;
    const sCtx = standbyCanvas.getContext('2d');
    sCtx.fillStyle = '#050c18';
    sCtx.fillRect(0, 0, 1024, 576);
    sCtx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    sCtx.lineWidth = 1.5;
    for (let y = 0; y < 576; y += 32) {
      sCtx.beginPath();
      sCtx.moveTo(0, y);
      sCtx.lineTo(1024, y);
      sCtx.stroke();
    }
    for (let x = 0; x < 1024; x += 48) {
      sCtx.beginPath();
      sCtx.moveTo(x, 0);
      sCtx.lineTo(x, 576);
      sCtx.stroke();
    }
    sCtx.strokeStyle = '#00f0ff';
    sCtx.lineWidth = 2.5;
    sCtx.strokeRect(32, 32, 960, 512);
    sCtx.fillStyle = '#38bdf8';
    sCtx.font = 'bold 34px monospace';
    sCtx.fillText('FORWARD PROW SENSOR FEED // STANDBY', 80, 100);
    sCtx.fillStyle = '#4ade80';
    sCtx.font = '22px monospace';
    sCtx.fillText('PILOT SEAT: READY // PRESS [E] TO ENGAGE HELM', 80, 150);
    sCtx.fillText('PRIMARY SENSORS: 100% // PITCH / YAW / ROLL STABILIZED', 80, 185);

    const standbyTex = new THREE.CanvasTexture(standbyCanvas);
    this.cockpitFeedMat = new THREE.MeshBasicMaterial({
      map: standbyTex,
      side: THREE.DoubleSide
    });

    // 1. Center Panoramic Primary Flight Viewscreen (Facing South towards pilot seat)
    const centerScreenGeo = new THREE.PlaneGeometry(1.8, 0.92);
    const centerScreen = new THREE.Mesh(centerScreenGeo, this.cockpitFeedMat);
    centerScreen.position.set(0, 1.38, -20.95);
    centerScreen.rotation.set(0, 0, 0); // Faces South (+Z) towards the pilot seat at Z=-23.8
    consoleGroup.add(centerScreen);
    this.centerCockpitScreen = centerScreen;

    // Center screen high-tech border frame
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });
    const bezelGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const topBezel = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 0.12), bezelMat);
    topBezel.position.set(0, 1.86, -20.95); topBezel.scale.set(0.35, 1, 1);
    consoleGroup.add(topBezel);
    const botBezel = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 0.12), bezelMat);
    botBezel.position.set(0, 0.90, -20.95); botBezel.scale.set(0.35, 1, 1);
    consoleGroup.add(botBezel);

    // Illuminated status indicator strip on center screen
    const centerStatus = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.04, 0.14), bezelGlowMat);
    centerStatus.position.set(0, 1.88, -20.94); centerStatus.scale.set(0.5, 1, 1);
    consoleGroup.add(centerStatus);

    // 2. Port Wing Auxiliary Tactical Display Screen (Angled towards pilot)
    const portScreenGeo = new THREE.PlaneGeometry(2.5, 2.1);
    const portScreen = new THREE.Mesh(portScreenGeo, this.cockpitFeedMat);
    portScreen.position.set(-3.0, 1.95, -25.6);
    portScreen.rotation.set(0, 0.44, 0);
    // consoleGroup.add(portScreen);

    const portBezel = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.1, 0.1), bezelMat);
    portBezel.position.set(-3.0, 3.05, -25.6);
    portBezel.rotation.set(0, 0.44, 0);
    // consoleGroup.add(portBezel);

    // 3. Starboard Wing Auxiliary Navigation Display Screen (Angled towards pilot)
    const stbScreenGeo = new THREE.PlaneGeometry(2.5, 2.1);
    const stbScreen = new THREE.Mesh(stbScreenGeo, this.cockpitFeedMat);
    stbScreen.position.set(3.0, 1.95, -25.6);
    stbScreen.rotation.set(0, -0.44, 0);
    // consoleGroup.add(stbScreen);

    const stbBezel = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.1, 0.1), bezelMat);
    stbBezel.position.set(3.0, 3.05, -25.6);
    stbBezel.rotation.set(0, -0.44, 0);
    // consoleGroup.add(stbBezel);

    // 4. Heavy Forward Helm Control Dashboard / Consoles below the screens
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
    const dashBase = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.55, 1.4), dashMat);
    dashBase.position.set(0, 0.28, -25.5);
    // consoleGroup.add(dashBase);

    // Glowing keyboard & control buttons on the helm dashboard
    const keyMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    for (let i = -4; i <= 4; i++) {
      const btn = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.18), keyMat);
      btn.position.set(i * 0.48, 0.58, -25.3);
      consoleGroup.add(btn);
    }

    // 5. Ergonomic Pilot Flight Seat (Positioned at X = 0, Z = -23.8 facing -Z)
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1d, roughness: 0.45, metalness: 0.7 });
    const seatCushionMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.3 });
    const seatAccentMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.8 });

    const seatGroup = new THREE.Group();
    seatGroup.position.set(0, 0, -25.6);

    // Base pedestal & hydraulic suspension
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 0.4, 16), seatMat);
    pedestal.position.y = 0.2;
    seatGroup.add(pedestal);

    // Seat bottom cushion
    const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.72), seatCushionMat);
    seatBase.position.set(0, 0.45, 0);
    seatGroup.add(seatBase);

    // Seat backrest (slanted slightly back)
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.85, 0.14), seatCushionMat);
    backrest.position.set(0, 0.95, 0.32);
    backrest.rotation.x = 0.08;
    seatGroup.add(backrest);

    // Headrest
    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.14), seatCushionMat);
    headrest.position.set(0, 1.45, 0.36);
    seatGroup.add(headrest);

    // Armrests with dual flight joysticks
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.48), seatMat);
    armL.position.set(-0.42, 0.68, 0.05);
    seatGroup.add(armL);

    const stickL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.22, 8), seatAccentMat);
    stickL.position.set(-0.42, 0.82, -0.12);
    stickL.rotation.x = -0.2;
    seatGroup.add(stickL);

    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.48), seatMat);
    armR.position.set(0.42, 0.68, 0.05);
    seatGroup.add(armR);

    const stickR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.22, 8), seatAccentMat);
    stickR.position.set(0.42, 0.82, -0.12);
    stickR.rotation.x = -0.2;
    seatGroup.add(stickR);

    // Lumbar accent piping
    const piping = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.04, 0.04), seatAccentMat);
    piping.position.set(0, 0.75, 0.26);
    seatGroup.add(piping);

    // consoleGroup.add(seatGroup);
    this.pilotSeatGroup = seatGroup;
    this.pilotSeatWorldPos = new THREE.Vector3(0, 0.52, -19.50);
    this.pilotEyeWorldPos = new THREE.Vector3(0, 1.28, -19.50);

    // Pulsing interaction ring on ground around the pilot seat
    const ringGeo = new THREE.RingGeometry(0.9, 1.25, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const interactRing = new THREE.Mesh(ringGeo, ringMat);
    interactRing.position.set(0, 0.09, -19.50); interactRing.scale.set(0.55, 0.55, 0.55);
    consoleGroup.add(interactRing);

    this.interactiveConsoles.push(interactRing);
    this.zoneCockpit.add(consoleGroup);
  }

  setCockpitScreenTexture(tex) {
    if (!tex) return;
    if (this.cockpitFeedMat && this.cockpitFeedMat.map !== tex) {
      this.cockpitFeedMat.map = tex;
      this.cockpitFeedMat.needsUpdate = true;
    }
    if (this.cockpitScreenMats) {
      this.cockpitScreenMats.forEach((m) => {
        if (m.map !== tex) {
          m.map = tex;
          m.needsUpdate = true;
        }
      });
    }
  }

  setupInteriorLighting() {
    this.interiorLightingGroup.clear();

    // High-Vibrancy Ambient and Hemisphere fill for crystal clear room illumination
    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 5.5);
    this.interiorLightingGroup.add(hemi);

    const amb = new THREE.AmbientLight(0xffffff, 4.5);
    this.interiorLightingGroup.add(amb);

    // 1. Cockpit Bridge Illumination (Z = -26 to -16, Y = 0 to 2.5)
    const cockpitFill = new THREE.PointLight(0x38bdf8, 8.5, 30);
    cockpitFill.position.set(0, 2.10, -19.30);
    this.interiorLightingGroup.add(cockpitFill);

    const cockpitHelmLight = new THREE.PointLight(0x00f0ff, 7.0, 22);
    cockpitHelmLight.position.set(0, 1.80, -21.50);
    this.interiorLightingGroup.add(cockpitHelmLight);

    const cockpitAftLight = new THREE.PointLight(0xe0f2fe, 6.5, 20);
    cockpitAftLight.position.set(0, 2.10, -16.80);
    this.interiorLightingGroup.add(cockpitAftLight);

    // 2. Central Corridor Overhead Lights Array (Z = -14 to +17)
    const corridorLights = [
      { z: -12.0, color: 0xf8fafc, y: 2.3, dist: 20, intensity: 7.0 },
      { z: -5.0,  color: 0x38bdf8, y: 2.3, dist: 20, intensity: 7.0 },
      { z: 2.0,   color: 0xf8fafc, y: 2.3, dist: 20, intensity: 7.0 },
      { z: 10.0,  color: 0x38bdf8, y: 2.3, dist: 20, intensity: 7.0 },
      { z: 17.0,  color: 0x00f0ff, y: 2.5, dist: 22, intensity: 7.5 } // Threshold to Grand Hall
    ];
    corridorLights.forEach(lp => {
      const pl = new THREE.PointLight(lp.color, lp.intensity, lp.dist);
      pl.position.set(0, lp.y, lp.z);
      this.interiorLightingGroup.add(pl);
      this.pulsingLights.push(pl);
    });

    // 3. Grand Hall & Armory Floodlights (Z = 18 to 120)
    const hallLights = [
      { z: 25.0,  color: 0xe0f2fe, y: 4.8, dist: 35, intensity: 8.0 },
      { z: 42.0,  color: 0x00e5ff, y: 5.5, dist: 40, intensity: 8.5 }, // Forward junction & weapon pedestals
      { z: 60.0,  color: 0x38bdf8, y: 5.2, dist: 40, intensity: 8.0 }, // Mid-hall
      { z: 80.0,  color: 0xe0f2fe, y: 5.5, dist: 40, intensity: 8.0 },
      { z: 100.0, color: 0x00f0ff, y: 6.2, dist: 45, intensity: 8.5 }, // Aft Observation Dome
      { z: 120.0, color: 0x38bdf8, y: 6.5, dist: 40, intensity: 8.0 }
    ];
    hallLights.forEach(lp => {
      const pl = new THREE.PointLight(lp.color, lp.intensity, lp.dist);
      pl.position.set(0, lp.y, lp.z);
      this.interiorLightingGroup.add(pl);
      this.pulsingLights.push(pl);
    });

    // 4. Upper Mezzanine Storage & Cargo Bay (Y = 8.5m, Z in [40, 85])
    const upperLights = [
      { z: 45.0, color: 0xf8fafc, y: 12.5, dist: 45, intensity: 9.0 },
      { z: 65.0, color: 0x00f0ff, y: 12.5, dist: 50, intensity: 9.5 },
      { z: 80.0, color: 0x38bdf8, y: 12.5, dist: 45, intensity: 9.0 }
    ];
    upperLights.forEach(lp => {
      const pl = new THREE.PointLight(lp.color, lp.intensity, lp.dist);
      pl.position.set(0, lp.y, lp.z);
      this.interiorLightingGroup.add(pl);
    });

    // 5. Lower Reactor & Engine Deck (Y = -6.0m, Z in [55, 95])
    const lowerLights = [
      { z: 60.0, color: 0x06b6d4, y: -4.0, dist: 45, intensity: 9.0 },
      { z: 75.0, color: 0xf59e0b, y: -4.0, dist: 45, intensity: 9.5 }, // Amber Reactor Glow
      { z: 90.0, color: 0x00f0ff, y: -4.0, dist: 45, intensity: 9.0 }
    ];
    lowerLights.forEach(lp => {
      const pl = new THREE.PointLight(lp.color, lp.intensity, lp.dist);
      pl.position.set(0, lp.y, lp.z);
      this.interiorLightingGroup.add(pl);
    });
  }

  createInteriorLaddersAndGantries() {
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.85 });
    const ladderRailMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.9 });
    const rungMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.2, metalness: 0.95 });
    const cyanGlowMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.9 });
    const amberGlowMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.9 });
    const hazardMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });

    // 1. Upper Mezzanine Walkway & Gantry Platform (Enlarged under Storage Deck at Y = 8.4m, Z in [37, 87])
    const gantryFloor = new THREE.Mesh(new THREE.BoxGeometry(52.0, 0.25, 70.0), metalMat);
    gantryFloor.position.set(0, 8.4, 76.0);
    this.zoneUpperDeck.add(gantryFloor);

    // Gantry Safety Railings
    const railMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.4 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 70.0), railMat);
    railL.position.set(-26.0, 9.0, 76.0);
    this.zoneUpperDeck.add(railL);

    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 70.0), railMat);
    railR.position.set(26.0, 9.0, 76.0);
    this.zoneUpperDeck.add(railR);

    // Gantry Support Pillars anchoring to Main Deck
    [-9.0, 9.0].forEach((px) => {
      [46.0, 78.0].forEach((pz) => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.40, 8.4, 16), metalMat);
        pillar.position.set(px, 4.2, pz);
        this.zoneGrandHall.add(pillar);
      });
    });

    // 2. Upper Ladder: Main Deck (Y=0.08) -> Upper Storage Deck (Y=8.5) at X = -6.0, Z = 45.0
    const upperLadderGroup = new THREE.Group();
    upperLadderGroup.position.set(-6.0, 0, 45.0);

    // Side Rails
    const upperRailL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 8.6, 12), ladderRailMat);
    upperRailL.position.set(-0.45, 4.3, 0);
    upperLadderGroup.add(upperRailL);

    const upperRailR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 8.6, 12), ladderRailMat);
    upperRailR.position.set(0.45, 4.3, 0);
    upperLadderGroup.add(upperRailR);

    // Cyan Guide Neon Strips
    const upperNeon = new THREE.Mesh(new THREE.BoxGeometry(0.02, 8.6, 0.02), cyanGlowMat);
    upperNeon.position.set(-0.49, 4.3, 0);
    upperLadderGroup.add(upperNeon);

    // Rungs spaced every 0.35m
    const upperRungCount = 24;
    for (let i = 1; i <= upperRungCount; i++) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), rungMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, i * 0.35, 0);
      upperLadderGroup.add(rung);
    }

    // Upper Ladder Threshold Indicator Platform
    const upperPlatform = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.2), cyanGlowMat);
    upperPlatform.position.set(0, 8.45, -0.4);
    upperLadderGroup.add(upperPlatform);

    this.zoneGrandHall.add(upperLadderGroup);

    // 3. Lower Ladder: Main Deck (Y=0.08) -> Lower Cryo Deck (Y=-6.5) at X = 6.0, Z = 45.0
    const lowerLadderGroup = new THREE.Group();
    lowerLadderGroup.position.set(6.0, 0, 45.0);

    // Hatch Opening Rim on Main Deck Floor
    const hatchRim = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 1.8), hazardMat);
    hatchRim.position.set(0, 0.06, 0);
    lowerLadderGroup.add(hatchRim);

    // Side Rails extending down into sub-deck
    const lowerRailL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 6.7, 12), ladderRailMat);
    lowerRailL.position.set(-0.45, -3.25, 0);
    lowerLadderGroup.add(lowerRailL);

    const lowerRailR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 6.7, 12), ladderRailMat);
    lowerRailR.position.set(0.45, -3.25, 0);
    lowerLadderGroup.add(lowerRailR);

    // Amber Guide Neon Strips
    const lowerNeon = new THREE.Mesh(new THREE.BoxGeometry(0.02, 6.7, 0.02), amberGlowMat);
    lowerNeon.position.set(0.49, -3.25, 0);
    lowerLadderGroup.add(lowerNeon);

    // Rungs spaced every 0.35m down
    const lowerRungCount = 19;
    for (let i = 1; i <= lowerRungCount; i++) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), rungMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, -i * 0.35, 0);
      lowerLadderGroup.add(rung);
    }

    // Lower Sub-Deck Landing Platform flush with Cryo Deck floor at Y = -6.28m
    const lowerPlatform = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 2.2), amberGlowMat);
    lowerPlatform.position.set(0, -6.32, 0.5);
    lowerLadderGroup.add(lowerPlatform);

    this.zoneGrandHall.add(lowerLadderGroup);

    // 4. Built-in Cryo Chamber Ladder Hatch & Shaft (connecting built-in ladder at X=2.0, Z=47.0 to Main Deck floor Y=0.08)
    const cryoShaftGroup = new THREE.Group();
    cryoShaftGroup.position.set(2.0, 0, 47.0);

    // Hazard Rim collar on Main Deck Floor
    const cryoRim = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.6), hazardMat);
    cryoRim.position.set(0, 0.06, 0);
    cryoShaftGroup.add(cryoRim);

    // Continuous side rails extending from cryo chamber ceiling (-3.2m) to main deck (+0.1m)
    const cryoRailL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.4, 12), ladderRailMat);
    cryoRailL.position.set(-0.35, -1.6, 0);
    cryoShaftGroup.add(cryoRailL);

    const cryoRailR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.4, 12), ladderRailMat);
    cryoRailR.position.set(0.35, -1.6, 0);
    cryoShaftGroup.add(cryoRailR);

    // Amber Guide Neon Strip
    const cryoNeon = new THREE.Mesh(new THREE.BoxGeometry(0.02, 3.4, 0.02), amberGlowMat);
    cryoNeon.position.set(0.39, -1.6, 0);
    cryoShaftGroup.add(cryoNeon);

    // Rungs bridging the shaft every 0.35m
    for (let i = 1; i <= 9; i++) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), rungMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, -i * 0.35, 0);
      cryoShaftGroup.add(rung);
    }

    this.zoneLowerDeck.add(cryoShaftGroup);
  }

  createHoloTexture(weapon) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Translucent dark tech backdrop
    ctx.fillStyle = 'rgba(10, 17, 32, 0.9)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(8, 8, 496, 240, 16);
    else ctx.rect(8, 8, 496, 240);
    ctx.fill();

    // Border
    const hexColor = '#' + weapon.color.toString(16).padStart(6, '0');
    ctx.strokeStyle = hexColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Header Accent Bars
    ctx.fillStyle = hexColor;
    ctx.fillRect(8, 8, 30, 8);
    ctx.fillRect(8, 8, 8, 30);
    ctx.fillRect(474, 8, 30, 8);
    ctx.fillRect(496, 8, 8, 30);
    ctx.fillRect(8, 232, 30, 8);
    ctx.fillRect(8, 210, 8, 30);
    ctx.fillRect(474, 232, 30, 8);
    ctx.fillRect(496, 210, 8, 30);

    // Type Badge
    ctx.fillStyle = hexColor;
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText(`[ ${weapon.type.toUpperCase()} ]`, 28, 46);

    // Weapon Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.fillText(weapon.name, 28, 86);

    // Tag
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 17px "Segoe UI", sans-serif';
    ctx.fillText(weapon.tag, 28, 120);

    // Stats
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px "Segoe UI", monospace';
    ctx.fillText(weapon.stats, 28, 160);

    // Prompt
    ctx.fillStyle = hexColor;
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.fillText('► PRESS [E] TO EQUIP ◄', 28, 208);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  createArmoryDeck() {
    console.log("Constructing Starship Armory Deck in Grand Hall...");
    const gltfLoader = new GLTFLoader();

    // 1. Overhead Holographic Entrance Archway at Z = 21.0
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, 21.0);

    const archMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.85 });
    const cyanNeonMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.2 });

    // Arch Pillars & Header Beam
    const archPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.0, 0.6), archMat);
    archPillarL.position.set(-6.8, 3.0, 0);
    archGroup.add(archPillarL);

    const archPillarR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.0, 0.6), archMat);
    archPillarR.position.set(6.8, 3.0, 0);
    archGroup.add(archPillarR);

    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(14.1, 0.6, 0.6), archMat);
    archBeam.position.set(0, 5.8, 0);
    archGroup.add(archBeam);

    const archNeon = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.08, 0.62), cyanNeonMat);
    archNeon.position.set(0, 5.48, 0);
    archGroup.add(archNeon);

    // Glowing Armory Header Canvas Plaque
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1024;
    bannerCanvas.height = 128;
    const bCtx = bannerCanvas.getContext('2d');
    bCtx.fillStyle = 'rgba(8, 14, 26, 0.9)';
    bCtx.fillRect(0, 0, 1024, 128);
    bCtx.strokeStyle = '#00f0ff';
    bCtx.lineWidth = 6;
    bCtx.strokeRect(4, 4, 1016, 120);
    bCtx.fillStyle = '#00f0ff';
    bCtx.font = '900 40px "Segoe UI", sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('★ STARSHIP ARMORY // TACTICAL WEAPONS BAY ★', 512, 56);
    bCtx.fillStyle = '#94a3b8';
    bCtx.font = 'bold 22px "Segoe UI", monospace';
    bCtx.fillText('PORT: SCI-FI ENERGY WEAPONS  ◄ ■ ►  STARBOARD: TACTICAL BALLISTICS & MELEE', 512, 98);

    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const bannerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8.0, 1.0),
      new THREE.MeshBasicMaterial({ map: bannerTex, transparent: true, side: THREE.DoubleSide })
    );
    bannerMesh.position.set(0, 4.8, 0.02);
    archGroup.add(bannerMesh);

    this.zoneGrandHall.add(archGroup);

    // 2. Weapon Pedestals Configurations
    const weapons = [
      {
        id: 'plasma_rifle',
        name: 'PR-90 Plasma Core Rifle',
        type: 'Sci-Fi Energy',
        tag: 'CYCLING PULSED PLASMA DISCHARGE',
        path: '/assets/guns/scifi/plasma_rifle.glb',
        pos: { x: -5.5, y: 0.08, z: 27.0 },
        color: 0x00ffcc,
        targetLength: 1.05,
        rotY: -Math.PI / 3,
        rotX: 0.05,
        rotZ: 0,
        stats: 'DMG: 45 | CORE: 100% | VEL: 120m/s | RECOIL: LOW',
        hasAnimation: true,
        desc: 'Advanced magnetized plasma rifle with rotating accelerator cylinder core.'
      },
      {
        id: 'railgun',
        name: 'X-7 Hyper-Kinetic Railgun',
        type: 'Sci-Fi Heavy',
        tag: 'HYPER-VELOCITY SOLID SLUG',
        path: '/assets/guns/scifi/railgun.glb',
        pos: { x: -5.5, y: 0.08, z: 34.0 },
        color: 0x38bdf8,
        targetLength: 1.15,
        rotY: -Math.PI / 3,
        rotX: 0.05,
        rotZ: 0,
        stats: 'DMG: 120 | BEAM: INSTANT SLUG | SHIELD PIERCING',
        hasAnimation: false,
        desc: 'Electromagnetic railgun firing superheated tungsten penetrators.'
      },
      {
        id: 'energy_pistol',
        name: 'Ion-9 Compact Energy Pistol',
        type: 'Sci-Fi Sidearm',
        tag: 'HIGH-FREQUENCY ION BURST',
        path: '/assets/guns/scifi/energy_pistol.glb',
        pos: { x: -5.5, y: 0.08, z: 41.0 },
        color: 0x00e5ff,
        targetLength: 0.45,
        rotY: -Math.PI / 3,
        rotX: 0.05,
        rotZ: 0,
        stats: 'DMG: 28 | CADENCE: 600 RPM | LIGHTWEIGHT REACTION',
        hasAnimation: false,
        desc: 'Precision officer sidearm with focused ionized particle bolt.'
      },
      {
        id: 'assault_rifle',
        name: 'M16A3 Tactical Assault Rifle',
        type: 'Ballistic Kinetic',
        tag: '5.56x45MM HIGH-VELOCITY TRACER',
        path: '/assets/guns/basic/assault_rifle.glb',
        pos: { x: 5.5, y: 0.08, z: 30.0 },
        color: 0xf59e0b,
        targetLength: 0.95,
        rotY: Math.PI / 3,
        rotX: 0.05,
        rotZ: 0,
        stats: 'DMG: 34 | MAG: 30 RDS | BURST TRACER SPREAD',
        hasAnimation: false,
        desc: 'Mil-spec selective-fire combat rifle firing high-velocity kinetic rounds.'
      },
      {
        id: 'combat_knife',
        name: 'CQC Carbon Combat Knife',
        type: 'Tactical Melee',
        tag: 'CARBON-TITANIUM SERRATED BLADE',
        path: '/assets/guns/basic/combat_knife.glb',
        pos: { x: 5.5, y: 0.08, z: 38.0 },
        color: 0xef4444,
        targetLength: 0.38,
        rotY: Math.PI / 3,
        rotX: 0.1,
        rotZ: 0,
        stats: 'DMG: 70 | SILENT KILL | HIGH-FREQUENCY SLASH',
        hasAnimation: true,
        desc: 'Extreme-durability tactical combat knife with custom slash combat animation.'
      }
    ];

    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25, metalness: 0.9 });

    weapons.forEach((w) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(w.pos.x, w.pos.y, w.pos.z);

      const colorMat = new THREE.MeshStandardMaterial({
        color: w.color,
        emissive: w.color,
        emissiveIntensity: 0.8
      });

      // 1. Octagonal / Cylindrical Riser Base
      const baseRiser = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.35, 8), pedestalMat);
      baseRiser.position.y = 0.175;
      pGroup.add(baseRiser);

      // Neon Top Rim
      const baseRim = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.04, 8, 32), colorMat);
      baseRim.rotation.x = Math.PI / 2;
      baseRim.position.y = 0.35;
      pGroup.add(baseRim);

      // Inner Core Glow Well
      const wellMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.02, 16), colorMat);
      wellMesh.position.y = 0.36;
      pGroup.add(wellMesh);

      // 2. Translucent Holographic Containment Cylinder Field
      const fieldMat = new THREE.MeshBasicMaterial({
        color: w.color,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide
      });
      const fieldCyl = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.8, 16, 1, true), fieldMat);
      fieldCyl.position.y = 1.25;
      pGroup.add(fieldCyl);

      // 3. Ground Interaction Pulse Ring on Deck
      const ringGeo = new THREE.RingGeometry(1.4, 1.65, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: w.color,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide
      });
      const floorRing = new THREE.Mesh(ringGeo, ringMat);
      floorRing.rotation.x = -Math.PI / 2;
      floorRing.position.y = 0.03;
      pGroup.add(floorRing);

      // 4. Overhead Weapon Display Spotlight
      const pedestalLight = new THREE.PointLight(w.color, 2.2, 5.0);
      pedestalLight.position.set(0, 2.5, 0);
      pGroup.add(pedestalLight);

      // 5. Floating Weapon Model Group (Animated bobbing & rotation)
      const floatGroup = new THREE.Group();
      floatGroup.position.y = 1.25;
      pGroup.add(floatGroup);

      // 6. Holographic Floating Stats Card
      const holoTex = this.createHoloTexture(w);
      const holoMat = new THREE.MeshBasicMaterial({
        map: holoTex,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide
      });
      const holoPlaque = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), holoMat);
      holoPlaque.position.set(0, 2.2, 0);
      holoPlaque.rotation.y = (w.pos.x < 0) ? Math.PI / 2 : -Math.PI / 2;
      pGroup.add(holoPlaque);

      // Add to armory registry
      const pedestalRecord = {
        id: w.id,
        name: w.name,
        type: w.type,
        tag: w.tag,
        stats: w.stats,
        color: w.color,
        position: new THREE.Vector3(w.pos.x, w.pos.y, w.pos.z),
        floatGroup: floatGroup,
        baseY: 1.25,
        pulseRing: floorRing,
        spotLight: spot,
        holoPlaque: holoPlaque,
        config: w
      };
      this.armoryPedestals.push(pedestalRecord);

      // Load Weapon Model into floatGroup
      gltfLoader.load(
        w.path,
        (gltf) => {
          const model = gltf.scene;

          // For combat knife, hide arms mesh on pedestal display
          if (w.id === 'combat_knife') {
            model.traverse((child) => {
              if (child.isMesh && (child.name === 'Mesh.001' || (child.material && child.material.name === 'arms'))) {
                child.visible = false;
              }
            });
          }

          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = false;
              if (child.material) {
                child.material.metalness = 0.8;
                child.material.roughness = 0.3;
              }
            }
          });

          // Normalize size and center pivot
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = w.targetLength / (maxDim || 1);
          model.scale.set(scale, scale, scale);

          // Center bounding box
          const scaledBox = new THREE.Box3().setFromObject(model);
          const center = new THREE.Vector3();
          scaledBox.getCenter(center);
          model.position.sub(center);

          if (w.rotY) model.rotation.y = w.rotY;
          if (w.rotX) model.rotation.x = w.rotX;
          if (w.rotZ) model.rotation.z = w.rotZ;

          floatGroup.add(model);

          // If weapon has animation (e.g. Plasma Rifle cylinder cycle), create dedicated mixer on pedestal
          if (gltf.animations && gltf.animations.length > 0 && w.hasAnimation) {
            const mixer = new THREE.AnimationMixer(model);
            const clip = gltf.animations[0];
            const action = mixer.clipAction(clip);
            action.setLoop(THREE.LoopRepeat);
            action.play();
            this.armoryMixers.push(mixer);
            console.log(`Active display animation loop started for ${w.name}: ${clip.name}`);
          }
        },
        undefined,
        (err) => {
          console.warn(`Could not load armory weapon model for ${w.name}:`, err);
        }
      );

      this.zoneGrandHall.add(pGroup);
    });

    console.log(`Starship Armory initialized with ${weapons.length} interactive weapon display pedestals!`);
  }

  isLowerDoorOpen(id) {
    if (!this.lowerDeckDoors) return true;
    const d = this.lowerDeckDoors.find(door => door.id === id);
    return d ? d.isOpen : true;
  }

  toggleDoor(name = 'blastDoor') {
    const door = this.doors[name];
    if (door) {
      door.targetOpen = door.targetOpen > 0.5 ? 0.0 : 1.0;
    }
  }

  isDoorOpen(name = 'blastDoor') {
    return this.doors[name] ? this.doors[name].isOpen : true;
  }

  async initStarbase() {
    // 1. IMMEDIATELY add Starbase lighting so the station is NEVER in pitch blackness!
    const stationHemi = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 3.5);
    this.starbaseGroup.add(stationHemi);

    const stationAmb = new THREE.AmbientLight(0xffffff, 2.6);
    this.starbaseGroup.add(stationAmb);

    const stationSun = new THREE.DirectionalLight(0xe0f2fe, 2.8);
    stationSun.position.set(10, 18, 8);
    this.starbaseGroup.add(stationSun);

    // Concourse Floodlights (Bright, high-visibility illumination across the station)
    const concourseLights = [
      { z: -25, color: 0x00d4ff, y: 5.5, intensity: 5.5, dist: 50 },
      { z: 0,   color: 0x00f0ff, y: 5.8, intensity: 6.0, dist: 55 },
      { z: +22, color: 0x38bdf8, y: 5.5, intensity: 5.5, dist: 50 },
      { z: +34, color: 0x00ffaa, y: 5.5, intensity: 6.0, dist: 45 }
    ];
    concourseLights.forEach((lp) => {
      const pl = new THREE.PointLight(lp.color, lp.intensity, lp.dist);
      pl.position.set(0, lp.y, lp.z);
      this.starbaseGroup.add(pl);
    });

    // 2. IMMEDIATELY add Procedural Starbase Concourse Platform
    // (Guarantees visible floor, observation deck, and departure gate from frame 1!)
    const concourseGroup = new THREE.Group();
    const floorGeo = new THREE.BoxGeometry(40, 0.4, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.65
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.2, 4);
    concourseGroup.add(floorMesh);

    // Glowing concourse runway guide stripes
    const stripeGeo = new THREE.PlaneGeometry(0.35, 78);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const stripeL = new THREE.Mesh(stripeGeo, stripeMat);
    stripeL.rotation.x = -Math.PI / 2;
    stripeL.position.set(-6.5, 0.02, 4);
    const stripeR = new THREE.Mesh(stripeGeo, stripeMat);
    stripeR.rotation.x = -Math.PI / 2;
    stripeR.position.set(6.5, 0.02, 4);
    concourseGroup.add(stripeL, stripeR);

    // Station Perimeter Safety Rails & Glow Panels
    const railMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    [-19.5, 19.5].forEach(x => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 80), railMat);
      rail.position.set(x, 0.6, 4);
      const glowBar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 80), glowMat);
      glowBar.position.set(x, 1.22, 4);
      concourseGroup.add(rail, glowBar);
    });

    this.starbaseFallbackPlatform = concourseGroup;
    this.starbaseGroup.add(concourseGroup);

    // Departure Airlock Gate to Starship
    this.setupStarbaseDepartureGate();

    // 3. Asynchronously load high-detail Starbase model in background without blocking
    const gltfLoader = new GLTFLoader();
    console.log("Streaming Starbase station model in background...");
    this.loadModelWithProgress('/assets/starbase.glb', 'STARBASE STATION', (gltf) => {
      if (gltf && gltf.scene) {
        this.starbaseModel = gltf.scene;
        this.starbaseModel.position.set(0, 0.26, 0);
        this.starbaseModel.traverse((child) => {
          if (child.isMesh) {
            child.receiveShadow = false;
            child.castShadow = false;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
              if (!mat) return;
              if (mat.emissive && (mat.emissive.r > 0.05 || mat.emissive.g > 0.05 || mat.emissive.b > 0.05)) {
                mat.emissiveIntensity = 2.5;
              } else {
                mat.roughness = Math.min(mat.roughness !== undefined ? mat.roughness : 0.38, 0.5);
                mat.metalness = Math.max(mat.metalness !== undefined ? mat.metalness : 0.4, 0.6);
              }
            });
          }
        });
        this.starbaseGroup.add(this.starbaseModel);
        this.setupOrbitalStarbase(this.starbaseModel);
        console.log("Starbase station loaded and upgraded successfully!");
      }
    }, undefined, (e) => {
      console.warn("Could not load starbase.glb, using procedural station concourse:", e);
    });
  }

  setupStarbaseDepartureGate() {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, 32.0);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.8 });
    const arch = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.4, 0.6), frameMat);
    arch.position.y = 3.6;
    gateGroup.add(arch);

    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.6, 0.6), frameMat);
    postL.position.set(-3.5, 1.8, 0);
    gateGroup.add(postL);

    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.6, 0.6), frameMat);
    postR.position.set(3.5, 1.8, 0);
    gateGroup.add(postR);

    // Glowing departure energy field
    const fieldMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    const field = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 3.4), fieldMat);
    field.position.set(0, 1.8, 0);
    gateGroup.add(field);

    const gateLight = new THREE.PointLight(0x00ffaa, 3.5, 16);
    gateLight.position.set(0, 2.2, 0);
    gateGroup.add(gateLight);

    this.starbaseGroup.add(gateGroup);
  }

  setupOrbitalStarbase(sourceScene = null) {
    if (this.orbitalStarbase) return;

    const setupScene = (orbital) => {
      orbital.position.set(0, 100, -380);
      orbital.scale.set(1.4, 1.4, 1.4);
      orbital.traverse((c) => {
        if (c.isMesh) {
          c.receiveShadow = true;
          c.castShadow = true;
        }
      });
      this.spaceGroup.add(orbital);
      this.orbitalStarbase = orbital;
      this.dockingPosition = new THREE.Vector3(0, 100, -380);
      console.log("Orbital Starbase station ready in space flight sector!");
    };

    if (sourceScene) {
      setupScene(sourceScene.clone(true));
      return;
    }

    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/assets/starbase.glb', (gltf) => {
      if (gltf && gltf.scene) {
        setupScene(gltf.scene);
      }
    }, undefined, (e) => console.warn("Orbital Starbase load error:", e));
  }


  updateCulling(playerPos, deckLevel = 'main') {
    if (this.mode === 'starbase') {
      if (this.starbaseGroup.visible !== true) this.starbaseGroup.visible = true;
      if (this.interiorGroup.visible !== false) this.interiorGroup.visible = false;
      if (this.spaceGroup.visible !== true) this.spaceGroup.visible = true;
      this.zoneCockpit.visible = false;
      this.zoneCorridor.visible = false;
      this.zoneGrandHall.visible = false;
      this.zoneLowerDeck.visible = false;
      this.zoneUpperDeck.visible = false;
      return;
    }

    if (this.mode === 'flight' || this.mode === 'eva') {
      if (this.starbaseGroup.visible !== false) this.starbaseGroup.visible = false;
      if (this.interiorGroup.visible !== false) this.interiorGroup.visible = false;
      if (this.spaceGroup.visible !== true) this.spaceGroup.visible = true;
      this.zoneCockpit.visible = false;
      this.zoneCorridor.visible = false;
      this.zoneGrandHall.visible = false;
      this.zoneLowerDeck.visible = false;
      this.zoneUpperDeck.visible = false;

      // Distance culling for massive 83MB starbase in space flight
      if (this.orbitalStarbase && playerPos && this.dockingPosition) {
        const dist = playerPos.distanceTo(this.dockingPosition);
        this.orbitalStarbase.visible = (dist < 900);
      }
      return;
    }

    // Inside the spaceship (mode === 'interior')
    // 100% hide Starbase and Space Group
    if (this.starbaseGroup.visible !== false) this.starbaseGroup.visible = false;
    if (this.spaceGroup.visible !== false) this.spaceGroup.visible = false;
    if (this.interiorGroup.visible !== true) this.interiorGroup.visible = true;

    if (!playerPos) return;

    const y = playerPos.y;
    const z = playerPos.z;
    const blastDoorOpen = this.isDoorOpen('blastDoor');

    // Deck Separation
    const inLower = (deckLevel === 'lower' || y < -0.8);
    const inUpper = (deckLevel === 'upper' || y > 5.5);

    // If on Lower Cryo & Engineering Deck (Y <= -0.8):
    if (inLower) {
      this.zoneLowerDeck.visible = true;
      this.zoneUpperDeck.visible = false; // Cull 120MB Storage
      this.zoneCockpit.visible = false;   // Cull Cockpit
      this.zoneCorridor.visible = false;  // Cull Corridor
      // Grand Hall only visible if player is climbing near hatch top
      this.zoneGrandHall.visible = (y > -3.5 && Math.abs(z - 45.0) < 6.0);
      return;
    }

    // If on Upper Mezzanine Storage Deck (Y >= 5.5):
    if (inUpper) {
      this.zoneUpperDeck.visible = true;
      this.zoneLowerDeck.visible = false; // Cull 100MB Lower Deck
      this.zoneCockpit.visible = false;   // Cull Cockpit
      this.zoneCorridor.visible = false;  // Cull Corridor
      this.zoneGrandHall.visible = (y < 9.5); // Gantry lookout into Grand Hall
      return;
    }

    // Main Deck Level:
    this.zoneLowerDeck.visible = false;
    this.zoneUpperDeck.visible = false;

    // Both Cockpit and Corridor stay visible to each other for continuous illumination
    if (z <= -16.0) {
      // In Cockpit Bridge
      this.zoneCockpit.visible = true;
      this.zoneCorridor.visible = true; // Always see lighted corridor behind bridge doors
      this.zoneGrandHall.visible = false;
    } else if (z <= 17.6) {
      // In Central Corridor
      this.zoneCorridor.visible = true;
      this.zoneCockpit.visible = true; // Always see lighted bridge forward
      this.zoneGrandHall.visible = true; // Grand Hall lighted through portal
    } else {
      // In Grand Sci-Fi Hall
      this.zoneGrandHall.visible = true;
      this.zoneCorridor.visible = true; // Corridor entrance visible looking forward
      this.zoneCockpit.visible = false;
    }
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'starbase') {
      this.starbaseGroup.visible = true;
      this.interiorGroup.visible = false;
      this.spaceGroup.visible = true;
    } else if (mode === 'interior') {
      this.starbaseGroup.visible = false;
      this.interiorGroup.visible = true;
      this.spaceGroup.visible = false;
    } else {
      this.starbaseGroup.visible = false;
      this.interiorGroup.visible = false;
      this.spaceGroup.visible = true;
    }
  }

  setStorageDoorsOpen(open) {
    if (!this.storageDoorActions || this.storageDoorActions.length === 0) return;
    if (this._storageDoorsOpen === open) return;
    this._storageDoorsOpen = open;
    try { sounds.playDoor(); } catch (e) {}
    this.storageDoorActions.forEach((action) => {
      action.paused = false;
      const clip = action.getClip();
      if (open) {
        action.timeScale = 1.2;
        if (action.time >= clip.duration) {
          action.time = clip.duration;
        }
        action.play();
      } else {
        action.timeScale = -1.2;
        if (action.time <= 0) {
          action.time = 0;
        }
        action.play();
      }
    });
  }

  setCryoDoorsOpen(open) {
    if (!this.cryoDoorActions || this.cryoDoorActions.length === 0) return;
    if (this._cryoDoorsOpen === open) return;
    this._cryoDoorsOpen = open;
    try { sounds.playDoor(); } catch (e) {}
    this.cryoDoorActions.forEach((action) => {
      action.paused = false;
      const clip = action.getClip();
      if (open) {
        action.timeScale = 1.2;
        if (action.time >= clip.duration) {
          action.time = clip.duration;
        }
        action.play();
      } else {
        action.timeScale = -1.2;
        if (action.time <= 0) {
          action.time = 0;
        }
        action.play();
      }
    });
  }

  update(delta, playerPos = null, deckLevel = 'main') {
    this.updateCulling(playerPos, deckLevel);
    if (this.mode === 'starbase') return; // 0 interior or space overhead while in starbase
    // 1. Functional Blast Doors Automation & Animation
    const door = this.doors.blastDoor;
    if (door && door.leftMesh && door.rightMesh) {
      if (playerPos) {
        // Proximity sensor: triggers when player approaches within 7m of doorway (Z = 17.6)
        const inProximity = (playerPos.z >= 10.5 && playerPos.z <= 24.5 && Math.abs(playerPos.x) <= 5.2);
        door.targetOpen = inProximity ? 1.0 : 0.0;
      }

      const prevOpen = door.currentOpen;
      door.currentOpen = THREE.MathUtils.lerp(door.currentOpen, door.targetOpen, delta * 4.0);

      // Play hydraulic whoosh audio when door starts opening or closing
      if ((prevOpen < 0.08 && door.currentOpen >= 0.08) || (prevOpen > 0.92 && door.currentOpen <= 0.92)) {
        sounds.playDoor();
      }

      // Exact linear interpolation between closed and open states:
      // t = 0.0 -> meets at center (closed)
      // t = 1.0 -> retracts fully into wall pockets (open)
      const offset = (1.0 - door.currentOpen) * door.closedOffset + door.currentOpen * door.openOffset;
      door.leftMesh.position.x = door.baseLeftX + offset;
      door.rightMesh.position.x = door.baseRightX - offset;
      door.isOpen = door.currentOpen > 0.35;

      // Update indicator lights (Green = open, Red = closed)
      if (this.doorStatusLight) {
        this.doorStatusLight.material.color.setHex(door.isOpen ? 0x00ff88 : 0xff3344);
      }
      if (this.doorPointLight) {
        this.doorPointLight.color.setHex(door.isOpen ? 0x00ff88 : 0xff3344);
      }
    }

    // 1b. Functional Lower Deck (Cryo Chamber & Compartments) Sliding Doors Automation
    if (this.lowerDeckDoors && this.lowerDeckDoors.length > 0) {
      const isPlayerOnLower = (playerPos && playerPos.y < -1.5);

      this.lowerDeckDoors.forEach((door) => {
        if (isPlayerOnLower) {
          const dx = playerPos.x - door.center.x;
          const dz = playerPos.z - door.center.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          door.targetOpen = dist <= 3.3 ? 1.0 : 0.0;
        } else {
          door.targetOpen = 0.0;
        }

        const prevOpen = door.currentOpen;
        door.currentOpen = THREE.MathUtils.lerp(door.currentOpen, door.targetOpen, delta * 4.2);

        // Play hydraulic whoosh audio when door starts opening or closing
        if ((prevOpen < 0.08 && door.currentOpen >= 0.08) || (prevOpen > 0.92 && door.currentOpen <= 0.92)) {
          try { sounds.playDoor(); } catch (e) {}
        }

        door.isOpen = door.currentOpen > 0.35;

        // Slide the dual door panels apart
        if (door.axis === 'z') {
          if (door.panel1) door.panel1.position.z = door.basePos1 + (door.dir1 * door.currentOpen * door.slideDist);
          if (door.panel2) door.panel2.position.z = door.basePos2 + (door.dir2 * door.currentOpen * door.slideDist);
        } else if (door.axis === 'x') {
          if (door.panel1) door.panel1.position.x = door.basePos1 + (door.dir1 * door.currentOpen * door.slideDist);
          if (door.panel2) door.panel2.position.x = door.basePos2 + (door.dir2 * door.currentOpen * door.slideDist);
        }

        // Update indicator light (Emerald when open, Cyan when sealed)
        if (door.statusLight) {
          door.statusLight.material.color.setHex(door.isOpen ? 0x00ff88 : 0x00d4ff);
        }
      });
    }

    // 2. Rotate celestial body
    if (this.planet) {
      this.planet.rotation.y += delta * 0.03;
    }

    // 3. Tumble asteroids (Optimized: only in space/eva flight mode)
    if (this.mode === 'flight' || this.mode === 'eva') {
      this.asteroids.forEach((rock) => {
        if (rock.userData && rock.userData.rotSpeed) {
          rock.rotation.x += rock.userData.rotSpeed.x * delta;
          rock.rotation.y += rock.userData.rotSpeed.y * delta;
          rock.rotation.z += rock.userData.rotSpeed.z * delta;
        }
      });
    }

    // 4. Pulse interactive rings & neon lights
    const time = performance.now() * 0.003;
    this.interactiveConsoles.forEach((ring) => {
      ring.material.opacity = 0.5 + Math.sin(time * 3) * 0.35;
      const s = 1.0 + Math.sin(time * 3) * 0.08;
      ring.scale.set(s, s, s);
    });

    this.pulsingLights.forEach((light, i) => {
      light.intensity = 2.4 + Math.sin(time * 2 + i) * 0.4;
    });

    // 5. Update pneumatic storage door animation mixer
    if (this.storageMixer && this.zoneUpperDeck.visible) {
      this.storageMixer.update(delta);
    }

    // 6. Update Armory Weapon Pedestals (floating levitation bobbing, rotation, proximity pulse)
    if (this.armoryPedestals && this.armoryPedestals.length > 0) {
      this.armoryPedestals.forEach((ped, idx) => {
        if (ped.floatGroup) {
          ped.floatGroup.position.y = ped.baseY + Math.sin(time * 2.0 + idx * 1.3) * 0.08;
          ped.floatGroup.rotation.y += delta * 0.65;
        }

        if (ped.pulseRing) {
          let isNear = false;
          if (playerPos) {
            const dx = playerPos.x - ped.position.x;
            const dz = playerPos.z - ped.position.z;
            const distSq = dx * dx + dz * dz;
            if (distSq < 6.5) isNear = true;
          }

          const ringScale = isNear ? (1.08 + Math.sin(time * 6.0) * 0.08) : (1.0 + Math.sin(time * 3.5 + idx) * 0.04);
          ped.pulseRing.scale.set(ringScale, ringScale, ringScale);
          ped.pulseRing.material.opacity = isNear ? 0.95 : 0.45;

          if (ped.holoPlaque) {
            ped.holoPlaque.material.opacity = isNear ? 1.0 : 0.75;
          }
        }
      });
    }

    // 7. Update Armory Weapon Animation Mixers (e.g. Plasma Rifle cylinder cycling)
    if (this.armoryMixers && this.armoryMixers.length > 0 && this.zoneGrandHall.visible) {
      this.armoryMixers.forEach((m) => m.update(delta));
    }

    // 8. Update CryoPod canopy animation mixer
    if (this.cryoMixer && this.zoneLowerDeck.visible) {
      this.cryoMixer.update(delta);
    }

    // 9. Update Red Supergiant Star Corona & Flare Animation
    if (this.redStar) {
      this.redStar.rotation.y += delta * 0.01;
      if (this.starCorona) {
        this.starCorona.rotation.z += delta * 0.02;
        this.starCorona.material.opacity = 0.38 + Math.sin(time * 2.5) * 0.12;
      }
      if (this.starFlareRing) {
        this.starFlareRing.rotation.z -= delta * 0.03;
      }
    }

    // 10. Update Interior Airlock Warning Beacon Strobe
    if (this.airlockBeacon) {
      this.airlockBeacon.intensity = 2.0 + Math.sin(time * 8.0) * 1.5;
    }
  }
}

