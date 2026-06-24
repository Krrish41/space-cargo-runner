# System Architecture Documentation

> **Note:** For full technical implementation details and an overview of the live game, please see the root [`Game_Documentation.md`](../Game_Documentation.md).

**Space Cargo Runner** utilizes a decoupled, event-driven Web2.5 architecture. This document outlines the distinct layers of the tech stack and how data flows from the game client to the persistent cloud database.

---

## 1. High-Level Architecture Flow

1. **Client Rendering Layer:** The HTML5 Canvas rendered by **Phaser 3** runs the 60FPS physics and collision loops.
2. **Client State Layer:** **Zustand** acts as an intermediary bridge between Phaser's telemetry and the **React** User Interface (HUD).
3. **Web3 Authentication:** **Wagmi/Viem** manages the EVM wallet lifecycle, supplying wallet addresses to the backend for identity binding.
4. **Network Layer:** **Axios/Fetch** handles standard REST CRUD operations, while **Socket.io** maintains a persistent bi-directional connection for live game feed broadcasts.
5. **Server Layer:** A **Node.js/Express** backend processes game logic validation, handles API routes, and emits socket events.
6. **Data Persistence Layer:** **Prisma ORM** strictly types database queries, executing them against a **Neon Serverless PostgreSQL** database.

---

## 2. Database Schema (Prisma Models)

The system relies on a heavily relational schema to map users to their ships and historical game sessions.

### `User` Model
- `id` (UUID): Primary key.
- `walletAddress` (String?): Optional EVM address for Web3 users.
- `username` (String): Customizable pilot callsign.
- `coins`, `xp`, `highScore` (Int): Lifetime accumulated metrics.

### `Ship` Model
- `userId` (UUID): Foreign key linking the ship to a specific user.
- `engineLevel`, `shieldLevel`, `fuelLevel` (Int): Current upgrade states applied to the Phaser engine on boot.

### `GameSession` Model
- `id` (UUID): Primary key.
- `userId` (UUID): Foreign key denoting the player.
- `distance`, `cargoCollected`, `coinsEarned`, `xpEarned` (Int): Immutable snapshot of a completed run's stats.

---

## 3. WebSocket Event Definitions

The real-time multiplayer component ("Global Live Comms") is completely decoupled from the REST API, driven solely by WebSocket events.

### Client-to-Server
- `submitScore (payload: ScoreData)`: Emitted when a player's ship reaches zero health or fuel. Contains the delta distance and cargo collected for the active session.

### Server-to-Client
- `scoreUpdated (payload: UserProfile)`: Globally broadcasted the instant any player's `submitScore` event is successfully written to the Neon DB. The React UI intercepts this event to update the scrolling Comms ticker.

---

## 4. API Specification

All REST routes are prefixed with `/api`.

- `POST /api/auth`: Handles guest initialization. If a user ID exists in the local cache, retrieves their profile; otherwise, instantiates a new guest record.
- `POST /api/wallet/bind`: Re-assigns a temporary guest identity to a permanent Web3 wallet address.
- `POST /api/user/rename`: Updates the `username` field, with server-side validation rejecting strings under 3 or over 20 characters.
- `GET /api/leaderboard`: Queries the top 10 players globally sorted by `highScore` descending.
- `GET /api/feed`: Queries the 5 most recently updated players to populate the Live Comms ticker history upon page refresh.
