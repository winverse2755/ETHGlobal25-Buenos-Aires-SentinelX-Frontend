import { useState, useEffect } from "react";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { keccak256, formatUnits, stringToBytes } from "viem";
import { celoSepolia } from "viem/chains";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const CELO_CHAIN_ID = celoSepolia.id;
const APPCHAIN_CHAIN_ID = 4661;
const RARI_CHAIN_ID = 1918988905;

const USDC_ADDRESSES = {
  celo: "0xE3347DC25e96F65E0029B18595bCAf6656Ed027e",
  appchain: "0xcF203c5f8Ef52DBC1451Fc48db1Fc4a54E0935b3",
  rari: "0x1ed6fd61b72E24084A92d94999858D51161676CE",
};

const CELO_FREEZER_ADDRESS = "0x2Ad79330D074236D4A8f401B549a9CE9b7f0a197";

const PAUSER_ROLE = keccak256(stringToBytes("PAUSER_ROLE"));

const ERC20_ABI = [
  {
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const MainPage = () => {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const [balances, setBalances] = useState({
    celo: "0",
    appchain: "0",
    rari: "0",
  });
  const [protecting, setProtecting] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [balanceErrors, setBalanceErrors] = useState({
    celo: false,
    appchain: false,
    rari: false,
  });

  const celoBalance = useBalance({
    address,
    token: USDC_ADDRESSES.celo as `0x${string}`,
    chainId: CELO_CHAIN_ID,
    query: {
      enabled: !!address,
      retry: 1,
      retryDelay: 1000,
    },
  });

  const appchainBalance = useBalance({
    address,
    token: USDC_ADDRESSES.appchain as `0x${string}`,
    chainId: APPCHAIN_CHAIN_ID,
    query: {
      enabled: !!address,
      retry: 1,
      retryDelay: 1000,
    },
  });

  const rariBalance = useBalance({
    address,
    token: USDC_ADDRESSES.rari as `0x${string}`,
    chainId: RARI_CHAIN_ID,
    query: {
      enabled: !!address,
      retry: 1,
      retryDelay: 1000,
    },
  });

  useEffect(() => {
    if (celoBalance.data) {
      setBalances((prev) => ({
        ...prev,
        celo: formatUnits(celoBalance.data.value, 18),
      }));
      setBalanceErrors((prev) => ({ ...prev, celo: false }));
    }
    if (celoBalance.isError) {
      setBalanceErrors((prev) => ({ ...prev, celo: true }));
    }
  }, [celoBalance.data, celoBalance.isError]);

  useEffect(() => {
    if (appchainBalance.data) {
      setBalances((prev) => ({
        ...prev,
        appchain: formatUnits(appchainBalance.data.value, 18),
      }));
      setBalanceErrors((prev) => ({ ...prev, appchain: false }));
    }
    if (appchainBalance.isError) {
      setBalanceErrors((prev) => ({ ...prev, appchain: true }));
    }
  }, [appchainBalance.data, appchainBalance.isError]);

  useEffect(() => {
    if (rariBalance.data) {
      setBalances((prev) => ({
        ...prev,
        rari: formatUnits(rariBalance.data.value, 18),
      }));
      setBalanceErrors((prev) => ({ ...prev, rari: false }));
    }
    if (rariBalance.isError) {
      setBalanceErrors((prev) => ({ ...prev, rari: true }));
    }
  }, [rariBalance.data, rariBalance.isError]);

  const handleGrantRole = async (chain: "celo" | "appchain" | "rari") => {
    const targetChainId =
      chain === "celo"
        ? CELO_CHAIN_ID
        : chain === "appchain"
        ? APPCHAIN_CHAIN_ID
        : RARI_CHAIN_ID;
    const tokenAddress = USDC_ADDRESSES[chain];

    if (chainId !== targetChainId) {
      switchChain({ chainId: targetChainId });
      return;
    }

    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "grantRole",
      args: [PAUSER_ROLE, CELO_FREEZER_ADDRESS as `0x${string}`],
    });
  };

  const handleProtectMe = async () => {
    if (!address) {
      console.warn("[Frontend] Cannot register wallet: no address available");
      return;
    }

    console.log("[Frontend] Initiating wallet registration:", { address });
    setProtecting(true);
    try {
      const response = await axios.post(
        "http://localhost:4000/register-wallet",
        {
          address: address,
        }
      );
      if (response.data.success) {
        console.log("[Frontend] Wallet successfully registered:", {
          address: response.data.address,
          timestamp: new Date().toISOString(),
        });
        setIsProtected(true);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("[Frontend] Error registering wallet:", error);
      if (axios.isAxiosError(error)) {
        console.error("[Frontend] Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
      }
    } finally {
      setProtecting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center">
          <h1 className="text-3xl mb-6 gradient-text">
            Please connect your wallet
          </h1>
          <ConnectButton accountStatus="avatar" showBalance={false} />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
            onClick={() => setShowSuccessModal(false)}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="glass-effect rounded-3xl p-10 max-w-md w-full mx-4 border border-purple-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-24 h-24 mb-8 relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
                    <motion.svg
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="w-14 h-14 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  </div>
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl font-bold mb-4 gradient-text">
                  Wallet Protected!
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-300 mb-8 text-lg leading-relaxed">
                  Your wallet address has been successfully registered for
                  real-time monitoring and automatic protection.
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="glass-effect rounded-xl p-5 mb-8 w-full border border-purple-400/20">
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                    Registered Address
                  </p>
                  <p className="text-sm font-mono text-purple-400 break-all">
                    {address}
                  </p>
                </motion.div>
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSuccessModal(false)}
                  className="button-glow w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 px-8 py-4 rounded-xl transition-all duration-300 font-semibold text-lg shadow-lg shadow-purple-500/30">
                  Got it!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, 100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, -100, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 p-6 md:p-8">
          <div className="max-w-7xl  mx-auto">
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12 bg">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl md:text-4xl font-bold mb-2 gradient-text">
                    SentinelX{" "}
                  </motion.h1>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-4">
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="/malicious-dapp"
                    className="px-4 py-2 rounded-lg border border-red-400/30 hover:border-red-400/60 hover:bg-red-400/10 text-red-400 hover:text-red-300 transition-all duration-300 text-sm font-medium">
                    ⚠️ Demo
                  </motion.a>
                  <ConnectButton accountStatus="avatar" showBalance={false} />
                </motion.div>
              </div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Balance",
                    value: (
                      parseFloat(balances.celo || "0") +
                      parseFloat(balances.appchain || "0") +
                      parseFloat(balances.rari || "0")
                    ).toFixed(2),
                    subtitle: "USDC",
                  },
                  {
                    label: "Chains Monitored",
                    value: "3",
                    subtitle: "Active",
                  },
                  {
                    label: "Protection Status",
                    value: isProtected ? "Active" : "Inactive",
                    subtitle: isProtected
                      ? "24/7 Monitoring"
                      : "Enable to start",
                    valueColor: isProtected
                      ? "text-green-400"
                      : "text-gray-400",
                  },
                  {
                    label: "Response Time",
                    value: "<2s",
                    subtitle: "Instant freeze",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="glass-effect rounded-xl p-5 border border-purple-400/30 relative overflow-hidden group"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 50%, rgba(240, 147, 251, 0.15) 100%)",
                    }}>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(102, 126, 234, 0.4) 0%, rgba(118, 75, 162, 0.4) 50%, rgba(240, 147, 251, 0.4) 100%)",
                      }}
                    />
                    <div className="relative z-10">
                      <p className="text-gray-300 text-sm mb-2 font-medium">
                        {stat.label}
                      </p>
                      <p
                        className={`text-2xl font-bold mb-1 ${
                          stat.valueColor || "text-white"
                        }`}>
                        {stat.value}
                      </p>
                      <p className="text-gray-400 text-xs">{stat.subtitle}</p>
                    </div>
                    <div
                      className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-30"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(102, 126, 234, 0.4) 0%, rgba(240, 147, 251, 0.4) 100%)",
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.header>

            {/* Hero Protection Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-effect rounded-3xl p-8 md:p-12 mb-12 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                  <div className="flex-1">
                    <motion.h2
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-3xl md:text-4xl font-bold mb-4 text-white">
                      {isProtected ? (
                        <>
                          <span className="text-green-400">✓ Protected</span> &
                          Ready
                        </>
                      ) : (
                        "Enable Protection Now"
                      )}
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="text-gray-300 text-lg leading-relaxed max-w-2xl">
                      {isProtected
                        ? "Your wallet is being monitored 24/7. We'll automatically freeze suspicious transactions across all chains to keep your funds safe."
                        : "Activate real-time monitoring and automatic protection. We'll watch for suspicious activity and freeze tokens instantly if threats are detected."}
                    </motion.p>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isProtected
                        ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30"
                        : "bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-400/30"
                    }`}>
                    {/* {isProtected ? (
                      <motion.svg
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-10 h-10 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </motion.svg>
                    ) : (
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    )} */}
                    {isProtected ? (
                      <motion.svg
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-10 h-10 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </motion.svg>
                    ) : (
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    )}
                  </motion.div>
                </div>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleProtectMe}
                  disabled={protecting || isProtected}
                  className={`button-glow w-full md:w-auto px-10 py-5 rounded-xl transition-all duration-300 font-semibold text-lg shadow-lg ${
                    isProtected
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 cursor-default shadow-green-500/30"
                      : protecting
                      ? "bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-500/30"
                  }`}>
                  {isProtected
                    ? "✓ Protection Active"
                    : protecting
                    ? "Activating Protection..."
                    : "🛡️ Activate Protection"}
                </motion.button>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 font-medium">
                      Error: {error.message}
                    </p>
                  </motion.div>
                )}
                {isConfirmed && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <p className="text-green-400 font-medium">
                      ✓ Transaction confirmed!
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* How It Works Section */}
            {!isProtected && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="glass-effect rounded-2xl p-8 mb-12 border border-white/10">
                <h3 className="text-xl font-bold mb-4 text-white">
                  How Protection Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      step: "1",
                      title: "Monitor",
                      description:
                        "We watch all transactions and approvals across your connected chains in real-time.",
                      icon: "👁️",
                    },
                    {
                      step: "2",
                      title: "Detect",
                      description:
                        "Suspicious approvals or drain attempts are instantly identified using advanced algorithms.",
                      icon: "🔍",
                    },
                    {
                      step: "3",
                      title: "Protect",
                      description:
                        "Tokens are automatically frozen across all chains before any funds can be moved.",
                      icon: "🛡️",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-400/30 flex items-center justify-center text-2xl">
                          {item.icon}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-purple-400">
                            STEP {item.step}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {item.title}
                        </h4>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Your Assets Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isProtected ? 0.9 : 1.3 }}
              className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Your Assets
                </h2>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: isProtected ? 1 : 1.4 }}
                  className="text-sm text-gray-400">
                  {isProtected && (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Protected
                    </span>
                  )}
                </motion.div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: "Celo",
                    chain: "celo",
                    chainId: CELO_CHAIN_ID,
                    balance: balances.celo,
                    isLoading: celoBalance.isLoading,
                    error: balanceErrors.celo,
                    icon: "🌕",
                    color: "yellow",
                    gradient: "from-yellow-500/20 to-orange-500/20",
                    borderColor: "border-yellow-400/30",
                    textColor: "text-yellow-400",
                  },
                  {
                    name: "Appchain",
                    chain: "appchain",
                    chainId: APPCHAIN_CHAIN_ID,
                    balance: balances.appchain,
                    isLoading: appchainBalance.isLoading,
                    error: balanceErrors.appchain,
                    icon: "🔗",
                    color: "blue",
                    gradient: "from-blue-500/20 to-cyan-500/20",
                    borderColor: "border-blue-400/30",
                    textColor: "text-blue-400",
                  },
                  {
                    name: "Rari",
                    chain: "rari",
                    chainId: RARI_CHAIN_ID,
                    balance: balances.rari,
                    isLoading: rariBalance.isLoading,
                    error: balanceErrors.rari,
                    icon: "💎",
                    color: "pink",
                    gradient: "from-pink-500/20 to-rose-500/20",
                    borderColor: "border-pink-400/30",
                    textColor: "text-pink-400",
                  },
                ].map((asset, index) => (
                  <motion.div
                    key={asset.chain}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="card-hover glass-effect rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${asset.gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`}
                    />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">
                          {asset.name} USDC
                        </h3>
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${asset.gradient} border ${asset.borderColor} flex items-center justify-center`}>
                          <span className={`${asset.textColor} text-xl`}>
                            {asset.icon}
                          </span>
                        </motion.div>
                      </div>
                      <div className="mb-6">
                        <p className="text-gray-400 text-sm mb-2 font-medium">
                          Balance
                        </p>
                        <motion.div
                          key={asset.balance}
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          className="flex items-baseline gap-2">
                          <p className="text-3xl font-bold text-white">
                            {asset.isLoading
                              ? "..."
                              : asset.error
                              ? "Error"
                              : asset.balance}
                          </p>
                          <span className="text-gray-500 text-lg">USDC</span>
                        </motion.div>
                        {asset.isLoading && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${asset.gradient.replace(
                                "/20",
                                ""
                              )}`}
                            />
                          </motion.div>
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          handleGrantRole(
                            asset.chain as "celo" | "appchain" | "rari"
                          )
                        }
                        disabled={isPending || isConfirming}
                        className="button-glow w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-4 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-purple-500/20">
                        {chainId !== asset.chainId
                          ? `Switch to ${asset.name}`
                          : isPending || isConfirming
                          ? "Processing..."
                          : "Grant Pauser Role"}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Protection Features */}
            {isProtected && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="glass-effect rounded-2xl p-8 border border-green-500/20 bg-green-500/5">
                <div className="flex items-start gap-4">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 flex items-center justify-center">
                    <span className="text-2xl">🔄</span>
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-white">
                      Active Monitoring
                    </h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      Your wallet is being monitored across Celo, Appchain, and
                      Rari networks. Any suspicious activity will trigger an
                      automatic freeze to protect your funds.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {["Celo", "Appchain", "Rari"].map((chain) => (
                        <span
                          key={chain}
                          className="px-3 py-1 rounded-lg bg-green-500/10 border border-green-400/20 text-green-400 text-sm font-medium">
                          ✓ {chain}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MainPage;
