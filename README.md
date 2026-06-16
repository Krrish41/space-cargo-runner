# 🚀 Space Cargo Runner - Neon Cyberpunk Odyssey

Welcome to **Space Cargo Runner**! A retro-futuristic Web2.5 arcade game where you jump into the cockpit, dodge cosmic hazards, and push your engines to the limit to dominate the global leaderboards.

![Space Cargo Runner UI](https://via.placeholder.com/800x400.png?text=Space+Cargo+Runner) *(Note: Add a screenshot of your main menu here!)*

## 🌌 Overview

Space Cargo Runner seamlessly blends high-octane Web2 arcade physics with the bleeding edge of Web3 Ethereum wallet identity. Players can jump in instantly as Guest Pilots, or connect a Web3 wallet for an immutable global identity, bridging the gap between traditional gaming and decentralized ecosystems.

## ✨ Key Features

* **Phaser 3 Physics Engine:** Buttery smooth spaceship movement, collision detection, and scrolling backgrounds.
* **Live WebSocket Multiplayer (Comms Feed):** Real-time broadcast system that pushes high-score runs to all connected pilots globally the second they happen.
* **Zustand State Management:** Lightning-fast, un-opinionated state management ensuring the React UI and Phaser Canvas communicate in perfect sync without tearing.
* **Prisma & PostgreSQL Backend:** A rock-solid relational database storing persistent pilot profiles, ship upgrades, and global leaderboards.

## 🏗️ Monorepo Architecture

This project is structured as an NPM Workspace Monorepo:
* **`apps/frontend`**: The React 18 / Vite application. Houses the UI components, Wagmi wallet hooks, Zustand store, and the embedded Phaser 3 game canvas.
* **`apps/backend`**: The Node.js / Express server. Manages the Socket.io WebSocket connections, REST endpoints, and the Prisma ORM instance.
* **`packages/shared`**: Shared TypeScript types ensuring strict end-to-end type safety between the frontend and backend.

## 🛠️ Local Setup Instructions

### 1. Install Dependencies
From the root directory, install all workspace packages:
```bash
npm install
```

### 2. Configure Environment Variables
Inside `apps/backend`, create a `.env` file for your database connection:
```env
# apps/backend/.env
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
```
*(Optionally configure WalletConnect project IDs in the frontend if expanding Wagmi integration).*

### 3. Initialize the Database
Generate the Prisma Client and push the schema to your database:
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
Navigate to `http://localhost:5173` to start your run!

## 🚀 Deployment Note

The **Frontend** is configured to be automatically built and deployed as a static site via **GitHub Pages**. 
However, because this game relies heavily on WebSockets and database interactions, the **Backend** requires a dedicated Node.js hosting environment (such as Render, Heroku, or Railway) for full multiplayer functionality. Make sure to update the Socket and REST endpoints in the frontend to point to your live backend URL once deployed!
