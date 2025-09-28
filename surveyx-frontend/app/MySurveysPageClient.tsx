"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useToast } from "./providers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskProvider } from "@/hooks/useMetaMaskProvider";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { useSurveyData } from "@/hooks/useSurveyData";
import { 
  PlusCircle, 
  Eye, 
  BarChart3, 
  Settings, 
  Users, 
  Clock, 
  Lock,
  Share2,
  Trash2,
  Play,
  Pause
} from "lucide-react";

export default function MySurveysPage() {
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
  
  // Use real survey data
  const { surveys, isLoading, activateSurvey } = useSurveyData(contract, fhevmInstance, account);

  // Component state
  const [selectedTab, setSelectedTab] = useState<"active" | "inactive" | "all">("all");

  const toggleSurveyStatus = async (surveyId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await activateSurvey(surveyId);
      } else {
        // Deactivate survey by calling deactivateSurvey
        addToast({
          type: "info",
          title: "Deactivating survey...",
          description: "Please confirm transaction in MetaMask"
        });
        
        // Call smart contract to deactivate
        if (!contract) {
          throw new Error("Contract not available");
        }
        
        // Get signer contract
        if (typeof window !== 'undefined' && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractAddress = await contract.getAddress();
          const signerContract = new ethers.Contract(contractAddress, contract.interface, signer);
          
          const tx = await signerContract.deactivateSurvey(surveyId);
          await tx.wait();
        }
        
        addToast({
          type: "success",
          title: "Survey deactivated",
          description: "Users can no longer fill out this survey"
        });
      }
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Operation failed",
        description: error.message || "Could not change survey status"
      });
    }
  };

  const deleteSurvey = async (surveyId: string) => {
    if (!confirm("Are you sure you want to delete this survey? This action cannot be undone.")) {
      return;
    }

    try {
      addToast({
        type: "info",
        title: "Deleting survey...",
        description: "Please confirm transaction in MetaMask"
      });

      // TODO: Implement delete survey
      await new Promise(resolve => setTimeout(resolve, 1000));

      addToast({
        type: "success",
        title: "Survey deleted",
        description: "Survey has been successfully deleted"
      });

    } catch (error) {
      addToast({
        type: "error",
        title: "Delete failed",
        description: "Could not delete survey, please try again"
      });
    }
  };

  const copyShareLink = (surveyId: string) => {
    const shareUrl = `${window.location.origin}/survey/${surveyId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      addToast({
        type: "success",
        title: "Link copied",
        description: "Survey share link copied to clipboard"
      });
    }).catch(() => {
      addToast({
        type: "error",
        title: "Copy failed",
        description: "Could not copy link, please copy manually"
      });
    });
  };

  const filteredSurveys = surveys.filter(survey => {
    if (selectedTab === "active") return survey.isActive && Date.now() <= survey.expiresAt;
    if (selectedTab === "inactive") return !survey.isActive || Date.now() > survey.expiresAt;
    return true;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getTimeRemaining = (expiresAt: number) => {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return "Expired";
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days left`;
    if (hours > 0) return `${hours} hours left`;
    return "Expiring soon";
  };

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-20">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Wallet Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please connect your MetaMask wallet to view your surveys
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Surveys</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage all your created surveys
          </p>
        </div>
        <a href="/create" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          Create New Survey
        </a>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {[
          { id: "all", label: "All", count: surveys.length },
          { id: "active", label: "Active", count: surveys.filter(s => s.isActive && Date.now() <= s.expiresAt).length },
          { id: "inactive", label: "Ended", count: surveys.filter(s => !s.isActive || Date.now() > s.expiresAt).length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === tab.id
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
          <span className="ml-3">Loading surveys...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSurveys.length === 0 && (
        <div className="text-center py-20">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {selectedTab === "all" ? "No surveys yet" : 
             selectedTab === "active" ? "No active surveys" : "No ended surveys"}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {selectedTab === "all" ? "Create your first survey to start collecting feedback" : 
             selectedTab === "active" ? "All surveys have ended or are paused" : "No ended surveys"}
          </p>
          {selectedTab === "all" && (
            <a href="/create" className="btn-primary">
              Create Survey
            </a>
          )}
        </div>
      )}

      {/* Surveys Grid */}
      {!isLoading && filteredSurveys.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSurveys.map(survey => {
            const isExpired = Date.now() > survey.expiresAt;
            const isActiveAndNotExpired = survey.isActive && !isExpired;

            return (
              <div key={survey.id} className="survey-card hover:shadow-lg transition-shadow">
                {/* Survey Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1 line-clamp-2">
                      {survey.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {survey.description}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ml-3 ${
                    isActiveAndNotExpired
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  }`}>
                    {isActiveAndNotExpired ? "Active" : isExpired ? "Expired" : "Paused"}
                  </div>
                </div>

                {/* Survey Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>{survey.responseCount} responses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                    <span>{survey.questionCount} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-xs">{getTimeRemaining(survey.expiresAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-600" />
                    <span className="text-xs">{survey.isPublic ? "Public" : "Private"}</span>
                  </div>
                </div>

                {/* Survey Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href={`/survey/${survey.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </a>
                  
                  <a
                    href={`/results/${survey.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Results
                  </a>

                  <button
                    onClick={() => copyShareLink(survey.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={() => toggleSurveyStatus(survey.id, !survey.isActive)}
                      className={`p-1.5 rounded-md transition-colors ${
                        survey.isActive
                          ? "text-orange-600 hover:bg-orange-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                      title={survey.isActive ? "Pause survey" : "Activate survey"}
                    >
                      {survey.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => deleteSurvey(survey.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete survey"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Creation Date */}
                <div className="text-xs text-gray-500 mt-2">
                  Created on {formatDate(survey.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}