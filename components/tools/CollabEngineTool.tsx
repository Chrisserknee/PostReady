"use client";

import React, { useState, useEffect } from 'react';
import { InputField } from "@/components/InputField";
import { SelectField } from "@/components/SelectField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Modal } from "@/components/Modal";

interface Collaborator {
  username: string;
  displayName: string;
  followerCount: number;
  niche: string;
  contentFocus: string;
  bio: string;
  instagram?: string;
  youtube?: string;
  isRealUser: boolean;
  whyPerfect: string;
  collabIdea: string;
  dm: string;
}

export function CollabEngineTool() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [username, setUsername] = useState("");
  const [niche, setNiche] = useState("");
  const [followerRange, setFollowerRange] = useState("10k-50k");
  const [results, setResults] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyingIndex, setCopyingIndex] = useState<number | null>(null);
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [directoryProfile, setDirectoryProfile] = useState<any>(null);
  const [showJoinDirectory, setShowJoinDirectory] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    tiktok_username: "",
    display_name: "",
    niche: "",
    follower_count: "",
    content_focus: "",
    bio: "",
    instagram_username: "",
    youtube_username: "",
    email_for_collabs: "",
  });

  // Load profile
  useEffect(() => {
    const loadCollabProfile = async () => {
      // Even if no user, we stop loading
      if (!user) {
        setIsLoadingProfile(false);
        return;
      }
      
      try {
        const response = await fetch('/api/collab-directory');
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setDirectoryProfile(data.profile);
            setProfileForm({
              tiktok_username: data.profile.tiktok_username || "",
              display_name: data.profile.display_name || "",
              niche: data.profile.niche || "",
              follower_count: data.profile.follower_count?.toLocaleString() || "",
              content_focus: data.profile.content_focus || "",
              bio: data.profile.bio || "",
              instagram_username: data.profile.instagram_username || "",
              youtube_username: data.profile.youtube_username || "",
              email_for_collabs: data.profile.email_for_collabs || "",
            });
          }
        }
      } catch (error) {
        console.error('Error loading collab profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    loadCollabProfile();
  }, [user]);

  const handleSearch = async () => {
    if (!niche.trim()) {
      setError("Please enter a niche to search.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    setResults([]);
    
    try {
      const response = await fetch('/api/collab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username || undefined,
          niche,
          followerRange
        })
      });

      if (!response.ok) {
        throw new Error('Failed to find collaborators');
      }

      const data = await response.json();
      setResults(data.collaborators);
    } catch (err: any) {
      console.error('Collab search error:', err);
      setError(err.message || 'Failed to find collaborators. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDmAndVisit = (dm: string, username: string, index: number) => {
    setCopyingIndex(index);
    navigator.clipboard.writeText(dm);
    
    // Simulate "reading" time before redirect
    setTimeout(() => {
      window.open(`https://www.tiktok.com/@${username.replace('@', '')}`, '_blank');
      setCopyingIndex(null);
    }, 1000);
  };

  const handleJoinNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return; // Should be handled by auth check before opening
    
    setIsSubmittingProfile(true);
    
    try {
      const response = await fetch('/api/collab-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save profile');
      }
      
      const data = await response.json();
      setDirectoryProfile(data.profile);
      setShowJoinDirectory(false);
      // Ideally show a toast here
    } catch (error) {
      console.error('Error saving profile:', error);
      // Ideally show error toast
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Join Network CTA - Visible if not loading, not joined, or not logged in */}
      {!isLoadingProfile && !directoryProfile && (
        <div 
          className="mb-8 p-6 rounded-xl border-2 border-dashed transition-all duration-500 ease-in-out" 
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(255, 79, 120, 0.08)' : 'rgba(255, 79, 120, 0.05)',
            borderColor: 'rgba(255, 79, 120, 0.4)',
            animation: 'fadeIn 0.5s ease-in-out'
          }}
        >
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
              ✨ Join the PostReady Collab Network
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Click join, enter your details, and instantly discover creators with similar followings in your niche ready to collaborate!
            </p>
            <Button
              onClick={() => {
                if (user) {
                  setProfileForm(prev => ({ ...prev, email_for_collabs: user.email || '' }));
                  setShowJoinDirectory(true);
                } else {
                  // Redirect to sign in or show auth modal - for now alert as placeholder if auth context doesn't expose modal opener
                  alert("Please sign in to join the network!");
                  // In real app: openAuthModal('signup');
                }
              }}
              className="px-8 py-6 font-bold text-lg shadow-md hover:scale-105 transition-transform"
              style={{
                background: 'linear-gradient(135deg, #FF4F78, #FF6B9D, #FF8FB3)',
                color: 'white',
                border: 'none'
              }}
            >
              Join the Network
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Find Your Perfect Collab Partner</CardTitle>
          <CardDescription>Search for creators in your niche with similar follower counts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <InputField
              label="Your Niche"
              value={niche}
              onChange={setNiche}
              placeholder="e.g. Fitness, Gaming, Beauty..."
              required
            />
            
            <SelectField
              label="Follower Count"
              value={followerRange}
              onChange={setFollowerRange}
              options={[
                "1k-10k",
                "10k-50k",
                "50k-100k",
                "100k-500k",
                "500k-1M",
                "1M+"
              ]}
              required
            />
            
            <InputField
              label="Your Username (Optional)"
              value={username}
              onChange={setUsername}
              placeholder="@yourhandle"
            />
          </div>

          <Button 
            onClick={handleSearch}
            disabled={isLoading || !niche.trim()}
            className="w-full font-bold text-lg py-6"
            size="lg"
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Searching Network...
              </>
            ) : (
              "Find Collaborators 🤝"
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-2xl font-bold">Matches Found ({results.length})</h3>
          
          <div className="grid gap-6">
            {results.map((collab, index) => (
              <Card key={index} className="overflow-hidden border-2 transition-all hover:border-primary/50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Profile Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-bold">@{collab.username.replace('@', '')}</h4>
                        {collab.isRealUser && (
                          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">
                            ✅ Real User
                          </Badge>
                        )}
                      </div>
                      
                      <p className="font-medium text-foreground/80 mb-2">{collab.displayName}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary">{collab.followerCount.toLocaleString()} followers</Badge>
                        <Badge variant="outline">{collab.niche}</Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">{collab.bio}</p>
                      
                      <div className="flex gap-3">
                        {collab.instagram && (
                          <a href={`https://instagram.com/${collab.instagram}`} target="_blank" rel="noreferrer" className="text-pink-600 text-sm hover:underline">
                            📷 Instagram
                          </a>
                        )}
                        {collab.youtube && (
                          <a href={`https://youtube.com/@${collab.youtube}`} target="_blank" rel="noreferrer" className="text-red-600 text-sm hover:underline">
                            ▶️ YouTube
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Right: AI Insights */}
                    <div className="flex-1 space-y-4 border-l pl-6">
                      <div className="bg-primary/5 p-4 rounded-lg">
                        <p className="text-sm font-bold text-primary mb-1">💡 Why They're Perfect</p>
                        <p className="text-sm">{collab.whyPerfect}</p>
                      </div>
                      
                      <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="text-sm font-bold mb-1">🎬 Collab Idea</p>
                        <p className="text-sm">{collab.collabIdea}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* DM Section */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="bg-muted p-4 rounded-lg mb-4 font-mono text-sm whitespace-pre-wrap">
                      {collab.dm}
                    </div>
                    <Button 
                      onClick={() => handleCopyDmAndVisit(collab.dm, collab.username, index)}
                      disabled={copyingIndex === index}
                      className="w-full font-bold"
                    >
                      {copyingIndex === index ? "Redirecting..." : "📋 Copy DM & Visit Profile"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Join Directory Modal - Reused logic from old page but inline here */}
      {/* Note: The Modal component is generic, we need to render the form inside it */}
      {/* Simplified for this context, usually we'd use a Dialog from shadcn */}
      {showJoinDirectory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Join the Creator Network</CardTitle>
              <CardDescription>Fill out your profile to be discoverable by other creators.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinNetwork} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="TikTok Username"
                    value={profileForm.tiktok_username}
                    onChange={(val) => setProfileForm({...profileForm, tiktok_username: val})}
                    placeholder="@username"
                    required
                  />
                  <InputField
                    label="Display Name"
                    value={profileForm.display_name}
                    onChange={(val) => setProfileForm({...profileForm, display_name: val})}
                    placeholder="Your Name"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Niche"
                    value={profileForm.niche}
                    onChange={(val) => setProfileForm({...profileForm, niche: val})}
                    placeholder="e.g. Fitness"
                    required
                  />
                  <InputField
                    label="Follower Count"
                    value={profileForm.follower_count}
                    onChange={(val) => setProfileForm({...profileForm, follower_count: val})}
                    placeholder="e.g. 10,000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio / Collab Interests</label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                    className="w-full p-3 rounded-md border bg-background"
                    rows={3}
                    placeholder="What kind of collabs are you looking for?"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Instagram (Optional)"
                    value={profileForm.instagram_username}
                    onChange={(val) => setProfileForm({...profileForm, instagram_username: val})}
                    placeholder="@username"
                  />
                  <InputField
                    label="YouTube (Optional)"
                    value={profileForm.youtube_username}
                    onChange={(val) => setProfileForm({...profileForm, youtube_username: val})}
                    placeholder="@channel"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" type="button" onClick={() => setShowJoinDirectory(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmittingProfile}>
                    {isSubmittingProfile ? "Joining..." : "Join Network"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
