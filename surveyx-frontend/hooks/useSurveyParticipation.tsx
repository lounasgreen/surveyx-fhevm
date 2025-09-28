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
  type: number; // 0=SINGLE_CHOICE, 1=MULTIPLE_CHOICE, 2=TEXT, 3=RATING
  text: string;
  options: string[];
  maxRating: number;
  isRequired: boolean;
}

export function useSurveyParticipation(
  surveyId: string,
  contract: ethers.Contract | undefined,
  fhevmInstance: FhevmInstance | undefined,
  account: string | undefined
) {
  const { addToast } = useToast();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Helper function to get signer contract
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

  // Load survey data from blockchain
  const loadSurvey = useCallback(async () => {
    if (!contract || !surveyId) {
      setSurvey(null);
      setQuestions([]);
      return;
    }

    try {
      setIsLoading(true);
      
      console.log("Loading survey:", surveyId);
      
      // Get survey details from blockchain
      const surveyData = await contract.surveys(surveyId);
      console.log("Survey data:", surveyData);
      
      if (surveyData.creator === ethers.ZeroAddress) {
        console.log("Survey does not exist");
        setSurvey(null);
        return;
      }

      // Check if survey is public or if user has access
      const isPublic = await contract.isPublicSurvey(surveyId);
      let userHasAccess = isPublic;
      
      if (!isPublic && account) {
        try {
          userHasAccess = await contract.surveyPermissions(surveyId, account);
        } catch (error) {
          console.error("Failed to check permissions:", error);
          userHasAccess = false;
        }
      }
      
      setHasAccess(userHasAccess || surveyData.creator === account);

      const survey: Survey = {
        id: surveyId,
        title: surveyData.title || `Survey #${surveyId}`,
        description: surveyData.description || "No description provided",
        creator: surveyData.creator,
        createdAt: Number(surveyData.createdAt) * 1000,
        expiresAt: Number(surveyData.expiresAt) * 1000,
        isActive: surveyData.isActive,
        isPublic: isPublic,
        questionCount: Number(surveyData.questionCount),
        responseCount: Number(surveyData.responseCount)
      };

      setSurvey(survey);

      // Load questions
      if (userHasAccess) {
        const questionIds = await contract.getSurveyQuestions(surveyId);
        console.log("Question IDs:", questionIds);
        
        const loadedQuestions: Question[] = [];
        
        for (const questionId of questionIds) {
          try {
            // Use new getter functions to properly read question data
            const [surveyIdData, questionType, questionText, maxRating, isRequired] = await contract.getQuestionData(questionId);
            console.log("Question basic data:", { surveyIdData, questionType, questionText, maxRating, isRequired });
            
            // Get options separately using the new getter function
            const options = await contract.getQuestionOptions(questionId);
            console.log("Question options from getQuestionOptions:", options);
            console.log("Options type:", typeof options);
            console.log("Options length:", options?.length);
            
            // Convert options to string array
            let processedOptions: string[] = [];
            if (options && Array.isArray(options)) {
              processedOptions = options.map((opt: any) => String(opt));
              console.log("Processed options:", processedOptions);
            } else {
              console.warn("Options is not an array or is null:", options);
              processedOptions = [];
            }
            
            const question: Question = {
              id: questionId.toString(),
              surveyId: surveyId,
              type: Number(questionType),
              text: questionText || `Question ${questionId}`,
              options: processedOptions,
              maxRating: Number(maxRating),
              isRequired: isRequired
            };
            
            console.log("Final processed question:", question);
            loadedQuestions.push(question);
          } catch (error) {
            console.error(`Failed to load question ${questionId}:`, error);
          }
        }
        
        setQuestions(loadedQuestions);
      }

    } catch (error) {
      console.error("Failed to load survey:", error);
      addToast({
        type: "error",
        title: "Failed to load survey",
        description: "Could not load survey from blockchain"
      });
      setSurvey(null);
    } finally {
      setIsLoading(false);
    }
  }, [contract, surveyId, account, addToast]);

  // Submit encrypted response
  const submitResponse = useCallback(async (responses: Record<string, any>) => {
    console.log("=== STARTING REAL SURVEY SUBMISSION ===");
    console.log("Responses to submit:", responses);
    console.log("FHEVM instance:", !!fhevmInstance);
    console.log("Account:", account);
    console.log("Survey:", survey);
    console.log("Questions:", questions);
    
    if (!fhevmInstance || !account || !survey) {
      throw new Error("FHEVM instance, account, or survey not available");
    }

    try {
      const signerContract = await getSignerContract();
      const contractAddress = await signerContract.getAddress();
      console.log("Got signer contract:", contractAddress);
      
      addToast({
        type: "info",
        title: "Submitting responses...",
        description: "Please confirm transactions in MetaMask"
      });

      let submittedCount = 0;
      console.log("Processing", questions.length, "questions...");
      
      // Submit each response
      for (const question of questions) {
        const response = responses[question.id];
        console.log(`Processing question ${question.id}:`, response);
        
        // Extract the actual value from the response object
        const responseValue = response?.value;
        console.log(`Extracted response value:`, responseValue);
        
        if (!responseValue || (typeof responseValue === 'string' && responseValue.trim() === '') || 
            (Array.isArray(responseValue) && responseValue.length === 0)) {
          console.log(`Skipping question ${question.id} - no response value`);
          continue;
        }

        // Convert response to number for encryption
        let numericValue = 0;
        
        if (question.type === 0) { // SINGLE_CHOICE
          const questionObj = questions.find(q => q.id === question.id);
          if (questionObj && questionObj.options && questionObj.options.length > 0) {
            numericValue = questionObj.options.indexOf(responseValue) + 1;
            console.log(`Single choice: "${responseValue}" -> index ${numericValue}`);
          } else {
            // Fallback for test options
            const testOptions = ["Test Option A", "Test Option B", "Test Option C"];
            numericValue = testOptions.indexOf(responseValue) + 1;
            console.log(`Single choice (test mode): "${responseValue}" -> index ${numericValue}`);
            if (numericValue === 0) {
              console.warn(`Question ${question.id} response "${responseValue}" not found in test options`);
              continue;
            }
          }
        } else if (question.type === 1) { // MULTIPLE_CHOICE
          const questionObj = questions.find(q => q.id === question.id);
          if (questionObj && questionObj.options && Array.isArray(responseValue)) {
            numericValue = responseValue.reduce((sum, val) => {
              const index = questionObj.options.indexOf(val);
              return sum + (index >= 0 ? index + 1 : 0);
            }, 0);
            console.log(`Multiple choice: ${responseValue} -> value ${numericValue}`);
          } else if (Array.isArray(responseValue)) {
            // Fallback for test options
            const testOptions = ["Test Feature X", "Test Feature Y", "Test Feature Z"];
            numericValue = responseValue.reduce((sum, val) => {
              const index = testOptions.indexOf(val);
              return sum + (index >= 0 ? index + 1 : 0);
            }, 0);
            console.log(`Multiple choice (test mode): ${responseValue} -> value ${numericValue}`);
          } else {
            console.warn(`Question ${question.id} has no options for multiple choice`);
            continue;
          }
        } else if (question.type === 3) { // RATING
          numericValue = parseInt(responseValue) || 0;
          console.log(`Rating: ${responseValue} -> ${numericValue}`);
        } else if (question.type === 2) { // TEXT
          numericValue = (responseValue as string).length;
          console.log(`Text length: "${responseValue}" -> ${numericValue}`);
        }

        if (numericValue > 0) {
          console.log(`Creating encrypted input for question ${question.id} with value:`, numericValue);
          
          // Create encrypted input
          const input = fhevmInstance.createEncryptedInput(contractAddress, account);
          input.add32(numericValue);
          console.log("Encrypting input...");
          const encryptedInput = await input.encrypt();
          console.log("Encryption completed, handles:", encryptedInput.handles);

          console.log(`=== CALLING SMART CONTRACT submitResponse ===`);
          console.log("Parameters:", {
            surveyId,
            questionId: question.id,
            handle: encryptedInput.handles[0],
            proofLength: encryptedInput.inputProof.length
          });
          
          const tx = await signerContract.submitResponse(
            surveyId,
            question.id,
            encryptedInput.handles[0],
            encryptedInput.inputProof
          );
          
          console.log(`Transaction sent for question ${question.id}:`, tx.hash);
          const receipt = await tx.wait();
          console.log(`Transaction confirmed for question ${question.id}:`, receipt);
          submittedCount++;
        } else {
          console.log(`Skipping question ${question.id} - numeric value is 0`);
        }
      }

      addToast({
        type: "success",
        title: "Responses submitted successfully!",
        description: `${submittedCount} encrypted responses have been recorded`
      });

      return true;

    } catch (error: any) {
      console.error("Failed to submit responses:", error);
      addToast({
        type: "error",
        title: "Failed to submit responses",
        description: error.message || "Transaction failed"
      });
      throw error;
    }
  }, [fhevmInstance, account, survey, questions, addToast, getSignerContract, surveyId]);

  // Check if user has already responded
  const checkExistingResponse = useCallback(async () => {
    if (!contract || !account || !surveyId) return false;
    
    try {
      const userResponses = await contract.getUserResponses(account);
      
      // Check if any response is for this survey
      for (const responseId of userResponses) {
        try {
          const response = await contract.responses(responseId);
          if (response.surveyId.toString() === surveyId) {
            setHasSubmitted(true);
            return true;
          }
        } catch (error) {
          console.error("Failed to check response:", error);
        }
      }
      
      setHasSubmitted(false);
      return false;
    } catch (error) {
      console.error("Failed to check existing responses:", error);
      setHasSubmitted(false);
      return false;
    }
  }, [contract, account, surveyId]);

  // Load survey when dependencies change
  useEffect(() => {
    loadSurvey();
  }, [loadSurvey]);

  return {
    survey,
    questions,
    isLoading,
    hasAccess,
    hasSubmitted,
    loadSurvey,
    submitResponse,
    checkExistingResponse
  };
}
