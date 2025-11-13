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

