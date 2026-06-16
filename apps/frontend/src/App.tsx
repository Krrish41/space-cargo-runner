import { useEffect, useState, useRef } from 'react';
import { useStore } from './store/useStore';
import { PhaserGame } from './game/PhaserGame';
import { Rocket, Coins, Trophy, Settings, LogOut, User } from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';
import { useWalletModal } from './context/WalletModalContext';
import ProvenanceWalletModal from './components/ui/ProvenanceWalletModal';
import EditPilotModal from './components/ui/EditPilotModal';
import { socket } from './lib/socket';
import type { UserProfile } from 'shared';
import './App.css';
import './styles/console.css';

function App() {
  const { gameState, distance, coinsCollected, health, maxHealth, shieldLevel, fuel, maxFuel, fuelLevel, setGameState, resetRun, user, setUser, syncPlayerStats, upgradeShield, upgradeFuel } = useStore();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [walletBound, setWalletBound] = useState(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const initAttempted = useRef(false);
  const { isWalletModalOpen, openWalletModal, closeWalletModal } = useWalletModal();
  const getPilotLevel = useStore((state) => state.getPilotLevel);
  const getXpProgress = useStore((state) => state.getXpProgress);
  const liveFeed = useStore((state) => state.liveFeed);
  const topRunners = useStore((state) => state.topRunners);
  const fetchLeaderboard = useStore((state) => state.fetchLeaderboard);

  useEffect(() => {
    socket.on('scoreUpdated', (updatedUser: UserProfile) => {
      // If this is the current player, sync their new state locally
      if (user && updatedUser.id === user.id) {
        setUser(updatedUser);
      }
      useStore.getState().pushToLiveFeed(updatedUser);
    });

    return () => {
      socket.off('scoreUpdated');
    };
  }, [user, setUser]);

  // Initialize Guest User
  useEffect(() => {
    if (!user && !initAttempted.current) {
      initAttempted.current = true;
      const initGuest = async () => {
        try {
          const storedGuestId = localStorage.getItem('guestId');
          const storedUserId = localStorage.getItem('userId');
          
          const payload: any = { isGuest: true };
          if (storedUserId) payload.userId = storedUserId;
          else if (storedGuestId) payload.username = storedGuestId;

          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
          const res = await fetch(`${backendUrl}/api/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('guestId', data.user.username); // Keep for legacy
            setUser(data.user);
            syncPlayerStats(data.user);
          }
        } catch (e) {
          console.error('Failed to init guest from backend. Falling back to offline mode:', e);
          // Offline Fallback so the game doesn't permanently lock out
          const offlineUser = {
            id: 'offline-' + Math.random().toString(36).substring(2, 9),
            username: 'Offline Pilot',
            coins: 0,
            highScore: 0,
            shipEngineLevel: 1,
            shipHandlingLevel: 1,
            shipShieldLevel: 1,
            walletAddress: null
          };
          setUser(offlineUser);
        }
      };
      initGuest();
    }
  }, [user, setUser]);

  useEffect(() => {
    // If a wallet is connected and we haven't bound it to this session user yet
    if (isConnected && address && user && !walletBound) {
      const bindWallet = async () => {
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
          const res = await fetch(`${backendUrl}/api/wallet/bind`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, walletAddress: address })
          });
          const data = await res.json();
          if (data.success) {
            console.log('Wallet bound successfully:', data.user.walletAddress);
            setWalletBound(true);
            syncPlayerStats(data.user);
          }
        } catch (e) {
          console.error(e);
        }
      };
      bindWallet();
    }
  }, [isConnected, address, user, walletBound]);

  const handleStart = () => {
    resetRun();
    setGameState('PLAYING');
  };

  const handleOpenLeaderboard = () => {
    fetchLeaderboard();
    setGameState('LEADERBOARD');
  };

  return (
    <>
      <PhaserGame />
      
      <div className="console-overlay">
        
        {/* Top Cockpit Bar: HUD & Player ID */}
        <div className="hud-cockpit">
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {gameState === 'PLAYING' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="hud-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '0.7rem', color: '#8899b5', letterSpacing: '2px', marginBottom: '4px' }}>HULL INTEGRITY</div>
                    <div className="health-bar-container">
                      <div 
                        className="health-bar-fill" 
                        style={{ width: `${(health / maxHealth) * 100}%`, background: health > 30 ? 'var(--primary)' : '#ff005a' }}
                      ></div>
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>{health} / {maxHealth} HP</div>
                  </div>

                  <div className="hud-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '0.7rem', color: '#8899b5', letterSpacing: '2px', marginBottom: '4px' }}>FUEL CORE DISSIPATION</div>
                    <div className="fuel-bar-container">
                      <div className="hud-bar-bg">
                        <div className="hud-bar-fill fuel-bar-fill" style={{ width: `${(fuel / maxFuel) * 100}%` }}></div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>{Math.floor(fuel)} / {maxFuel} EU</div>
                  </div>

                  {/* EXPERIENCE/RANK */}
                  <div className="hud-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '0.7rem', color: '#00ffcc', letterSpacing: '2px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>PILOT RANK</span>
                      <span>LVL {getPilotLevel()}</span>
                    </div>
                    <div className="fuel-bar-container" style={{ width: '150px' }}>
                      <div className="hud-bar-bg">
                        <div className="hud-bar-fill xp-bar-fill" style={{ width: `${getXpProgress()}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hud-item">
                  <Rocket className="text-primary" />
                  <span className="stat-value">{Math.floor(distance)}m</span>
                </div>
                <div className="hud-item">
                  <Coins className="text-secondary" color="#ff00ff" />
                  <span className="stat-value">{coinsCollected}</span>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Interactive Top-Right Wallet Panel */}
        <div className="console-interactive wallet-panel-container">
          <div className="player-id-panel">
            <div className={`status-light ${isConnected ? 'connected' : 'disconnected'}`}></div>
            
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="profile-avatar">
                  <User size={24} color={isConnected ? "var(--primary)" : "#8899b5"} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', color: '#8899b5' }}>
                    {isConnected ? 'LINKED PILOT' : 'GUEST PILOT'}
                  </span>
                  <strong 
                    style={{ fontSize: '1.2rem', letterSpacing: '1px', cursor: 'pointer', borderBottom: '1px dashed #444' }}
                    onClick={() => setIsEditNameModalOpen(true)}
                    title="Click to change name"
                  >
                    {user.username}
                  </strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '20px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#ff00ff', letterSpacing: '2px' }}>CREDITS</span>
                  <strong style={{ fontSize: '1.2rem', color: '#ff00ff' }}>{user.coins} <Coins size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/></strong>
                </div>
                {isConnected ? (
                  <button 
                    className="disconnect-btn" 
                    onClick={() => {
                      disconnect();
                      localStorage.removeItem('guestId');
                      window.location.reload();
                    }}
                    title="Disconnect Wallet"
                  >
                    <LogOut size={16} />
                  </button>
                ) : (
                  <button className="physical-btn primary" style={{ padding: '6px 12px', fontSize: '0.7rem', marginLeft: '10px' }} onClick={openWalletModal}>
                    LINK WALLET
                  </button>
                )}
              </div>
            ) : (
              <div onClick={openWalletModal} className="connect-prompt">
                SYSTEM OFFLINE - LINK WALLET
              </div>
            )}
          </div>
        </div>

        {/* Center CRT Screens */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="console-interactive">
          
          {gameState === 'MENU' && (
             <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <h1 className="neon-title">Space Cargo<br/>Runner</h1>

               {/* LIVE COMMS TICKER */}
               <div className="live-comms-ticker" style={{ marginTop: '40px', border: '1px solid #00ffcc', padding: '15px', background: 'rgba(5, 5, 10, 0.85)', backdropFilter: 'blur(4px)', color: '#00ffcc', fontFamily: 'monospace', width: '100%', maxWidth: '600px', height: '140px', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,255,204,0.1)' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid rgba(0,255,204,0.3)', paddingBottom: '6px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="status-light connected" style={{ width: '8px', height: '8px' }}></div>
                    GLOBAL LIVE COMMS LINK
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', fontSize: '13px' }}>
                    {liveFeed.length === 0 ? (
                      <span className="blinking" style={{ color: '#8899b5' }}>Awaiting incoming transmissions...</span>
                    ) : (
                      liveFeed.map((feedUser, idx) => (
                        <div key={`${feedUser.id}-${idx}`} className="fade-in-ticker" style={{ display: 'flex', gap: '10px', color: '#fff' }}>
                          <span style={{ color: '#00aaff' }}>[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                          <span>
                            <strong style={{ color: 'var(--primary)' }}>{feedUser.username}</strong> achieved High Score: <span style={{ color: 'var(--secondary)' }}>{feedUser.highScore}m</span> <span style={{ color: '#ff00ff', fontSize: '11px' }}>(+{feedUser.xp} XP)</span>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
               </div>
             </div>
          )}

          {gameState === 'GAME_OVER' && (
            <div className="crt-panel" style={{ padding: '40px', textAlign: 'center', minWidth: '400px' }}>
              <h2 className="title emergency-text" style={{ fontSize: '2.5rem' }}>CRITICAL FAILURE</h2>
              <div style={{ margin: '30px 0', fontSize: '1.5rem', fontFamily: 'Courier New' }}>
                <p>Dist Traveled: <span className="stat-value">{distance}m</span></p>
                <p>Cargo Secured: <span className="stat-value" style={{ color: 'var(--secondary)' }}>{coinsCollected}</span></p>
              </div>
              <button className="physical-btn primary" onClick={handleStart} style={{ margin: '0 auto' }}>Reboot Engine</button>
            </div>
          )}

          {gameState === 'HOW_TO_PLAY' && (
            <div className="crt-panel" style={{ padding: '30px', minWidth: '500px' }}>
              <h2 className="title" style={{ fontSize: '2rem', textAlign: 'center' }}>SYSTEM MANUAL</h2>
              
              <div className="manual-entry">
                <img src={`${import.meta.env.BASE_URL}assets/cargo.png`} alt="Cargo" className="manual-sprite" />
                <div className="manual-text">
                  <strong style={{color: 'var(--secondary)'}}>CARGO:</strong> Collect for coins and XP.
                </div>
              </div>
              
              <div className="manual-entry">
                <img src={`${import.meta.env.BASE_URL}assets/asteroid.png`} alt="Asteroid" className="manual-sprite" style={{ filter: 'drop-shadow(0 0 10px rgba(255,0,0,0.5))' }} />
                <div className="manual-text">
                  <strong style={{color: '#ff3366'}}>ASTEROID:</strong> Dodge. Hits drain fuel.
                </div>
              </div>
              
              <div className="manual-entry">
                <img src={`${import.meta.env.BASE_URL}assets/fuel.png`} alt="Fuel" className="manual-sprite" style={{ filter: 'drop-shadow(0 0 10px rgba(0,170,255,0.5))' }} />
                <div className="manual-text">
                  <strong style={{color: '#00aaff'}}>FUEL:</strong> Replenish. Running empty ends session.
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button className="physical-btn" onClick={() => setGameState('MENU')} style={{ margin: '0 auto' }}>Close Manual</button>
              </div>
            </div>
          )}

          {gameState === 'SHOP' && (
            <div className="crt-panel" style={{ padding: '30px', minWidth: '500px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="title" style={{ fontSize: '2rem', margin: 0 }}>SHIP UPGRADES</h2>
                <div style={{ color: '#ff00ff', fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'Courier New' }}>
                  CREDITS: {user?.coins || 0} <Coins size={16} style={{ display: 'inline', verticalAlign: 'middle' }}/>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'Courier New', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 0, 0, 0.4)', padding: '15px', borderRadius: '8px', border: '1px solid #1a2233' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>DEFLECTOR SHIELDS</span>
                    <span style={{ color: '#8899b5' }}>Level {shieldLevel} &rarr; Level {shieldLevel + 1}</span>
                    <span style={{ color: '#8899b5', fontSize: '0.9rem' }}>Max HP: {maxHealth} &rarr; {maxHealth + 100}</span>
                  </div>
                  <button 
                    className="physical-btn" 
                    style={{ minWidth: '150px', padding: '10px' }}
                    onClick={upgradeShield}
                    disabled={!user || user.coins < shieldLevel * 150}
                  >
                    UPGRADE ({shieldLevel * 150} <Coins size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>)
                  </button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 0, 0, 0.4)', padding: '15px', borderRadius: '8px', border: '1px solid #1a2233' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '1.2rem', color: '#00f0ff' }}>PLASMA FUEL CORE</span>
                    <span style={{ color: '#8899b5' }}>Level {fuelLevel} &rarr; Level {fuelLevel + 1}</span>
                    <span style={{ color: '#8899b5', fontSize: '0.9rem' }}>Capacity: {maxFuel} &rarr; {maxFuel + 100}</span>
                  </div>
                  <button 
                    className="physical-btn" 
                    style={{ minWidth: '150px', padding: '10px' }}
                    onClick={upgradeFuel}
                    disabled={!user || user.coins < fuelLevel * 125}
                  >
                    UPGRADE ({fuelLevel * 125} <Coins size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>)
                  </button>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <button className="physical-btn" onClick={() => setGameState('MENU')} style={{ margin: '0 auto' }}>Exit Bay</button>
              </div>
            </div>
          )}

          {gameState === 'LEADERBOARD' && (
            <div className="crt-panel" style={{ padding: '30px', minWidth: '400px' }}>
              <h2 className="title" style={{ fontSize: '2rem', textAlign: 'center' }}>TOP RUNNERS</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: 'Courier New', marginBottom: '30px' }}>
                {topRunners === null ? (
                  <div style={{ textAlign: 'center', color: '#8899b5' }}>Fetching data...</div>
                ) : topRunners.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#8899b5' }}>No runners yet! Be the first!</div>
                ) : (
                  topRunners.map((runner, idx) => (
                    <div key={runner.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a2233', paddingBottom: '10px' }}>
                      <span style={runner.id === user?.id ? { color: 'var(--secondary)' } : {}}>
                        {idx + 1}. {runner.username} {runner.id === user?.id && '(You)'}
                      </span>
                      <span className="stat-value">{runner.highScore}m</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button className="physical-btn" onClick={() => setGameState('MENU')} style={{ margin: '0 auto' }}>Exit Terminal</button>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Physical Dashboard */}
        {(gameState === 'MENU' || gameState === 'GAME_OVER') && (
          <div className="console-dashboard console-interactive">
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="physical-btn primary" onClick={handleStart}>
                <Rocket size={20} /> START ENGINE
              </button>
              <button className="physical-btn" onClick={() => setGameState('SHOP')}>
                <Settings size={20} /> UPGRADES
              </button>
              <button className="physical-btn" onClick={handleOpenLeaderboard}>
                <Trophy size={20} /> LEADERBOARD
              </button>
              <button className="physical-btn" onClick={() => setGameState('HOW_TO_PLAY')}>
                HOW TO PLAY
              </button>
            </div>
          </div>
        )}

      </div>
      
      <ProvenanceWalletModal isOpen={isWalletModalOpen} onClose={closeWalletModal} />
      {user && (
        <EditPilotModal 
          isOpen={isEditNameModalOpen} 
          onClose={() => setIsEditNameModalOpen(false)} 
          currentName={user.username} 
        />
      )}
    </>
  );
}

export default App;
