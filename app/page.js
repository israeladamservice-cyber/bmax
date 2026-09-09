'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtjehqjnazsxvdzqtkgh.supabase.co';
const supabaseAnonKey = 'sb_publishable_sqVY-eC8omT648v-K5hiUw_u03LW-3r';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [feedFilter, setFeedFilter] = useState('for you');
  const [composerType, setComposerType] = useState('update');
  const [user, setUser] = useState(null);

  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authMessageType, setAuthMessageType] = useState('info');

  // Post & Composer State
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState('');
  const [locationTag, setLocationTag] = useState('Port Harcourt, NG');
  const [visibility, setVisibility] = useState('public');
  const [uploading, setUploading] = useState(false);

  // Profile & Data
  const [username, setUsername] = useState('');
  const [reputation, setReputation] = useState(88);
  const [weeklyRep, setWeeklyRep] = useState(4);
  const [userLikes, setUserLikes] = useState([]);
  const [userFollows, setUserFollows] = useState([]);

  // Direct Messages
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChatUser, setActiveChatUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) setUser(session?.user || null);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) setUser(session?.user || null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserProfile();
      fetchUserLikes();
      fetchUserFollows();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    if (data?.username) setUsername(data.username);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setPosts(data);
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    const { data } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
    if (data) setUserLikes(data.map(l => l.post_id));
  };

  const fetchUserFollows = async () => {
    if (!user) return;
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    if (data) setUserFollows(data.map(f => f.following_id));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please sign in to publish a post.');
    if (!postText.trim()) return alert('Post content cannot be empty.');

    setUploading(true);

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        caption: postText,
        post_type: composerType
      })
      .select('*')
      .single();

    setUploading(false);

    if (error) {
      alert(`Could not create post: ${error.message}`);
    } else {
      setPostText('');
      setPosts([data, ...posts]);
    }
  };

  const handleLike = async (postId) => {
    if (!user) return alert('Please log in to react.');
    const isLiked = userLikes.includes(postId);

    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
      setUserLikes(prev => prev.filter(id => id !== postId));
    } else {
      await supabase.from('likes').insert([{ user_id: user.id, post_id: postId }]);
      setUserLikes(prev => [...prev, postId]);
    }
    fetchPosts();
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthMessage(error.message);
      setAuthMessageType('error');
    } else {
      setAuthMessage('Signed in successfully.');
      setAuthMessageType('success');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthMessage(error.message);
      setAuthMessageType('error');
    } else {
      setAuthMessage('Check your email for activation instructions.');
      setAuthMessageType('success');
    }
  };

  return (
    <div style={styles.appWrapper}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.brandGroup}>
          <h1 style={styles.logo}>BMAX</h1>
          <span style={styles.badge}>v2.0</span>
        </div>
        <nav style={styles.topNav}>
          {['home', 'discover', 'create', 'messages', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={activeTab === tab ? styles.activeNavBtn : styles.navBtn}
            >
              {tab === 'home' && '🏠 Home'}
              {tab === 'discover' && '🧭 Discover'}
              {tab === 'create' && '➕ Create'}
              {tab === 'messages' && '💬 Messages'}
              {tab === 'profile' && '👤 Profile'}
            </button>
          ))}
        </nav>
      </header>

      {/* MAIN LAYOUT */}
      <div style={styles.layoutContainer}>
        {/* LEFT / CENTER FEED */}
        <main style={styles.feedColumn}>
          {/* REPUTATION WIDGET */}
          <div style={styles.card}>
            <div style={styles.repHeader}>
              <span style={styles.repTitle}>🛡️ Reputation Score</span>
              <span style={styles.repValue}>{reputation} <small style={{ color: '#22c55e' }}>+{weeklyRep} this week</small></span>
            </div>
            <p style={styles.subtext}>Earn points by creating, helping, & collaborating with builders.</p>
          </div>

          {/* COMPOSER WIDGET */}
          <div style={styles.card}>
            <div style={styles.composerTabs}>
              {['update', 'code block', 'poll'].map((type) => (
                <button
                  key={type}
                  onClick={() => setComposerType(type)}
                  style={composerType === type ? styles.activeChip : styles.chip}
                >
                  {type === 'update' ? '📌 Update' : type === 'code block' ? '‹/› Code Block' : '📊 Poll'}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreatePost} style={styles.composerForm}>
              <div style={styles.metaRow}>
                <span style={styles.tag}>🌐 {visibility}</span>
                <span style={styles.tag}>📍 {locationTag}</span>
              </div>

              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What are you building or creating?"
                style={styles.textArea}
              />

              <div style={styles.composerFooter}>
                <div style={styles.iconGroup}>
                  <button type="button" style={styles.iconBtn}>📷</button>
                  <button type="button" style={styles.iconBtn}>📍</button>
                  <button type="button" style={styles.iconBtn}>😀</button>
                </div>
                <button type="submit" disabled={uploading} style={styles.broadcastBtn}>
                  {uploading ? 'Publishing...' : '📡 Broadcast'}
                </button>
              </div>
            </form>
          </div>

          {/* FEED CATEGORIES */}
          <div style={styles.filterRow}>
            {['for you', 'following', 'trending', 'learning', 'projects', 'local'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFeedFilter(filter)}
                style={feedFilter === filter ? styles.activeFilterChip : styles.filterChip}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* FEED STREAM */}
          <div style={styles.streamContainer}>
            {posts.length === 0 ? (
              <div style={{ ...styles.card, textAlign: 'center', color: '#64748b' }}>
                <p>No posts in this feed yet.</p>
                <p style={{ fontSize: '12px' }}>Be the first to share an update using the composer above!</p>
              </div>
            ) : (
              posts.map((post) => {
                const isLiked = userLikes.includes(post.id);
                return (
                  <div key={post.id} style={styles.card}>
                    <div style={styles.postHeader}>
                      <span style={styles.username}>@{post.profiles?.username || 'builder'}</span>
                      <span style={styles.postType}>{post.post_type}</span>
                    </div>
                    <p style={styles.postContent}>{post.caption}</p>
                    <div style={styles.postActions}>
                      <button onClick={() => handleLike(post.id)} style={styles.actionBtn}>
                        {isLiked ? '❤️' : '🤍'} Like
                      </button>
                      <button style={styles.actionBtn}>💬 Reply</button>
                      <button style={styles.actionBtn}>🔄 Remix</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside style={styles.sidebarColumn}>
          {/* AUTHENTICATION BOX */}
          {!user ? (
            <div style={styles.card}>
              <h3 style={styles.sidebarTitle}>Join the Network</h3>
              {authMessage && (
                <div style={authMessageType === 'error' ? styles.errorBox : styles.successBox}>
                  {authMessage}
                </div>
              )}
              <form style={styles.authForm}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSignIn} style={styles.primaryBtn}>Sign In</button>
                  <button onClick={handleSignUp} style={styles.secondaryBtn}>Sign Up</button>
                </div>
              </form>
            </div>
          ) : (
            <div style={styles.card}>
              <h3 style={styles.sidebarTitle}>Logged in as</h3>
              <p style={{ color: '#38bdf8', fontWeight: 'bold' }}>@{username || user.email}</p>
              <button onClick={() => supabase.auth.signOut()} style={styles.dangerBtn}>
                Sign Out
              </button>
            </div>
          )}

          {/* HYPERLOCAL TRENDS */}
          <div style={styles.card}>
            <h3 style={styles.sidebarTitle}>📈 Hyperlocal Trends</h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Port Harcourt</p>
            <div style={styles.trendList}>
              <div style={styles.trendItem}>
                <strong>#PortHarcourtTech Meetup</strong>
                <span>24 posts</span>
              </div>
              <div style={styles.trendItem}>
                <strong>#NextJS Buildathon</strong>
                <span>12 posts</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav style={styles.mobileNav}>
        {['home', 'discover', 'create', 'messages', 'profile'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={activeTab === tab ? styles.activeMobileBtn : styles.mobileBtn}
          >
            {tab === 'home' && '🏠'}
            {tab === 'discover' && '🔍'}
            {tab === 'create' && '➕'}
            {tab === 'messages' && '💬'}
            {tab === 'profile' && '👤'}
          </button>
        ))}
      </nav>
    </div>
  );
}

const styles = {
  appWrapper: {
    backgroundColor: '#0a0f1d',
    color: '#f8fafc',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    paddingBottom: '60px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #1e293b',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logo: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '900',
    letterSpacing: '2px',
    color: '#38bdf8',
  },
  badge: {
    backgroundColor: '#0284c7',
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '8px',
  },
  topNav: {
    display: 'flex',
    gap: '8px',
  },
  navBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  activeNavBtn: {
    backgroundColor: '#1e293b',
    border: 'none',
    color: '#38bdf8',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  layoutContainer: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 320px',
    gap: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px 16px',
  },
  feedColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sidebarColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '16px',
  },
  repHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  repTitle: {
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  repValue: {
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  subtext: {
    margin: 0,
    fontSize: '12px',
    color: '#94a3b8',
  },
  composerTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  chip: {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  activeChip: {
    backgroundColor: '#0284c7',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  composerForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  metaRow: {
    display: 'flex',
    gap: '8px',
  },
  tag: {
    fontSize: '11px',
    backgroundColor: '#1e293b',
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#cbd5e1',
  },
  textArea: {
    backgroundColor: '#0a0f1d',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    color: '#fff',
    padding: '10px',
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  composerFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconGroup: {
    display: 'flex',
    gap: '6px',
  },
  iconBtn: {
    backgroundColor: '#1e293b',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  broadcastBtn: {
    backgroundColor: '#0284c7',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  filterChip: {
    backgroundColor: '#0f172a',
    color: '#64748b',
    border: '1px solid #1e293b',
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    textTransform: 'capitalize',
  },
  activeFilterChip: {
    backgroundColor: '#1e293b',
    color: '#38bdf8',
    border: '1px solid #38bdf8',
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  streamContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  username: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  postType: {
    fontSize: '10px',
    backgroundColor: '#1e293b',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  postContent: {
    margin: '0 0 12px 0',
    lineHeight: '1.4',
  },
  postActions: {
    display: 'flex',
    gap: '12px',
    borderTop: '1px solid #1e293b',
    paddingTop: '8px',
  },
  actionBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '12px',
  },
  sidebarTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#f8fafc',
  },
  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  input: {
    backgroundColor: '#0a0f1d',
    border: '1px solid #1e293b',
    color: '#fff',
    padding: '8px',
    borderRadius: '6px',
    fontSize: '12px',
  },
  primaryBtn: {
    backgroundColor: '#0284c7',
    color: '#fff',
    border: 'none',
    padding: '8px',
    borderRadius: '6px',
    flex: 1,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  secondaryBtn: {
    backgroundColor: '#1e293b',
    color: '#fff',
    border: 'none',
    padding: '8px',
    borderRadius: '6px',
    flex: 1,
    cursor: 'pointer',
    fontSize: '12px',
  },
  dangerBtn: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    marginTop: '8px',
  },
  trendList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  trendItem: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '12px',
  },
  errorBox: {
    backgroundColor: '#450a0a',
    color: '#fecaca',
    padding: '6px',
    borderRadius: '4px',
    fontSize: '11px',
    marginBottom: '8px',
  },
  successBox: {
    backgroundColor: '#052e16',
    color: '#bbf7d0',
    padding: '6px',
    borderRadius: '4px',
    fontSize: '11px',
    marginBottom: '8px',
  },
  mobileNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderTop: '1px solid #1e293b',
    display: 'none',
    justifyContent: 'space-around',
    padding: '8px 0',
    zIndex: 100,
  },
  mobileBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '18px',
  },
  activeMobileBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '18px',
  },
};
