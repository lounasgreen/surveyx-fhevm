"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { useToast } from "@/app/providers";

export interface Survey {
  id: string;
  title: string;
  description: string;
  creator: string;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
  isPublic: boolean;
  questionCount: number;
  responseCount: number;
}

export interface Question {
  id: string;
  surveyId: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT" | "RATING";
  text: string;
  options: string[];
  maxRating: number;
  isRequired: boolean;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  questionId: string;
  respondent: string;
  submittedAt: number;
}

export function useSurveyData(
  contract: ethers.Contract | undefined,
  fhevmInstance: FhevmInstance | undefined,
  account: string | undefined
) {
  const { addToast } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to ensure we have a signer-connected contract
  const getSignerContract = useCallback(async (): Promise<ethers.Contract> => {
    if (!contract) {
      throw new Error("Contract not available");
    }

    // If contract already has a signer, return it
    if (contract.runner && typeof contract.runner.sendTransaction === 'function') {
      return contract;
    }

    // Try to get a new signer-connected contract
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractAddress = await contract.getAddress();
      
      return new ethers.Contract(
        contractAddress,
        contract.interface,
        signer
      );
    }

    throw new Error("Could not create signer-connected contract");
  }, [contract]);

  // Load surveys from blockchain
  const loadSurveys = useCallback(async () => {
    if (!contract || !account) {
      setSurveys([]);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get user's surveys from blockchain
      const userSurveyIds = await contract.getUserSurveys(account);
      const loadedSurveys: Survey[] = [];

      for (const surveyId of userSurveyIds) {
        try {
          // Get survey details
          const surveyData = await contract.surveys(surveyId);
          
          if (surveyData.creator !== ethers.ZeroAddress) {
            const survey: Survey = {
              id: surveyId.toString(),
              title: surveyData.title || `Survey #${surveyId}`,
              description: surveyData.description || "No description provided",
              creator: surveyData.creator,
              createdAt: Number(surveyData.createdAt) * 1000, // Convert to milliseconds
              expiresAt: Number(surveyData.expiresAt) * 1000,
              isActive: surveyData.isActive,
              isPublic: await contract.isPublicSurvey(surveyId),
              questionCount: Number(surveyData.questionCount),
              responseCount: Number(surveyData.responseCount)
            };
            loadedSurveys.push(survey);
          }
        } catch (error) {
          console.error(`Failed to load survey ${surveyId}:`, error);
        }
      }

      setSurveys(loadedSurveys);
    } catch (error) {
      console.error("Failed to load surveys:", error);
      addToast({
        type: "error",
        title: "Failed to load surveys",
        description: "Could not load surveys from blockchain"
      });
    } finally {
      setIsLoading(false);
    }
  }, [contract, account, addToast]);

  // Create a new survey
  const createSurvey = useCallback(async (
    title: string,
    description: string,
    duration: number,
    isPublic: boolean
  ) => {
    console.log("Creating survey with:", { title, description, duration, isPublic });
    
    if (!account) {
      throw new Error("Account not available");
    }

    try {
      // Get a signer-connected contract
      const signerContract = await getSignerContract();
      console.log("Got signer contract:", signerContract);
      
      console.log("Calling contract.createSurvey...");
      const tx = await signerContract.createSurvey(title, description, duration, isPublic);
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      // Find the SurveyCreated event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = signerContract.interface.parseLog(log);
          return parsed?.name === "SurveyCreated";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = signerContract.interface.parseLog(event);
        const surveyId = parsed?.args?.surveyId;
        
        addToast({
          type: "success",
          title: "Survey created successfully",
          description: `Survey ID: ${surveyId}`
        });

        // Reload surveys
        await loadSurveys();
        return surveyId.toString();
      }
    } catch (error: any) {
      console.error("Failed to create survey:", error);
      addToast({
        type: "error",
        title: "Failed to create survey",
        description: error.message || "Transaction failed"
      });
      throw error;
    }
  }, [account, addToast, loadSurveys, getSignerContract]);

  // Add question to survey
  const addQuestion = useCallback(async (
    surveyId: string,
    questionType: number,
    questionText: string,
    options: string[],
    maxRating: number,
    isRequired: boolean
  ) => {
    console.log("Adding question with parameters:", {
      surveyId,
      questionType,
      questionText,
      options,
      maxRating,
      isRequired
    });
    
    try {
      const signerContract = await getSignerContract();
      
      console.log("Calling signerContract.addQuestion...");
      const tx = await signerContract.addQuestion(
        surveyId,
        questionType,
        questionText,
        options,
        maxRating,
        isRequired
      );
      console.log("AddQuestion transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("AddQuestion transaction confirmed:", receipt);
      
      addToast({
        type: "success",
        title: "Question added successfully"
      });
    } catch (error: any) {
      console.error("Failed to add question:", error);
      addToast({
        type: "error",
        title: "Failed to add question",
        description: error.message || "Transaction failed"
      });
      throw error;
    }
  }, [addToast, getSignerContract]);

  // Activate survey
  const activateSurvey = useCallback(async (surveyId: string) => {
    try {
      const signerContract = await getSignerContract();
      
      const tx = await signerContract.activateSurvey(surveyId);
      await tx.wait();
      
      addToast({
        type: "success",
        title: "Survey activated successfully"
      });

      // Reload surveys
      await loadSurveys();
    } catch (error: any) {
      console.error("Failed to activate survey:", error);
      addToast({
        type: "error",
        title: "Failed to activate survey",
        description: error.message || "Transaction failed"
      });
      throw error;
    }
  }, [addToast, loadSurveys, getSignerContract]);

  // Submit encrypted response
  const submitResponse = useCallback(async (
    surveyId: string,
    questionId: string,
    encryptedValue: number
  ) => {
    if (!fhevmInstance || !account) {
      throw new Error("FHEVM instance or account not available");
    }

    try {
      // Get signer contract
      const signerContract = await getSignerContract();
      const contractAddress = await signerContract.getAddress();
      
      // Create encrypted input
      const input = fhevmInstance.createEncryptedInput(
        contractAddress,
        account
      );
      input.add32(encryptedValue);
      const encryptedInput = await input.encrypt();

      const tx = await signerContract.submitResponse(
        surveyId,
        questionId,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );
      await tx.wait();
      
      addToast({
        type: "success",
        title: "Response submitted successfully",
        description: "Your encrypted response has been recorded"
      });
    } catch (error: any) {
      console.error("Failed to submit response:", error);
      addToast({
        type: "error",
        title: "Failed to submit response",
        description: error.message || "Transaction failed"
      });
      throw error;
    }
  }, [fhevmInstance, account, addToast, getSignerContract]);

  // Load surveys when contract or account changes
  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  return {
    surveys,
    isLoading,
    loadSurveys,
    createSurvey,
    addQuestion,
    activateSurvey,
    submitResponse
  };
}
