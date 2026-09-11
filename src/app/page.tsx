'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient, type User } from '@supabase/supabase-js';

type Profile = {
  id?: string;
  username?: string | null;
  avatar_url?: string | null;
};

type PostRow = {
  id: string;
  user_id: string;
  caption?: string | null;
  content?: string | null;
  media_url?: string | null;
  image_url?: string | null;
  media_type?: string | null;
  image_type?: string | null;
  created_at?: string | null;
  profiles?: Profile | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function normalizeUsername(user: User) {
  const metaUsername = (user.user_metadata?.username as string | undefined)?.trim();
  if (metaUsername) return metaUsername;
  const emailPart = user.email?.split('@')[0]?.trim();
  if (emailPart) return emailPart;
  return `user_${user.id.slice(0, 8)}`;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [postText, setPostText] = useState('');
  const [postType, setPostType] = useState('update');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [toast, setToast] = useState('');
  const [lastError, setLastError] = useState('');

  const envReady = useMemo(() => Boolean(supabaseUrl && supabaseAnonKey), []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };

  const fetchPosts = async () => {
    if (!envReady) return;
    const client = supabase;
    if (!client) return;

    const primary = await client
      .from('posts')
      .select('id,user_id,caption,content,media_url,image_url,media_type,image_type,created_at,profiles(username,avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!primary.error && primary.data) {
      setPosts(primary.data as PostRow[]);
      return;
    }

    const fallback = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!fallback.error && fallback.data) {
      setPosts(fallback.data as PostRow[]);
    }
  };

  const ensureProfile = async (activeUser: User) => {
    const client = supabase;
    if (!client) {
      throw new Error('Supabase client is not configured.');
    }

    const username = normalizeUsername(activeUser);

    const { error } = await client.from('profiles').upsert(
      {
        id: activeUser.id,
        username,
      },
      { onConflict: 'id', ignoreDuplicates: false }
    );

    if (error) {
      throw new Error(`Profile bootstrap failed: ${error.message}`);
    }
  };

  const uploadMediaIfAny = async (activeUser: User) => {
    const client = supabase;
    if (!client) {
      throw new Error('Supabase client is not configured.');
    }

    if (!mediaFile) {
      return { mediaUrl: null as string | null, mediaKind: null as string | null };
    }

    const ext = mediaFile.name.includes('.') ? mediaFile.name.split('.').pop() : 'bin';
    const safeExt = (ext ?? 'bin').toLowerCase();
    const path = `media/${activeUser.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

    const { error: uploadError } = await client.storage
      .from('posts')
      .upload(path, mediaFile, { contentType: mediaFile.type || undefined, upsert: false });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: publicData } = client.storage.from('posts').getPublicUrl(path);
    const mediaKind = mediaFile.type.startsWith('video/') ? 'video' : 'image';

    return { mediaUrl: publicData.publicUrl, mediaKind };
  };

  const createPost = async () => {
    const client = supabase;
    if (!client) {
      showToast('Supabase env is missing.');
      return;
    }

    if (!user) {
      showToast('Please sign in first.');
      return;
    }

    if (!postText.trim() && !mediaFile) {
      showToast('Add text or attach media.');
      return;
    }

    setIsPosting(true);
    setLastError('');

    try {
      await ensureProfile(user);

      const { mediaUrl, mediaKind } = await uploadMediaIfAny(user);

      const modernPayload: Record<string, unknown> = {
        user_id: user.id,
        caption: postText.trim(),
        post_type: postType,
        media_url: mediaUrl,
        media_type: mediaKind,
      };

      let insertResult = await client.from('posts').insert([modernPayload]).select('*').single();

      if (insertResult.error) {
        const fallbackPayload: Record<string, unknown> = {
          user_id: user.id,
          content: postText.trim(),
          post_type: postType,
          image_url: mediaUrl,
          image_type: mediaKind,
        };

        const secondTry = await client.from('posts').insert([fallbackPayload]).select('*').single();

        if (secondTry.error) {
          throw new Error(
            `Insert failed. First: ${insertResult.error.message} | Fallback: ${secondTry.error.message}`
          );
        }

        insertResult = secondTry;
      }

      setPostText('');
      setMediaFile(null);
      setMediaPreview(null);
      showToast('Broadcast published.');
      await fetchPosts();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLastError(message);
      showToast('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      if (!envReady) {
        setLoadingSession(false);
        return;
      }

      const client = supabase;
      if (!client) {
        setLoadingSession(false);
        return;
      }

      const { data } = await client.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoadingSession(false);
      await fetchPosts();
    };

    void boot();

    const client = supabase;
    const listener = client
      ? client.auth.onAuthStateChange((_event, session) => {
          if (!mounted) return;
          setUser(session?.user ?? null);
        })
      : null;

    return () => {
      mounted = false;
      listener?.data.subscription.unsubscribe();
    };
  }, [envReady]);

  if (!envReady) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-10">
        <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h1 className="text-lg font-bold">Supabase env missing</h1>
          <p className="mt-2 text-sm">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your deployment
            environment.
          </p>
        </div>
      </main>
    );
  }

  if (loadingSession) {
    return <main className="min-h-screen bg-slate-950" />;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <section className="mx-auto w-full max-w-3xl space-y-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h1 className="text-2xl font-bold">BMAX Broadcast Composer</h1>
          <p className="mt-1 text-sm text-slate-400">Signed in as: {user?.email ?? 'Not signed in'}</p>
          {lastError ? (
            <p className="mt-3 rounded-lg border border-rose-700 bg-rose-950/40 p-3 text-xs text-rose-300">{lastError}</p>
          ) : null}

          <div className="mt-4 space-y-3">
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Share an update..."
              className="min-h-28 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-violet-500"
            />

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="update">update</option>
                <option value="project">project</option>
                <option value="question">question</option>
                <option value="showcase">showcase</option>
              </select>

              <label className="cursor-pointer rounded-lg border border-slate-700 px-3 py-2 text-sm">
                Attach media
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setMediaFile(file);
                    setMediaPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => void createPost()}
                disabled={isPosting}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isPosting ? 'Publishing...' : 'Broadcast'}
              </button>
            </div>

            {mediaPreview ? (
              <div className="overflow-hidden rounded-xl border border-slate-700">
                {mediaFile?.type.startsWith('video/') ? (
                  <video src={mediaPreview} controls className="max-h-80 w-full object-contain" />
                ) : (
                  <img src={mediaPreview} alt="preview" className="max-h-80 w-full object-contain" />
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          {posts.map((post) => {
            const text = post.caption || post.content || '';
            const media = post.media_url || post.image_url || '';
            const author = post.profiles?.username || post.user_id.slice(0, 8);
            return (
              <article key={post.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs text-violet-300">@{author}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{text}</p>
                {media ? <img src={media} alt="post media" className="mt-3 max-h-96 w-full rounded-lg object-cover" /> : null}
              </article>
            );
          })}
        </div>
      </section>

      {toast ? (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
