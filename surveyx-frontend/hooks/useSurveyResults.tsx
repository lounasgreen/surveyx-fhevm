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
  responseCount: number;
}

export interface Question {
  id: string;
  type: number;
  text: string;
  options: string[];
  maxRating: number;
  isRequired: boolean;
}

export interface QuestionResult {
  questionId: string;
  question: Question;
  totalResponses: number;
  encryptedStats: string; // Encrypted statistics handle
  results: {
    responseRate: number;
    // Note: Actual decrypted results would require FHEVM decryption
  };
}

export interface SurveyResults {
  survey: Survey;
  totalResponses: number;
  completionRate: number;
  questions: Question[];
  questionResults: QuestionResult[];
  canDecrypt: boolean; // Whether current user can decrypt results
}

export function useSurveyResults(
  surveyId: string,
  contract: ethers.Contract | undefined,
  fhevmInstance: FhevmInstance | undefined,
  account: string | undefined
) {
  const { addToast } = useToast();
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to get signer contract
  const getSignerContract = useCallback(async (): Promise<ethers.Contract> => {
    if (!contract) {
      throw new Error("Contract not available");
    }

    if (contract.runner && typeof contract.runner.sendTransaction === 'function') {
      return contract;
    }

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

  // Load survey results from blockchain
  const loadResults = useCallback(async () => {
    if (!contract || !surveyId) {
      setResults(null);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Loading survey results for:", surveyId);
      
      // Get survey details
      const surveyData = await contract.surveys(surveyId);
      console.log("Survey data:", surveyData);
      
      if (surveyData.creator === ethers.ZeroAddress) {
        console.log("Survey does not exist");
        setResults(null);
        return;
      }

      // Check if current user is the creator (can view results)
      console.log("Checking decrypt permissions:");
      console.log("Current account:", account);
      console.log("Survey creator:", surveyData.creator);
      console.log("Account type:", typeof account);
      console.log("Creator type:", typeof surveyData.creator);
      
      // Use case-insensitive address comparison
      const canDecrypt = account && surveyData.creator && 
        account.toLowerCase() === surveyData.creator.toLowerCase();
      console.log("Can decrypt results (case-insensitive):", canDecrypt);
      
      // Additional debug
      if (account && surveyData.creator) {
        console.log("Account toLowerCase:", account.toLowerCase());
        console.log("Creator toLowerCase:", surveyData.creator.toLowerCase());
        console.log("Addresses match:", account.toLowerCase() === surveyData.creator.toLowerCase());
      }

      // Get survey visibility
      const isPublic = await contract.isPublicSurvey(surveyId);
      
      const survey: Survey = {
        id: surveyId,
        title: surveyData.title || `Survey #${surveyId}`,
        description: surveyData.description || "No description provided",
        creator: surveyData.creator,
        createdAt: Number(surveyData.createdAt) * 1000,
        expiresAt: Number(surveyData.expiresAt) * 1000,
        isActive: surveyData.isActive,
        isPublic: isPublic,
        responseCount: Number(surveyData.responseCount)
      };

      // Load questions
      const questionIds = await contract.getSurveyQuestions(surveyId);
      console.log("Question IDs:", questionIds);
      
      const questions: Question[] = [];
      const questionResults: QuestionResult[] = [];
      
      for (const questionId of questionIds) {
        try {
          // Get question data using the new getter functions
          const [qSurveyId, questionType, questionText, maxRating, isRequired] = await contract.getQuestionData(questionId);
          const options = await contract.getQuestionOptions(questionId);
          
          const question: Question = {
            id: questionId.toString(),
            type: Number(questionType),
            text: questionText || `Question ${questionId}`,
            options: Array.isArray(options) ? options.map((opt: any) => String(opt)) : [],
            maxRating: Number(maxRating),
            isRequired: isRequired
          };
          
          questions.push(question);
          
          // Get encrypted statistics for this question (if user is creator)
          let encryptedStats = "";
          if (canDecrypt) {
            try {
              const stats = await contract.getQuestionStats(surveyId, questionId);
              encryptedStats = stats.toString();
              console.log(`Question ${questionId} encrypted stats:`, encryptedStats);
            } catch (error) {
              console.warn(`Cannot access stats for question ${questionId}:`, error);
            }
          }

          const questionResult: QuestionResult = {
            questionId: questionId.toString(),
            question: question,
            totalResponses: Number(surveyData.responseCount), // This is the total survey responses
            encryptedStats: encryptedStats,
            results: {
              responseRate: questions.length > 0 ? (Number(surveyData.responseCount) / questions.length) * 100 : 0
            }
          };
          
          questionResults.push(questionResult);
          
        } catch (error) {
          console.error(`Failed to load question ${questionId}:`, error);
        }
      }

      const surveyResults: SurveyResults = {
        survey: survey,
        totalResponses: Number(surveyData.responseCount),
        completionRate: questions.length > 0 ? (Number(surveyData.responseCount) / questions.length) * 100 : 0,
        questions: questions,
        questionResults: questionResults,
        canDecrypt: canDecrypt
      };

      setResults(surveyResults);
      console.log("Survey results loaded:", surveyResults);

    } catch (error) {
      console.error("Failed to load survey results:", error);
      addToast({
        type: "error",
        title: "Failed to load results",
        description: "Could not load survey results from blockchain"
      });
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [contract, surveyId, account, addToast]);


  // Load results when dependencies change
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  return {
    results,
    isLoading,
    loadResults
  };
}
