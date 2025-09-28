"use client";

import { useState, useEffect } from "react";
import { useTheme } from "./providers";
import { PlusCircle, FileText, Users, BarChart3, Shield, Zap, Globe, Lock } from "lucide-react";

export default function HomePageClient() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SurveyX
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            The first fully homomorphic encrypted survey platform on blockchain. 
            Create, share, and analyze surveys while preserving complete privacy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={toggleTheme}
              className="btn-primary flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Get Started
            </button>
            <a href="/browse" className="btn-secondary flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Browse Surveys
            </a>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="feature-card">
              <Shield className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fully Encrypted</h3>
              <p className="text-muted-foreground">
                Responses are encrypted using FHEVM technology, ensuring complete privacy
              </p>
            </div>
            <div className="feature-card">
              <Users className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Decentralized</h3>
              <p className="text-muted-foreground">
                Built on blockchain with smart contracts for transparency and trust
              </p>
            </div>
            <div className="feature-card">
              <BarChart3 className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-muted-foreground">
                Decrypt and analyze results while maintaining individual privacy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Create Survey</h3>
              <p className="text-muted-foreground">
                Design your survey with multiple question types and set access permissions
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Share & Collect</h3>
              <p className="text-muted-foreground">
                Share your survey publicly or with specific users to collect responses
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Encrypted Storage</h3>
              <p className="text-muted-foreground">
                All responses are encrypted on-chain using FHEVM technology
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">4. Decrypt & Analyze</h3>
              <p className="text-muted-foreground">
                Only survey creators can decrypt results for analysis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Create your first encrypted survey and experience the future of privacy-preserving data collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/create" className="btn-primary flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Create Survey
            </a>
            <a href="/browse" className="btn-secondary flex items-center gap-2">
              <Users className="w-5 h-5" />
              Explore Surveys
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
