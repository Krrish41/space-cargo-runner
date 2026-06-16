import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import { createConfig, http, WagmiProvider } from 'wagmi';
import { polygon, base, mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { WalletModalProvider } from './context/WalletModalContext';

const config = createConfig({
  chains: [polygon, base, mainnet],
  connectors: [
    injected(), 
    injected({ target: 'metaMask' }),
    injected({ target: 'rainbow' }),
    walletConnect({ 
      projectId: 'c03d4d825a075306ea64eddb747a5446',
      showQrModal: false,
      metadata: {
        name: 'Space Cargo Runner',
        description: 'Retro Web3 Game',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: []
      }
    }),
  ],
  transports: {
    [polygon.id]: http(),
    [base.id]: http(),
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
