import { ethers } from "ethers";

export function generateRandomAddress() {
  return ethers.Wallet.createRandom().address;
}

export function sanitizeApprovalAmount(amount: string) {
  return amount.slice(0, 20);
}

export function sanitizeUserBalance(balance: string) {
  return balance.slice(0, 20);
}
