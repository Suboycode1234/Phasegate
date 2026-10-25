import { execSync } from 'child_process';
import fs from 'fs';

console.log('[PhaseGate Prebuild] Checking 3D model assets integrity...');

const sampleFile = 'public/assets/ship_corridor.glb';
if (fs.existsSync(sampleFile)) {
  const stat = fs.statSync(sampleFile);
  if (stat.size < 1000) {
    console.log(`[PhaseGate Prebuild] Git LFS pointer file detected (${stat.size} bytes).`);
    console.log('[PhaseGate Prebuild] Pulling full binary assets via Git LFS...');
    try {
      execSync('git lfs pull', { stdio: 'inherit' });
      const newStat = fs.statSync(sampleFile);
      console.log(`[PhaseGate Prebuild] Git LFS pull complete! Sample file size: ${(newStat.size / (1024 * 1024)).toFixed(2)} MB.`);
    } catch (err) {
      console.warn('[PhaseGate Prebuild] Could not execute git lfs pull:', err.message);
    }
  } else {
    console.log(`[PhaseGate Prebuild] Binary assets verified (${(stat.size / (1024 * 1024)).toFixed(2)} MB). Skipping LFS pull.`);
  }
} else {
  console.log('[PhaseGate Prebuild] Sample file not found, running git lfs pull just in case...');
  try {
    execSync('git lfs pull', { stdio: 'inherit' });
  } catch (e) {}
}
