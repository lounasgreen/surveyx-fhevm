"use client";

import { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { SurveyXABI } from "@/abi/SurveyXABI";
import { SurveyXAddresses } from "@/abi/SurveyXAddresses";

export function useSurveyContract(
  fhevmInstance: FhevmInstance | undefined,
  provider: ethers.Eip1193Provider | undefined,
  chainId: number | undefined
) {
  const [contract, setContract] = useState<ethers.Contract | undefined>(undefined);
  const [readOnlyContract, setReadOnlyContract] = useState<ethers.Contract | undefined>(undefined);
  const [isDeployed, setIsDeployed] = useState<boolean | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  // Get contract address for current chain
  const contractAddress = useMemo(() => {
    if (!chainId) return undefined;
    
    const addressInfo = SurveyXAddresses[chainId.toString() as keyof typeof SurveyXAddresses];
    return addressInfo?.address;
  }, [chainId]);

  // Create contract instances
  useEffect(() => {
    if (!provider || !contractAddress || !fhevmInstance) {
      setContract(undefined);
      setReadOnlyContract(undefined);
      setIsDeployed(undefined);
      return;
    }

    const initializeContracts = async () => {
      try {
        const ethersProvider = new ethers.BrowserProvider(provider);
        
        // Create read-only contract instance
        const readOnlyInstance = new ethers.Contract(
          contractAddress,
          SurveyXABI.abi,
          ethersProvider
        );
        setReadOnlyContract(readOnlyInstance);

        // Create signer-connected contract instance for transactions
        try {
          const signer = await ethersProvider.getSigner();
          const signerInstance = new ethers.Contract(
            contractAddress,
            SurveyXABI.abi,
            signer
          );
          setContract(signerInstance);
        } catch (signerError) {
          console.warn("No signer available, using read-only contract:", signerError);
          setContract(readOnlyInstance);
        }

        setError(undefined);

        // Check if contract is deployed
        const code = await ethersProvider.getCode(contractAddress);
        setIsDeployed(code !== "0x");

      } catch (err: any) {
        console.error("Failed to create contract instance:", err);
        setContract(undefined);
        setReadOnlyContract(undefined);
        setIsDeployed(false);
        setError(err.message || "Failed to create contract instance");
      }
    };

    initializeContracts();
  }, [provider, contractAddress, fhevmInstance]);

  // Get contract with signer for write operations
  const getContractWithSigner = async () => {
    if (!provider || !contractAddress) return undefined;

    try {
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      return new ethers.Contract(contractAddress, SurveyXABI.abi, signer);
    } catch (err) {
      console.error("Failed to get signer:", err);
      return undefined;
    }
  };

  return {
    contract, // Signer-connected contract for transactions
    readOnlyContract, // Read-only contract for view functions
    contractAddress,
    isDeployed,
    error,
    getContractWithSigner,
  };
}
