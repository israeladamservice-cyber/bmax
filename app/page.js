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

  // Profile & Social State
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [reputation, setReputation] = useState(0);
  const [userLikes, setUserLikes] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [socialModalType, setSocialModalType] = useState(null); // 'followers' | 'following' | null
  const [viewingProfile, setViewingProfile] = useState(null);

  // Discover Page State
  const [discoverSearch, setDiscoverSearch] = useState('');

  // Create Page State (Communities)
  const [communityName, setCommunityName] = useState('');
  const [communityDesc, setCommunityDesc] = useState('');
  const [communityTag, setCommunityTag] = useState('Tech');
  const [communities, setCommunities] = useState([
    { id: 1, name: 'Cyber Builders', desc: 'A hub for indie hackers & full-stack devs.', members: 1240, tag: 'Tech' },
    { id: 2, name: 'AI & Neural Labs', desc: 'Discussing the future of generative models & LLMs.', members: 3100, tag: 'AI' },
    { id: 3, name: 'Design Systems Hub', desc: 'UI/UX designers sharing Figma, CSS, and aesthetic web art.', members: 890, tag: 'Design' }
  ]);

  // Messages & Live DMs State
  const [msgSubTab, setMsgSubTab] = useState('activity');
  const [activities, setActivities] = useState([
    { id: 1, type: 'rep', text: 'Welcome to BMAX! Your reputation ledger initialized at 0 PTS.', time: 'Just now' }
  ]);
  const [conversations, setConversations] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null); // { id, username }
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
      fetchSocialConnections();
      fetchConversations();
    }
  }, [user]);

  // Real-time Chat Subscription
  useEffect(() => {
    if (!user || !activeChatUser) return;
    
    fetchChatHistory(activeChatUser.id);

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new;
        if (
          (newMsg.sender_id === user.id && newMsg.receiver_id === activeChatUser.id) ||
          (newMsg.sender_id === activeChatUser.id && newMsg.receiver_id === user.id)
        ) {
          setChatHistory(prev => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatUser, user]);

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
      if (data.reputation !== undefined) setReputation(data.reputation);
    }
  };

  const fetchSocialConnections = async () => {
    if (!user) return;
    
    // Get Followers with profile details
    const { data: followersData } = await supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(id, username, bio)')
      .eq('following_id', user.id);

    if (followersData) {
      setFollowersList(followersData.map(item => item.profiles).filter(Boolean));
    }

    // Get Following with profile details
    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, username, bio)')
      .eq('follower_id', user.id);

    if (followingData) {
      setFollowingList(followingData.map(item => item.profiles).filter(Boolean));
    }
  };

  const fetchConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id, username), receiver:profiles!messages_receiver_id_fkey(id, username)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      const map = new Map();
      data.forEach(msg => {
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
        if (otherUser && !map.has(otherUser.id)) {
          map.set(otherUser.id, { user: otherUser, lastMsg: msg.content, time: msg.created_at });
        }
      });
      setConversations(Array.from(map.values()));
    }
  };

  const fetchChatHistory = async (otherUserId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (data) setChatHistory(data);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeChatUser) return;
    const text = chatInput;
    setChatInput('');

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: activeChatUser.id,
      content: text
    });

    if (error) alert(`Failed to send message: ${error.message}`);
    else fetchConversations();
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(id, username)')
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
    if (!user) return alert('Please sign in to publish a broadcast.');
    if (!postText.trim() && !mediaFile) return alert('Broadcast content or media cannot be empty.');

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

    // Insert Post
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        caption: postText,
        post_type: composerType,
        media_url: mediaUrl,
        media_type: mediaType
      })
      .select('*, profiles(id, username)')
      .single();

    if (!error && data) {
      // Award reputation point and log it
      const newRep = reputation + 1;
      await supabase.from('profiles').update({ reputation: newRep }).eq('id', user.id);
      await supabase.from('reputation_logs').insert({
        user_id: user.id,
        points: 1,
        action_type: 'broadcast_published'
      });
      setReputation(newRep);
      setPosts([data, ...posts]);
    }

    setUploading(false);

    if (error) {
      alert(`Could not publish broadcast: ${error.message}`);
    } else {
      setPostText('');
      clearMediaPreview();
      alert('Broadcast successfully published & +1 Rep earned!');
    }
  };

  const handleFollowUser = async (targetUserId) => {
    if (!user) return alert('Please log in.');
    const isFollowing = followingList.some(f => f.id === targetUserId);

    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
    }
    fetchSocialConnections();
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
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthMessage(error.message);
      setAuthMessageType('error');
    } else {
      if (data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: email.split('@')[0],
          reputation: 0
        });
      }
      setAuthMessage('Account created! Reputation ledger initialized at 0 PTS.');
      setAuthMessageType('success');
    }
  };

  const filteredPosts = posts.filter(post => {
    if (discoverSearch.trim() === '') return true;
    return post.caption?.toLowerCase().includes(discoverSearch.toLowerCase());
  });

  return (
    <div style={styles.appWrapper}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background-color: #030008; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .desktop-only { display: flex; }
        .mobile-only { display: none; }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          .responsive-grid { grid-template-columns: 1fr !important; }
          .community-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.brandGroup}>
          <h1 style={styles.logo}>BMAX</h1>
          <span style={styles.badge}>GLOBAL v2.6</span>
        </div>
        <nav style={styles.topNav} className="desktop-only">
          {['home', 'discover', 'create', 'messages', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setViewingProfile(null); }}
              style={activeTab === tab ? styles.activeNavBtn : styles.navBtn}
            >
              {tab === 'home' && '⚡ Feed'}
              {tab === 'discover' && '🧭 Discover'}
              {tab === 'create' && '➕ Hubs'}
              {tab === 'messages' && '💬 Messages'}
              {tab === 'profile' && '👤 Profile'}
            </button>
          ))}
        </nav>
      </header>

      {/* MAIN LAYOUT */}
      <div style={styles.layoutContainer} className="responsive-grid">
        {viewingProfile ? (
          /* VIEW OTHER USER PROFILE */
          <main style={{ gridColumn: '1 / -1', maxWidth: '700px', margin: '0 auto', width: '100%' }}>
            <div style={styles.card}>
              <button onClick={() => setViewingProfile(null)} style={{ ...styles.actionBtn, marginBottom: '16px' }}>← Back to Feed</button>
              <div style={styles.profileHeader}>
                <div style={styles.avatar}>👤</div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '20px' }}>@{viewingProfile.username}</h2>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 12px 0' }}>{viewingProfile.bio || 'No bio configured.'}</p>
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleFollowUser(viewingProfile.id)}
                  style={followingList.some(f => f.id === viewingProfile.id) ? styles.secondaryBtn : styles.primaryBtn}
                >
                  {followingList.some(f => f.id === viewingProfile.id) ? 'Following ✓' : 'Follow'}
                </button>
                <button
                  onClick={() => { setActiveTab('messages'); setActiveChatUser(viewingProfile); setViewingProfile(null); }}
                  style={styles.secondaryBtn}
                >
                  💬 Message
                </button>
              </div>
            </div>
          </main>
        ) : activeTab === 'discover' ? (
          <main style={{ gridColumn: '1 / -1', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            <div style={styles.card}>
              <h2 style={{ margin: '0 0 10px 0', color: '#c084fc', fontSize: '20px' }}>🧭 Global Network Discovery</h2>
              <input
                type="text"
                placeholder="🔍 Search creator broadcasts..."
                value={discoverSearch}
                onChange={(e) => setDiscoverSearch(e.target.value)}
                style={{ ...styles.input, padding: '12px 16px', fontSize: '14px', marginBottom: '20px' }}
              />
              <div style={styles.streamContainer}>
                {filteredPosts.map((post) => (
                  <div key={post.id} style={styles.postCard}>
                    <div style={styles.postHeader}>
                      <span onClick={() => setViewingProfile(post.profiles)} style={{ ...styles.username, cursor: 'pointer' }}>
                        @{post.profiles?.username || 'builder'}
                      </span>
                      <span style={styles.postType}>{post.post_type}</span>
                    </div>
                    <p style={styles.postContent}>{post.caption}</p>
                    {post.media_url && (
                      <div style={{ marginBottom: '14px' }}>
                        {post.media_type === 'image' ? (
                          <img src={post.media_url} alt="Media" style={styles.postMedia} />
                        ) : (
                          <video src={post.media_url} controls style={styles.postMedia} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </main>
        ) : activeTab === 'create' ? (
          <main style={{ gridColumn: '1 / -1', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
            <div style={styles.card}>
              <h2 style={{ margin: '0 0 8px 0', color: '#c084fc', fontSize: '20px' }}>🌐 Builder Ecosystem Creator</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!communityName.trim()) return alert('Enter name.');
                setCommunities([{ id: Date.now(), name: communityName, desc: communityDesc, members: 1, tag: communityTag }, ...communities]);
                setCommunityName(''); setCommunityDesc('');
                alert('Hub launched!');
              }} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                <input type="text" placeholder="Community Name" value={communityName} onChange={(e) => setCommunityName(e.target.value)} style={{ ...styles.input, padding: '12px' }} />
                <textarea placeholder="Mission..." value={communityDesc} onChange={(e) => setCommunityDesc(e.target.value)} style={{ ...styles.textArea, minHeight: '80px' }} />
                <button type="submit" style={styles.primaryBtn}>🚀 Launch Hub</button>
              </form>
              <div style={styles.communityGrid} className="community-grid">
                {communities.map(comm => (
                  <div key={comm.id} style={styles.miniCard}>
                    <strong style={{ color: '#e879f9' }}>{comm.name}</strong>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>{comm.desc}</p>
                    <button onClick={() => alert(`Joined ${comm.name}!`)} style={styles.secondaryBtn}>Join</button>
                  </div>
                ))}
              </div>
            </div>
          </main>
        ) : activeTab === 'profile' ? (
          <main style={{ gridColumn: '1 / -1', maxWidth: '700px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={styles.card}>
              <div style={styles.profileHeader}>
                <div style={styles.avatar}>👤</div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '20px' }}>@{username || user?.email || 'builder'}</h2>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 12px 0' }}>{bio || 'No bio configured yet.'}</p>
                  <div style={styles.profileStatsRow}>
                    <div onClick={() => setSocialModalType('followers')} style={{ cursor: 'pointer' }}><strong>{followersList.length}</strong> <small style={{ color: '#64748b' }}>Followers</small></div>
                    <div onClick={() => setSocialModalType('following')} style={{ cursor: 'pointer' }}><strong>{followingList.length}</strong> <small style={{ color: '#64748b' }}>Following</small></div>
                    <div><strong style={{ color: '#fbbf24' }}>🛡️ {reputation}</strong> <small style={{ color: '#64748b' }}>Reputation PTS</small></div>
                  </div>
                </div>
              </div>
              <div style={styles.profileActions}>
                <button onClick={() => setIsEditingProfile(!isEditingProfile)} style={styles.primaryBtn}>
                  {isEditingProfile ? 'Close Edit' : 'Edit Profile'}
                </button>
              </div>
              {isEditingProfile && (
                <div style={styles.editSection}>
                  <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={styles.input} />
                  <textarea placeholder="Bio" maxLength={200} value={bio} onChange={(e) => setBio(e.target.value)} style={{ ...styles.textArea, minHeight: '60px' }} />
                  <button onClick={handleSaveProfile} style={{ ...styles.primaryBtn, marginTop: '8px' }}>Save Profile</button>
                </div>
              )}

              {/* SOCIAL LIST MODAL VIEW */}
              {socialModalType && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #1e1b4b', paddingTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: '#c084fc', textTransform: 'capitalize' }}>{socialModalType} List</h4>
                    <button onClick={() => setSocialModalType(null)} style={styles.actionBtn}>Close ✕</button>
                  </div>
                  {(socialModalType === 'followers' ? followersList : followingList).length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#64748b' }}>No users found here yet.</p>
                  ) : (
                    (socialModalType === 'followers' ? followersList : followingList).map(person => (
                      <div key={person.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #120b24' }}>
                        <span onClick={() => { setViewingProfile(person); setSocialModalType(null); }} style={{ color: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}>
                          @{person.username}
                        </span>
                        <button onClick={() => { setActiveTab('messages'); setActiveChatUser(person); setSocialModalType(null); }} style={styles.secondaryBtn}>Message</button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* BROADCAST COMPOSER */}
            <div style={styles.card}>
              <h3 style={{ margin: '0 0 12px 0', color: '#c084fc', fontSize: '16px' }}>📡 Broadcast New Post</h3>
              <div style={styles.composerTabs}>
                {['update', 'code block', 'poll'].map((type) => (
                  <button key={type} onClick={() => setComposerType(type)} style={composerType === type ? styles.activeChip : styles.chip}>
                    {type}
                  </button>
                ))}
              </div>
              <form onSubmit={handleCreatePost} style={styles.composerForm}>
                <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Share a project update..." style={styles.textArea} />
                {mediaPreview && (
                  <div style={styles.previewContainer}>
                    {mediaType === 'image' ? <img src={mediaPreview} alt="Preview" style={styles.mediaPreview} /> : <video src={mediaPreview} controls style={styles.mediaPreview} />}
                    <button type="button" onClick={clearMediaPreview} style={styles.removeMediaBtn}>✕</button>
                  </div>
                )}
                <div style={styles.composerFooter}>
                  <label style={styles.iconBtn}>
                    📷 Attach Media
                    <input type="file" accept="image/*,video/*" onChange={handleMediaSelect} style={{ display: 'none' }} />
                  </label>
                  <button type="submit" disabled={uploading} style={styles.broadcastBtn}>
                    {uploading ? 'Publishing...' : '📡 Broadcast (+1 Rep)'}
                  </button>
                </div>
              </form>
            </div>
          </main>
        ) : activeTab === 'messages' ? (
          <main style={{ gridColumn: '1 / -1', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div style={styles.card}>
              <div style={styles.subTabHeader}>
                <button onClick={() => setMsgSubTab('activity')} style={msgSubTab === 'activity' ? styles.activeSubTab : styles.subTab}>🔔 Reputation Ledger</button>
                <button onClick={() => setMsgSubTab('dms')} style={msgSubTab === 'dms' ? styles.activeSubTab : styles.subTab}>💬 Direct Messages</button>
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
              ) : activeChatUser ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '450px' }}>
                  <button onClick={() => setActiveChatUser(null)} style={{ ...styles.actionBtn, marginBottom: '8px' }}>← Back to Inbox</button>
                  <h4 style={{ margin: '0 0 12px 0', color: '#fbbf24' }}>Chat with @{activeChatUser.username}</h4>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} style={{ alignSelf: msg.sender_id === user.id ? 'flex-end' : 'flex-start', backgroundColor: msg.sender_id === user.id ? '#7e22ce' : '#1e1b4b', padding: '8px 12px', borderRadius: '8px', maxWidth: '70%' }}>
                        <p style={{ margin: 0, fontSize: '13px' }}>{msg.content}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <input type="text" placeholder="Write message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} style={{ ...styles.input, flex: 1 }} />
                    <button onClick={handleSendMessage} style={styles.primaryBtn}>Send</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {conversations.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#64748b' }}>No conversations yet. Visit profiles and click Message to start chatting!</p>
                  ) : (
                    conversations.map(conv => (
                      <div key={conv.user.id} onClick={() => setActiveChatUser(conv.user)} style={styles.conversationCard}>
                        <div>
                          <strong>@{conv.user.username}</strong>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{conv.lastMsg}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </main>
        ) : (
          /* HOME FEED */
          <>
            <main style={styles.feedColumn}>
              <div style={styles.filterRow}>
                {['for you', 'following', 'trending', 'code & tech', 'ai labs', 'design'].map((filter) => (
                  <button key={filter} onClick={() => setFeedFilter(filter)} style={feedFilter === filter ? styles.activeFilterChip : styles.filterChip}>
                    {filter}
                  </button>
                ))}
              </div>
              <div style={styles.streamContainer}>
                {posts.length === 0 ? (
                  <div style={{ ...styles.card, textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <p style={{ fontSize: '15px', color: '#94a3b8' }}>No global broadcasts found yet.</p>
                  </div>
                ) : (
                  posts.map((post) => {
                    const isLiked = userLikes.includes(post.id);
                    return (
                      <div key={post.id} style={styles.postCard}>
                        <div style={styles.postHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={styles.feedAvatar}>👤</div>
                            <span onClick={() => setViewingProfile(post.profiles)} style={{ ...styles.username, cursor: 'pointer' }}>
                              @{post.profiles?.username || 'builder'}
                            </span>
                          </div>
                          <span style={styles.postType}>{post.post_type}</span>
                        </div>
                        <p style={styles.postContent}>{post.caption}</p>
                        {post.media_url && (
                          <div style={styles.mediaWrapper}>
                            {post.media_type === 'image' ? <img src={post.media_url} alt="Media" style={styles.postMedia} /> : <video src={post.media_url} controls style={styles.postMedia} />}
                          </div>
                        )}
                        <div style={styles.postActions}>
                          <button onClick={() => handleLike(post.id)} style={styles.actionBtn}>{isLiked ? '❤️ Liked' : '🤍 Like'}</button>
                          <button onClick={() => { setActiveTab('messages'); setActiveChatUser(post.profiles); }} style={styles.actionBtn}>💬 Message</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </main>

            <aside style={styles.sidebarColumn}>
              <div style={styles.card}>
                <div style={styles.repHeader}>
                  <span style={styles.repTitle}>🛡️ Reputation Ledger</span>
                  <span style={styles.repValue}>{reputation} PTS</span>
                </div>
                <p style={styles.subtext}>Earn points dynamically through broadcasts.</p>
              </div>

              {!user ? (
                <div style={styles.card}>
                  <h3 style={styles.sidebarTitle}>Join BMAX Global</h3>
                  {authMessage && <div style={authMessageType === 'error' ? styles.errorBox : styles.successBox}>{authMessage}</div>}
                  <form style={styles.authForm}>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button onClick={handleSignIn} style={styles.primaryBtn}>Sign In</button>
                      <button onClick={handleSignUp} style={styles.secondaryBtn}>Sign Up</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div style={styles.card}>
                  <h3 style={styles.sidebarTitle}>Active Session</h3>
                  <p style={{ color: '#fbbf24', fontWeight: 'bold', margin: '0 0 4px 0' }}>@{username || user.email}</p>
                  <small style={{ color: '#94a3b8' }}>Reputation Score: <strong>{reputation} PTS</strong></small>
                </div>
              )}
            </aside>
          </>
        )}
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav style={styles.mobileNav} className="mobile-only">
        {['home', 'discover', 'create', 'messages', 'profile'].map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); setViewingProfile(null); }} style={activeTab === tab ? styles.activeMobileBtn : styles.mobileBtn}>
            {tab === 'home' && '⚡'}
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
  appWrapper: { backgroundColor: '#030008', color: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px', backgroundColor: '#090514', borderBottom: '1px solid #1e1b4b', position: 'sticky', top: 0, zIndex: 100 },
  brandGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
  logo: { margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '2px', color: '#c084fc' },
  badge: { backgroundColor: '#581c87', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', color: '#f8fafc', fontWeight: 'bold' },
  topNav: { display: 'flex', gap: '6px' },
  navBtn: { backgroundColor: 'transparent', border: 'none', color: '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  activeNavBtn: { backgroundColor: '#1e1b4b', border: '1px solid #7e22ce', color: '#fbbf24', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  layoutContainer: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', maxWidth: '1100px', margin: '0 auto', padding: '24px 16px', width: '100%' },
  feedColumn: { display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' },
  sidebarColumn: { display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' },
  card: { backgroundColor: '#090514', border: '1px solid #1e1b4b', borderRadius: '16px', padding: '20px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' },
  postCard: { backgroundColor: '#090514', border: '1px solid #1e1b4b', borderRadius: '16px', padding: '20px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' },
  miniCard: { backgroundColor: '#06030d', border: '1px solid #1e1b4b', borderRadius: '12px', padding: '16px' },
  repHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  repTitle: { fontWeight: 'bold', color: '#f8fafc', fontSize: '15px' },
  repValue: { fontWeight: '900', color: '#fbbf24', fontSize: '16px' },
  subtext: { margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' },
  composerTabs: { display: 'flex', gap: '8px', marginBottom: '14px' },
  chip: { backgroundColor: '#120b24', color: '#94a3b8', border: 'none', padding: '6px 14px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer', textTransform: 'capitalize' },
  activeChip: { backgroundColor: '#7e22ce', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'capitalize' },
  composerForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  textArea: { backgroundColor: '#030008', border: '1px solid #1e1b4b', borderRadius: '10px', color: '#fff', padding: '14px', minHeight: '90px', resize: 'vertical', width: '100%', fontSize: '14px' },
  previewContainer: { position: 'relative', width: '100%', maxHeight: '280px', overflow: 'hidden', borderRadius: '10px', backgroundColor: '#000' },
  mediaPreview: { width: '100%', height: '100%', objectFit: 'contain' },
  removeMediaBtn: { position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' },
  composerFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { backgroundColor: '#120b24', border: '1px solid #1e1b4b', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', color: '#e879f9', fontSize: '13px', fontWeight: 'bold' },
  broadcastBtn: { backgroundColor: '#7e22ce', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  filterRow: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' },
  filterChip: { backgroundColor: '#090514', color: '#94a3b8', border: '1px solid #1e1b4b', padding: '8px 16px', borderRadius: '14px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'capitalize' },
  activeFilterChip: { backgroundColor: '#1e1b4b', color: '#fbbf24', border: '1px solid #fbbf24', padding: '8px 16px', borderRadius: '14px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 'bold', textTransform: 'capitalize' },
  streamContainer: { display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' },
  postHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  feedAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1e1b4b', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px' },
  username: { color: '#c084fc', fontWeight: 'bold', fontSize: '14px' },
  postType: { fontSize: '10px', backgroundColor: '#120b24', border: '1px solid #1e1b4b', padding: '3px 8px', borderRadius: '6px', color: '#e879f9', textTransform: 'uppercase', fontWeight: 'bold' },
  postContent: { margin: '0 0 14px 0', lineHeight: '1.5', wordBreak: 'break-word', fontSize: '15px' },
  mediaWrapper: { borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', marginBottom: '14px', border: '1px solid #1e1b4b' },
  postMedia: { width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' },
  postActions: { display: 'flex', gap: '20px', borderTop: '1px solid #1e1b4b', paddingTop: '12px' },
  actionBtn: { backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  sidebarTitle: { margin: '0 0 12px 0', fontSize: '15px', color: '#f8fafc' },
  authForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { backgroundColor: '#030008', border: '1px solid #1e1b4b', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', width: '100%' },
  primaryBtn: { backgroundColor: '#7e22ce', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  secondaryBtn: { backgroundColor: '#120b24', border: '1px solid #1e1b4b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  errorBox: { backgroundColor: '#450a0a', color: '#fecaca', padding: '8px', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' },
  successBox: { backgroundColor: '#052e16', color: '#bbf7d0', padding: '8px', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' },
  profileHeader: { display: 'flex', gap: '20px', alignItems: 'center' },
  avatar: { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#1e1b4b', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px' },
  profileStatsRow: { display: 'flex', gap: '20px', fontSize: '14px' },
  profileActions: { display: 'flex', gap: '8px', marginTop: '16px' },
  editSection: { marginTop: '16px', borderTop: '1px solid #1e1b4b', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  mobileNav: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#090514', borderTop: '1px solid #1e1b4b', justifyContent: 'space-around', padding: '12px 0', zIndex: 100 },
  mobileBtn: { backgroundColor: 'transparent', border: 'none', fontSize: '22px', padding: '4px' },
  activeMobileBtn: { backgroundColor: '#1e1b4b', border: '1px solid #7e22ce', fontSize: '22px', borderRadius: '10px', padding: '4px' },
  communityGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' },
  subTabHeader: { display: 'flex', gap: '12px', borderBottom: '1px solid #1e1b4b', paddingBottom: '10px', marginBottom: '14px' },
  subTab: { backgroundColor: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  activeSubTab: { backgroundColor: 'transparent', border: 'none', color: '#fbbf24', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  activityCard: { backgroundColor: '#030008', border: '1px solid #1e1b4b', padding: '12px', borderRadius: '8px', fontSize: '13px' },
  conversationCard: { backgroundColor: '#030008', border: '1px solid #1e1b4b', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }
};
