"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useToast } from "../../providers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskProvider } from "@/hooks/useMetaMaskProvider";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { useSurveyResults } from "@/hooks/useSurveyResults";
import { useSurveyDecryption } from "@/hooks/useSurveyDecryption";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { 
  BarChart3, 
  Users, 
  Eye, 
  Download, 
  Lock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Share2,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { ethers } from "ethers"; // Import ethers for BigInt conversion

export default function ResultsPageClient() {
  const params = useParams();
  const surveyId = params.id as string;
  const { addToast } = useToast();

  // FHEVM and Web3 hooks
  const { provider, chainId, account, isConnected } = useMetaMaskProvider();
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider,
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected,
  });
  const { contract } = useSurveyContract(fhevmInstance, provider, chainId);

  // Real survey results data
  const { results, isLoading, loadResults } = useSurveyResults(
    surveyId, 
    contract, 
    fhevmInstance, 
    account
  );

  // FHEVM decryption functionality
  const { storage } = useInMemoryStorage();
  const [contractAddress, setContractAddress] = useState<string | undefined>(undefined);
  
  // Get contract address
  useEffect(() => {
    if (contract) {
      contract.getAddress().then(setContractAddress).catch(console.error);
    }
  }, [contract]);
  
  const { 
    isDecrypting, 
    decryptedResults, 
    decryptQuestionStats 
  } = useSurveyDecryption(
    fhevmInstance,
    contract,
    contractAddress,
    account,
    storage
  );

  const handleDecryptResults = async () => {
    console.log("=== DECRYPT BUTTON CLICKED ===");
    console.log("Results:", results);
    console.log("Can decrypt:", results?.canDecrypt);
    console.log("Account:", account);
    console.log("Survey creator:", results?.survey.creator);
    
    if (!results) {
      addToast({
        type: "error",
        title: "No results",
        description: "Survey results not loaded"
      });
      return;
    }

    // Check if user is creator (with enhanced logic)
    const isCreator = account && results.survey.creator && 
      account.toLowerCase() === results.survey.creator.toLowerCase();
    
    console.log("Is creator (enhanced check):", isCreator);

    if (!isCreator && process.env.NODE_ENV !== 'development') {
      addToast({
        type: "error",
        title: "Access denied",
        description: "Only survey creators can decrypt results"
      });
      return;
    }

    // Show mode info
    if (!isCreator && process.env.NODE_ENV === 'development') {
      addToast({
        type: "warning",
        title: "Development Test Mode",
        description: "Testing decryption functionality (you're not the creator)"
      });
    } else if (isCreator) {
      addToast({
        type: "info",
        title: "Starting decryption",
        description: "You are the survey creator - proceeding with decryption"
      });
    }

    try {
      const questionIds = results.questionResults.map(qr => qr.questionId);
      console.log("Attempting to decrypt question IDs:", questionIds);
      await decryptQuestionStats(surveyId, questionIds);
    } catch (error: any) {
      console.error("Decryption process failed:", error);
      addToast({
        type: "error", 
        title: "Decryption process failed",
        description: error.message || "Error in decryption workflow"
      });
    }
  };

  const exportResults = () => {
    if (!results) return;

    const exportData = {
      survey: results.survey,
      totalResponses: results.totalResponses,
      questions: results.questions,
      decryptedResults: decryptedResults,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey-${surveyId}-results.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast({
      type: "success",
      title: "Results exported",
      description: "Survey results have been downloaded as JSON"
    });
  };

  const formatDate = (timestamp: number) => {
    return format(timestamp, "MMM dd, yyyy HH:mm");
  };

  const getQuestionTypeText = (type: number): string => {
    switch (type) {
      case 0: return "Single Choice";
      case 1: return "Multiple Choice";
      case 2: return "Text";
      case 3: return "Rating";
      default: return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="loading-spinner mx-auto w-8 h-8 mb-4"></div>
        <p className="text-lg text-muted-foreground">Loading survey results...</p>
      </div>
    );
  }

  if (!results || !results.survey) {
    return (
      <div className="text-center py-10 bg-card rounded-lg shadow-md">
        <p className="text-xl font-semibold text-muted-foreground mb-4">Survey results not found.</p>
        <p className="text-muted-foreground">Please check the survey ID or ensure it exists.</p>
        <Link href="/my-surveys" className="btn-primary mt-6 inline-flex items-center gap-2">
          <Eye className="w-5 h-5" /> View My Surveys
        </Link>
      </div>
    );
  }

  const survey = results.survey;
  const isExpired = Date.now() > survey.expiresAt;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">{survey.title}</h1>
          <p className="text-muted-foreground text-lg">{survey.description}</p>
        </div>
        <div className="flex items-center gap-3 ml-6">
          {/* Show decrypt button - enhanced logic */}
          {(results.canDecrypt || 
            process.env.NODE_ENV === 'development' ||
            (account && results.survey.creator && 
             account.toLowerCase() === results.survey.creator.toLowerCase())) && (
            <button
              onClick={handleDecryptResults}
              disabled={isDecrypting}
              className="btn-secondary flex items-center gap-2"
              title="Click to decrypt FHEVM encrypted statistics"
            >
              {isDecrypting ? (
                <>
                  <div className="loading-spinner w-4 h-4"></div>
                  Decrypting...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Decrypt Results
                </>
              )}
            </button>
          )}
          
          <button
            onClick={exportResults}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="survey-card text-center">
          <div className="text-2xl font-bold text-blue-600">{results.totalResponses}</div>
          <div className="text-sm text-gray-500">Total Responses</div>
        </div>
        <div className="survey-card text-center">
          <div className="text-2xl font-bold text-purple-600">{results.questions.length}</div>
          <div className="text-sm text-gray-500">Questions</div>
        </div>
        <div className="survey-card text-center">
          <div className="text-2xl font-bold text-orange-600">
            {survey.isActive && !isExpired ? "Active" : "Inactive"}
          </div>
          <div className="text-sm text-gray-500">Status</div>
        </div>
      </div>

      {/* Survey Metadata */}
      <div className="survey-card mb-8">
        <h3 className="text-xl font-semibold mb-4">Survey Details</h3>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Created: {formatDate(survey.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{survey.isPublic ? "Public Survey" : "Private Survey"}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>Expires: {formatDate(survey.expiresAt)}</span>
          </div>
        </div>
      </div>

      {/* Question Results */}
      <h2 className="text-3xl font-bold mb-6">Question Analysis</h2>
      <div className="space-y-8">
        {results.questionResults.map((result) => {
          const question = result.question;
          const decryptedValue = decryptedResults[question.id]?.decryptedValue;

          return (
            <div key={question.id} className="survey-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{question.text}</h3>
                <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  {getQuestionTypeText(question.type)}
                </span>
              </div>

              {/* Encrypted/Decrypted Stats */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Encrypted Statistics
                </h4>
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                  Response data is encrypted using FHEVM technology. 
                  {results.canDecrypt 
                    ? " As the survey creator, you can decrypt the results to view detailed statistics."
                    : " Only the survey creator can decrypt and view detailed results."
                  }
                </p>
                {result.encryptedStats && (
                  <div className="text-xs font-mono bg-purple-100 dark:bg-purple-900 p-2 rounded">
                    Encrypted Handle: {result.encryptedStats.slice(0, 20)}...
                  </div>
                )}
                
                {/* Show decrypted value if available */}
                {decryptedValue !== undefined && (
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Decrypted Value: {decryptedValue.toString()}
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      This is the sum of all encrypted responses for this question
                    </p>
                  </div>
                )}
              </div>

              {/* Question Options Display */}
              {(question.type === 0 || question.type === 1) && question.options.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Available Options:</h4>
                  <div className="flex flex-wrap gap-2">
                    {question.options.map((option: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                        {option}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {question.type === 3 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Rating Scale:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    1 to {question.maxRating}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && results && (
        <div className="survey-card mt-6 border-gray-200 bg-gray-50 dark:bg-gray-900/20">
          <h3 className="font-medium mb-2">Debug Info (Development Only)</h3>
          <div className="text-sm space-y-1">
            <p>Survey ID: {results.survey.id}</p>
            <p>Creator: {results.survey.creator}</p>
            <p>Current Account: {account}</p>
            <p>Addresses Match: {account?.toLowerCase() === results.survey.creator.toLowerCase() ? "Yes" : "No"}</p>
            <p>Can Decrypt: {results.canDecrypt ? "Yes" : "No"} 
              {!results.canDecrypt && account && (
                <span className="text-red-600 ml-2">
                  ← This is why no decrypt button!
                </span>
              )}
            </p>
            <p>FHEVM Status: {fhevmStatus}</p>
            <p>Questions Loaded: {results.questions.length}</p>
            <p>Total Responses: {results.totalResponses}</p>
            <p>Contract Address: {contractAddress || "Not Available"}</p>
            <p>Is Connected: {isConnected ? "Yes" : "No"}</p>
          </div>
        </div>
      )}

      {/* Decrypt Button Status */}
      {results && (
        <div className="survey-card mt-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            🔓 Decryption Access Status
          </h3>
          {results.canDecrypt ? (
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ✅ You are the survey creator and can decrypt results. Look for the "Decrypt Results" button in the header above.
            </p>
          ) : (
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="mb-3">❌ You cannot decrypt results because addresses don't match:</p>
              <div className="bg-white dark:bg-blue-800 p-3 rounded border space-y-2">
                <div>
                  <span className="font-medium">Survey Creator:</span>
                  <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded mt-1">
                    {results.survey.creator}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Your Account:</span>
                  <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded mt-1">
                    {account || "Not connected"}
                  </div>
                </div>
                <div className="text-xs text-red-600 dark:text-red-400">
                  ❌ Addresses don't match - only creators can decrypt
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="font-medium">💡 Solutions:</p>
                <div className="pl-4 space-y-1">
                  <p>1. Switch to the creator's wallet in MetaMask</p>
                  <p>2. Or create your own survey to test decryption</p>
                  <p>3. In development mode, the button shows for testing</p>
                </div>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 bg-yellow-100 dark:bg-yellow-900 p-3 rounded">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    🧪 Development Mode: Decrypt button is visible for testing, but will show access error when clicked.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
