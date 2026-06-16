# Space Cargo Runner - Neon Cyberpunk Odyssey

Welcome to **Space Cargo Runner**! A retro-futuristic Web2.5 arcade game where you jump into the cockpit, dodge cosmic hazards, and push your engines to the limit to dominate the global leaderboards.

### 🎮 [Play the Game Live Here!](https://krrish41.github.io/space-cargo-runner/)

## Under the Hood: Game Architecture & Technical Implementation

Space Cargo Runner seamlessly blends high-octane Web2 arcade physics with the bleeding edge of Web3 wallet identity powered by SecureChain. Players can jump in instantly as Guest Pilots, or connect a Web3 wallet for an immutable global identity, bridging the gap between traditional gaming and decentralized ecosystems.

### 1. The Game Engine Layer (Phaser 3 + React)
The core gameplay loop is powered by **Phaser 3**, operating entirely within an HTML5 Canvas. To achieve a modern React UI overlay without sacrificing canvas performance, the architecture heavily utilizes **Zustand**. 

Instead of passing props down a complex React tree and forcing costly re-renders every frame, the Phaser instance hooks directly into a lightweight Zustand store. When the spaceship collects cargo or takes damage, Phaser updates the Zustand state (e.g., `useStore.getState().addCoins(10)`). The React UI layer (which houses the HUD, Modals, and Main Menu) passively subscribes to these Zustand changes and updates independently of the Phaser render loop.

### 2. The Real-Time Network Layer (Socket.io)
Space Cargo Runner features a "Global Live Comms" feed. To achieve real-time broadcast capabilities, the Node.js backend implements an event-driven WebSocket server using **Socket.io**. 

When a player finishes a run:
1. The React frontend sends an HTTP POST request to the Express REST API with the final score.
2. The Express endpoint saves the score to the database and immediately invokes `io.emit()`.
3. This pushes the new run data to every single connected WebSocket client globally in milliseconds.
4. The frontend catches this event and pushes it to the bottom of the glowing CRT terminal ticker.

### 3. The Data Persistence Layer (Prisma + Neon PostgreSQL)
All game data is persistently stored in a global **Neon PostgreSQL** database, managed and modeled using **Prisma ORM**.
The schema is strictly relational, handling:
- **Users**: Unique UUIDs, cosmetic callsigns, and Web3 Wallet Addresses.
- **Ships**: One-to-one mapping to Users, storing upgrade levels (Plasma Cores, Deflector Shields).
- **Runs**: One-to-many mapping to Users, logging every individual run, distance, and timestamp.

### 4. The Authentication Architecture
The game implements a dual-layer authentication system:
- **Guest Authentication**: Upon first load, the backend generates a persistent UUID for the user. This UUID is stored in the browser's `localStorage` as a cryptographic identity badge. It bypasses the need for traditional email/password registration while still allowing database persistence.
- **Web3 Wallet Connection**: Using **Wagmi** and viem, players can upgrade their temporary Guest UUID into a permanent, immutable identity by signing a message with a Web3 wallet (like MetaMask or Rainbow) connected to the **SecureChain (SCAI)** network. 

#### SecureChain (SCAI) Network Configuration
To fully interact with the Web3 features of Space Cargo Runner, ensure your wallet is configured with the following SecureChain Mainnet details:
* **Network Name:** SCAI Mainnet
* **RPC URL:** `https://mainnet-rpc.scai.network`
* **Chain ID:** `34`
* **Currency Symbol:** `SCAI`
* **Block Explorer:** `https://explorer.securechain.ai`

### 5. The Cyberpunk UI Design System
The entire interface is built using Vanilla CSS to avoid the overhead of heavy styling frameworks, leaning into a bespoke 1980s retro-futuristic aesthetic.
- **CRT Overlays**: Achieved using CSS `box-shadow` insets and `rgba` gradients to simulate curved glass monitors.
- **Frosted Glass**: Leveraging `backdrop-filter: blur()` to ensure glowing neon text remains readable when overlaid directly on top of the active Phaser canvas.
- **Animations**: CSS `@keyframes` handle the ambient glowing and blinking of UI elements, keeping the main JavaScript thread entirely free for physics calculations.

## Monorepo Architecture

* **`apps/frontend`**: The React 18 / Vite application. Houses the UI components, Wagmi wallet hooks, Zustand store, and the embedded Phaser 3 game canvas.
* **`apps/backend`**: The Node.js / Express server. Manages the Socket.io WebSocket connections, REST endpoints, and the Prisma ORM instance.
* **`packages/shared`**: Shared TypeScript types ensuring strict end-to-end type safety between the frontend and backend over the network.

## Local Development & Installation

### 1. Install Dependencies
From the root directory, install all workspace packages:
```bash
npm install
```

### 2. Configure Database Environment
Inside `apps/backend`, create a `.env` file for your Neon Postgres connection:
```env
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
```

### 3. Initialize the Database
Generate the Prisma Client and migrate the schema to your global database:
```bash
cd apps/backend
npx prisma db push
```

### 4. Boot the Servers
Start the backend WebSocket/REST server:
```bash
cd apps/backend
npm run dev
```

In a new terminal, start the Vite frontend development server:
```bash
cd apps/frontend
npm run dev
```
Navigate to `http://localhost:5173` to start playing.
