# Game Design Document (GDD)

> **Note:** For full technical implementation details and an overview of the live game, please see the root [`Game_Documentation.md`](../Game_Documentation.md).

## 1. Concept overview
**Space Cargo Runner** is an infinite-runner arcade survival game. The player pilots a heavily modified cargo ship through a dense, procedurally generated asteroid belt. The primary objective is to survive as long as possible (Distance) while securing valuable resources (Cargo) to climb the global leaderboard.

## 2. Core Gameplay Loop
1. **Launch:** The player starts at a base speed. Fuel dissipates linearly over time.
2. **Navigate:** The player uses the `LEFT` and `RIGHT` arrow keys (or A/D, or pointer/touch input on the left/right sides of the screen) to maneuver the ship laterally across the canvas.
3. **Collect & Survive:** 
   - **Cargo (Neon Cubes):** Collecting cargo grants 10 coins.
   - **Fuel Cells (Blue Capsules):** Replenish the core fuel dissipation bar. These spawn with a 15% probability and are critical for extending the run as fuel drains automatically every second.
   - **Asteroids (Red Rocks):** Hitting an asteroid strips Hull Integrity (HP).
4. **End Condition:** The run ends ("CRITICAL FAILURE") if Hull Integrity reaches 0 (destroyed) or if the Fuel Core Dissipation bar depletes completely (stranded).

## 3. RPG Mechanics: Pilot Rank & XP
The game features a permanent RPG progression system designed to reward long-term engagement.
- **XP Calculation:** At the end of every run, the player is awarded XP based on a weighted formula combining `Distance Traveled` and `Cargo Secured`.
- **Pilot Rank Formula:** A player's Pilot Rank (Level) is mathematically derived from their lifetime accumulated XP. The formula `Level = Math.floor(Math.sqrt(XP / 100)) + 1` creates an exponential curve, making early levels quick to achieve while higher ranks require significant mastery and grind.
- **XP Bar:** The HUD displays a real-time progress bar indicating the percentage of XP required to reach the next rank.

## 4. UI & Heads-Up Display (HUD)
The HUD is designed with a retro "cyberpunk" aesthetic, utilizing glowing CRT filters and monospace fonts.
- **Hull Integrity Bar:** Visually tracks HP. Transitions from Neon Blue to Emergency Red when below 30% capacity.
- **Fuel Core Dissipation:** A constantly shrinking progress bar. Visually alerts the player to the urgency of collecting Fuel Cells.
- **Global Live Comms Link:** A scrolling ticker box positioned at the bottom of the main menu. It intercepts live WebSocket broadcasts from the server to display real-time achievements of other players globally.

## 5. Web3 Integration
Instead of forcing players to create an account with a password, Space Cargo Runner utilizes an invisible, frictionless onboarding flow. 
- **Guest Mode:** Players are instantly assigned a local, browser-based Guest identity.
- **Wallet Binding:** Players can permanently secure their High Scores, Coins, and Pilot Rank by connecting an Ethereum-compatible Web3 wallet. The game binds the hardware address to the telemetry, serving as a decentralized authentication method.
