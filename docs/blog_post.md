# Bridging Web2 Canvas and Web3 Identity: Building "Space Cargo Runner"

*By the Space Cargo Runner Engineering Team*

When we set out to build **Space Cargo Runner**, our goal was simple yet highly ambitious: take the fast-paced, pixel-perfect mechanics of a classic arcade space survival game and inject it with the immutable identity and real-time connectivity of Web3 technologies. We didn’t want to build a clunky "crypto game"; we wanted a seamless Web2.5 experience where players could just click and play, but optionally bind a Web3 wallet to permanently secure their legacy on a global leaderboard. 

This post dives deep into the architecture, the technical hurdles we faced, and how we solved them using React, Phaser 3, WebSockets, and Serverless Postgres.

---

## 1. The Engine Challenge: React meets Phaser 3

**The Problem:** React is incredible for building beautiful, responsive UIs (like menus, HUDs, and modals). However, React is notoriously terrible at rendering 60-frames-per-second game logic. For the actual game canvas, we needed a dedicated engine, so we chose **Phaser 3**. The challenge was bridging the gap between Phaser's isolated internal loop and React's component state.

**The Solution:** We decoupled our state entirely using **Zustand**. 
Instead of trying to pass props down from React into the Phaser canvas, we set up a lightweight, global Zustand store. When the player's spaceship takes damage or collects a coin, the Phaser engine makes a direct call to the store: `useStore.getState().drainFuel(2)`. 

Our React UI layer (the HUD) passively subscribes to `useStore`. This means the HUD automatically updates when health or fuel changes, but the React components never interrupt or block the Phaser rendering loop. It resulted in a butter-smooth 60 FPS experience with a stunning, reactive CSS UI on top.

This decoupled state architecture also makes the game incredibly easy to re-balance on the fly. For instance, in a recent patch, we were able to instantly double the survival time of our players simply by adjusting the fuel drain timer from 0.5s to 1.0s and slightly bumping the fuel tank spawn rate to 15%—all without touching a single React component!

## 2. Web3 Identity: Invisible Onboarding

We used **Wagmi** and **Viem** to handle our Web3 wallet integrations. One of the core tenets of our project was that players shouldn't be forced to sign a transaction just to play the game. 

When a user boots the game, the backend instantly assigns them a secure "Guest Pilot" identity, stored in the browser's `localStorage`. They can play, rack up points, and level up their Pilot Rank immediately. If they decide they want to secure their identity on the blockchain, they click "Connect Wallet". A custom backend endpoint (`/api/wallet/bind`) securely merges their temporary guest telemetry into their wallet address profile, granting them permanent, cross-device progression without any friction.

## 3. Real-Time Global Comms via Socket.io

We didn't just want a static leaderboard; we wanted a living, breathing universe. To achieve this, we deployed a **Node.js/Express** server hosted on Render, equipped with **Socket.io** WebSockets.

Every time a player finishes a cargo run anywhere in the world, their client fires a `submitScore` event to the backend. The server instantly calculates their XP gains, updates their database profile, and broadcasts a `scoreUpdated` WebSocket signal globally to every connected user. Our React frontend listens for this signal and pipes it directly into the "Global Live Comms Link" on the main menu, creating a scrolling, real-time ticker of player achievements across the world.

## 4. Persistent RPG Progression with Neon Serverless Postgres

To make the leaderboards matter, we needed an iron-clad database. We utilized **Neon Serverless PostgreSQL** paired with **Prisma ORM**. 

We designed a robust schema tracking `User`, `Ship`, and `GameSession` models. This allowed us to implement an RPG leveling system ("Pilot Rank"). Every distance unit traveled and piece of cargo secured translates into XP. As XP grows exponentially, players rank up. Because it's backed by a cloud Postgres instance, this telemetry is permanent. 

## Conclusion

Building **Space Cargo Runner** was a masterclass in modern full-stack development, proving that Web3 games don't have to sacrifice gameplay, and Web2 games don't have to rely on siloed, centralized identity. By strategically delegating responsibilities—Phaser for rendering, Zustand for state, Express for APIs, Socket.io for real-time events, and Neon for persistence—we successfully shipped a highly polished, Web2.5 arcade odyssey. 

*Try it out live, connect your wallet, and see if you can claim the top spot on the Global Leaderboard!*
