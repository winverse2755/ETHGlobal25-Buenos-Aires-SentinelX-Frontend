# SentinelX Frontend

React + Vite frontend for the SentinelX cross-chain token protection system.

User interface for monitoring and protecting wallets from malicious token approvals. Features wallet connection, real-time protection status, automatic freeze/unfreeze controls, and demonstration of attack scenarios across multiple chains (Celo, Appchain, Rari).

## Setup

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_ATTACKER_PRIVATE_KEY=your_private_key_here
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Tech Stack

- React 19
- Vite
- Wagmi + Viem
- RainbowKit
- TailwindCSS
- TypeScript
