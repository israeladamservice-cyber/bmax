import { supabase } from './supabaseClient';

/**
 * Fetch full comment conversations for a given post.
 */
export async function getPostComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Check if the current user follows a target user to unlock DMs.
 */
export async function checkFollowStatus(followerId, followingId) {
  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

/**
 * Re-share/Remix a post natively into the main feed.
 */
export async function remixPost(originalPostId, userId, remixContent) {
  const { data, error } = await supabase
    .from('posts')
    .insert([
      {
        user_id: userId,
        content: remixContent,
        remix_parent_id: originalPostId,
        is_remix: true,
      },
    ]);

  if (error) throw error;
  return data;
}
