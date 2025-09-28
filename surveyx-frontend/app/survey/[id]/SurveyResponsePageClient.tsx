"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useToast } from "../../providers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskProvider } from "@/hooks/useMetaMaskProvider";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { useSurveyParticipation, Question } from "@/hooks/useSurveyParticipation";
import { Clock, Lock, Users, CheckCircle, AlertCircle, Send, Eye, Shield } from "lucide-react";

interface Answer {
  questionId: string;
  value: string | string[] | number;
}

export default function SurveyResponsePageClient() {
  const params = useParams();
  const surveyId = params.id as string;
  const { addToast } = useToast();
  
  // FHEVM and Web3 hooks
  const { provider, chainId, account, connect, isConnected } = useMetaMaskProvider();
  const { instance: fhevmInstance, status: fhevmStatus, error: fhevmError } = useFhevm({
    provider,
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected,
  });
  const { contract } = useSurveyContract(fhevmInstance, provider, chainId);

  // Use real survey participation data
  const { survey, questions, isLoading, hasAccess, hasSubmitted, submitResponse, loadSurvey } = useSurveyParticipation(
    surveyId,
    contract,
    fhevmInstance,
    account
  );

  // Component state
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update answer for a specific question
  const updateAnswer = (questionId: string, answer: Answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    if (!questions || questions.length === 0) return false;

    for (const question of questions) {
      if (question.isRequired) {
        const answer = answers[question.id];
        if (!answer || !answer.value || 
            (Array.isArray(answer.value) && answer.value.length === 0)) {
          addToast({
            type: "error",
            title: "Missing required answers",
            description: `Please answer the required question: ${question.text}`
          });
          return false;
        }
      }
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    console.log("=== SUBMIT SURVEY BUTTON CLICKED ===");
    
    if (!isConnected) {
      addToast({
        type: "error",
        title: "Wallet not connected",
        description: "Please connect your wallet to submit responses"
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    console.log("Validation passed, starting submission...");

    try {
      setIsSubmitting(true);
      console.log("Current answers:", answers);
      
      // Convert answers to the format expected by submitResponse
      const responsesToSubmit: Record<string, string | string[] | number> = {};
      Object.values(answers).forEach(answer => {
        responsesToSubmit[answer.questionId] = answer.value;
      });
      
      console.log("Calling submitResponse with answers:", responsesToSubmit);
      
      const success = await submitResponse(responsesToSubmit);
      
      if (success) {
        console.log("SubmitResponse result:", success);
        
        addToast({
          type: "success",
          title: "Survey submitted successfully!",
          description: "Your encrypted responses have been recorded"
        });
        
        console.log("Survey submission completed successfully");
        
        // Reset form
        setAnswers({});
      }
    } catch (error: any) {
      console.error("Survey submission failed:", error);
      addToast({
        type: "error",
        title: "Submission failed",
        description: error.message || "Failed to submit survey responses"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load survey when contract or surveyId changes
  useEffect(() => {
    loadSurvey();
  }, [loadSurvey]);

  // Get question type text
  const getQuestionTypeText = (type: number): string => {
    switch (type) {
      case 0: return "Single Choice";
      case 1: return "Multiple Choice";
      case 2: return "Text";
      case 3: return "Rating";
      default: return "Unknown";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="loading-spinner mx-auto w-8 h-8 mb-4"></div>
        <p className="text-lg text-muted-foreground">Loading survey...</p>
      </div>
    );
  }

  // Survey not found
  if (!survey) {
    return (
      <div className="text-center py-10 bg-card rounded-lg shadow-md">
        <p className="text-xl font-semibold text-muted-foreground mb-4">Survey not found.</p>
        <p className="text-muted-foreground">Please check the survey ID or ensure it exists.</p>
      </div>
    );
  }

  // Survey expired or inactive
  const isExpired = Date.now() > survey.expiresAt;
  if (!survey.isActive || isExpired) {
    return (
      <div className="text-center py-10 bg-card rounded-lg shadow-md">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-xl font-semibold text-muted-foreground mb-4">Survey is not available.</p>
        <p className="text-muted-foreground">
          {isExpired ? "This survey has expired." : "This survey is currently inactive."}
        </p>
      </div>
    );
  }

  // No access
  if (!hasAccess) {
    return (
      <div className="text-center py-10 bg-card rounded-lg shadow-md">
        <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-xl font-semibold text-muted-foreground mb-4">Access denied.</p>
        <p className="text-muted-foreground">You don't have permission to participate in this survey.</p>
      </div>
    );
  }

  // Already submitted
  if (hasSubmitted) {
    return (
      <div className="text-center py-10 bg-card rounded-lg shadow-md">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <p className="text-xl font-semibold text-muted-foreground mb-4">Response submitted!</p>
        <p className="text-muted-foreground">You have already submitted your response to this survey.</p>
      </div>
    );
  }

  const renderQuestion = (question: Question, index: number) => {
    const answer = answers[question.id];

    // Debug logging
    console.log(`Rendering question ${index + 1}:`, question);
    console.log(`Question type: ${question.type}, Options:`, question.options);

    return (
      <div key={question.id} className="question-card">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              {getQuestionTypeText(question.type)}
            </span>
            {question.isRequired && (
              <span className="text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                Required
              </span>
            )}
            {/* Debug info */}
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
              Type: {question.type}, Options: {question.options.length}
            </span>
            {/* Test mode for empty options */}
            {question.options.length === 0 && (question.type === 0 || question.type === 1) && (
              <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                No options loaded - will use test values
              </span>
            )}
          </div>
          <h3 className="text-lg font-medium">
            {index + 1}. {question.text}
            {question.isRequired && <span className="text-red-500 ml-1">*</span>}
          </h3>
        </div>

        {/* Single Choice */}
        {question.type === 0 && (
          <div className="space-y-3">
            {question.options && question.options.length > 0 ? (
              question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={answer?.value === option}
                    onChange={(e) => updateAnswer(question.id, { questionId: question.id, value: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>{option}</span>
                </label>
              ))
            ) : (
              // Fallback options for testing when contract options are empty
              <div className="space-y-3">
                <div className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-3 rounded mb-3">
                  ⚠️ No options loaded from contract. Using test options for demonstration.
                </div>
                {["Test Option A", "Test Option B", "Test Option C"].map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answer?.value === option}
                      onChange={(e) => updateAnswer(question.id, { questionId: question.id, value: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>{option} (Test)</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Multiple Choice */}
        {question.type === 1 && (
          <div className="space-y-3">
            {question.options && question.options.length > 0 ? (
              question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                  <input
                    type="checkbox"
                    value={option}
                    checked={(answer?.value as string[] || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = (answer?.value as string[]) || [];
                      if (e.target.checked) {
                        updateAnswer(question.id, { questionId: question.id, value: [...currentValues, option] });
                      } else {
                        updateAnswer(question.id, { questionId: question.id, value: currentValues.filter(v => v !== option) });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>{option}</span>
                </label>
              ))
            ) : (
              // Fallback options for testing when contract options are empty
              <div className="space-y-3">
                <div className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-3 rounded mb-3">
                  ⚠️ No options loaded from contract. Using test options for demonstration.
                </div>
                {["Test Feature X", "Test Feature Y", "Test Feature Z"].map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                    <input
                      type="checkbox"
                      value={option}
                      checked={(answer?.value as string[] || []).includes(option)}
                      onChange={(e) => {
                        const currentValues = (answer?.value as string[]) || [];
                        if (e.target.checked) {
                          updateAnswer(question.id, { questionId: question.id, value: [...currentValues, option] });
                        } else {
                          updateAnswer(question.id, { questionId: question.id, value: currentValues.filter(v => v !== option) });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>{option} (Test)</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rating */}
        {question.type === 3 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">1</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => updateAnswer(question.id, { questionId: question.id, value: star })}
                className={`text-2xl ${
                  (answer?.value as number || 0) >= star ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"
                }`}
              >
                ★
              </button>
            ))}
            <span className="text-sm text-gray-500">{question.maxRating}</span>
          </div>
        )}

        {/* Text */}
        {question.type === 2 && (
          <textarea
            value={(answer?.value as string) || ""}
            onChange={(e) => updateAnswer(question.id, { questionId: question.id, value: e.target.value })}
            className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
            placeholder="Type your answer here..."
          />
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Survey Header */}
      <div className="survey-card mb-8">
        <h1 className="text-3xl font-bold mb-4">{survey.title}</h1>
        <p className="text-muted-foreground text-lg mb-6">{survey.description}</p>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Expires: {new Date(survey.expiresAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{survey.responseCount} responses</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Encrypted with FHEVM</span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => renderQuestion(question, index))}
      </div>

      {/* Submit Button */}
      <div className="mt-8 flex justify-center">
        {!isConnected ? (
          <button
            onClick={connect}
            className="btn-primary flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Connect Wallet to Participate
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner w-4 h-4"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Survey
              </>
            )}
          </button>
        )}
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="font-medium mb-2">Debug Info (Development Only)</h3>
          <div className="text-sm space-y-1">
            <p>Survey ID: {surveyId}</p>
            <p>Account: {account || "Not connected"}</p>
            <p>FHEVM Status: {fhevmStatus}</p>
            <p>Questions Loaded: {questions.length}</p>
            <p>Has Access: {hasAccess ? "Yes" : "No"}</p>
            <p>Has Submitted: {hasSubmitted ? "Yes" : "No"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
