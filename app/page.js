'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmqkqdzzmyzkoltxnnqt.supabase.co';
const supabaseAnonKey = 'sb_publishable_tHE9rIwNAsYile9BPJwCBA_pMGRyI5S';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [feedFilter, setFeedFilter] = useState('for you');
  const [user, setUser] = useState(null);

  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authMessageType, setAuthMessageType] = useState('info');

  // Posts & Feed State
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState('');
  const [composerType, setComposerType] = useState('update');
  const [uploading, setUploading] = useState(false);

  // File Attachment & Preview State
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  // Profile State
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [reputation, setReputation] = useState(88);
  const [userLikes, setUserLikes] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Discover Page State
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [discoverCategory, setDiscoverCategory] = useState('all');

  // Create Page State (Communities)
  const [communityName, setCommunityName] = useState('');
  const [communityDesc, setCommunityDesc] = useState('');
  const [communityTag, setCommunityTag] = useState('Tech');
  const [communities, setCommunities] = useState([
    { id: 1, name: 'Cyber Builders', desc: 'A hub for indie hackers & full-stack devs.', members: 1240, tag: 'Tech' },
    { id: 2, name: 'AI & Neural Labs', desc: 'Discussing the future of generative models & LLMs.', members: 3100, tag: 'AI' },
    { id: 3, name: 'Design Systems Hub', desc: 'UI/UX designers sharing Figma, CSS, and aesthetic web art.', members: 890, tag: 'Design' }
  ]);

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);

  // Messages & Activity State
  const [msgSubTab, setMsgSubTab] = useState('activity');
  const [activities, setActivities] = useState([
    { id: 1, type: 'follow', text: 'alex_dev started following you', time: '2m ago' },
    { id: 2, type: 'like', text: 'sara_code liked your post', time: '15m ago' },
    { id: 3, type: 'rep', text: 'You gained +4 Reputation points!', time: '1h ago' }
  ]);
  const [conversations, setConversations] = useState([
    { id: '1', user: 'alex_dev', lastMsg: 'Hey, checked your latest project!', unread: true },
    { id: '2', user: 'sara_code', lastMsg: 'Let us collaborate on Next.js', unread: false }
  ]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    let mounted = true;
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) setUser(session?.user || null);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user || null);
    });

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
      fetchFollowCounts();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('username, bio, reputation')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      if (data.username) setUsername(data.username);
      if (data.bio) setBio(data.bio);
      if (data.reputation) setReputation(data.reputation);
    }
  };

  const fetchFollowCounts = async () => {
    if (!user) return;
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);

    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
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

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 60) {
          alert('Video duration must be 1 minute (60 seconds) or less.');
          return;
        }
        setMediaFile(file);
        setMediaType('video');
        setMediaPreview(URL.createObjectURL(file));
      };
      video.src = URL.createObjectURL(file);
    } else if (file.type.startsWith('image/')) {
      setMediaFile(file);
      setMediaType('image');
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const clearMediaPreview = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username,
      bio,
      updated_at: new Date()
    });

    if (error) alert(`Error updating profile: ${error.message}`);
    else {
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please sign in to publish a post.');
    if (!postText.trim() && !mediaFile) return alert('Post content or media cannot be empty.');

    setUploading(true);
    let mediaUrl = null;

    if (mediaFile) {
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `post-media/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, mediaFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filePath);
        mediaUrl = urlData?.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        caption: postText,
        post_type: composerType,
        media_url: mediaUrl,
        media_type: mediaType
      })
      .select('*')
      .single();

    setUploading(false);

    if (error) {
      alert(`Could not create post: ${error.message}`);
    } else {
      setPostText('');
      clearMediaPreview();
      setPosts([data, ...posts]);
      if (activeTab === 'create') setActiveTab('home');
    }
  };

  const handleCreateCommunity = (e) => {
    e.preventDefault();
    if (!communityName.trim()) return alert('Please enter a community name.');
    const newComm = {
      id: Date.now(),
      name: communityName,
      desc: communityDesc || 'A newly created builder community.',
      members: 1,
      tag: communityTag
    };
    setCommunities([newComm, ...communities]);
    setCommunityName('');
    setCommunityDesc('');
    alert(`Community "${newComm.name}" created successfully!`);
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

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatHistory(prev => [...prev, { sender: 'me', text: chatInput, time: 'Just now' }]);
    setChatInput('');
  };

  // Filtered posts for home and discover pages
  const filteredPosts = posts.filter(post => {
    if (discoverSearch.trim() === '') return true;
    return post.caption?.toLowerCase().includes(discoverSearch.toLowerCase());
  });

  return (
    <div style={styles.appWrapper}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.brandGroup}>
          <h1 style={styles.logo}>BMAX</h1>
          <span style={styles.badge}>PRO v2.5</span>
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
        {/* DISCOVER VIEW */}
        {activeTab === 'discover' ? (
          <main style={{ gridColumn: '1 / -1', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            <div style={styles.card}>
              <h2 style={{ margin: '0 0 12px 0', color: '#a855f7' }}>🧭 Discover Network Content</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
                Search for broadcasts, explore trending topics, and uncover active communities.
              </p>

              {/* SEARCH & FILTERS */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search posts, tags, or topics..."
                  value={discoverSearch}
                  onChange={(e) => setDiscoverSearch(e.target.value)}
                  style={{ ...styles.input, flex: 1, padding: '10px 14px', fontSize: '14px' }}
                />
                <select
                  value={discoverCategory}
                  onChange={(e) => setDiscoverCategory(e.target.value)}
                  style={{ ...styles.input, width: '130px', cursor: 'pointer' }}
                >
                  <option value="all">All Topics</option>
                  <option value="tech">Tech</option>
                  <option value="ai">AI & ML</option>
                  <option value="design">Design</option>
                </select>
              </div>

              {/* DISCOVERED POSTS STREAM */}
              <h3 style={{ fontSize: '16px', color: '#f8fafc', marginBottom: '12px' }}>Broadcast Results</h3>
              <div style={styles.streamContainer}>
                {filteredPosts.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    No posts matched your search criteria.
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <div key={post.id} style={{ ...styles.card, backgroundColor: '#0f0a1c', borderColor: '#2e1065' }}>
                      <div style={styles.postHeader}>
                        <span style={styles.username}>@{post.profiles?.username || 'builder'}</span>
                        <span style={styles.postType}>{post.post_type}</span>
                      </div>
                      <p style={styles.postContent}>{post.caption}</p>
                      {post.media_url && (
                        <div style={{ marginBottom: '12px' }}>
                          {post.media_type === 'image' ? (
                            <img src={post.media_url} alt="Post media" style={styles.postMedia} />
                          ) : (
                            <video src={post.media_url} controls style={styles.postMedia} />
                          )}
                        </div>
                      )}
                      <div style={styles.postActions}>
                        <button onClick={() => handleLike(post.id)} style={styles.actionBtn}>
                          {userLikes.includes(post.id) ? '❤️ Liked' : '🤍 Like'}
                        </button>
                        <button style={styles.actionBtn}>💬 Reply</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        ) : activeTab === 'create' ? (
          /* CREATE PAGE VIEW (COMMUNITIES & IDEAS) */
          <main style={{ gridColumn: '1 / -1', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
            <div style={styles.card}>
              <h2 style={{ margin: '0 0 8px 0', color: '#a855f7' }}>🌐 Community & Hub Creator</h2>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
                Build an ecosystem around your ideas. Launch a dedicated space for builders and creators.
              </p>

              {/* CREATE COMMUNITY FORM */}
              <form onSubmit={handleCreateCommunity} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                <input
                  type="text"
                  placeholder="Community Name (e.g. AI Engineers Club)"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  style={{ ...styles.input, padding: '10px' }}
                />
                <textarea
                  placeholder="What is this community about?"
                  value={communityDesc}
                  onChange={(e) => setCommunityDesc(e.target.value)}
                  style={{ ...styles.textArea, minHeight: '70px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <select
                    value={communityTag}
                    onChange={(e) => setCommunityTag(e.target.value)}
                    style={{ ...styles.input, width: '150px' }}
                  >
                    <option value="Tech">Tech & Code</option>
                    <option value="AI">AI & Robotics</option>
                    <option value="Design">UI/UX Design</option>
                    <option value="General">General</option>
                  </select>
                  <button type="submit" style={styles.primaryBtn}>🚀 Launch Community</button>
                </div>
              </form>

              {/* EXISTING COMMUNITIES LIST */}
              <h3 style={{ fontSize: '15px', color: '#f8fafc', margin: '16px 0 12px 0' }}>Explore Active Hubs</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {communities.map(comm => (
                  <div key={comm.id} style={{ backgroundColor: '#0f0a1c', border: '1px solid #2e1065', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#d8b4fe' }}>{comm.name}</strong>
                      <span style={{ fontSize: '10px', backgroundColor: '#3b0764', color: '#f0abfc', padding: '2px 6px', borderRadius: '4px' }}>
                        {comm.tag}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0' }}>{comm.desc}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <small style={{ color: '#f59e0b', fontSize: '11px' }}>👥 {comm.members} Members</small>
                      <button onClick={() => alert(`Joined ${comm.name}!`)} style={styles.secondaryBtn}>Join</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        ) : activeTab === 'profile' ? (
          /* PROFILE PAGE VIEW */
          <main style={{ gridColumn: '1 / -1', maxWidth: '700px', margin: '0 auto', width: '100%' }}>
            <div style={styles.card}>
              <div style={styles.profileHeader}>
                <div style={styles.avatar}>👤</div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, color: '#f8fafc' }}>@{username || user?.email || 'builder'}</h2>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 12px 0' }}>
                    {bio || 'No bio set yet.'}
                  </p>
                  
                  <div style={styles.profileStatsRow}>
                    <div><strong>{followersCount}</strong> <small style={{ color: '#64748b' }}>Followers</small></div>
                    <div><strong>{followingCount}</strong> <small style={{ color: '#64748b' }}>Following</small></div>
                    <div><strong style={{ color: '#f59e0b' }}>🛡️ {reputation}</strong> <small style={{ color: '#64748b' }}>Reputation</small></div>
                  </div>
                </div>
              </div>

              <div style={styles.profileActions}>
                <button onClick={() => setIsEditingProfile(!isEditingProfile)} style={styles.primaryBtn}>
                  {isEditingProfile ? 'Close Edit' : 'Edit Profile'}
                </button>
                <button onClick={() => setActiveTab('messages')} style={styles.secondaryBtn}>
                  💬 Direct Message
                </button>
              </div>

              {/* EDIT PROFILE FORM */}
              {isEditingProfile && (
                <div style={styles.editSection}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#f8fafc' }}>Edit Profile</h4>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={styles.input}
                  />
                  <textarea
                    placeholder="Bio (Max 200 chars)"
                    maxLength={200}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    style={{ ...styles.textArea, minHeight: '60px' }}
                  />
                  <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                    {bio.length}/200
                  </div>
                  <button onClick={handleSaveProfile} style={{ ...styles.primaryBtn, marginTop: '8px' }}>
                    Save Profile
                  </button>
                </div>
              )}
            </div>
          </main>
        ) : activeTab === 'messages' ? (
          /* MESSAGES & ACTIVITY VIEW */
          <main style={{ gridColumn: '1 / -1', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div style={styles.card}>
              <div style={styles.subTabHeader}>
                <button
                  onClick={() => setMsgSubTab('activity')}
                  style={msgSubTab === 'activity' ? styles.activeSubTab : styles.subTab}
                >
                  🔔 Activity Updates
                </button>
                <button
                  onClick={() => setMsgSubTab('dms')}
                  style={msgSubTab === 'dms' ? styles.activeSubTab : styles.subTab}
                >
                  💬 Messages
                </button>
              </div>

              {msgSubTab === 'activity' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activities.map(act => (
                    <div key={act.id} style={styles.activityCard}>
                      <div>{act.text}</div>
                      <small style={{ color: '#64748b' }}>{act.time}</small>
                    </div>
                  ))}
                </div>
              ) : activeChat ? (
                /* CHAT HISTORY & INPUT */
                <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
                  <button onClick={() => setActiveChat(null)} style={{ ...styles.actionBtn, marginBottom: '8px' }}>
                    ← Back to Chats
                  </button>
                  <h4 style={{ margin: '0 0 12px 0', color: '#f59e0b' }}>Chat with @{activeChat}</h4>
                  
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                          backgroundColor: msg.sender === 'me' ? '#7e22ce' : '#1e1b4b',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          maxWidth: '70%'
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '13px' }}>{msg.text}</p>
                        <span style={{ fontSize: '10px', color: '#cbd5e1' }}>{msg.time}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <input
                      type="text"
                      placeholder="Write a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      style={{ ...styles.input, flex: 1 }}
                    />
                    <button onClick={handleSendMessage} style={styles.primaryBtn}>Send</button>
                  </div>
                </div>
              ) : (
                /* CONVERSATION LIST */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => setActiveChat(conv.user)}
                      style={styles.conversationCard}
                    >
                      <div>
                        <strong>@{conv.user}</strong>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{conv.lastMsg}</p>
                      </div>
                      {conv.unread && <span style={styles.unreadBadge}>New</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        ) : (
          /* HOME & FEED VIEW */
          <>
            <main style={styles.feedColumn}>
              {/* REPUTATION WIDGET */}
              <div style={styles.card}>
                <div style={styles.repHeader}>
                  <span style={styles.repTitle}>🛡️ Reputation Score</span>
                  <span style={styles.repValue}>{reputation} <small style={{ color: '#22c55e' }}>+4 this week</small></span>
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
                  <textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="What are you building or creating?"
                    style={styles.textArea}
                  />

                  {/* MEDIA PREVIEW */}
                  {mediaPreview && (
                    <div style={styles.previewContainer}>
                      {mediaType === 'image' ? (
                        <img src={mediaPreview} alt="Preview" style={styles.mediaPreview} />
                      ) : (
                        <video src={mediaPreview} controls style={styles.mediaPreview} />
                      )}
                      <button type="button" onClick={clearMediaPreview} style={styles.removeMediaBtn}>✕</button>
                    </div>
                  )}

                  <div style={styles.composerFooter}>
                    <div style={styles.iconGroup}>
                      <label style={styles.iconBtn}>
                        📷 / 🎥
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleMediaSelect}
                          style={{ display: 'none' }}
                        />
                      </label>
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

              {/* FEED STREAM (SHOWING REAL USER POSTS) */}
              <div style={styles.streamContainer}>
                {posts.length === 0 ? (
                  <div style={{ ...styles.card, textAlign: 'center', color: '#64748b' }}>
                    <p>No user posts yet. Be the first to share something above!</p>
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

                        {post.media_url && (
                          <div style={{ marginBottom: '12px' }}>
                            {post.media_type === 'image' ? (
                              <img src={post.media_url} alt="Post content" style={styles.postMedia} />
                            ) : (
                              <video src={post.media_url} controls style={styles.postMedia} />
                            )}
                          </div>
                        )}

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
                  <p style={{ color: '#f59e0b', fontWeight: 'bold', margin: 0 }}>@{username || user.email}</p>
                </div>
              )}
            </aside>
          </>
        )}
      </div>

      {/* THREE-DOT SETTINGS SHEET TRIGGER */}
      <div style={styles.settingsFab} onClick={() => setShowSettings(true)}>
        ⋮
      </div>

      {/* SETTINGS DRAWER / MODAL */}
      {showSettings && (
        <div style={styles.modalOverlay} onClick={() => setShowSettings(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>Settings & Analytics</h3>
            
            <div style={styles.settingItem}>
              <span>📊 Analytics Dashboard</span>
              <small style={{ color: '#64748b' }}>Active</small>
            </div>
            <div style={styles.settingItem}>
              <span>🛡️ Reputation Score Matrix</span>
              <small style={{ color: '#f59e0b' }}>{reputation} PTS</small>
            </div>
            <div style={styles.settingItem} onClick={() => alert('Cache cleared!')}>
              <span>🧹 Clear Cache</span>
              <small style={{ color: '#64748b' }}>24 MB</small>
            </div>
            <div style={styles.settingItem} onClick={() => alert('Storage cleared!')}>
              <span>💾 Clear Storage</span>
              <small style={{ color: '#64748b' }}>112 MB</small>
            </div>
            <div style={styles.settingItem}>
              <span>📶 Data Usage</span>
              <small style={{ color: '#64748b' }}>Low Data Mode</small>
            </div>

            {user && (
              <button
                onClick={() => {
                  supabase.auth.signOut();
                  setShowSettings(false);
                }}
                style={{ ...styles.dangerBtn, width: '100%', marginTop: '16px' }}
              >
                Sign Out
              </button>
            )}

            <button onClick={() => setShowSettings(false)} style={{ ...styles.secondaryBtn, width: '100%', marginTop: '8px' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* MOBILE NAVIGATION */}
      <nav style={styles.mobileNav}>
        {['home', 'discover', 'create', 'messages', 'profile'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={activeTab === tab ? styles.activeMobileBtn : styles.mobileBtn}
          >
            {tab === 'home' && '🏠'}
            {tab === 'discover' && '🧭'}
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
    backgroundColor: '#07040d',
    color: '#f8fafc',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    paddingBottom: '60px',
  },
  header: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#0f0a1c',
    borderBottom: '1px solid #2e1065',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brandGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  logo: { margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '2px', color: '#a855f7' },
  badge: { backgroundColor: '#7e22ce', fontSize: '10px', padding: '2px 6px', borderRadius: '8px', color: '#f8fafc' },
  topNav: { display: 'flex', gap: '8px' },
  navBtn: { backgroundColor: 'transparent', border: 'none', color: '#94a3b8', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  activeNavBtn: { backgroundColor: '#2e1065', border: '1px solid #7e22ce', color: '#f59e0b', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  layoutContainer: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '20px', maxWidth: '1000px', margin: '0 auto', padding: '20px 16px' },
  feedColumn: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sidebarColumn: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { backgroundColor: '#0f0a1c', border: '1px solid #2e1065', borderRadius: '12px', padding: '16px' },
  repHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  repTitle: { fontWeight: 'bold', color: '#f8fafc' },
  repValue: { fontWeight: 'bold', color: '#f59e0b' },
  subtext: { margin: 0, fontSize: '12px', color: '#94a3b8' },
  composerTabs: { display: 'flex', gap: '8px', marginBottom: '12px' },
  chip: { backgroundColor: '#1e1b4b', color: '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer' },
  activeChip: { backgroundColor: '#7e22ce', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' },
  composerForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
  textArea: { backgroundColor: '#07040d', border: '1px solid #2e1065', borderRadius: '8px', color: '#fff', padding: '10px', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' },
  previewContainer: { position: 'relative', width: '100%', maxHeight: '250px', overflow: 'hidden', borderRadius: '8px', backgroundColor: '#000' },
  mediaPreview: { width: '100%', height: '100%', objectFit: 'contain' },
  removeMediaBtn: { position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' },
  composerFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  iconGroup: { display: 'flex', gap: '6px' },
  iconBtn: { backgroundColor: '#1e1b4b', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', color: '#fff', fontSize: '12px' },
  broadcastBtn: { backgroundColor: '#7e22ce', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  filterRow: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' },
  filterChip: { backgroundColor: '#0f0a1c', color: '#64748b', border: '1px solid #2e1065', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'capitalize' },
  activeFilterChip: { backgroundColor: '#2e1065', color: '#f59e0b', border: '1px solid #f59e0b', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 'bold', textTransform: 'capitalize' },
  streamContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  postHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  username: { color: '#a855f7', fontWeight: 'bold' },
  postType: { fontSize: '10px', backgroundColor: '#2e1065', padding: '2px 6px', borderRadius: '4px', color: '#d8b4fe', textTransform: 'uppercase' },
  postContent: { margin: '0 0 12px 0', lineHeight: '1.4' },
  postMedia: { width: '100%', borderRadius: '8px', maxHeight: '350px', objectFit: 'cover' },
  postActions: { display: 'flex', gap: '12px', borderTop: '1px solid #2e1065', paddingTop: '8px' },
  actionBtn: { backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' },
  sidebarTitle: { margin: '0 0 12px 0', fontSize: '14px', color: '#f8fafc' },
  authForm: { display: 'flex', flexDirection: 'column', gap: '8px' },
  input: { backgroundColor: '#07040d', border: '1px solid #2e1065', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' },
  primaryBtn: { backgroundColor: '#7e22ce', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  secondaryBtn: { backgroundColor: '#1e1b4b', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  dangerBtn: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  errorBox: { backgroundColor: '#450a0a', color: '#fecaca', padding: '6px', borderRadius: '4px', fontSize: '11px', marginBottom: '8px' },
  successBox: { backgroundColor: '#052e16', color: '#bbf7d0', padding: '6px', borderRadius: '4px', fontSize: '11px', marginBottom: '8px' },
  profileHeader: { display: 'flex', gap: '16px', alignItems: 'center' },
  avatar: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#2e1065', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' },
  profileStatsRow: { display: 'flex', gap: '16px', fontSize: '14px' },
  profileActions: { display: 'flex', gap: '8px', marginTop: '16px' },
  editSection: { marginTop: '16px', borderTop: '1px solid #2e1065', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  settingsFab: { position: 'fixed', bottom: '70px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2e1065', border: '1px solid #a855f7', color: '#f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', cursor: 'pointer', zIndex: 99 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#0f0a1c', border: '1px solid #2e1065', borderRadius: '12px', padding: '20px', width: '90%', maxWidth: '400px' },
  settingItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #2e1065', fontSize: '13px', cursor: 'pointer' },
  subTabHeader: { display: 'flex', gap: '8px', borderBottom: '1px solid #2e1065', paddingBottom: '8px', marginBottom: '12px' },
  subTab: { backgroundColor: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px' },
  activeSubTab: { backgroundColor: 'transparent', border: 'none', color: '#f59e0b', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  activityCard: { backgroundColor: '#07040d', border: '1px solid #2e1065', padding: '10px', borderRadius: '6px', fontSize: '13px' },
  conversationCard: { backgroundColor: '#07040d', border: '1px solid #2e1065', padding: '12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  unreadBadge: { backgroundColor: '#7e22ce', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '8px' },
  mobileNav: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#0f0a1c', borderTop: '1px solid #2e1065', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 100 },
  mobileBtn: { backgroundColor: 'transparent', border: 'none', fontSize: '18px' },
  activeMobileBtn: { backgroundColor: 'transparent', border: 'none', fontSize: '18px' }
};
