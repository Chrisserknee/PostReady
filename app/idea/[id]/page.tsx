"use client";

// Video Idea Detail Page
import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { SectionCard } from "@/components/SectionCard";
import { Badge } from "@/components/Badge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { loadSavedVideoIdeas, SavedVideoIdea } from "@/lib/userHistory";
import { loadPostHistory, CompletedPost } from "@/lib/userHistory";
import { ContentIdea } from "@/types";

export default function IdeaDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <IdeaDetailContent />
    </Suspense>
  );
}

function IdeaDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [idea, setIdea] = useState<SavedVideoIdea | null>(null);
  const [completedPost, setCompletedPost] = useState<CompletedPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIdea = async () => {
      if (!params.id) return;

      try {
        if (user && user.id) {
          // Load from Supabase for authenticated users
          const ideasResult = await loadSavedVideoIdeas(user.id);
          const foundIdea = ideasResult.data?.find(i => i.id === params.id);
          
          if (foundIdea) {
            setIdea(foundIdea);
            
            // Try to find a completed post for this idea
            const postsResult = await loadPostHistory(user.id);
            const matchingPost = postsResult.data?.find(
              post => post.videoIdea.title === foundIdea.videoIdea.title && 
                      post.businessName === foundIdea.businessName
            );
            
            if (matchingPost) {
              setCompletedPost(matchingPost);
            }
          }
        }
      } catch (error) {
        console.error('Error loading idea:', error);
      } finally {
        setLoading(false);
      }
    };

    loadIdea();
  }, [params.id, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <SectionCard className="max-w-2xl">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
              Idea Not Found
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              This video idea could not be found.
            </p>
            <PrimaryButton onClick={() => router.push('/?view=history')} isPro={false}>
              Back to History
            </PrimaryButton>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => router.push('/?view=history')}
          className="mb-6 flex items-center gap-2 text-sm font-medium transition-all hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to History
        </button>

        <SectionCard className="mb-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {idea.videoIdea.title}
                  </h1>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {idea.businessName} • Saved {new Date(idea.savedAt).toLocaleString()}
                  </p>
                  <Badge variant={idea.videoIdea.angle}>
                    {idea.videoIdea.angle.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--secondary)' }}>
                📝 Description
              </h2>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {idea.videoIdea.description}
              </p>
            </div>

            {/* Caption & Hashtags (if completed post exists) */}
            {completedPost && completedPost.postDetails ? (
              <>
                <div>
                  <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--secondary)' }}>
                    ✍️ Caption
                  </h2>
                  <div className="rounded-lg p-4 border-2" style={{ 
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)'
                  }}>
                    <p className="text-base whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {completedPost.postDetails.caption}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(completedPost.postDetails.caption);
                      alert("Caption copied to clipboard!");
                    }}
                    className="mt-3 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 text-white"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    Copy Caption
                  </button>
                </div>

                {completedPost.postDetails.hashtags && completedPost.postDetails.hashtags.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--secondary)' }}>
                      🏷️ Hashtags
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {completedPost.postDetails.hashtags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--card-border)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t-2" style={{ borderColor: 'var(--card-border)' }}>
                  <div>
                    <h3 className="font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Post Title:</h3>
                    <p style={{ color: 'var(--text-primary)' }}>{completedPost.postDetails.title}</p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Best Post Time:</h3>
                    <p style={{ color: 'var(--text-primary)' }}>{completedPost.postDetails.bestPostTime}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg p-6 border-2 text-center" style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)'
              }}>
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  No Caption Generated Yet
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Complete the pipeline to generate captions and hashtags for this idea.
                </p>
                <PrimaryButton onClick={() => router.push('/')} isPro={false}>
                  Create Post
                </PrimaryButton>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

