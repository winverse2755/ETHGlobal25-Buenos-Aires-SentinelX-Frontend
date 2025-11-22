import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { celo, celoAlfajores, celoSepolia } from "viem/chains";
import { defineChain } from "viem";

const AirDAO_NETWORK = {
  id: 16718,
  name: "AirDAO Mainnet",
  nativeCurrency: { name: "AMB", symbol: "AMB", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.airdao.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "AirDAO Explorer",
      url: "https://airdao.io/explorer/",
      apiUrl: "https://airdao.io/explorer//api",
    },
  },
};

const RARI_NETWORK = defineChain({
  id: 1918988905,
  name: "Rari",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rari-testnet.calderachain.xyz/"],
    },
  },
  blockExplorers: {
    default: {
      name: "Rari Explorer",
      url: "https://explorer.rari.xyz",
    },
  },
});

const APPCHAIN_NETWORK = defineChain({
  id: 4661,
  name: "Appchain",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://appchaintestnet.rpc.caldera.xyz/http"],
    },
  },
  blockExplorers: {
    default: {
      name: "Appchain Explorer",
      url: "https://explorer.appchain.io",
    },
  },
});

export const wagmiConfig = getDefaultConfig({
  appName: "HarborStake",
  projectId: "c4a7e569513c0a57eab30b6824f31e04",
  chains: [
    celo,
    celoSepolia,
    celoAlfajores,
    AirDAO_NETWORK,
    RARI_NETWORK,
    APPCHAIN_NETWORK,
  ],
  ssr: false,
});
