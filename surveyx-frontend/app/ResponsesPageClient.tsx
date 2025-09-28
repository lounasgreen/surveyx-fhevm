"use client";

import { useState } from "react";
import { useToast } from "./providers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskProvider } from "@/hooks/useMetaMaskProvider";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { useUserResponses } from "@/hooks/useUserResponses";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Eye, 
  Lock,
  Calendar,
  Users,
  BarChart3,
  AlertCircle
} from "lucide-react";

export default function ResponsesPage() {
  const { addToast } = useToast();
  
  // FHEVM and Web3 hooks
  const { provider, chainId, account, connect, isConnected } = useMetaMaskProvider();
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider,
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected,
  });
  const { contract, isDeployed } = useSurveyContract(fhevmInstance, provider, chainId);

  // Use real user responses data
  const { responses, isLoading } = useUserResponses(contract, fhevmInstance, account);

  // Component state  
  const [selectedFilter, setSelectedFilter] = useState<"all" | "completed" | "partial">("all");

  const filteredResponses = responses.filter(response => {
    if (selectedFilter === "completed") return response.status === "completed";
    if (selectedFilter === "partial") return response.status === "partial";
    return true;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "partial":
        return <Clock className="w-5 h-5 text-orange-600" />;
      case "expired":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "partial":
        return "Partial";
      case "expired":
        return "Expired";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "partial":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-20">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Wallet Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please connect your MetaMask wallet to view your response history
          </p>
          <button onClick={connect} className="btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Responses</h1>
        <p className="text-gray-600 dark:text-gray-300">
          View all surveys you have participated in
        </p>
      </div>

      {/* Contract Status */}
      {isDeployed === false && (
        <div className="survey-card mb-8 border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900 dark:text-red-100">
                Contract Not Deployed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                SurveyX contract is not deployed on this network
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FHEVM Status */}
      {isConnected && fhevmStatus !== "ready" && (
        <div className="survey-card mb-8 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="loading-spinner"></div>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Initializing FHEVM...
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                Status: {fhevmStatus}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="survey-card text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {responses.length}
          </div>
          <div className="text-sm text-gray-500">Total Participated</div>
        </div>
        <div className="survey-card text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {responses.filter(r => r.status === "completed").length}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="survey-card text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {responses.filter(r => r.status === "partial").length}
          </div>
          <div className="text-sm text-gray-500">Partial</div>
        </div>
        <div className="survey-card text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {responses.reduce((sum, r) => sum + r.answeredCount, 0)}
          </div>
          <div className="text-sm text-gray-500">Total Responses</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {[
          { id: "all", label: "All", count: responses.length },
          { id: "completed", label: "Completed", count: responses.filter(r => r.status === "completed").length },
          { id: "partial", label: "Partial", count: responses.filter(r => r.status === "partial").length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id as any)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedFilter === tab.id
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="loading-spinner"></div>
          <span className="ml-3">Loading response history...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredResponses.length === 0 && (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {selectedFilter === "all" ? "No survey responses yet" : 
             selectedFilter === "completed" ? "No completed surveys" : "No partial surveys"}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {responses.length === 0 
              ? "You haven't participated in any surveys yet. Browse public surveys to get started!"
              : selectedFilter === "completed" 
              ? "Complete more surveys to see them here" 
              : "Continue incomplete surveys to see them here"}
          </p>
          {responses.length === 0 && (
            <a href="/browse" className="btn-primary">
              Browse Public Surveys
            </a>
          )}
        </div>
      )}

      {/* Responses List */}
      {!isLoading && filteredResponses.length > 0 && (
        <div className="space-y-4">
          {filteredResponses.map(response => (
            <div key={response.id} className="survey-card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(response.status)}
                    <h3 className="text-lg font-semibold">{response.surveyTitle}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(response.status)}`}>
                      {getStatusText(response.status)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {response.surveyDescription}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>{formatDate(response.submittedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-green-600" />
                      <span>{response.answeredCount}/{response.questionCount} questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>{formatAddress(response.creator)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-orange-600" />
                      <span>FHEVM Encrypted</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-6">
                  <a
                    href={`/survey/${response.surveyId}`}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Survey
                  </a>
                  
                  {response.status === "partial" && (
                    <a
                      href={`/survey/${response.surveyId}`}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Continue
                    </a>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {response.status !== "completed" && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Progress</span>
                    <span className="text-sm font-medium">
                      {Math.round((response.answeredCount / response.questionCount) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        response.status === "expired" ? "bg-red-500" : "bg-blue-600"
                      }`}
                      style={{ 
                        width: `${(response.answeredCount / response.questionCount) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="survey-card mt-8 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Privacy Protection Notice
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              All your survey responses are encrypted using FHEVM technology and stored on the blockchain. 
              Only survey creators can view statistical results - your individual responses remain completely private.
            </p>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="survey-card mt-6 border-gray-200 bg-gray-50 dark:bg-gray-900/20">
          <h3 className="font-medium mb-2">Debug Info (Development Only)</h3>
          <div className="text-sm space-y-1">
            <p>Account: {account}</p>
            <p>Contract: {contract ? "Available" : "Not Available"}</p>
            <p>Contract Deployed: {isDeployed ? "Yes" : "No"}</p>
            <p>FHEVM Status: {fhevmStatus}</p>
            <p>Responses Loaded: {responses.length}</p>
            <p>Is Loading: {isLoading ? "Yes" : "No"}</p>
          </div>
        </div>
      )}
    </div>
  );
}