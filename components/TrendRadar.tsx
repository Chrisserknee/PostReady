"use client";

import React, { useState, useEffect } from 'react';
import { EnhancedTrend, TrendResponse, TrendPlatform } from '@/types';

interface TrendRadarProps {
  theme: 'light' | 'dark';
}

export default function TrendRadar({ theme }: TrendRadarProps) {
  const [trends, setTrends] = useState<EnhancedTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Social Media');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [selectedTrend, setSelectedTrend] = useState<EnhancedTrend | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'detailed'>('grid');
  const [filterEngagement, setFilterEngagement] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [insights, setInsights] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['Social Media', 'Technology', 'Entertainment', 'Lifestyle', 'Business', 'Creative'];
  const platforms = ['All', 'TikTok', 'Instagram', 'YouTube', 'Twitter/X', 'LinkedIn', 'Facebook'];
  const engagementLevels = ['all', 'Viral 🚀', 'Hot 🔥', 'Rising 📈', 'Steady ⭐', 'Emerging 🌱'];

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          platform: selectedPlatform,
          trendCount: 12,
          includeHashtags: true,
          includeContentIdeas: true,
          includeAudioTrends: true,
          targetAudience: 'content creators'
        })
      });

      const data: TrendResponse = await response.json();
      
      if (data.success) {
        setTrends(data.trends);
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [selectedCategory, selectedPlatform]);

  const filteredTrends = trends.filter(trend => {
    const matchesEngagement = filterEngagement === 'all' || trend.engagementLevel === filterEngagement;
    const matchesSearch = searchQuery === '' || 
      trend.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trend.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trend.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesEngagement && matchesSearch;
  });

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'Viral 🚀': return '#ff0050';
      case 'Hot 🔥': return '#ff4500';
      case 'Rising 📈': return '#22c55e';
      case 'Steady ⭐': return '#3b82f6';
      case 'Emerging 🌱': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'Low': return '#22c55e';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatViews = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <div 
      className="mb-10 rounded-2xl shadow-lg border p-8 space-y-6 transition-all duration-500"
      style={{
        backgroundColor: theme === 'dark' 
          ? 'rgba(15, 23, 42, 0.9)' 
          : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' 
          ? 'rgba(41, 121, 255, 0.3)' 
          : 'rgba(41, 121, 255, 0.2)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
          📊 Enhanced Trend Radar 2.0
        </h2>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          AI-Powered Real-Time Trend Analysis Across All Platforms
        </p>
        {insights && (
          <div className="mt-4 flex justify-center gap-4 flex-wrap">
            <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              Avg Viral Score: {insights.averageViralScore}
            </span>
            <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              Top Platform: {insights.mostCommonPlatform}
            </span>
            <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
              {filteredTrends.length} Trends Found
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Category & Platform Selection */}
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-5 py-2.5 rounded-xl font-semibold transition-all hover:scale-105 shadow-md"
              style={{
                background: selectedCategory === cat 
                  ? 'linear-gradient(to right, #2979FF, #6FFFD2)'
                  : theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                color: selectedCategory === cat ? 'white' : 'var(--text-primary)',
                border: selectedCategory === cat ? 'none' : '1px solid rgba(41, 121, 255, 0.3)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Platform Filter & View Controls */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            {platforms.map(platform => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                style={{
                  background: selectedPlatform === platform
                    ? 'rgba(41, 121, 255, 0.2)'
                    : 'transparent',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(41, 121, 255, 0.3)'
                }}
              >
                {platform}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-center">
            {/* View Mode Toggle */}
            <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'rgba(41, 121, 255, 0.1)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className="px-3 py-1.5 rounded text-sm font-medium transition-all"
                style={{
                  backgroundColor: viewMode === 'grid' ? '#2979FF' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : 'var(--text-primary)'
                }}
              >
                📱 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="px-3 py-1.5 rounded text-sm font-medium transition-all"
                style={{
                  backgroundColor: viewMode === 'list' ? '#2979FF' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'var(--text-primary)'
                }}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className="px-3 py-1.5 rounded text-sm font-medium transition-all"
                style={{
                  backgroundColor: viewMode === 'detailed' ? '#2979FF' : 'transparent',
                  color: viewMode === 'detailed' ? 'white' : 'var(--text-primary)'
                }}
              >
                📊 Detailed
              </button>
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
              style={{
                background: showFilters ? 'linear-gradient(to right, #6366f1, #8b5cf6)' : 'rgba(99, 102, 241, 0.2)',
                color: 'white'
              }}
            >
              🔍 Filters
            </button>

            {/* Refresh */}
            <button
              onClick={fetchTrends}
              disabled={loading}
              className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(to right, #22c55e, #10b981)',
                color: 'white',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: 'rgba(41, 121, 255, 0.05)', border: '1px solid rgba(41, 121, 255, 0.2)' }}>
            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text-primary)' }}>
                Search Trends:
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, or hashtags..."
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'white',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(41, 121, 255, 0.3)'
                }}
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text-primary)' }}>
                Filter by Engagement:
              </label>
              <div className="flex gap-2 flex-wrap">
                {engagementLevels.map(level => (
                  <button
                    key={level}
                    onClick={() => setFilterEngagement(level)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: filterEngagement === level ? getEngagementColor(level) : 'rgba(41, 121, 255, 0.1)',
                      color: filterEngagement === level ? 'white' : 'var(--text-primary)',
                      border: '1px solid rgba(41, 121, 255, 0.3)'
                    }}
                  >
                    {level === 'all' ? 'All Levels' : level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trending Hashtags Bar */}
      {insights && insights.trendingHashtags.length > 0 && (
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <h3 className="font-bold mb-2" style={{ color: '#8b5cf6' }}>🔥 Trending Hashtags:</h3>
          <div className="flex flex-wrap gap-2">
            {insights.trendingHashtags.slice(0, 8).map((tag: string, i: number) => (
              <span 
                key={i}
                className="px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:scale-105 transition-all"
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}
                onClick={() => setSearchQuery(tag.replace('#', ''))}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trends Display */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin text-6xl mb-4">⚡</div>
          <p className="text-xl font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Analyzing trends across platforms...
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrends.map(trend => (
                <div
                  key={trend.id}
                  onClick={() => setSelectedTrend(trend)}
                  className="p-5 rounded-xl border transition-all hover:scale-105 cursor-pointer"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.05)' : 'rgba(41, 121, 255, 0.03)',
                    borderColor: getEngagementColor(trend.engagementLevel),
                    borderWidth: '2px'
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg flex-1" style={{ color: 'var(--secondary)' }}>
                      {trend.title}
                    </h3>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-bold ml-2 whitespace-nowrap"
                      style={{ 
                        backgroundColor: getEngagementColor(trend.engagementLevel) + '33',
                        color: getEngagementColor(trend.engagementLevel)
                      }}
                    >
                      {trend.engagementLevel}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {trend.description}
                  </p>

                  {/* Stats */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>Viral Score:</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${trend.viralScore}%`,
                              background: 'linear-gradient(to right, #2979FF, #6FFFD2)'
                            }}
                          />
                        </div>
                        <span className="font-bold" style={{ color: 'var(--secondary)' }}>
                          {trend.viralScore}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>Estimated Views:</span>
                      <span className="font-bold" style={{ color: '#22c55e' }}>
                        {formatViews(trend.estimatedViews.min)} - {formatViews(trend.estimatedViews.max)}
                      </span>
                    </div>
                  </div>

                  {/* Platform Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                      📱 {trend.primaryPlatform}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: getCompetitionColor(trend.competitionLevel) + '33', color: getCompetitionColor(trend.competitionLevel) }}>
                      {trend.competitionLevel} Competition
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-3">
              {filteredTrends.map((trend, index) => (
                <div
                  key={trend.id}
                  onClick={() => setSelectedTrend(trend)}
                  className="p-4 rounded-xl border transition-all hover:scale-[1.01] cursor-pointer flex items-center gap-4"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.05)' : 'rgba(41, 121, 255, 0.03)',
                    borderColor: 'rgba(41, 121, 255, 0.3)'
                  }}
                >
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-secondary)', minWidth: '40px' }}>
                    #{index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg" style={{ color: 'var(--secondary)' }}>
                        {trend.title}
                      </h3>
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-bold"
                        style={{ 
                          backgroundColor: getEngagementColor(trend.engagementLevel) + '33',
                          color: getEngagementColor(trend.engagementLevel)
                        }}
                      >
                        {trend.engagementLevel}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                      {trend.description}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold mb-1" style={{ color: '#22c55e' }}>
                      {trend.viralScore}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Viral Score
                    </div>
                  </div>

                  <div className="text-sm text-center">
                    <div className="font-bold" style={{ color: 'var(--secondary)' }}>
                      {formatViews(trend.estimatedViews.max)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Max Views
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'detailed' && (
            <div className="space-y-6">
              {filteredTrends.map((trend, index) => (
                <div
                  key={trend.id}
                  className="p-6 rounded-xl border"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.05)' : 'rgba(41, 121, 255, 0.03)',
                    borderColor: getEngagementColor(trend.engagementLevel),
                    borderWidth: '2px'
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                          #{index + 1}
                        </span>
                        <h3 className="font-bold text-2xl" style={{ color: 'var(--secondary)' }}>
                          {trend.title}
                        </h3>
                        <span 
                          className="px-3 py-1 rounded-full text-sm font-bold"
                          style={{ 
                            backgroundColor: getEngagementColor(trend.engagementLevel) + '33',
                            color: getEngagementColor(trend.engagementLevel)
                          }}
                        >
                          {trend.engagementLevel}
                        </span>
                      </div>
                      <p className="text-base mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {trend.description}
                      </p>
                    </div>

                    <div className="text-center ml-4">
                      <div className="text-4xl font-bold mb-1" style={{ color: '#22c55e' }}>
                        {trend.viralScore}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Viral Score
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                      <div className="text-xs font-semibold mb-1" style={{ color: '#22c55e' }}>
                        📊 ESTIMATED VIEWS
                      </div>
                      <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formatViews(trend.estimatedViews.min)} - {formatViews(trend.estimatedViews.max)}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                      <div className="text-xs font-semibold mb-1" style={{ color: '#3b82f6' }}>
                        🎯 TARGET AUDIENCE
                      </div>
                      <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        {trend.demographics.targetAge}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                      <div className="text-xs font-semibold mb-1" style={{ color: '#8b5cf6' }}>
                        ⏱️ TREND DURATION
                      </div>
                      <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        {trend.durationPrediction}
                      </div>
                    </div>
                  </div>

                  {/* Platforms & Competition */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="px-3 py-1.5 rounded-full text-sm font-semibold" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                      📱 {trend.primaryPlatform}
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-sm font-semibold" style={{ backgroundColor: getCompetitionColor(trend.competitionLevel) + '33', color: getCompetitionColor(trend.competitionLevel) }}>
                      {trend.competitionLevel} Competition
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-sm font-semibold" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                      🎯 {trend.reachPotential}% Reach
                    </span>
                  </div>

                  {/* Hashtags */}
                  {trend.hashtags.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        🔖 Hashtags:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trend.hashtags.map((tag, i) => (
                          <span 
                            key={i}
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Angles */}
                  {trend.contentAngles.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        🎬 Content Angles:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trend.contentAngles.map((angle, i) => (
                          <span 
                            key={i}
                            className="px-3 py-1 rounded-lg text-sm font-medium"
                            style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}
                          >
                            {angle}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Content Ideas */}
                  {trend.quickContentIdeas.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        💡 Quick Content Ideas:
                      </div>
                      <ul className="space-y-1">
                        {trend.quickContentIdeas.map((idea, i) => (
                          <li 
                            key={i}
                            className="text-sm pl-4"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            • {idea}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Best Posting Times */}
                  {trend.bestPostingTimes.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        ⏰ Best Posting Times:
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {trend.bestPostingTimes.map((time, i) => (
                          <span 
                            key={i}
                            className="px-3 py-1 rounded-lg text-sm font-medium"
                            style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
                          >
                            🕐 {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Audio */}
                  {trend.trendingAudio && (
                    <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                      <div className="text-sm font-semibold mb-1" style={{ color: '#ec4899' }}>
                        🎵 Trending Audio:
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {trend.trendingAudio}
                      </div>
                    </div>
                  )}

                  {/* Related Trends */}
                  {trend.relatedTrends.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        🔗 Related Trends:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trend.relatedTrends.map((related, i) => (
                          <span 
                            key={i}
                            className="px-2 py-1 rounded text-xs"
                            style={{ backgroundColor: 'rgba(41, 121, 255, 0.15)', color: '#2979FF' }}
                          >
                            {related}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Trend Detail Modal */}
      {selectedTrend && viewMode !== 'detailed' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTrend(null)}
        >
          <div 
            className="max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              border: `2px solid ${getEngagementColor(selectedTrend.engagementLevel)}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                  {selectedTrend.title}
                </h2>
                <span 
                  className="px-3 py-1 rounded-full text-sm font-bold"
                  style={{ 
                    backgroundColor: getEngagementColor(selectedTrend.engagementLevel) + '33',
                    color: getEngagementColor(selectedTrend.engagementLevel)
                  }}
                >
                  {selectedTrend.engagementLevel}
                </span>
              </div>
              <button
                onClick={() => setSelectedTrend(null)}
                className="text-2xl font-bold hover:scale-110 transition-all"
                style={{ color: 'var(--text-primary)' }}
              >
                ✕
              </button>
            </div>

            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              {selectedTrend.description}
            </p>

            {/* All the detailed information from the detailed view */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: '#22c55e' }}>VIRAL SCORE</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedTrend.viralScore}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: '#3b82f6' }}>ESTIMATED VIEWS</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatViews(selectedTrend.estimatedViews.min)}-{formatViews(selectedTrend.estimatedViews.max)}
                  </div>
                </div>
              </div>

              {selectedTrend.hashtags.length > 0 && (
                <div>
                  <div className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>🔖 Hashtags:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrend.hashtags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 rounded text-sm" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedTrend.quickContentIdeas.length > 0 && (
                <div>
                  <div className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>💡 Content Ideas:</div>
                  <ul className="space-y-1">
                    {selectedTrend.quickContentIdeas.map((idea, i) => (
                      <li key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>• {idea}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedTrend.bestPostingTimes.length > 0 && (
                <div>
                  <div className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>⏰ Best Times:</div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTrend.bestPostingTimes.map((time, i) => (
                      <span key={i} className="px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                        {time}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTrends.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            No trends found
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Try adjusting your filters or selecting a different category
          </p>
        </div>
      )}
    </div>
  );
}
