"use client";

import { useTheme } from "../providers";
import { useMetaMaskProvider } from "@/hooks/useMetaMaskProvider";
import { Wallet, Sun, Moon, User, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { 
    isConnected, 
    account, 
    chainId, 
    connect, 
    disconnect, 
    isConnecting,
    isMetaMaskAvailable 
  } = useMetaMaskProvider();
  
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return "Ethereum Mainnet";
      case 11155111: return "Sepolia Testnet";
      case 31337: return "Hardhat Local";
      default: return `Chain ${chainId}`;
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <a href="/" className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SurveyX
              </h1>
              <span className="text-sm text-muted-foreground">
                Confidential Survey System
              </span>
            </a>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </a>
            <a href="/browse" className="text-sm font-medium hover:text-primary transition-colors">
              Browse Surveys
            </a>
            <a href="/create" className="text-sm font-medium hover:text-primary transition-colors">
              Create Survey
            </a>
            <a href="/my-surveys" className="text-sm font-medium hover:text-primary transition-colors">
              My Surveys
            </a>
            <a href="/responses" className="text-sm font-medium hover:text-primary transition-colors">
              My Responses
            </a>
          </nav>

          {/* Right side - Theme toggle and Wallet */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Wallet Connection */}
            {!mounted ? (
              <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ) : !isMetaMaskAvailable ? (
              <div className="text-sm text-red-600">
                MetaMask not installed
              </div>
            ) : !isConnected ? (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="btn-primary flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="loading-spinner w-4 h-4"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </>
                )}
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {formatAddress(account!)}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Account Menu */}
                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium">Connected Account</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">
                        {account}
                      </div>
                    </div>
                    
                    {chainId && (
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-medium">Network</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getNetworkName(chainId)} (Chain ID: {chainId})
                        </div>
                      </div>
                    )}

                    <div className="px-4 py-2">
                      <button
                        onClick={() => {
                          disconnect();
                          setShowAccountMenu(false);
                        }}
                        className="w-full text-left text-sm text-red-600 hover:text-red-800 transition-colors"
                      >
                        Disconnect Wallet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex items-center space-x-4 overflow-x-auto">
          <a href="/" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
            Home
          </a>
          <a href="/browse" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
            Browse
          </a>
          <a href="/create" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
            Create
          </a>
          <a href="/my-surveys" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
            My Surveys
          </a>
          <a href="/responses" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
            Responses
          </a>
        </nav>
      </div>

      {/* Click outside to close menu */}
      {showAccountMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowAccountMenu(false)}
        />
      )}
    </header>
  );
}
