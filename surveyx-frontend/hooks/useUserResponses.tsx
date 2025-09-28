"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { useToast } from "@/app/providers";

export interface SurveyResponse {
  id: string;
  surveyId: string;
  surveyTitle: string;
  surveyDescription: string;
  creator: string;
  submittedAt: number;
  questionCount: number;
  answeredCount: number;
  isComplete: boolean;
  status: "completed" | "partial" | "expired";
}

export function useUserResponses(
  contract: ethers.Contract | undefined,
  fhevmInstance: FhevmInstance | undefined,
  account: string | undefined
) {
  const { addToast } = useToast();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user's responses from blockchain
  const loadUserResponses = useCallback(async () => {
    if (!contract || !account) {
      setResponses([]);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Loading user responses for account:", account);
      
      // Get user's response IDs from blockchain
      const userResponseIds = await contract.getUserResponses(account);
      console.log("User response IDs:", userResponseIds);
      
      const loadedResponses: SurveyResponse[] = [];
      const surveyResponseMap: Record<string, { 
        surveyData: any, 
        responseIds: string[], 
        submittedAt: number 
      }> = {};

      // Process each response
      for (const responseId of userResponseIds) {
        try {
          console.log(`Loading response ${responseId}...`);
          const responseData = await contract.responses(responseId);
          console.log(`Response ${responseId} data:`, responseData);
          
          if (responseData.respondent !== ethers.ZeroAddress) {
            const surveyId = responseData.surveyId.toString();
            const submittedAt = Number(responseData.submittedAt) * 1000;
            
            // Group responses by survey
            if (!surveyResponseMap[surveyId]) {
              try {
                const surveyData = await contract.surveys(surveyId);
                console.log(`Survey ${surveyId} data:`, surveyData);
                
                if (surveyData.creator !== ethers.ZeroAddress) {
                  surveyResponseMap[surveyId] = {
                    surveyData,
                    responseIds: [],
                    submittedAt: submittedAt
                  };
                }
              } catch (error) {
                console.error(`Failed to load survey ${surveyId}:`, error);
                continue;
              }
            }
            
            if (surveyResponseMap[surveyId]) {
              surveyResponseMap[surveyId].responseIds.push(responseId.toString());
              // Use the earliest submission time
              if (submittedAt < surveyResponseMap[surveyId].submittedAt) {
                surveyResponseMap[surveyId].submittedAt = submittedAt;
              }
            }
          }
        } catch (error) {
          console.error(`Failed to load response ${responseId}:`, error);
        }
      }

      // Convert grouped data to SurveyResponse objects
      for (const [surveyId, data] of Object.entries(surveyResponseMap)) {
        try {
          const survey = data.surveyData;
          const totalQuestions = Number(survey.questionCount);
          const answeredCount = data.responseIds.length;
          const isComplete = answeredCount >= totalQuestions;
          const isExpired = Date.now() > (Number(survey.expiresAt) * 1000);
          
          let status: "completed" | "partial" | "expired" = "completed";
          if (isExpired && !isComplete) {
            status = "expired";
          } else if (!isComplete) {
            status = "partial";
          }

          const surveyResponse: SurveyResponse = {
            id: `response_${surveyId}`,
            surveyId: surveyId,
            surveyTitle: survey.title || `Survey #${surveyId}`,
            surveyDescription: survey.description || "No description provided",
            creator: survey.creator,
            submittedAt: data.submittedAt,
            questionCount: totalQuestions,
            answeredCount: answeredCount,
            isComplete: isComplete,
            status: status
          };
          
          loadedResponses.push(surveyResponse);
          console.log(`Processed survey response:`, surveyResponse);
        } catch (error) {
          console.error(`Failed to process survey ${surveyId}:`, error);
        }
      }

      // Sort by submission date (most recent first)
      loadedResponses.sort((a, b) => b.submittedAt - a.submittedAt);
      
      setResponses(loadedResponses);
      console.log(`Loaded ${loadedResponses.length} survey responses`);

    } catch (error) {
      console.error("Failed to load user responses:", error);
      addToast({
        type: "error",
        title: "Failed to load responses",
        description: "Could not load your response history from blockchain"
      });
    } finally {
      setIsLoading(false);
    }
  }, [contract, account, addToast]);

  // Load responses when contract or account changes
  useEffect(() => {
    loadUserResponses();
  }, [loadUserResponses]);

  return {
    responses,
    isLoading,
    loadUserResponses
  };
}

