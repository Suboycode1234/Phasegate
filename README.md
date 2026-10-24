# PhaseGate *(in production)*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Engine: Three.js](https://img.shields.io/badge/Three.js-r128-black.svg)](https://threejs.org/)
[![Multiplayer: PeerJS WebRTC](https://img.shields.io/badge/Multiplayer-PeerJS%20WebRTC-00f0ff.svg)](https://peerjs.com/)
[![Built with: Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF.svg)](https://vitejs.dev/)

> **PhaseGate** is a next-generation 3D sci-fi action exploration and spaceflight game built directly for the modern web browser. Explore massive starship interiors and orbital starbases, engage in tactical PvP/PvE combat, tether yourself during zero-G spacewalks, and crew vessels with friends via direct serverless WebRTC peer-to-peer multiplayer.

Developed by **Riftbound Studios**.

---

## 🚀 Key Features

### 👥 Class-Based Pilot Roster
Choose from three specialized crew roles, each featuring unique abilities and tactical advantages:

1. **Captain Vanguard [Fleet Commander]**
   - **Role**: Command & Support
   - **Special Ability**: `Tactical Rally Aura` — Instantly replenishes shields (+50) and grants an overdrive sprint boost for 8 seconds.

2. **Chief Mechanic Cog [Engineer]**
   - **Role**: Support & Logistics
   - **Special Ability**: `Nanite Field Repair` — Restores hull integrity (+40) and re-arms all weapon magazines in the squad.

3. **Spectre Scout [Infiltrator]**
   - **Role**: High-Agility Mobility & Reconnaissance
   - **Inbuilt Arsenal**: Dual Kinetic Wrist Grapplers
   - **Mechanics**: Independent Left & Right wrist hooks with real physics cables, dynamic reeling, and slingshot catapult leaps.

---

### 🌐 Serverless P2P Multiplayer (PeerJS WebRTC)
- Direct low-latency browser-to-browser data channels.
- Full real-time synchronization of:
  - Position, velocity, and facing yaw/pitch.
  - Skeletal character animations (walk, run, sprint, jump, crouch, aim, punches).
  - Combat lasers, ballistic projectiles, friendly fire, and knockback.
  - Multi-crew starship piloting and EVA spacewalk states.
- Works across local networks (LAN) or over the internet via WebRTC brokers (STUN/TURN fallback compatible).

---

### 🌌 Exploration Environments & EVA
- **Starship Interior**: Multi-deck vessel including the Bridge Cockpit, Crew Living Quarters, Storage Corridors, and Engineering Lower Deck.
- **Orbital Starbase**: Exterior docking bays and space stations.
- **EVA Spacewalk (Zero-G)**: Step through airlocks with 3D jetpack RCS thrusters and an active hull tether.
- **Helm Spaceflight**: Take the pilot seat to command ship thrusters and planetary navigation.

---

### ⚔️ Combat & Arsenal
- **PR-90 Plasma Core Rifle**: Rapid-fire continuous energy weapon with animated core.
- **X-7 Hyper-Kinetic Railgun**: High-damage sniper rail with accelerated velocity and camera recoil.
- **Ion-9 Compact Sidearm**: High-mobility close-quarters pistol.
- **M16A3 Tactical Assault Rifle**: Kinetic ballistic automatic rifle.
- **CQC Combat Knife & Melee Fists**: Hand-to-hand martial combat with directional impact sparks.
- **Friendly Fire & Med-Bay Respawn**: Full damage detection, camera screen jolts, low-health red vignettes, and automatic medical reconstruction.

---

## 🎮 Controls

### Pilot Controls (On Foot / EVA)
| Input | Action |
| :--- | :--- |
| **`[W]` `[A]` `[S]` `[D]`** | Movement (Walk / Strafe) |
| **`[Shift]`** | Sprint Overdrive |
| **`[Space]`** | Jump / Ascend (EVA Jetpack) / **Grappler Slingshot Leap** |
| **`[C]`** | Crouch / Descend (EVA Jetpack) |
| **`[V]`** | Toggle Viewpoint (1st Person ⟷ 3rd Person) |
| **`[Left Mouse Button (LMB)]`** | Fire Weapon / Strike / Fire Left Grapple Hook |
| **`[Right Mouse Button (RMB)]`** | Fire Right Grapple Hook (Scout) / Precision Aim |
| **`[Q]`** | Activate Pilot Class Ability |
| **`[G]`** | Quick Dual Grappler Launch (Scout) |
| **`[R]`** | Reload Weapon |
| **`[1]` – `[6]`** | Hotkey Weapon Select (`[6]` for Dual Grapplers / Knife) |
| **`[E]`** | Interact (Enter Cockpit Seat / Equip Pedestal Weapons) |
| **`[F]`** | Launch Hull Tether to Airlock (EVA Mode) |
| **`[B]`** | Mag-Boots Toggle (EVA Mode) |

---

## 🛠️ Development & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or later recommended)
- [Git](https://git-scm.com/) and [Git LFS](https://git-lfs.github.com/)

### Clone & Install
```bash
# Clone repository
git clone https://github.com/Suboycode1234/Spacex3D.git
cd Spacex3D

# Install dependencies
npm install

# Start local Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚢 Deployment (Vercel)

PhaseGate is optimized for zero-config deployment on **Vercel**:

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New Project** and import `Spacex3D`.
3. **Important — Enable Git LFS**:
   - Go to **Project Settings** ➔ **Git**.
   - Under **Git LFS**, toggle the switch to **ON**.
4. Click **Deploy**. Vercel will install dependencies, retrieve the 3D assets via LFS, and build the production bundle automatically.

---

## 📄 License & Copyright

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete terms.

Copyright © 2026 **Riftbound Studios**. All rights reserved.
