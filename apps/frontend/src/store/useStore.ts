import { create } from 'zustand';
import { socket } from '../lib/socket';
import type { UserProfile, ShipState, PlayerStats } from 'shared';

interface GameState {
  user: UserProfile | null;
  liveFeed: UserProfile[];
  topRunners: { id: string, username: string, highScore: number }[] | null;
  ship: ShipState | null;
  gameState: 'MENU' | 'PLAYING' | 'GAME_OVER' | 'SHOP' | 'LEADERBOARD' | 'HOW_TO_PLAY';
  distance: number;
  coinsCollected: number;
  cargoCollected: number;
  
  // Ship Health & Upgrades
  health: number;
  maxHealth: number;
  shieldLevel: number;
  
  fuel: number;
  maxFuel: number;
  fuelLevel: number;
  
  setUser: (user: UserProfile) => void;
  setShip: (ship: ShipState) => void;
  setGameState: (state: 'MENU' | 'PLAYING' | 'GAME_OVER' | 'SHOP' | 'LEADERBOARD' | 'HOW_TO_PLAY') => void;
  setDistance: (dist: number) => void;
  addCoins: (coins: number) => void;
  incrementCargo: () => void;
  resetRun: () => void;
  pushToLiveFeed: (user: UserProfile) => void;
  fetchLeaderboard: () => Promise<void>;
  updateUsername: (newName: string) => Promise<any>;
  
  getPilotLevel: () => number;
  getXpProgress: () => number;

  // New Actions
  syncPlayerStats: (stats: PlayerStats) => void;
  damageShip: (amount: number) => void;
  upgradeShield: () => Promise<boolean>;
  drainFuel: (amount: number) => void;
  replenishFuel: (amount: number) => void;
  upgradeFuel: () => Promise<boolean>;
  syncRunResults: (distance: number, coins: number) => Promise<void>;
  
  hasGuestProgress: () => boolean;
}

export const useStore = create<GameState>((set, get) => ({
  user: null,
  liveFeed: [],
  topRunners: null,
  ship: null,
  gameState: 'MENU',
  distance: 0,
  coinsCollected: 0,
  cargoCollected: 0,
  
  health: 100,
  maxHealth: 100,
  shieldLevel: 1,
  
  fuel: 100,
  maxFuel: 100,
  fuelLevel: 1,

  setUser: (user) => set({ user }),
  setShip: (ship) => set({ ship }),
  setGameState: (gameState) => set({ gameState }),
  setDistance: (distance) => set({ distance }),
  addCoins: (coins) => set((state) => ({ coinsCollected: state.coinsCollected + coins })),
  incrementCargo: () => set((state) => ({ cargoCollected: state.cargoCollected + 1 })),
  
  resetRun: () => set((state) => ({ 
    distance: 0, 
    coinsCollected: 0,
    cargoCollected: 0,
    health: state.maxHealth,
    fuel: state.maxFuel
  })),

  pushToLiveFeed: (feedUser) => set((state) => ({
    liveFeed: [feedUser, ...state.liveFeed].slice(0, 5)
  })),

  getPilotLevel: () => {
    const xp = get().user?.xp || 0;
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  },

  getXpProgress: () => {
    const xp = get().user?.xp || 0;
    const currentLevel = Math.floor(Math.sqrt(xp / 100)) + 1;
    const currentLevelBaseXp = 100 * Math.pow(currentLevel - 1, 2);
    const nextLevelBaseXp = 100 * Math.pow(currentLevel, 2);
    const xpIntoCurrentLevel = xp - currentLevelBaseXp;
    const xpRequiredForNextLevel = nextLevelBaseXp - currentLevelBaseXp;
    return (xpIntoCurrentLevel / xpRequiredForNextLevel) * 100;
  },

  hasGuestProgress: () => {
    const state = get();
    return (
      state.distance > 0 || 
      state.coinsCollected > 0 || 
      state.shieldLevel > 1 || 
      state.fuelLevel > 1 || 
      (state.user?.coins ?? 0) > 0
    );
  },

  syncPlayerStats: (stats: PlayerStats) => {
    const maxHealth = stats.ship.shieldLevel * 100;
    const maxFuel = stats.ship.fuelLevel * 100;
    set({
      shieldLevel: stats.ship.shieldLevel,
      maxHealth,
      health: maxHealth,
      fuelLevel: stats.ship.fuelLevel,
      maxFuel,
      fuel: maxFuel,
      user: { ...get().user, coins: stats.coins } as UserProfile
    });
  },

  damageShip: (amount: number) => {
    const state = get();
    if (state.gameState !== 'PLAYING') return;

    const newHealth = Math.max(0, state.health - amount);
    set({ health: newHealth });
    
    if (newHealth === 0) {
      set({ gameState: 'GAME_OVER' });
    }
  },

  drainFuel: (amount: number) => {
    const state = get();
    if (state.gameState !== 'PLAYING') return;

    const newFuel = Math.max(0, state.fuel - amount);
    set({ fuel: newFuel });

    if (newFuel === 0) {
      set({ gameState: 'GAME_OVER' });
    }
  },

  replenishFuel: (amount: number) => {
    const state = get();
    if (state.gameState !== 'PLAYING') return;

    const newFuel = Math.min(state.maxFuel, state.fuel + amount);
    set({ fuel: newFuel });
  },

  upgradeShield: async () => {
    const state = get();
    if (!state.user) return false;

    const cost = state.shieldLevel * 150;
    if (state.user.coins < cost) return false;

    set({
      user: { ...state.user, coins: state.user.coins - cost },
      shieldLevel: state.shieldLevel + 1,
      maxHealth: (state.shieldLevel + 1) * 100,
      health: (state.shieldLevel + 1) * 100
    });

    try {
      const res = await fetch('http://localhost:3001/api/ship/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.user.id, upgradeType: 'shieldLevel' })
      });
      const data = await res.json();
      
      if (data.success && data.user) {
        const maxHealth = data.user.ship.shieldLevel * 100;
        set({
          user: { ...state.user, coins: data.user.coins },
          shieldLevel: data.user.ship.shieldLevel,
          maxHealth,
          health: maxHealth
        });
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (e) {
      console.error("Upgrade failed:", e);
      set({
        user: { ...state.user, coins: state.user.coins + cost },
        shieldLevel: state.shieldLevel,
        maxHealth: state.shieldLevel * 100,
        health: state.shieldLevel * 100
      });
      return false;
    }
  },

  upgradeFuel: async () => {
    const state = get();
    if (!state.user) return false;

    const cost = state.fuelLevel * 125;
    if (state.user.coins < cost) return false;

    set({
      user: { ...state.user, coins: state.user.coins - cost },
      fuelLevel: state.fuelLevel + 1,
      maxFuel: (state.fuelLevel + 1) * 100,
      fuel: (state.fuelLevel + 1) * 100
    });

    try {
      const res = await fetch('http://localhost:3001/api/ship/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.user.id, upgradeType: 'fuelLevel' })
      });
      const data = await res.json();
      
      if (data.success && data.user) {
        const maxFuel = data.user.ship.fuelLevel * 100;
        set({
          user: { ...state.user, coins: data.user.coins },
          fuelLevel: data.user.ship.fuelLevel,
          maxFuel,
          fuel: maxFuel
        });
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (e) {
      console.error("Upgrade failed:", e);
      set({
        user: { ...state.user, coins: state.user.coins + cost },
        fuelLevel: state.fuelLevel,
        maxFuel: state.fuelLevel * 100,
        fuel: state.fuelLevel * 100
      });
      return false;
    }
  },

  syncRunResults: async (distance: number, coins: number) => {
    const state = get();
    if (!state.user) return;
    try {
      const payload = { 
        userId: state.user.id, 
        distance, 
        coins, 
        xp: Math.floor(distance / 10),
        cargoCollected: state.cargoCollected
      };
      socket.emit('submitScore', payload);
      
      // Auto refresh leaderboard if we just submitted
      get().fetchLeaderboard();
    } catch (e) {
      console.error(e);
    }
  },

  fetchLeaderboard: async () => {
    try {
      const res = await fetch('http://localhost:3001/api/leaderboard');
      const data = await res.json();
      if (data.success) {
        set({ topRunners: data.leaderboard });
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    }
  },

  updateUsername: async (newName: string) => {
    const state = get();
    if (!state.user) return;
    try {
      const res = await fetch('http://localhost:3001/api/user/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.user.id, newName })
      });
      const data = await res.json();
      if (data.success) {
        set({ user: data.user });
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Server error' };
    }
  }
}));
