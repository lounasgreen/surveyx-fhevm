"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";

export function useMetaMaskEthersSigner() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersReadonlyProvider, setEthersReadonlyProvider] = useState<ethers.BrowserProvider | undefined>(undefined);
  
  const sameChain = useRef<(chainId: number | undefined) => boolean>(() => false);
  const sameSigner = useRef<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>(() => false);

  const initialMockChains = { 31337: "http://localhost:8545" };

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not available");
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      }) as string;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setProvider(window.ethereum);
      setChainId(parseInt(chainId, 16));
      setAccounts(accounts);
      setIsConnected(true);
      setEthersSigner(signer);
      setEthersReadonlyProvider(provider);

      // Update refs for stale checks
      const currentChainId = parseInt(chainId, 16);
      sameChain.current = (checkChainId: number | undefined) => checkChainId === currentChainId;
      sameSigner.current = (checkSigner: ethers.JsonRpcSigner | undefined) => checkSigner === signer;

    } catch (error) {
      console.error("Failed to connect to MetaMask:", error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    setProvider(undefined);
    setChainId(undefined);
    setAccounts([]);
    setIsConnected(false);
    setEthersSigner(undefined);
    setEthersReadonlyProvider(undefined);
  }, []);

  // Initialize connection check
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            connect().catch(console.error);
          }
        })
        .catch(console.error);
    }
  }, [connect]);

  return {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  };
}
