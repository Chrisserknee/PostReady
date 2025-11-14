import { supabase } from './supabase';
import { BusinessInfo, StrategyResult, ContentIdea, PostDetails } from '@/types';

export interface SavedBusiness {
  id: string;
  businessInfo: BusinessInfo;
  strategy: StrategyResult;
  lastUsed: string;
}

export interface CompletedPost {
  id: string;
  businessName: string;
  videoIdea: ContentIdea;
  postDetails: PostDetails;
  completedAt: string;
}

export interface SavedVideoIdea {
  id: string;
  businessName: string;
  businessInfo: BusinessInfo;
  videoIdea: ContentIdea;
  savedAt: string;
}

// Save a business for quick access
export async function saveBusiness(
  userId: string,
  businessInfo: BusinessInfo,
  strategy: StrategyResult
): Promise<{ error: any }> {
  try {
    const { error } = await supabase.from('saved_businesses').upsert(
      {
        user_id: userId,
        business_name: businessInfo.businessName,
        business_info: businessInfo,
        strategy: strategy,
        last_used: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,business_name',
      }
    );

    return { error };
  } catch (error) {
    console.error('Error saving business:', error);
    return { error };
  }
}

// Load all saved businesses for a user
export async function loadSavedBusinesses(userId: string): Promise<{
  data: SavedBusiness[];
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('saved_businesses')
      .select('*')
      .eq('user_id', userId)
      .order('last_used', { ascending: false });

    if (error) {
      return { data: [], error };
    }

    const businesses: SavedBusiness[] = (data || []).map((row: any) => ({
      id: row.id,
      businessInfo: row.business_info,
      strategy: row.strategy,
      lastUsed: row.last_used,
    }));

    return { data: businesses, error: null };
  } catch (error) {
    console.error('Error loading saved businesses:', error);
    return { data: [], error };
  }
}

// Save a completed post to history
export async function saveCompletedPost(
  userId: string,
  businessName: string,
  videoIdea: ContentIdea,
  postDetails: PostDetails
): Promise<{ error: any }> {
  try {
    // Check if a post with the same video idea title already exists (within the last 5 minutes)
    // This prevents duplicate saves when the same post is saved multiple times during the workflow
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: existingPosts, error: checkError } = await supabase
      .from('post_history')
      .select('id, video_idea')
      .eq('user_id', userId)
      .eq('business_name', businessName)
      .gte('completed_at', fiveMinutesAgo)
      .order('completed_at', { ascending: false })
      .limit(5);

    if (checkError) {
      console.error('Error checking for existing posts:', checkError);
      // Continue with insert even if check fails
    }

    // Check if we have a very recent post with the same video idea
    if (existingPosts && existingPosts.length > 0) {
      for (const post of existingPosts) {
        const existingVideoIdea = (post as any).video_idea;
        if (existingVideoIdea?.title === videoIdea.title) {
          console.log('📝 Post already saved recently, skipping duplicate save');
          return { error: null };
        }
      }
    }

    // Insert new post
    const { error } = await supabase.from('post_history').insert({
      user_id: userId,
      business_name: businessName,
      video_idea: videoIdea,
      post_details: postDetails,
      completed_at: new Date().toISOString(),
    });

    return { error };
  } catch (error) {
    console.error('Error saving completed post:', error);
    return { error };
  }
}

// Load all completed posts for a user
export async function loadPostHistory(userId: string): Promise<{
  data: CompletedPost[];
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('post_history')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }

    const posts: CompletedPost[] = (data || []).map((row: any) => ({
      id: row.id,
      businessName: row.business_name,
      videoIdea: row.video_idea,
      postDetails: row.post_details,
      completedAt: row.completed_at,
    }));

    return { data: posts, error: null };
  } catch (error) {
    console.error('Error loading post history:', error);
    return { data: [], error };
  }
}

// Save a video idea to saved ideas
export async function saveVideoIdea(
  userId: string,
  businessInfo: BusinessInfo,
  videoIdea: ContentIdea
): Promise<{ error: any }> {
  try {
    // Check if this exact idea is already saved (prevent duplicates)
    const { data: existing, error: checkError } = await supabase
      .from('saved_video_ideas')
      .select('id')
      .eq('user_id', userId)
      .eq('business_name', businessInfo.businessName)
      .eq('video_idea->>title', videoIdea.title)
      .limit(1);

    if (checkError) {
      console.error('Error checking for existing saved idea:', checkError);
    }

    if (existing && existing.length > 0) {
      console.log('📝 Video idea already saved, skipping duplicate');
      return { error: null };
    }

    const { error } = await supabase.from('saved_video_ideas').insert({
      user_id: userId,
      business_name: businessInfo.businessName,
      business_info: businessInfo,
      video_idea: videoIdea,
      saved_at: new Date().toISOString(),
    });

    return { error };
  } catch (error) {
    console.error('Error saving video idea:', error);
    return { error };
  }
}

// Load all saved video ideas for a user
export async function loadSavedVideoIdeas(userId: string): Promise<{
  data: SavedVideoIdea[];
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('saved_video_ideas')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }

    const ideas: SavedVideoIdea[] = (data || []).map((row: any) => ({
      id: row.id,
      businessName: row.business_name,
      businessInfo: row.business_info,
      videoIdea: row.video_idea,
      savedAt: row.saved_at,
    }));

    return { data: ideas, error: null };
  } catch (error) {
    console.error('Error loading saved video ideas:', error);
    return { data: [], error };
  }
}

// Delete a saved video idea
export async function deleteSavedVideoIdea(
  userId: string,
  ideaId: string
): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('saved_video_ideas')
      .delete()
      .eq('id', ideaId)
      .eq('user_id', userId);

    return { error };
  } catch (error) {
    console.error('Error deleting saved video idea:', error);
    return { error };
  }
}


