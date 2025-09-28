"use client";

import { useState, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { useToast } from "@/app/providers";

export interface DecryptedResult {
  questionId: string;
  decryptedValue: bigint | number;
  handle: string;
}

export function useSurveyDecryption(
  fhevmInstance: FhevmInstance | undefined,
  contract: ethers.Contract | undefined,
  contractAddress: string | undefined,
  account: string | undefined,
  storage: GenericStringStorage
) {
  const { addToast } = useToast();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedResults, setDecryptedResults] = useState<Record<string, DecryptedResult>>({});
  const isDecryptingRef = useRef(false);

  const decryptQuestionStats = useCallback(async (
    surveyId: string,
    questionIds: string[]
  ): Promise<Record<string, DecryptedResult> | null> => {
    console.log("=== STARTING REAL FHEVM DECRYPTION (Mock-Utils Compatible) ===");
    console.log("Survey ID:", surveyId);
    console.log("Question IDs:", questionIds);
    console.log("FHEVM Instance:", !!fhevmInstance);
    console.log("Contract:", !!contract);
    console.log("Account:", account);

    if (isDecryptingRef.current) {
      console.log("Decryption already in progress");
      return null;
    }

    if (!fhevmInstance || !contract || !contractAddress || !account) {
      throw new Error("FHEVM instance, contract, or account not available");
    }

    try {
      isDecryptingRef.current = true;
      setIsDecrypting(true);

      addToast({
        type: "info",
        title: "Getting encrypted data...",
        description: "Loading encrypted statistics from blockchain"
      });

      // Get encrypted handles for each question
      const handleContractPairs: { handle: string; contractAddress: string }[] = [];
      const questionHandleMap: Record<string, string> = {};
      
      for (const questionId of questionIds) {
        try {
          console.log(`Getting encrypted stats for question ${questionId}...`);
          const encryptedStats = await contract.getQuestionStats(surveyId, questionId);
          console.log(`Question ${questionId} encrypted stats:`, encryptedStats);
          
          if (encryptedStats && encryptedStats !== ethers.ZeroHash && encryptedStats.toString() !== "0") {
            const handle = encryptedStats.toString();
            handleContractPairs.push({
              handle: handle,
              contractAddress: contractAddress
            });
            questionHandleMap[handle] = questionId;
          }
        } catch (error) {
          console.error(`Failed to get stats for question ${questionId}:`, error);
        }
      }

      console.log("Handle-contract pairs:", handleContractPairs);

      if (handleContractPairs.length === 0) {
        addToast({
          type: "warning",
          title: "No encrypted data to decrypt",
          description: "No responses have been submitted yet, or all encrypted values are zero"
        });
        return {};
      }

      addToast({
        type: "info",
        title: "Creating decryption signature...",
        description: "Please sign the decryption request in MetaMask"
      });

      // Create ethers signer (following FHECounter pattern exactly)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log("Got ethers signer:", signer.address);

      // Use the exact same pattern as FHECounter for signature creation
      console.log("Creating FHEVM decryption signature...");
      const sig: FhevmDecryptionSignature | null = await FhevmDecryptionSignature.loadOrSign(
        fhevmInstance,
        [contractAddress],
        signer,
        storage
      );

      if (!sig) {
        addToast({
          type: "error",
          title: "Unable to build FHEVM decryption signature",
          description: "Could not create decryption authorization"
        });
        return null;
      }

      console.log("FHEVM decryption signature created successfully");

      addToast({
        type: "info",
        title: "Decrypting data...",
        description: "Processing encrypted statistics with FHEVM"
      });

      console.log("Call FHEVM userDecrypt...");

      // Use the exact same userDecrypt call pattern as FHECounter
      const decryptionResults = await fhevmInstance.userDecrypt(
        handleContractPairs,
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      console.log("FHEVM userDecrypt completed!");
      console.log("Raw decryption results:", decryptionResults);

      // Process decryption results
      const processedResults: Record<string, DecryptedResult> = {};
      
      for (const [handle, decryptedValue] of Object.entries(decryptionResults)) {
        const questionId = questionHandleMap[handle];
        if (questionId && decryptedValue !== undefined && decryptedValue !== null) {
          processedResults[questionId] = {
            questionId,
            decryptedValue: typeof decryptedValue === 'bigint' ? decryptedValue : BigInt(decryptedValue),
            handle
          };
          console.log(`Question ${questionId} decrypted value:`, decryptedValue);
        }
      }

      setDecryptedResults(processedResults);

      addToast({
        type: "success",
        title: "Decryption completed!",
        description: `Successfully decrypted ${Object.keys(processedResults).length} statistics using @fhevm/mock-utils`
      });

      return processedResults;

    } catch (error: any) {
      console.error("FHEVM decryption failed:", error);
      addToast({
        type: "error",
        title: "Decryption failed",
        description: error.message || "Could not decrypt survey statistics"
      });
      throw error;
    } finally {
      isDecryptingRef.current = false;
      setIsDecrypting(false);
    }
  }, [fhevmInstance, contract, contractAddress, account, storage, addToast]);

  return {
    isDecrypting,
    decryptedResults,
    decryptQuestionStats
  };
}