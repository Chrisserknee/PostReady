"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "@/components/SectionCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { Notification } from "@/components/Notification";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

type AnalysisType = 'overall' | 'content' | 'engagement' | 'visual';

export default function AnalyzePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isDark = theme === 'dark';
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [analysisType, setAnalysisType] = useState<AnalysisType>('overall');
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setImageFile(file);
    setError("");
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please drop a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setImageFile(file);
    setError("");
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAnalyze = async () => {
    if (!imagePreview) {
      setError('Please upload an image first');
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setAnalysis("");

    try {
      const response = await fetch('/api/analyze-social-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imagePreview,
          analysisType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image');
      }

      setAnalysis(data.analysis);
      setNotification({
        type: 'success',
        message: 'Analysis completed successfully! 🎉'
      });

      // Scroll to results
      setTimeout(() => {
        document.getElementById('analysis-results')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze image. Please try again.');
      setNotification({
        type: 'error',
        message: 'Failed to analyze image. Please try again.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview("");
    setAnalysis("");
    setError("");
    setAnalysisType('overall');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis);
      setNotification({
        type: 'success',
        message: 'Analysis copied to clipboard! 📋'
      });
    }
  };

  // Format analysis with proper markdown-like styling
  const formatAnalysis = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Headers (lines starting with ##)
      if (line.startsWith('## ')) {
        return (
          <h3 key={index} className="text-2xl font-bold mt-6 mb-3" style={{ color: '#2979FF' }}>
            {line.replace('## ', '')}
          </h3>
        );
      }
      // Headers (lines starting with **header**)
      if (line.startsWith('**') && line.includes('**:')) {
        const headerMatch = line.match(/\*\*(.*?)\*\*/);
        if (headerMatch) {
          return (
            <h4 key={index} className="text-xl font-bold mt-4 mb-2" style={{ color: 'var(--secondary)' }}>
              {line.replace(/\*\*/g, '')}
            </h4>
          );
        }
      }
      // Bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-2" style={{ color: 'var(--text)' }}>
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i} style={{ color: '#2979FF' }}>{part}</strong> : part
            )}
          </p>
        );
      }
      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={index} className="ml-6 mb-2" style={{ color: 'var(--text)', listStyle: 'disc' }}>
            {line.replace(/^[\s-*]+/, '')}
          </li>
        );
      }
      // Numbered lists
      if (/^\d+\./.test(line.trim())) {
        return (
          <li key={index} className="ml-6 mb-2" style={{ color: 'var(--text)', listStyle: 'decimal' }}>
            {line.replace(/^\d+\.\s*/, '')}
          </li>
        );
      }
      // Regular paragraphs
      if (line.trim()) {
        return (
          <p key={index} className="mb-3" style={{ color: 'var(--text)' }}>
            {line}
          </p>
        );
      }
      // Empty lines
      return <br key={index} />;
    });
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--background)' }}>
      {notification && (
        <Notification
          isOpen={true}
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={() => router.push('/')}
            className="mb-6 text-sm font-medium hover:underline transition-colors"
            style={{ color: '#2979FF' }}
          >
            ← Back to Home
          </button>
          <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--text)' }}>
            📊 Social Media Page Analyzer
          </h1>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Upload a screenshot of any social media page and get AI-powered insights and actionable recommendations
          </p>
        </div>

        {/* Upload Section */}
        <SectionCard>
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text)' }}>
            📸 Upload Screenshot
          </h2>

          {!imagePreview ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all hover:border-blue-500"
              style={{ 
                borderColor: isDark ? '#444' : '#ddd',
                backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-4">
                <div className="text-6xl">📷</div>
                <h3 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                  Drop your screenshot here
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  or click to browse (PNG, JPG, JPEG - Max 10MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border-2" style={{ borderColor: '#2979FF' }}>
                <img
                  src={imagePreview}
                  alt="Screenshot preview"
                  className="w-full max-h-96 object-contain"
                  style={{ backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }}
                />
              </div>
              <div className="flex gap-3">
                <SecondaryButton onClick={handleReset} className="flex-1">
                  🗑️ Remove Image
                </SecondaryButton>
                <SecondaryButton onClick={() => fileInputRef.current?.click()} className="flex-1">
                  🔄 Change Image
                </SecondaryButton>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              ⚠️ {error}
            </div>
          )}
        </SectionCard>

        {/* Analysis Options */}
        {imagePreview && (
          <SectionCard>
            <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text)' }}>
              🎯 Analysis Focus
            </h2>
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                What would you like to focus on?
              </label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value as AnalysisType)}
                className="rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 border"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="overall">🌟 Overall Analysis (Comprehensive)</option>
                <option value="content">✍️ Content & Messaging</option>
                <option value="engagement">💬 Engagement & Interaction</option>
                <option value="visual">🎨 Visual Design & Branding</option>
              </select>
            </div>

            <PrimaryButton
              onClick={handleAnalyze}
              disabled={isAnalyzing || !imagePreview}
              className="w-full mt-6"
            >
              {isAnalyzing ? '🔍 Analyzing...' : '🚀 Analyze Page'}
            </PrimaryButton>
          </SectionCard>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <SectionCard>
            <div className="text-center py-12">
              <div className="inline-block mb-6">
                <div className="w-20 h-20 border-4 rounded-full animate-spin" style={{ 
                  borderColor: 'rgba(41, 121, 255, 0.2)',
                  borderTopColor: '#2979FF'
                }}></div>
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#2979FF' }}>
                Analyzing Your Social Media Page...
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Our AI is examining the content, design, and engagement strategies
              </p>
            </div>
          </SectionCard>
        )}

        {/* Analysis Results */}
        {analysis && !isAnalyzing && (
          <div id="analysis-results">
            <SectionCard>
              <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
                📊 Analysis Results
              </h2>
              <SecondaryButton onClick={copyToClipboard}>
                📋 Copy Analysis
              </SecondaryButton>
            </div>

            <div 
              className="prose prose-lg max-w-none p-6 rounded-xl"
              style={{ 
                backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9',
                border: `1px solid ${isDark ? '#333' : '#e5e5e5'}`
              }}
            >
              {formatAnalysis(analysis)}
            </div>

            <div className="flex gap-3 mt-6">
              <PrimaryButton onClick={handleReset} className="flex-1">
                🔄 Analyze Another Page
              </PrimaryButton>
              <SecondaryButton onClick={() => router.push('/')} className="flex-1">
                🏠 Back to Home
              </SecondaryButton>
            </div>
            </SectionCard>
          </div>
        )}

        {/* Info Card */}
        {!imagePreview && (
          <SectionCard>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              💡 How It Works
            </h2>
            <div className="space-y-4" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>Upload a Screenshot</h3>
                  <p>Take a screenshot of any social media page (Instagram, Facebook, TikTok, LinkedIn, etc.)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>Choose Your Focus</h3>
                  <p>Select what you want to analyze: overall strategy, content quality, engagement, or visual design</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>Get AI-Powered Insights</h3>
                  <p>Receive detailed analysis with strengths, opportunities, and actionable recommendations</p>
                </div>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
