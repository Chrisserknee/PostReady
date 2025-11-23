import { supabase } from './supabase';
import { BusinessInfo, StrategyResult, ContentIdea, PostDetails } from '@/types';

export type UserProgressData = {
  businessInfo: BusinessInfo | null;
  strategy: StrategyResult | null;
  selectedIdea: ContentIdea | null;
  postDetails: PostDetails | null;
  currentStep: string;
  generateIdeasCount?: number;
  rewriteCount?: number;
  regenerateCount?: number;
  rewordTitleCount?: number;
  hashtagCount?: number;
  guideAICount?: number;
  sugarDaddyCount?: number;
  brainwormCount?: number;
  commentBaitCount?: number;
  trendRadarCount?: number;
  redFlagTranslatorCount?: number;
  cringeCoupleCaptionCount?: number;
  commentFightStarterCount?: number;
  poorLifeChoicesAdvisorCount?: number;
  randomExcuseCount?: number;
  kidsafeUrlCheckerCount?: number;
};

export async function saveUserProgress(
  userId: string,
  progress: UserProgressData
): Promise<{ error: any }> {
  try {
    const { error } = await supabase.from('user_progress').upsert(
      {
        user_id: userId,
        business_info: progress.businessInfo,
        strategy: progress.strategy,
        selected_idea: progress.selectedIdea,
        post_details: progress.postDetails,
        current_step: progress.currentStep,
        generate_ideas_count: progress.generateIdeasCount ?? 0,
        rewrite_count: progress.rewriteCount ?? 0,
        regenerate_count: progress.regenerateCount ?? 0,
        reword_title_count: progress.rewordTitleCount ?? 0,
        hashtag_count: progress.hashtagCount ?? 0,
        guide_ai_count: progress.guideAICount ?? 0,
        sugar_daddy_count: progress.sugarDaddyCount ?? 0,
        brainworm_count: progress.brainwormCount ?? 0,
        comment_bait_count: progress.commentBaitCount ?? 0,
        trend_radar_count: progress.trendRadarCount ?? 0,
        red_flag_translator_count: progress.redFlagTranslatorCount ?? 0,
        cringe_couple_caption_count: progress.cringeCoupleCaptionCount ?? 0,
        comment_fight_starter_count: progress.commentFightStarterCount ?? 0,
        poor_life_choices_advisor_count: progress.poorLifeChoicesAdvisorCount ?? 0,
        random_excuse_count: progress.randomExcuseCount ?? 0,
        kidsafe_url_checker_count: progress.kidsafeUrlCheckerCount ?? 0,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    return { error };
  } catch (error) {
    console.error('Error saving progress:', error);
    return { error };
  }
}

export async function loadUserProgress(userId: string): Promise<{
  data: UserProgressData | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No progress found, return null
        return { data: null, error: null };
      }
      return { data: null, error };
    }

    const progress: UserProgressData = {
      businessInfo: data.business_info,
      strategy: data.strategy,
      selectedIdea: data.selected_idea,
      postDetails: data.post_details,
      currentStep: data.current_step || 'form',
      generateIdeasCount: data.generate_ideas_count ?? 0,
      rewriteCount: data.rewrite_count ?? 0,
      regenerateCount: data.regenerate_count ?? 0,
      rewordTitleCount: data.reword_title_count ?? 0,
      hashtagCount: data.hashtag_count ?? 0,
      guideAICount: data.guide_ai_count ?? 0,
      sugarDaddyCount: data.sugar_daddy_count ?? 0,
      brainwormCount: data.brainworm_count ?? 0,
      commentBaitCount: data.comment_bait_count ?? 0,
      trendRadarCount: data.trend_radar_count ?? 0,
      redFlagTranslatorCount: data.red_flag_translator_count ?? 0,
      cringeCoupleCaptionCount: data.cringe_couple_caption_count ?? 0,
      commentFightStarterCount: data.comment_fight_starter_count ?? 0,
      poorLifeChoicesAdvisorCount: data.poor_life_choices_advisor_count ?? 0,
      randomExcuseCount: data.random_excuse_count ?? 0,
      kidsafeUrlCheckerCount: data.kidsafe_url_checker_count ?? 0,
    };

    return { data: progress, error: null };
  } catch (error) {
    console.error('Error loading progress:', error);
    return { data: null, error };
  }
}

export async function clearUserProgress(userId: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId);

    return { error };
  } catch (error) {
    console.error('Error clearing progress:', error);
    return { error };
  }
}
