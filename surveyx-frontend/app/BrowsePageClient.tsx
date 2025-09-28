"use client";

import { useState, useEffect } from "react";
import { useToast } from "./providers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskProvider } from "@/hooks/useMetaMaskProvider";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { 
  Search, 
  Filter, 
  Eye, 
  Users, 
  Clock, 
  Plus,
  ExternalLink,
  AlertCircle,
  FileText
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function BrowsePageClient() {
  const { addToast } = useToast();
  
  // FHEVM and Web3 hooks
  const { provider, chainId, account, isConnected } = useMetaMaskProvider();
  const { instance: fhevmInstance } = useFhevm({
    provider,
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected,
  });
  const { contract } = useSurveyContract(fhevmInstance, provider, chainId);

  // Component state
  const [surveys, setSurveys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "responses">("newest");

  // Load public surveys
  const loadPublicSurveys = async () => {
    if (!contract) return;

    try {
      setIsLoading(true);
      const publicSurveyIds = await contract.getPublicSurveys();
      
      const surveysData = [];
      for (const surveyId of publicSurveyIds) {
        try {
          const surveyData = await contract.surveys(surveyId);
          if (surveyData.creator !== "0x0000000000000000000000000000000000000000") {
            surveysData.push({
              id: surveyId.toString(),
              title: surveyData.title || `Survey #${surveyId}`,
              description: surveyData.description || "No description provided",
              creator: surveyData.creator,
              createdAt: Number(surveyData.createdAt) * 1000,
              expiresAt: Number(surveyData.expiresAt) * 1000,
              isActive: surveyData.isActive,
              responseCount: Number(surveyData.responseCount),
              questionCount: Number(surveyData.questionCount)
            });
          }
        } catch (error) {
          console.error(`Failed to load survey ${surveyId}:`, error);
        }
      }
      
      setSurveys(surveysData);
    } catch (error) {
      console.error("Failed to load public surveys:", error);
      addToast({
        type: "error",
        title: "Failed to load surveys",
        description: "Could not load public surveys from blockchain"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPublicSurveys();
  }, [contract]);

  // Filter and sort surveys
  const filteredSurveys = surveys
    .filter(survey => 
      survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt - a.createdAt;
        case "oldest":
          return a.createdAt - b.createdAt;
        case "responses":
          return b.responseCount - a.responseCount;
        default:
          return 0;
      }
    });

  const formatDate = (timestamp: number) => {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Browse Public Surveys</h1>
          <p className="text-muted-foreground text-lg">
            Discover and participate in public surveys from the community
          </p>
        </div>
        <Link href="/create" className="btn-primary flex items-center gap-2 mt-4 md:mt-0">
          <Plus className="w-5 h-5" />
          Create Survey
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search surveys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "responses")}
          className="px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="newest">Sort by: Newest</option>
          <option value="oldest">Sort by: Oldest</option>
          <option value="responses">Sort by: Most Responses</option>
        </select>
      </div>

      {/* Surveys Grid */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="loading-spinner mx-auto w-8 h-8 mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading public surveys...</p>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-lg shadow-md">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-muted-foreground mb-4">
            {searchTerm ? "No surveys match your search" : "No public surveys available"}
          </p>
          <p className="text-muted-foreground mb-6">
            {searchTerm 
              ? "Try adjusting your search terms or create a new survey."
              : "Be the first to create a public survey for the community."
            }
          </p>
          <Link href="/create" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Survey
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSurveys.map((survey) => {
            const isExpired = Date.now() > survey.expiresAt;
            const isActive = survey.isActive && !isExpired;

            return (
              <div key={survey.id} className="survey-card">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold line-clamp-2 flex-1 mr-2">
                    {survey.title}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isActive 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                  {survey.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>by {survey.creator.slice(0, 6)}...{survey.creator.slice(-4)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(survey.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {survey.responseCount} responses
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {survey.questionCount} questions
                    </span>
                  </div>
                  {isActive && (
                    <Link 
                      href={`/survey/${survey.id}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Participate
                    </Link>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Expires {formatDate(survey.expiresAt)}</span>
                    {isExpired && (
                      <span className="text-red-500">Expired</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
