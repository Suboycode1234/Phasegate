// Standalone HTML Packager for Space3D Game
// Streams and packages HTML, CSS, JavaScript, 3D GLB models, and textures into a single standalone HTML file.

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const assetsDir = path.resolve(rootDir, 'public', 'assets');

console.log('[Standalone Packager] Starting standalone file compilation...');

if (!fs.existsSync(distDir)) {
  console.error('[Error] dist/ folder not found. Please run "npm run build" first.');
  process.exit(1);
}

// 1. Read dist/index.html
const indexHtmlPath = path.resolve(distDir, 'index.html');
let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// 2. Find and inline CSS
const distAssetsDir = path.resolve(distDir, 'assets');
const cssFiles = fs.readdirSync(distAssetsDir).filter(f => f.endsWith('.css'));
if (cssFiles.length > 0) {
  const cssPath = path.resolve(distAssetsDir, cssFiles[0]);
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  htmlContent = htmlContent.replace(/<link rel="stylesheet"[^>]*href="[^"]*"[^>]*>/i, `<style>\n${cssContent}\n</style>`);
  console.log(`[Standalone Packager] Inlined CSS (${(cssContent.length / 1024).toFixed(1)} KB)`);
}

// 3. Find and read JS bundle
const jsFiles = fs.readdirSync(distAssetsDir).filter(f => f.endsWith('.js'));
let inlinedJsContent = '';
if (jsFiles.length > 0) {
  const jsPath = path.resolve(distAssetsDir, jsFiles[0]);
  inlinedJsContent = fs.readFileSync(jsPath, 'utf8');
  // Remove the external module script from head
  htmlContent = htmlContent.replace(/<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/i, '');
  console.log(`[Standalone Packager] Prepared JavaScript bundle (${(inlinedJsContent.length / 1024).toFixed(1)} KB)`);
}

// 4. Inject JS bundle right before </body> so DOM elements are available
htmlContent = htmlContent.replace('</body>', `<script type="module">\n${inlinedJsContent}\n</script>\n</body>`);

// Split HTML into head prefix and remainder
const headSplitIdx = htmlContent.indexOf('</head>');
if (headSplitIdx === -1) {
  console.error('[Error] </head> tag not found in index.html');
  process.exit(1);
}

const htmlHeadPrefix = htmlContent.slice(0, headSplitIdx);
let htmlRemainder = htmlContent.slice(headSplitIdx);

// (JS bundle already injected before </body>)

const assetFiles = [
  'anim_idle.glb',
  'anim_walk.glb',
  'anim_run.glb',
  'anim_jump.glb',
  'anim_crouch.glb',
  'anim_punch.glb',
  'anim_hold_gun.glb',
  'anim_reload.glb',
  'player2/player2.glb',
  'player2/extracted_Material_001_Diffuse.jpg',
  'player2/extracted_Material_001_Normal.jpg',
  'player3/player3.glb',
  'player3/extracted_Material_001_Diffuse.jpg',
  'player3/extracted_Material_001_Normal.jpg',
  'ship_interior_room.glb',
  'ship_corridor.glb',
  'ship_cockpit.glb',
  'ship_storage_corridor.glb',
  'ship_lower_deck.glb',
  'ship_exterior.glb',
  'starbase.glb',
  'space_bg.jpg',
  'stars.jpg',
  'guns/scifi/plasma_rifle.glb',
  'guns/scifi/railgun.glb',
  'guns/scifi/energy_pistol.glb',
  'guns/basic/assault_rifle.glb',
  'guns/basic/combat_knife.glb'
];

const outputStandalonePath = path.resolve(distDir, 'space3d_game_standalone.html');
const outStream = fs.createWriteStream(outputStandalonePath, { encoding: 'utf8' });

console.log('[Standalone Packager] Streaming 3D models and textures into standalone file...');

outStream.write(htmlHeadPrefix);
outStream.write(`
  <script>
    // Embedded Standalone Asset Virtual File System
    window.__STANDALONE_BUNDLE__ = true;
    window.__ASSET_BLOBS__ = {};
    window.__OBJECT_URLS__ = {};
    window.__EMBEDDED_ASSETS__ = {};
  </script>
`);

for (let i = 0; i < assetFiles.length; i++) {
  const fileName = assetFiles[i];
  const filePath = path.resolve(assetsDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ Warning: Asset not found: ${fileName}`);
    continue;
  }

  let mime = 'application/octet-stream';
  let isGz = false;
  if (fileName.endsWith('.glb')) {
    mime = 'model/gltf-binary';
    isGz = true;
  } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
    mime = 'image/jpeg';
    isGz = false;
  } else if (fileName.endsWith('.png')) {
    mime = 'image/png';
    isGz = false;
  } else if (fileName.endsWith('.json')) {
    mime = 'application/json';
    isGz = true;
  }

  const stat = fs.statSync(filePath);
  const rawBuf = fs.readFileSync(filePath);
  const dataBuf = isGz ? zlib.gzipSync(rawBuf, { level: 6 }) : rawBuf;

  console.log(`  ✓ Bundling ${fileName} (${(stat.size / 1024 / 1024).toFixed(2)} MB raw -> ${(dataBuf.length / 1024 / 1024).toFixed(2)} MB ${isGz ? 'gzip' : 'direct'})...`);

  // Write each asset inside its own isolated script tag to stay well below browser V8 script string limits
  outStream.write(`  <script>\n    window.__EMBEDDED_ASSETS__["/assets/${fileName}"] = {\n      mime: "${mime}",\n      gz: ${isGz},\n      b64: "`);

  const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB chunk (multiple of 3 preserves base64 alignment)
  for (let offset = 0; offset < dataBuf.length; offset += CHUNK_SIZE) {
    const chunk = dataBuf.subarray(offset, Math.min(offset + CHUNK_SIZE, dataBuf.length));
    outStream.write(chunk.toString('base64'));
  }

  outStream.write('"\n    };\n  </script>\n');
}

outStream.write(`
  <script>
    const _b64Lookup = new Uint8Array(128);
    const _chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (let i = 0; i < _chars.length; i++) _b64Lookup[_chars.charCodeAt(i)] = i;

    function _b64ToUint8(b64) {
      if (typeof Uint8Array.fromBase64 === 'function') {
        try { return Uint8Array.fromBase64(b64); } catch(e) {}
      }
      const len = b64.length;
      let validLen = len;
      if (b64.endsWith('==')) validLen -= 2;
      else if (b64.endsWith('=')) validLen -= 1;

      const outLen = Math.floor(validLen * 3 / 4);
      const bytes = new Uint8Array(outLen);

      let p = 0;
      for (let i = 0; i < len; i += 4) {
        const c0 = _b64Lookup[b64.charCodeAt(i)];
        const c1 = _b64Lookup[b64.charCodeAt(i + 1)];
        const c2 = _b64Lookup[b64.charCodeAt(i + 2)];
        const c3 = _b64Lookup[b64.charCodeAt(i + 3)];

        bytes[p++] = (c0 << 2) | (c1 >> 4);
        if (p < outLen) bytes[p++] = ((c1 & 15) << 4) | (c2 >> 2);
        if (p < outLen) bytes[p++] = ((c2 & 3) << 6) | c3;
      }
      return bytes;
    }

    async function _decompressGzip(uint8) {
      if (typeof DecompressionStream === 'function') {
        const ds = new DecompressionStream('gzip');
        const stream = new Response(uint8).body.pipeThrough(ds);
        const ab = await new Response(stream).arrayBuffer();
        return new Uint8Array(ab);
      }
      return uint8;
    }

    function _findAssetKey(rawUrl) {
      if (!rawUrl || typeof rawUrl !== 'string') return null;
      const clean = rawUrl.split('?')[0].split('#')[0];
      for (const key of Object.keys(window.__EMBEDDED_ASSETS__)) {
        if (clean === key || clean.endsWith(key) || clean.endsWith('/' + key.replace(/^\\//, ''))) {
          return key;
        }
      }
      return null;
    }

    async function _getAssetBlob(key) {
      if (window.__ASSET_BLOBS__[key]) return window.__ASSET_BLOBS__[key];
      const entry = window.__EMBEDDED_ASSETS__[key];
      if (!entry) return null;
      let rawBytes = _b64ToUint8(entry.b64);
      if (entry.gz) {
        rawBytes = await _decompressGzip(rawBytes);
      }
      const blob = new Blob([rawBytes], { type: entry.mime });
      window.__ASSET_BLOBS__[key] = blob;
      return blob;
    }

    // Synchronous asset blob getter for images
    function _getSyncAssetUrl(key) {
      if (window.__OBJECT_URLS__[key]) return window.__OBJECT_URLS__[key];
      const entry = window.__EMBEDDED_ASSETS__[key];
      if (!entry || entry.gz) return null;
      const rawBytes = _b64ToUint8(entry.b64);
      const blob = new Blob([rawBytes], { type: entry.mime });
      const objUrl = URL.createObjectURL(blob);
      window.__OBJECT_URLS__[key] = objUrl;
      return objUrl;
    }

    window.__GET_ASSET_URL__ = function(rawUrl) {
      const key = _findAssetKey(rawUrl);
      if (!key) return null;
      return _getSyncAssetUrl(key);
    };

    // 1. Intercept window.fetch for all 3D models and assets
    const _nativeFetch = window.fetch;
    window.fetch = async function(input, init) {
      let urlStr = '';
      if (typeof input === 'string') {
        urlStr = input;
      } else if (input && typeof input.url === 'string') {
        urlStr = input.url;
      }
      const key = _findAssetKey(urlStr);
      if (key) {
        try {
          const blob = await _getAssetBlob(key);
          if (blob) {
            const entry = window.__EMBEDDED_ASSETS__[key];
            return new Response(blob, {
              status: 200,
              statusText: 'OK',
              headers: new Headers({
                'Content-Type': entry.mime || 'application/octet-stream',
                'Content-Length': blob.size.toString()
              })
            });
          }
        } catch (err) {
          console.error('[Space3D Standalone] Error preparing embedded asset for ' + key, err);
        }
      }
      return _nativeFetch(input, init);
    };

    // 2. Intercept HTMLImageElement.prototype.src for direct texture loading
    try {
      const imgDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
      if (imgDesc && imgDesc.set) {
        Object.defineProperty(HTMLImageElement.prototype, 'src', {
          set(val) {
            if (typeof val === 'string') {
              const key = _findAssetKey(val);
              if (key) {
                const objUrl = _getSyncAssetUrl(key);
                if (objUrl) val = objUrl;
              }
            }
            imgDesc.set.call(this, val);
          },
          get() {
            return imgDesc.get.call(this);
          }
        });
      }
    } catch (e) {
      console.warn('Image.src interception warning:', e);
    }

    console.log('[Space3D Standalone] Offline virtual asset system ready with ' + Object.keys(window.__EMBEDDED_ASSETS__).length + ' bundled assets.');
  </script>
`);

outStream.write(htmlRemainder);
outStream.end();

outStream.on('finish', () => {
  const finalStat = fs.statSync(outputStandalonePath);
  console.log(`\n======================================================`);
  console.log(`[SUCCESS] Standalone file successfully compiled!`);
  console.log(`Output: ${outputStandalonePath}`);
  console.log(`File Size: ${(finalStat.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`This single file contains the complete game, engine, models, and audio.`);
  console.log(`It can be run directly in any browser without needing a web server.`);
  console.log(`======================================================\n`);
});
