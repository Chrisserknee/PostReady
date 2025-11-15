"use client";

// Post Detail Page
import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { SectionCard } from "@/components/SectionCard";
import { Badge } from "@/components/Badge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { loadPostHistory, CompletedPost, updatePostNotes } from "@/lib/userHistory";

export default function PostDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <PostDetailContent />
    </Suspense>
  );
}

function PostDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [post, setPost] = useState<CompletedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      if (!params.id || !user) return;

      try {
        const { data, error } = await loadPostHistory(user.id);
        if (!error && data) {
          const foundPost = data.find(p => p.id === params.id);
          if (foundPost) {
            setPost(foundPost);
            setEditedNotes(foundPost.postDetails.notes || "");
          }
        }
      } catch (error) {
        console.error('Error loading post:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [params.id, user]);

  const handleSaveNotes = async () => {
    if (!user || !post) return;

    setIsSavingNotes(true);
    try {
      const { error } = await updatePostNotes(user.id, post.id, editedNotes);
      if (!error) {
        // Update local state
        setPost({
          ...post,
          postDetails: {
            ...post.postDetails,
            notes: editedNotes
          }
        });
        setIsEditingNotes(false);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  };

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

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <SectionCard className="max-w-2xl">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
              Post Not Found
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              This post could not be found.
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
                    {post.videoIdea.title}
                  </h1>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {post.businessName} • Saved {new Date(post.completedAt).toLocaleString()}
                  </p>
                  <Badge variant={post.videoIdea.angle}>
                    {post.videoIdea.angle.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Video Idea Description */}
            <div>
              <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--secondary)' }}>
                📝 Video Idea
              </h2>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {post.videoIdea.description}
              </p>
            </div>

            {/* Post Title */}
            <div>
              <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--secondary)' }}>
                🎬 Post Title
              </h2>
              <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                {post.postDetails.title}
              </p>
            </div>

            {/* Caption */}
            <div>
              <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--secondary)' }}>
                ✍️ Caption
              </h2>
              <div className="rounded-lg p-4 border-2" style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)'
              }}>
                <p className="text-base whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {post.postDetails.caption}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(post.postDetails.caption);
                  alert("Caption copied to clipboard!");
                }}
                className="mt-3 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 text-white"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                📋 Copy Caption
              </button>
            </div>

            {/* Best Posting Time */}
            <div>
              <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--secondary)' }}>
                ⏰ Best Posting Time
              </h2>
              <p className="text-base" style={{ color: 'var(--text-primary)' }}>
                {post.postDetails.bestPostTime}
              </p>
            </div>

            {/* User Notes Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold" style={{ color: 'var(--secondary)' }}>
                  📝 Personal Notes
                </h2>
                {!isEditingNotes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-sm px-3 py-1 rounded-lg transition-all hover:scale-105"
                    style={{
                      backgroundColor: 'rgba(41, 121, 255, 0.1)',
                      color: '#2979FF'
                    }}
                  >
                    {post.postDetails.notes ? 'Edit Notes' : 'Add Notes'}
                  </button>
                )}
              </div>
              
              {isEditingNotes ? (
                <div>
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add personal notes about this post..."
                    rows={6}
                    className="w-full rounded-lg px-4 py-3 text-sm resize-none border-2 focus:outline-none focus:ring-2 transition-all mb-3"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-primary)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2979FF';
                      e.target.style.boxShadow = '0 0 0 3px rgba(41, 121, 255, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--card-border)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 text-white disabled:opacity-50"
                      style={{ backgroundColor: '#10b981' }}
                    >
                      {isSavingNotes ? 'Saving...' : '💾 Save Notes'}
                    </button>
                    <button
                      onClick={() => {
                        setEditedNotes(post.postDetails.notes || "");
                        setIsEditingNotes(false);
                      }}
                      className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 border-2"
                      style={{
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--card-bg)'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg p-4 border-2" style={{ 
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)'
                }}>
                  {post.postDetails.notes ? (
                    <p className="text-base whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {post.postDetails.notes}
                    </p>
                  ) : (
                    <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
                      No notes yet. Click "Add Notes" to add your thoughts about this post.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

