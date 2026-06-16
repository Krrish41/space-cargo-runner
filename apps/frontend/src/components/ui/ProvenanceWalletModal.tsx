import { useState, useEffect, useRef } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Download, ExternalLink, Wallet, AlertCircle, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/useStore';

const UI_STATES = {
  DEFAULT: 'DEFAULT',
  INSTALL_METAMASK: 'INSTALL_METAMASK',
  INSTALL_RAINBOW: 'INSTALL_RAINBOW',
  CONNECTING: 'CONNECTING',
  ERROR: 'ERROR',
  MOBILE_INSTALL_REQUIRED: 'MOBILE_INSTALL_REQUIRED',
  MOBILE_ACTION_REQUIRED: 'MOBILE_ACTION_REQUIRED',
  IN_APP_BROWSER: 'IN_APP_BROWSER',
  WARNING: 'WARNING'
} as const;

type UiState = typeof UI_STATES[keyof typeof UI_STATES];

interface ProvenanceWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProvenanceWalletModal = ({ isOpen, onClose }: ProvenanceWalletModalProps) => {
  const { connect, connectors, error: connectError } = useConnect();
  const { isConnecting, isConnected } = useAccount();
  const [uiState, setUiState] = useState<UiState>(UI_STATES.DEFAULT);
  const [selectedConnector, setSelectedConnector] = useState<any>(null);
  const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
  const { hasGuestProgress } = useStore();

  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isInAppBrowser = typeof navigator !== 'undefined' && /Twitter|Instagram|FBAV|Telegram/i.test(navigator.userAgent);

  // Auto-close on successful connection
  useEffect(() => {
    if (isConnected) {
      if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
      onClose();
    }
  }, [isConnected, onClose]);

  // Aggressive In-App Browser Auto-Connect
  useEffect(() => {
    if (isMobile && !isConnected && typeof window !== 'undefined' && (window as any).ethereum) {
      const injectedConnector = connectors.find(c => 
        c.id === 'injected' || 
        c.name.toLowerCase().includes('metamask') || 
        c.name.toLowerCase().includes('rainbow')
      );

      if (injectedConnector) {
        console.log("[Provenance] Web3 Browser detected. Auto-connecting...");
        connect({ connector: injectedConnector });
      }
    }
  }, [isConnected, connectors, connect]);

  // Handle Wagmi connection errors
  useEffect(() => {
    if (connectError && selectedConnector) {
      if (
        connectError.message?.includes('already connected') ||
        connectError.message?.includes('Connector not found') ||
        connectError.message?.includes('Resource unavailable')
      ) {
        return;
      }

      if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
      
      const isUserRejection = 
        connectError.name === 'UserRejectedRequestError' || 
        connectError.message?.toLowerCase().includes('user rejected') ||
        connectError.message?.toLowerCase().includes('user denied') ||
        (connectError as any)?.code === 4001;

      if (isUserRejection) {
        setUiState(isMobile ? UI_STATES.MOBILE_ACTION_REQUIRED : UI_STATES.ERROR);
      } else {
        if (!isMobile) {
          console.warn("[Provenance] Desktop connection error suppressed:", connectError.message);
          return;
        }
        setUiState(UI_STATES.MOBILE_INSTALL_REQUIRED);
      }
    }
  }, [connectError, isMobile, selectedConnector]);

  useEffect(() => {
    const blockingStates: UiState[] = [UI_STATES.INSTALL_METAMASK, UI_STATES.INSTALL_RAINBOW, UI_STATES.MOBILE_INSTALL_REQUIRED, UI_STATES.IN_APP_BROWSER, UI_STATES.MOBILE_ACTION_REQUIRED];
    if (isConnecting && !blockingStates.includes(uiState)) {
      setUiState(UI_STATES.CONNECTING);
    }
  }, [isConnecting, uiState]);

  const handleConnectorClick = async (connector: any) => {
    setSelectedConnector(connector);
    if (connectionTimeout.current) clearTimeout(connectionTimeout.current);

    if (isMobile) {
      if (isInAppBrowser) {
        setUiState(UI_STATES.IN_APP_BROWSER);
        return;
      }
      setUiState(UI_STATES.MOBILE_ACTION_REQUIRED);
      return;
    }

    const name = connector.name.toLowerCase();
    const win = window as any;
    const hasInjected = typeof window !== 'undefined' && !!win.ethereum;
    const isMetaMask = hasInjected && !!win.ethereum.isMetaMask;
    const isRainbow = hasInjected && !!win.ethereum.isRainbow;
    
    if (name.includes('metamask') && !isMetaMask) {
      setUiState(UI_STATES.INSTALL_METAMASK);
      return;
    }

    if (name.includes('rainbow') && !isRainbow) {
      setUiState(UI_STATES.INSTALL_RAINBOW);
      return;
    }

    if (hasGuestProgress() && uiState !== UI_STATES.WARNING) {
      setUiState(UI_STATES.WARNING);
      return;
    }

    handleProceedConnection(connector);
  };

  const handleProceedConnection = (connectorToConnect: any = selectedConnector) => {
    if (!connectorToConnect) return;
    try {
      setUiState(UI_STATES.CONNECTING);
      connect({ connector: connectorToConnect });
    } catch (err: any) {
      console.error("[Provenance] Desktop connect sync error:", err);
      if (err.name === 'UserRejectedRequestError' || err?.code === 4001) {
        setUiState(UI_STATES.ERROR);
      }
    }
  };
  useEffect(() => {
    if (!isOpen) {
      if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
      setUiState(UI_STATES.DEFAULT);
      setSelectedConnector(null);
    }
  }, [isOpen]);

  const visibleConnectors = connectors
    .filter((connector, index, self) => 
      index === self.findIndex((c) => c.name === connector.name)
    )
    .filter(c => 
      c.id !== 'walletConnect' && 
      c.name.toLowerCase() !== 'injected'
    );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0 }}
          />

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={{ 
              position: 'relative', 
              background: '#0a0f18', 
              border: '2px solid #00ffcc', 
              borderRadius: '12px', 
              width: '100%', 
              maxWidth: '850px', 
              display: 'flex', 
              flexDirection: 'row', 
              minHeight: '480px', 
              boxShadow: '0 0 50px rgba(0,255,204,0.3)',
              overflow: 'hidden',
              zIndex: 10000
            }}
          >
            <button 
              onClick={onClose}
              style={{ position: 'absolute', top: '16px', right: '16px', color: '#00ffcc', cursor: 'pointer', zIndex: 20, background: 'transparent', border: 'none' }}
            >
              <X size={24} />
            </button>

            {/* Left Pane - Provider List */}
            <div style={{ width: '35%', borderRight: '1px solid rgba(0,255,204,0.3)', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(0,0,0,0.5)' }}>
              <h3 style={{ color: '#8899b5', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid rgba(0,255,204,0.2)', paddingBottom: '16px' }}>Provider Uplink</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {visibleConnectors.map((connector) => {
                  const isSelected = selectedConnector?.id === connector.id;
                  return (
                    <button
                      key={connector.id}
                      onClick={() => handleConnectorClick(connector)}
                      className={`provider-btn ${isSelected ? 'selected' : ''}`}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,255,204,0.3)', flexShrink: 0 }}>
                        <Wallet size={18} color={isSelected ? '#00ffcc' : '#8899b5'} />
                      </div>
                      <span style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: isSelected ? 'bold' : 'normal' }}>{connector.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Pane - Dynamic States */}
            <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
              <AnimatePresence mode="wait">
                {uiState === UI_STATES.DEFAULT ? (
                  <motion.div 
                    key="default"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
                  >
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px dashed rgba(0,255,204,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffcc', marginBottom: '16px' }}>
                      <Wallet size={48} />
                    </div>
                    <h2 style={{ color: '#fff', fontSize: '26px', letterSpacing: '2px', fontFamily: 'monospace', textTransform: 'uppercase', margin: 0 }}>SYSTEM STANDBY</h2>
                    <p style={{ color: '#8899b5', fontFamily: 'monospace', fontSize: '16px', maxWidth: '320px', lineHeight: 1.6, marginTop: '8px' }}>
                      Select a provider from the menu to authenticate your ship and establish uplink.
                    </p>
                  </motion.div>
                ) : uiState === UI_STATES.CONNECTING ? (
                  <motion.div 
                    key="connecting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}
                  >
                    <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ position: 'absolute', inset: 0, background: '#00ffcc', borderRadius: '50%', filter: 'blur(20px)' }}
                      />
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                        style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px dashed rgba(0, 255, 204, 0.5)' }}
                      />
                      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid rgba(0, 255, 204, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        >
                          <Loader2 size={32} color="#00ffcc" />
                        </motion.div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h3 style={{ color: '#fff', fontSize: '18px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Awaiting Signature...
                      </h3>
                      <p style={{ color: '#00ffcc', fontSize: '12px' }}>
                        Confirm the connection request in your wallet.
                      </p>
                    </div>
                  </motion.div>
                ) : uiState === UI_STATES.ERROR ? (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
                  >
                    <div style={{ color: '#ff3366', marginBottom: '8px' }}>
                      <AlertCircle size={48} />
                    </div>
                    <h3 style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>Connection Failed</h3>
                    <p style={{ color: '#00ffcc', fontSize: '14px', maxWidth: '220px' }}>The connection was aborted or timed out.</p>
                    <button 
                      onClick={() => {
                        setUiState(UI_STATES.DEFAULT);
                        setSelectedConnector(null);
                      }}
                      style={{ marginTop: '16px', color: '#00ffcc', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Back to List
                    </button>
                  </motion.div>
                ) : (uiState === UI_STATES.INSTALL_METAMASK || uiState === UI_STATES.INSTALL_RAINBOW) ? (
                  <motion.div 
                    key="install"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}
                  >
                    <div style={{ width: '80px', height: '80px', background: 'rgba(0,255,204,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffcc', border: '1px solid rgba(0,255,204,0.3)' }}>
                      <Download size={40} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                        {uiState === UI_STATES.INSTALL_METAMASK ? 'MetaMask Not Detected' : 'Rainbow Not Detected'}
                      </h2>
                      <p style={{ color: '#00ffcc', fontSize: '14px', maxWidth: '280px', margin: '0 auto' }}>
                        You must install the browser extension to interact.
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '240px' }}>
                      <a 
                        href={uiState === UI_STATES.INSTALL_METAMASK ? 'https://metamask.io/download/' : 'https://rainbow.me/download'}
                        target="_blank"
                        rel="noreferrer"
                        className="physical-btn primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                      >
                        Install {uiState === UI_STATES.INSTALL_METAMASK ? 'MetaMask' : 'Rainbow'}
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </motion.div>
                ) : uiState === UI_STATES.WARNING ? (
                  <motion.div 
                    key="warning"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
                  >
                    <div style={{ color: '#ff005a', marginBottom: '4px' }}>
                      <AlertTriangle size={64} />
                    </div>
                    <h2 style={{ color: '#ff005a', fontSize: '24px', letterSpacing: '2px', fontFamily: 'monospace', textTransform: 'uppercase', margin: 0, textShadow: '0 0 10px rgba(255,0,90,0.5)' }}>SYSTEM OVERRIDE DETECTED</h2>
                    <p style={{ color: '#ffccdd', fontFamily: 'monospace', fontSize: '15px', maxWidth: '380px', lineHeight: 1.6 }}>
                      Linking a wallet will overwrite your current guest progress with your saved profile. Do you wish to proceed?
                    </p>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '16px', width: '100%', justifyContent: 'center' }}>
                      <button 
                        onClick={() => {
                          setUiState(UI_STATES.DEFAULT);
                          setSelectedConnector(null);
                        }}
                        className="physical-btn"
                        style={{ minWidth: '140px', background: 'transparent', border: '1px solid #8899b5', color: '#8899b5' }}
                      >
                        [ ABORT ]
                      </button>
                      <button 
                        onClick={() => handleProceedConnection()}
                        className="physical-btn"
                        style={{ minWidth: '140px', background: 'rgba(255,0,90,0.1)', border: '1px solid #ff005a', color: '#ff005a', boxShadow: '0 0 15px rgba(255,0,90,0.2)' }}
                      >
                        [ PROCEED ]
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProvenanceWalletModal;
