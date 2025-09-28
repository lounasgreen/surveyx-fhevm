"use client";

import { useState, useEffect } from "react";
import { useToast } from "./providers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskProvider } from "@/hooks/useMetaMaskProvider";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { useSurveyData } from "@/hooks/useSurveyData";
import { PlusCircle, Trash2, Save, Eye, Settings } from "lucide-react";

type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT" | "RATING";

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: string[];
  maxRating: number;
  isRequired: boolean;
}

interface Survey {
  title: string;
  description: string;
  duration: number; // in hours
  isPublic: boolean;
  questions: Question[];
}

export default function CreateSurveyPage() {
  const { addToast } = useToast();
  
  // FHEVM and Web3 hooks
  const { provider, chainId, account, connect, isConnected } = useMetaMaskProvider();
  const { instance: fhevmInstance } = useFhevm({
    provider,
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected,
  });
  const { contract } = useSurveyContract(fhevmInstance, provider, chainId);
  const { createSurvey, addQuestion, activateSurvey } = useSurveyData(contract, fhevmInstance, account);

  const [survey, setSurvey] = useState<Survey>({
    title: "",
    description: "",
    duration: 24,
    isPublic: true,
    questions: []
  });

  const [currentStep, setCurrentStep] = useState<"basic" | "questions" | "settings" | "preview">("basic");
  const [isCreating, setIsCreating] = useState(false);

  const addQuestionToSurvey = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type: "SINGLE_CHOICE",
      text: "",
      options: ["Option 1", "Option 2"],
      maxRating: 5,
      isRequired: true
    };
    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === id ? { ...q, ...updates } : q
      )
    }));
  };

  const deleteQuestion = (id: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const addOption = (questionId: string) => {
    updateQuestion(questionId, {
      options: [...survey.questions.find(q => q.id === questionId)!.options, `Option ${survey.questions.find(q => q.id === questionId)!.options.length + 1}`]
    });
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = survey.questions.find(q => q.id === questionId)!;
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionId, { options: newOptions });
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = survey.questions.find(q => q.id === questionId)!;
    if (question.options.length > 2) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const handleSaveDraft = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('surveyDraft', JSON.stringify(survey));
    }
    addToast({
      type: "success",
      title: "Draft saved",
      description: "Survey draft saved locally"
    });
  };

  const handleCreateSurvey = async () => {
    if (!survey.title.trim()) {
      addToast({
        type: "error",
        title: "Please enter survey title"
      });
      return;
    }

    if (survey.questions.length === 0) {
      addToast({
        type: "error",
        title: "Please add at least one question"
      });
      return;
    }

    if (!isConnected) {
      addToast({
        type: "error",
        title: "Please connect your wallet first"
      });
      return;
    }

    try {
      setIsCreating(true);
      
      // Create survey on blockchain
      const surveyId = await createSurvey(
        survey.title,
        survey.description,
        survey.duration * 3600, // Convert hours to seconds
        survey.isPublic
      );

      // Add questions to the survey
      for (const question of survey.questions) {
        const questionTypeMap = {
          "SINGLE_CHOICE": 0,
          "MULTIPLE_CHOICE": 1,
          "TEXT": 2,
          "RATING": 3
        };

        await addQuestion(
          surveyId,
          questionTypeMap[question.type],
          question.text,
          question.options,
          question.maxRating,
          question.isRequired
        );
      }

      // Activate the survey so users can participate
      addToast({
        type: "info",
        title: "Activating survey...",
        description: "Making survey available for participation"
      });
      
      await activateSurvey(surveyId);

      addToast({
        type: "success",
        title: "Survey created and activated!",
        description: "Your survey is now live and ready for responses"
      });

      // Clear form
      setSurvey({
        title: "",
        description: "",
        duration: 24,
        isPublic: true,
        questions: []
      });
      setCurrentStep("basic");
      if (typeof window !== 'undefined') {
        localStorage.removeItem('surveyDraft');
      }

    } catch (error) {
      console.error("Failed to create survey:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Load draft on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('surveyDraft');
      if (draft) {
        try {
          setSurvey(JSON.parse(draft));
        } catch (error) {
          console.error("Failed to load draft:", error);
        }
      }
    }
  }, []);

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Survey Title *</label>
        <input
          type="text"
          value={survey.title}
          onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
          className="input-field w-full"
          placeholder="Enter survey title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Survey Description</label>
        <textarea
          value={survey.description}
          onChange={(e) => setSurvey(prev => ({ ...prev, description: e.target.value }))}
          className="input-field w-full h-24 resize-none"
          placeholder="Enter survey description (optional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Duration (hours)</label>
        <input
          type="number"
          value={survey.duration}
          onChange={(e) => setSurvey(prev => ({ ...prev, duration: parseInt(e.target.value) || 24 }))}
          className="input-field w-32"
          min="1"
          max="8760"
        />
        <p className="text-sm text-gray-500 mt-1">Survey will expire {survey.duration} hours after creation</p>
      </div>
    </div>
  );

  const renderQuestions = () => (
    <div className="space-y-6">
      {survey.questions.map((question, index) => (
        <div key={question.id} className="question-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Question {index + 1}</h3>
            <button
              onClick={() => deleteQuestion(question.id)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Question Type</label>
              <select
                value={question.type}
                onChange={(e) => updateQuestion(question.id, { type: e.target.value as QuestionType })}
                className="input-field w-48"
              >
                <option value="SINGLE_CHOICE">Single Choice</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="TEXT">Text</option>
                <option value="RATING">Rating</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Question Text *</label>
              <input
                type="text"
                value={question.text}
                onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                className="input-field w-full"
                placeholder="Enter question text"
              />
            </div>

            {(question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") && (
              <div>
                <label className="block text-sm font-medium mb-2">Options</label>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                        className="input-field flex-1"
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      {question.options.length > 2 && (
                        <button
                          onClick={() => removeOption(question.id, optionIndex)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(question.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Option
                  </button>
                </div>
              </div>
            )}

            {question.type === "RATING" && (
              <div>
                <label className="block text-sm font-medium mb-2">Maximum Rating</label>
                <select
                  value={question.maxRating}
                  onChange={(e) => updateQuestion(question.id, { maxRating: parseInt(e.target.value) })}
                  className="input-field w-24"
                >
                  <option value={3}>3 points</option>
                  <option value={5}>5 points</option>
                  <option value={10}>10 points</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`required-${question.id}`}
                checked={question.isRequired}
                onChange={(e) => updateQuestion(question.id, { isRequired: e.target.checked })}
                className="rounded"
              />
              <label htmlFor={`required-${question.id}`} className="text-sm">
                Required question
              </label>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addQuestionToSurvey}
        className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-5 h-5" />
        Add Question
      </button>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-4">Survey Visibility</label>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="radio"
              id="public"
              name="visibility"
              checked={survey.isPublic}
              onChange={() => setSurvey(prev => ({ ...prev, isPublic: true }))}
            />
            <label htmlFor="public" className="flex-1">
              <div className="font-medium">Public Survey</div>
              <div className="text-sm text-gray-500">Anyone can access and fill out this survey</div>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="radio"
              id="private"
              name="visibility"
              checked={!survey.isPublic}
              onChange={() => setSurvey(prev => ({ ...prev, isPublic: false }))}
            />
            <label htmlFor="private" className="flex-1">
              <div className="font-medium">Private Survey</div>
              <div className="text-sm text-gray-500">Only authorized users can access this survey</div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Privacy Protection Notice</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• All survey responses will be encrypted using FHEVM technology</li>
          <li>• Only survey creators can view decrypted statistical results</li>
          <li>• Respondent personal information is fully protected</li>
          <li>• Data transmission uses end-to-end encryption</li>
        </ul>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="survey-card">
        <h2 className="text-2xl font-bold mb-2">{survey.title || "Survey Title"}</h2>
        {survey.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-4">{survey.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>Duration: {survey.duration} hours</span>
          <span>Type: {survey.isPublic ? "Public" : "Private"}</span>
          <span>Questions: {survey.questions.length}</span>
        </div>
      </div>

      {survey.questions.map((question, index) => (
        <div key={question.id} className="question-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-medium">{index + 1}.</span>
            <span className="text-lg">{question.text || "Question text"}</span>
            {question.isRequired && <span className="text-red-500">*</span>}
          </div>

          {question.type === "SINGLE_CHOICE" && (
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <input type="radio" name={`preview-${question.id}`} disabled />
                  <span>{option}</span>
                </div>
              ))}
            </div>
          )}

          {question.type === "MULTIPLE_CHOICE" && (
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <input type="checkbox" disabled />
                  <span>{option}</span>
                </div>
              ))}
            </div>
          )}

          {question.type === "TEXT" && (
            <textarea
              className="input-field w-full h-20 resize-none"
              placeholder="Text answer..."
              disabled
            />
          )}

          {question.type === "RATING" && (
            <div className="flex items-center gap-2">
              {Array.from({ length: question.maxRating }, (_, i) => (
                <button key={i} className="w-8 h-8 border border-gray-300 rounded text-sm" disabled>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const steps = [
    { id: "basic", label: "Basic Info", icon: Settings },
    { id: "questions", label: "Questions", icon: PlusCircle },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "preview", label: "Preview", icon: Eye }
  ];

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-2">Connect Wallet Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please connect your MetaMask wallet to create surveys
          </p>
          <button onClick={connect} className="btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Survey</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Create privacy-preserving surveys using FHEVM technology
        </p>
      </div>

      {/* Step Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-blue-600 text-white" 
                      : isCompleted
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="survey-card mb-8">
        {currentStep === "basic" && renderBasicInfo()}
        {currentStep === "questions" && renderQuestions()}
        {currentStep === "settings" && renderSettings()}
        {currentStep === "preview" && renderPreview()}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {currentStep !== "basic" && (
            <button
              onClick={() => {
                const currentIndex = steps.findIndex(s => s.id === currentStep);
                if (currentIndex > 0) {
                  setCurrentStep(steps[currentIndex - 1].id as any);
                }
              }}
              className="btn-secondary"
            >
              Previous
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSaveDraft}
            className="btn-secondary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>

          {currentStep !== "preview" ? (
            <button
              onClick={() => {
                const currentIndex = steps.findIndex(s => s.id === currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1].id as any);
                }
              }}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreateSurvey}
              disabled={isCreating}
              className="btn-primary flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="loading-spinner w-4 h-4"></div>
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Create Survey
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}