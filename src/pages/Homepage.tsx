import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Homepage = () => {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
      {/* Enhanced Animated background */}
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
          className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/2 right-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"
        />
        <div
          className="fixed inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(102, 126, 234, 0.3) 0%, transparent 50%)`,
            transition: "background 0.3s ease-out",
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-50 w-full px-6 py-6 flex items-center justify-between glass-effect border-b border-white/10">
        <nav className="flex items-center gap-8">
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="/"
            className="text-white hover:text-purple-400 transition-all duration-300 font-medium relative group">
            Home
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-400 transition-all duration-300 group-hover:w-full" />
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="#how-it-works"
            className="text-white hover:text-purple-400 transition-all duration-300 font-medium relative group">
            How it Works
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-400 transition-all duration-300 group-hover:w-full" />
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="#features"
            className="text-white hover:text-purple-400 transition-all duration-300 font-medium relative group">
            Features
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-400 transition-all duration-300 group-hover:w-full" />
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/malicious-dapp"
            className="text-red-400 hover:text-red-300 transition-all duration-300 font-medium relative group px-3 py-1 rounded-lg border border-red-400/30 hover:border-red-400/60 hover:bg-red-400/10">
            ⚠️ Demo
          </motion.a>
        </nav>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}>
          <ConnectButton accountStatus="avatar" showBalance={false} />
        </motion.div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 flex flex-col items-center justify-center text-center overflow-hidden min-h-[90vh]">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-transparent to-black" />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl"
        />

        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 inline-block">
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-sm font-medium">
              🛡️ Real-Time Protection
            </motion.span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
            <span className="gradient-text">Real-Time Crypto</span>
            <br />
            <span className="text-white">Protection</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Real-time detection. Instant alerts. One-click lockdown. Your crypto
            stays yours. Sleep better knowing your wallet is protected.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <AnimatePresence mode="wait">
              {isConnected ? (
                <motion.button
                  key="proceed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/mainpage")}
                  className="button-glow px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-green-500/30 flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Proceed to Protection</span>
                </motion.button>
              ) : (
                <motion.button
                  key="get-started"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="button-glow px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-purple-500/30">
                  Get Started
                </motion.button>
              )}
            </AnimatePresence>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/malicious-dapp"
              className="px-8 py-4 bg-gray-800/50 hover:bg-gray-800 border border-white/20 hover:border-white/40 rounded-xl font-semibold text-lg transition-all duration-300">
              View Demo
            </motion.a>
          </motion.div>
        </div>

        {/* Enhanced Floating elements */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            x: [0, -10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-20 right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            y: [0, -15, 0],
            x: [0, 15, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-1/2 right-20 w-16 h-16 bg-pink-500/20 rounded-full blur-xl"
        />
      </section>

      {/* Stats Section */}
      <section className="relative px-6 py-16 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                label: "Response Time",
                value: "<2s",
                subtitle: "Instant freeze",
              },
              {
                label: "Chains Supported",
                value: "3+",
                subtitle: "Multi-chain",
              },
              {
                label: "24/7 Monitoring",
                value: "Always",
                subtitle: "Non-stop",
              },
              { label: "Zero Risk", value: "100%", subtitle: "Read-only" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-effect rounded-xl p-6 border border-purple-400/30 text-center relative overflow-hidden group"
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
                  <p className="text-3xl font-bold mb-1 text-white">
                    {stat.value}
                  </p>
                  <p className="text-gray-400 text-xs">{stat.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section
        id="how-it-works"
        className="relative px-6 py-20 md:py-32 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              How it works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Here's how we keep your wallet safe at all times — without
              changing how you use it.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Connect Your Wallet",
                description:
                  "Instant, read-only setup. No private keys. No permissions. No risk. Just connect and we start monitoring.",
                icon: (
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                ),
                color: "purple",
                gradient: "from-purple-500/20 to-purple-600/20",
                borderColor: "border-purple-400/30",
                textColor: "text-purple-400",
              },
              {
                step: "2",
                title: "We Watch Everything",
                description:
                  "Continuous monitoring of all transactions and approvals across multiple chains in real-time. Nothing escapes our watch.",
                icon: (
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ),
                color: "blue",
                gradient: "from-blue-500/20 to-blue-600/20",
                borderColor: "border-blue-400/30",
                textColor: "text-blue-400",
              },
              {
                step: "3",
                title: "Auto or Manual Lockdown",
                description:
                  "Threat detected? We freeze movement, block attackers, and notify you immediately. Your funds stay safe.",
                icon: (
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                ),
                color: "green",
                gradient: "from-green-500/20 to-green-600/20",
                borderColor: "border-green-400/30",
                textColor: "text-green-400",
              },
            ].map((card, index) => (
              <motion.div
                key={card.step}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="card-hover glass-effect rounded-2xl p-8 flex flex-col items-center text-center group relative overflow-hidden">
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`}
                />
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className={`w-20 h-20 mb-6 flex items-center justify-center bg-gradient-to-br ${card.gradient} rounded-2xl border ${card.borderColor} group-hover:border-opacity-60 transition-all duration-300 relative z-10`}>
                  <div className={card.textColor}>{card.icon}</div>
                </motion.div>
                <div className="relative z-10">
                  <span
                    className={`text-xs font-bold ${card.textColor} mb-2 block`}>
                    STEP {card.step}
                  </span>
                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-opacity-90 transition-colors duration-300">
                    {card.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative px-6 py-20 md:py-32 bg-gradient-to-b from-black/50 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Everything you need to keep your crypto safe, all in one place.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Multi-Chain Support",
                description:
                  "Protect your assets across Celo, Appchain, and Rari networks simultaneously.",
                icon: "🔗",
                color: "blue",
              },
              {
                title: "Real-Time Alerts",
                description:
                  "Get instant notifications when suspicious activity is detected on your wallet.",
                icon: "🔔",
                color: "yellow",
              },
              {
                title: "Automatic Freezing",
                description:
                  "Tokens are automatically frozen across all chains before any funds can be moved.",
                icon: "❄️",
                color: "cyan",
              },
              {
                title: "Zero Trust Required",
                description:
                  "Read-only access means we never touch your private keys or require permissions.",
                icon: "🔒",
                color: "green",
              },
              {
                title: "24/7 Monitoring",
                description:
                  "Round-the-clock surveillance of your wallet activity across all supported chains.",
                icon: "👁️",
                color: "purple",
              },
              {
                title: "Instant Response",
                description:
                  "Sub-2 second response time ensures threats are neutralized before damage occurs.",
                icon: "⚡",
                color: "pink",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass-effect rounded-xl p-6 border border-white/10 hover:border-purple-400/30 transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl flex-shrink-0">
                    {feature.icon}
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-purple-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-effect rounded-3xl p-12 md:p-16 text-center border border-purple-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
                Ready to Protect Your Wallet?
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center">
                {isConnected ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/mainpage")}
                    className="button-glow px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-green-500/30">
                    🛡️ Proceed to Protection
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      document
                        .getElementById("how-it-works")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="button-glow px-10 py-5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-purple-500/30">
                    Get Started Now
                  </motion.button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
