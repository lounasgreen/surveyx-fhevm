"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface MetaMaskState {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  account: string | undefined;
  accounts: string[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | undefined;
}

export function useMetaMaskProvider() {
  const [state, setState] = useState<MetaMaskState>({
    provider: undefined,
    chainId: undefined,
    account: undefined,
    accounts: [],
    isConnected: false,
    isConnecting: false,
    error: undefined,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if MetaMask is available
  const isMetaMaskAvailable = useCallback(() => {
    return mounted && 
           typeof window !== "undefined" && 
           typeof window.ethereum !== "undefined" && 
           window.ethereum.isMetaMask;
  }, [mounted]);

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!isMetaMaskAvailable()) {
      setState(prev => ({
        ...prev,
        error: "MetaMask is not installed. Please install MetaMask to continue."
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: undefined }));

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      }) as string;

      setState(prev => ({
        ...prev,
        provider: window.ethereum,
        chainId: parseInt(chainId, 16),
        account: accounts[0],
        accounts,
        isConnected: true,
        isConnecting: false,
        error: undefined,
      }));

    } catch (error: any) {
      console.error("Failed to connect to MetaMask:", error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || "Failed to connect to MetaMask",
      }));
    }
  }, [isMetaMaskAvailable]);

  // Disconnect
  const disconnect = useCallback(() => {
    setState({
      provider: undefined,
      chainId: undefined,
      account: undefined,
      accounts: [],
      isConnected: false,
      isConnecting: false,
      error: undefined,
    });
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (!state.provider) return;

    try {
      await state.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      // If the chain hasn't been added to MetaMask, add it
      if (error.code === 4902) {
        try {
          await state.provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: targetChainId === 31337 ? "Hardhat Local" : `Chain ${targetChainId}`,
                rpcUrls: targetChainId === 31337 ? ["http://localhost:8545"] : [],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      } else {
        console.error("Failed to switch network:", error);
      }
    }
  }, [state.provider]);

  // Initialize connection on mount
  useEffect(() => {
    if (!mounted || !isMetaMaskAvailable()) return;

    const checkConnection = async () => {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        }) as string[];

        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({
            method: "eth_chainId",
          }) as string;

          setState(prev => ({
            ...prev,
            provider: window.ethereum,
            chainId: parseInt(chainId, 16),
            account: accounts[0],
            accounts,
            isConnected: true,
          }));
        }
      } catch (error) {
        console.error("Failed to check connection:", error);
      }
    };

    checkConnection();
  }, [mounted, isMetaMaskAvailable]);

  // Listen for account changes
  useEffect(() => {
    if (!state.provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState(prev => ({
          ...prev,
          account: accounts[0],
          accounts,
        }));
      }
    };

    const handleChainChanged = (chainId: string) => {
      setState(prev => ({
        ...prev,
        chainId: parseInt(chainId, 16),
      }));
    };

    const handleDisconnect = () => {
      disconnect();
    };

    if (state.provider && 'on' in state.provider) {
      (state.provider as any).on("accountsChanged", handleAccountsChanged);
      (state.provider as any).on("chainChanged", handleChainChanged);
      (state.provider as any).on("disconnect", handleDisconnect);
    }

    return () => {
      if (state.provider && 'removeListener' in state.provider) {
        (state.provider as any).removeListener("accountsChanged", handleAccountsChanged);
        (state.provider as any).removeListener("chainChanged", handleChainChanged);
        (state.provider as any).removeListener("disconnect", handleDisconnect);
      }
    };
  }, [state.provider, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    isMetaMaskAvailable: isMetaMaskAvailable(),
    mounted,
  };
}
