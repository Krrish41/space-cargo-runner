# Space Cargo Runner - Game Documentation

Welcome to the official documentation for **Space Cargo Runner**, a high-octane retro-futuristic Web2.5 arcade game!

## 1. Introduction and Overview
**Space Cargo Runner** seamlessly blends traditional arcade physics with bleeding-edge Web3 wallet identity powered by SecureChain. Players jump into the cockpit, dodge cosmic hazards, and push their engines to the limit to dominate the global leaderboards.

- **Play Live:** [Space Cargo Runner](https://krrish41.github.io/space-cargo-runner/)
- **Core Objective:** Survive as long as possible while collecting cargo and coins. Manage your ship's health and fuel, dodge incoming asteroids, and upgrade your ship using your earnings to climb the leaderboard!

## 2. Core Game Mechanics
- **Ship Controls:** The ship follows your cursor or touch input. Move laterally to dodge and collect items.
- **Hazards (Asteroids):** Colliding with an asteroid damages your ship's health. After a hit, the ship gains temporary invulnerability frames (indicated by blinking).
- **Fuel System:**
  - The ship constantly consumes fuel while engines are active.
  - **Replenishing:** Look out for blue fuel canisters dropping into the lane! Collecting them instantly adds fuel back to your tank.
  - **Game Over:** If your fuel gauge hits zero, your ship will be stranded, resulting in an immediate Game Over.
- **Health & Shields:**
  - Your ship starts with a base health level. Asteroid collisions deplete this health.
  - Reaching zero health results in an immediate Game Over.
- **Cargo & Coins:**
  - Collecting floating cargo units awards points and in-game coins. These coins are saved permanently to your profile to be used in the Ship Upgrades Store.

## 3. Meta-Progression & Upgrades
The game features persistent mechanics that allow you to grow stronger over time. In the main menu, visit the **Ship Upgrades** terminal to spend your hard-earned coins:
- **Plasma Fuel Core:** Permanently increases your ship's maximum fuel capacity, allowing for longer runs without needing to find a fuel drop.
- **Energy Shield:** Permanently upgrades your maximum health, letting you sustain more asteroid hits before getting destroyed.
- **Pilot Rank System:** Every run grants XP based on distance survived and cargo secured. Earning XP mathematically increases your Pilot Rank (Level) and solidifies your position on the global leaderboards!

## 4. Technical Architecture
The game runs on a robust Monorepo architecture separating the game engine, real-time layers, and persistent storage:
- **Frontend Engine (Phaser 3 + React 18):** 
  - Uses Phaser 3 within an HTML5 Canvas for high-performance arcade physics.
  - Utilizes **Zustand** for state management, allowing Phaser to push state updates (coins, damage) to the React UI layer without forcing heavy React re-renders on the canvas.
- **Backend (Node.js & Express):** Manages REST endpoints and game logic validation.
- **Real-Time Network Layer (Socket.io):** A WebSockets server broadcasts live feed events globally. When any player completes a run, their score is pushed to every connected client in milliseconds and displayed on the CRT terminal ticker.
- **Database (Neon PostgreSQL & Prisma ORM):** Strictly relational database mapping Users (Web3 / UUIDs) to Ships (Upgrades) to Runs (Scores and Timestamps).

## 5. Web3 & Wallet Integration
Space Cargo Runner offers a dual-layer authentication system:
- **Guest Pilots:** Instant playability using persistent UUIDs stored in the browser's `localStorage`, bypassing traditional email registration.
- **Web3 Connected Pilots (MetaMask / Rainbow):** Players can bridge their account to Web3 by connecting a wallet. Using **Wagmi** and **Viem**, the game detects injected providers like MetaMask.
  - **SecureChain (SCAI) Network Configuration:**
    - **Network Name:** SCAI Mainnet
    - **RPC URL:** `https://mainnet-rpc.scai.network`
    - **Chain ID:** `34`
    - **Currency Symbol:** `SCAI`
    - **Block Explorer:** `https://explorer.securechain.ai`

## 6. Local Development & Installation Guide
Want to boot up the game locally? Follow these steps:

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Database Configuration:**
   Inside `apps/backend`, create a `.env` file with your Postgres connection:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
   ```
3. **Initialize the Database:**
   ```bash
   cd apps/backend
   npx prisma db push
   ```
4. **Boot the Servers:**
   - Terminal 1 (Backend):
     ```bash
     cd apps/backend
     npm run dev
     ```
   - Terminal 2 (Frontend):
     ```bash
     cd apps/frontend
     npm run dev
     ```
   Navigate to `http://localhost:5173` to start playing!

## 7. UI/UX Design Aesthetic
The game utilizes a bespoke 1980s Cyberpunk and Retro-futuristic aesthetic. 
- Built purely with **Vanilla CSS** to minimize framework overhead.
- Features **CRT Overlays** using CSS box-shadow insets.
- Incorporates **Frosted Glass** effects via `backdrop-filter: blur()`.
- Glowing text animations run via CSS `@keyframes`, keeping the main JavaScript thread completely dedicated to physics calculations.
