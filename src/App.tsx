import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Homepage from "./pages/Homepage";
import MainPage from "./pages/MainPage";
import MaliciousDapp from "./pages/MaliciousDapp";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { wagmiConfig } from "./config/wagmi";
import { celoSepolia } from "viem/chains";

// export const wagmiConfig = getDefaultConfig({
//   appName: "HarborStake",
//   projectId: "c4a7e569513c0a57eab30b6824f31e04",
//   chains: [CUSTOM_BSC, AirDAO_NETWORK],
//   ssr: false, // Disable SSR to prevent hydration issues
// });

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          initialChain={celoSepolia}
          theme={darkTheme()}
          showRecentTransactions={true}
          coolMode={true}>
          <Router>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/mainpage" element={<MainPage />} />
              <Route path="/malicious-dapp" element={<MaliciousDapp />} />
            </Routes>
          </Router>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
