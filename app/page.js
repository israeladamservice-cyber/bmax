'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmqkqdzzmyzkoltxnnqt.supabase.co';
const supabaseAnonKey = 'sb_publishable_tHE9rIwNAsYile9BPJwCBA_pMGRyI5S';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [feedFilter, setFeedFilter] = useState('for you');
  const [user, setUser] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authMessageType, setAuthMessageType] = useState('info');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  // Posts & Feed State
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState('');
  const [composerType, setComposerType] = useState('update');
  const [uploading, setUploading] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);

  // Post Editing State
  const [editingPostId, setEditingPostId] = useState(null);
  const [editCaption, setEditCaption] = useState('');

  // Comments / Replies State
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [commentInput, setCommentInput] = useState('');

  // Public Profile Viewer Modal State
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isFollowingSelected, setIsFollowingSelected] = useState(false);

  // File Attachment & Preview State
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  // Profile State
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [reputation, setReputation] = useState(0);
  const [userLikes, setUserLikes] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Messages & Activity State
  const [conversations] = useState([
    { id: '1', user: 'alex_dev', lastMsg: 'Hey, checked your latest project!', unread: true },
    { id: '2', user: 'sara_code', lastMsg: 'Let us collaborate on Next.js', unread: false }
  ]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const chatEndRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Welcome to BMAX. Start building your reputation.', read: false },
    { id: 2, text: 'Your profile is ready to customize.', read: false },
  ]);
  const [hubs, setHubs] = useState([
    { id: 'web', name: 'Web Builders', description: 'Build, ship and discuss modern websites.', members: 1284, joined: false, icon: '■' },
    { id: 'ai', name: 'AI Labs', description: 'AI tools, workflows, experiments and ideas.', members: 962, joined: false, icon: '■' },
    { id: 'design', name: 'Design Studio', description: 'UI/UX, branding, graphics and creative work.', members: 741, joined: false, icon: '■' },
    { id: 'growth', name: 'Creators & Growth', description: 'Marketing, personal brands and creator economy.', members: 523, joined: false, icon: '■' },
  ]);
  const [hubSearch, setHubSearch] = useState('');
  const [selectedHub, setSelectedHub] = useState(null);
  const [challengeJoined, setChallengeJoined] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(window.__bmaxToastTimer);
    window.__bmaxToastTimer = window.setTimeout(() => setToast(''), 2500);
  };

  const markNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleHubJoin = (hubId) => {
    setHubs(prev => prev.map(h => h.id === hubId ? { ...h, joined: !h.joined, members: h.members + (h.joined ? -1 : 1) } : h));
    const hub = hubs.find(h => h.id === hubId);
    if (hub) showToast(hub.joined ? `Left ${hub.name}` : `Joined ${hub.name}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveTab('discover');
  };

  // Auth & Event Handlers
  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthMessageType('error');
      setAuthMessage(error.message);
    } else {
      setShowAuthModal(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthMessage('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthMessageType('error');
      setAuthMessage(error.message);
    } else {
      setAuthMessageType('info');
      setAuthMessage('Check your email to confirm registration.');
    }
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowAuthModal(true);
  };

  const handleOpenAuthorProfile = (profile) => {
    if (profile) setSelectedProfile(profile);
  };

  const handleToggleFollow = () => {
    setIsFollowingSelected(!isFollowingSelected);
    showToast(isFollowingSelected ? 'Unfollowed user' : 'Following user');
  };

  const handleLike = (postId) => {
    if (userLikes.includes(postId)) {
      setUserLikes(userLikes.filter(id => id !== postId));
    } else {
      setUserLikes([...userLikes, postId]);
    }
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!postText.trim()) return;
    setUploading(true);
    const newPost = {
      id: Date.now().toString(),
      user_id: user?.id,
      caption: postText,
      profiles: { username: username || 'builder', avatar_url: avatarUrl },
      post_type: composerType,
      media_url: mediaPreview,
      media_type: mediaType
    };
    setPosts([newPost, ...posts]);
    setPostText('');
    clearMediaPreview();
    setUploading(false);
    showToast('Broadcast published!');
  };

  const handleStartEdit = (post) => {
    setEditingPostId(post.id);
    setEditCaption(post.caption);
  };

  const handleSaveEdit = (postId) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, caption: editCaption } : p));
    setEditingPostId(null);
    showToast('Broadcast updated');
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => p.id !== postId));
    showToast('Broadcast deleted');
  };

  const toggleComments = (postId) => {
    setActiveCommentPostId(activeCommentPostId === postId ? null : postId);
  };

  const handleAddComment = (postId) => {
    if (!commentInput.trim()) return;
    const currentComments = commentsMap[postId] || [];
    const newComment = {
      id: Date.now().toString(),
      comment_text: commentInput,
      profiles: { username: username || 'builder' }
    };
    setCommentsMap({ ...commentsMap, [postId]: [...currentComments, newComment] });
    setCommentInput('');
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const clearMediaPreview = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = () => {
    setIsEditingProfile(false);
    showToast('Profile updated');
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatHistory([...chatHistory, { sender: 'me', text: chatInput }]);
    setChatInput('');
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredPosts = posts.filter(post => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return `${post.caption || ''} ${post.profiles?.username || ''}`.toLowerCase().includes(q);
  });

  const navItems = [
    ['home', '■', 'Home'], ['discover', '■', 'Discover'], ['hubs', '■', 'Hubs'],
    ['create', '+', 'Create'], ['messages', '■', 'Messages'], ['profile', '■', 'Profile']
  ];

  const PageTitle = ({ title, subtitle, action }) => (
    <div style={styles.pageTitleRow}>
      <div><h2 style={styles.pageTitle}>{title}</h2>{subtitle && <p style={styles.pageSubtitle}>{subtitle}</p>}</div>
      {action}
    </div>
  );

  const renderDiscover = () => {
    const topics = ['AI Labs', 'Web Development', 'Design', 'Startups', 'Freelancing', 'Marketing'];
    const visiblePosts = filteredPosts.slice(0, 8);
    return (
      <main style={styles.singleColumn}>
        <PageTitle title="Discover" subtitle="Find people, ideas and communities worth following." />
        <form onSubmit={handleSearchSubmit} style={styles.searchBox}>
          <span>■</span><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search BMAX..." style={styles.searchInput} />
          <button type="submit" style={styles.primaryBtn}>Search</button>
        </form>
        <div style={styles.topicGrid}>
          {topics.map(topic => (
            <button key={topic} onClick={() => { setSearchQuery(topic); setActiveTab('discover'); }} style={styles.topicCard}>
              <strong>{topic}</strong>
              <span>Explore →</span>
            </button>
          ))}
        </div>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Trending broadcasts</h3>
          <button onClick={() => setFeedFilter('trending')} style={styles.linkBtn}>View all</button>
        </div>
        {visiblePosts.length ? visiblePosts.map(post => (
          <div key={post.id} style={styles.postCard}>
            <div style={styles.postHeader}>
              <div className="author-link" onClick={() => handleOpenAuthorProfile(post.profiles)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="Avatar" style={styles.feedAvatarImg} /> : <div style={styles.feedAvatar}>■</div>}
                <span style={styles.username}>@{post.profiles?.username || 'builder'}</span>
              </div>
              <span style={styles.miniTag}>{post.post_type || 'update'}</span>
            </div>
            <p style={styles.postContent}>{post.caption}</p>
            {post.media_url && (post.media_type === 'image' ? <img src={post.media_url} alt="Broadcast" style={styles.postMedia} /> : <video src={post.media_url} controls style={styles.postMedia} />)}
            <div style={styles.postActions}>
              <button onClick={() => handleLike(post.id)} style={styles.actionBtn}>{userLikes.includes(post.id) ? '❤■ Liked' : '■ Like'}</button>
              <button onClick={() => { setActiveTab('home'); setActiveCommentPostId(post.id); }} style={styles.actionBtn}>■ Reply</button>
            </div>
          </div>
        )) : <EmptyState icon="■" title="Nothing found yet" text="Try another search or explore a topic above." />}
      </main>
    );
  };

  const renderHubs = () => {
    const visibleHubs = hubs.filter(h => `${h.name} ${h.description}`.toLowerCase().includes(hubSearch.toLowerCase()));
    return (
      <main style={styles.singleColumn}>
        <PageTitle
          title="Hubs"
          subtitle="Join focused communities and build with people who share your interests."
          action={
            <button onClick={() => showToast('Hub creation UI is ready for backend connection.')} style={styles.primaryBtn}>
              ■ Create Hub
            </button>
          }
        />
        <input value={hubSearch} onChange={e => setHubSearch(e.target.value)} placeholder="Search hubs..." style={styles.input} />
        <div style={styles.hubGrid}>
          {visibleHubs.map(hub => (
            <div key={hub.id} style={styles.hubCard}>
              <div style={styles.hubIcon}>{hub.icon}</div>
              <h3 style={styles.hubName}>{hub.name}</h3>
              <p style={styles.hubDescription}>{hub.description}</p>
              <div style={styles.hubMeta}><span>■ {hub.members.toLocaleString()}</span><span>Public</span></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setSelectedHub(hub)} style={{ ...styles.secondaryBtn, flex: 1 }}>Open Hub</button>
                <button onClick={() => toggleHubJoin(hub.id)} style={{ ...styles.primaryBtn, flex: 1 }}>{hub.joined ? '✓ Joined' : 'Join'}</button>
              </div>
            </div>
          ))}
        </div>
        {selectedHub && (
          <div style={styles.modalOverlay} onClick={() => setSelectedHub(null)}>
            <div style={styles.largeModal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalTop}>
                <div>
                  <div style={styles.hubIcon}>{selectedHub.icon}</div>
                  <h2 style={styles.pageTitle}>{selectedHub.name}</h2>
                  <p style={styles.pageSubtitle}>{selectedHub.description}</p>
                </div>
                <button onClick={() => setSelectedHub(null)} style={styles.closeBtn}>✕</button>
              </div>
              <div style={styles.hubHero}><strong>{selectedHub.members.toLocaleString()} builders</strong><span>•</span><span>Public community</span></div>
              <div style={styles.placeholderPanel}>
                <div style={{ fontSize: 32 }}>■</div>
                <h3>Hub feed ready</h3>
                <p>Members can post projects, ask questions and collaborate here. This frontend is wired for the next Supabase hub tables.</p>
                <button onClick={() => { toggleHubJoin(selectedHub.id); setSelectedHub(null); }} style={styles.primaryBtn}>
                  {selectedHub.joined ? 'Leave Hub' : 'Join Hub'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  };

  const renderCreate = () => (
    <main style={styles.singleColumn}>
      <PageTitle title="Create" subtitle="Turn an idea into a broadcast and start building your reputation." />
      <div style={styles.createGrid}>
        <div style={styles.card}>
          <div style={styles.createIcon}>■</div>
          <h3>Broadcast</h3>
          <p>Share an update, project, question, image or video with the BMAX community.</p>
          <button onClick={() => setActiveTab('profile')} style={styles.primaryBtn}>Create Broadcast →</button>
        </div>
        <div style={styles.card}>
          <div style={styles.createIcon}>■</div>
          <h3>Challenge</h3>
          <p>Join a public challenge, build something and earn reputation through your contribution.</p>
          <button onClick={() => { setChallengeJoined(true); showToast('You joined the BMAX Builder Challenge'); }} style={styles.primaryBtn}>
            {challengeJoined ? '✓ Joined Challenge' : 'Join Challenge'}
          </button>
        </div>
        <div style={styles.card}>
          <div style={styles.createIcon}>■</div>
          <h3>Hub</h3>
          <p>Create a focused community around a skill, project, interest or professional niche.</p>
          <button onClick={() => setActiveTab('hubs')} style={styles.primaryBtn}>Explore Hubs →</button>
        </div>
        <div style={styles.card}>
          <div style={styles.createIcon}>■</div>
          <h3>Opportunity</h3>
          <p>Post a collaboration, freelance opportunity or job for builders on BMAX.</p>
          <button onClick={() => showToast('Opportunity composer is ready for the marketplace/jobs backend.')} style={styles.primaryBtn}>Start Opportunity</button>
        </div>
      </div>
      <div style={styles.challengeBanner}>
        <div>
          <span style={styles.miniTag}>WEEKLY</span>
          <h3 style={{ margin: '8px 0 4px' }}>BMAX Builder Challenge</h3>
          <p style={styles.pageSubtitle}>Build something useful. Share the process. Earn reputation.</p>
        </div>
        <button onClick={() => { setChallengeJoined(true); showToast('Challenge joined!'); }} style={styles.primaryBtn}>
          {challengeJoined ? '✓ Joined' : 'Join Challenge'}
        </button>
      </div>
    </main>
  );

  const EmptyState = ({ icon, title, text }) => (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );

  useEffect(() => {
    let mounted = true;
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user || null);
        setInitialLoad(false);
        if (!session?.user) {
          setShowAuthModal(true);
        }
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user || null);
        if (session?.user) {
          setShowAuthModal(false);
        } else {
          setShowAuthModal(true);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeChat]);

  if (initialLoad) {
    return <div style={{ backgroundColor: '#030008', height: '100vh' }}></div>;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={styles.appWrapper}>
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; padding: 0; background-color: #030008; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        button, input, textarea { font: inherit; }
        button { transition: transform .15s ease, opacity .15s ease, border-color .15s ease, background .15s ease; }
        button:active { transform: translateY(1px); }
        button:disabled { opacity: .55; cursor: not-allowed; }
        .desktop-only { display: flex; } .mobile-only { display: none; }
        .author-link { cursor: pointer; transition: opacity 0.2s; } .author-link:hover { opacity: 0.8; text-decoration: underline; }
        ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-thumb { background: #3b0764; border-radius: 10px; }
        @media (max-width: 900px) { .topicGrid,.hubGrid,.createGrid { grid-template-columns: 1fr !important; } .headerSearch { display:none !important; } .statsGrid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 768px) { .desktop-only { display: none !important; } .mobile-only { display: flex !important; } .responsive-grid { grid-template-columns: 1fr !important; } .desktopNav { display:none !important; } }
      `}</style>

      <header style={styles.header}>
        <button onClick={() => setActiveTab('home')} style={styles.brandButton}>
          <div style={styles.brandGroup}>
            <h1 style={styles.logo}>BMAX</h1>
            <span style={styles.badge}>GLOBAL v2.7</span>
          </div>
        </button>
        <form onSubmit={handleSearchSubmit} style={styles.headerSearch}>
          <span>■</span>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search BMAX" style={styles.headerSearchInput} />
        </form>
        <nav style={styles.topNav} className="desktopNav">
          {navItems.map(([tab, icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={activeTab === tab ? styles.activeNavBtn : styles.navBtn}>
              {icon} {label}
            </button>
          ))}
        </nav>
        <div style={styles.headerRight}>
          <button
            onClick={() => {
              markNotificationsRead();
              showToast(unreadCount ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} marked read` : 'No new notifications');
            }}
            style={styles.bellBtn}
          >
            ■{unreadCount > 0 && <span style={styles.notificationDot}>{unreadCount}</span>}
          </button>
          {user && <button onClick={handleSignOut} style={styles.secondaryBtn}>Sign Out</button>}
        </div>
      </header>

      <div style={styles.mobileNav}>
        {navItems.map(([tab, icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={activeTab === tab ? styles.mobileNavActive : styles.mobileNavBtn}>
            <span>{icon}</span>
            <small>{label}</small>
          </button>
        ))}
      </div>

      {selectedProfile && (
        <div style={styles.modalOverlay} onClick={() => setSelectedProfile(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>■ Public Profile</h3>
              <button onClick={() => setSelectedProfile(null)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              {selectedProfile.avatar_url ? <img src={selectedProfile.avatar_url} alt="Avatar" style={styles.avatarImg} /> : <div style={styles.avatar}>■</div>}
              <div>
                <h3 style={{ margin: 0, color: '#c084fc' }}>@{selectedProfile.username}</h3>
                <p style={{ margin: '4px 0', fontSize: 13, color: '#94a3b8' }}>{selectedProfile.bio || 'BMAX builder'}</p>
                <p style={styles.miniText}>■ {Number(selectedProfile.reputation || 0).toLocaleString()} reputation</p>
              </div>
            </div>
            {user?.id !== selectedProfile.id && (
              <button onClick={handleToggleFollow} style={{ ...styles.primaryBtn, width: '100%', backgroundColor: isFollowingSelected ? '#374151' : '#7e22ce' }}>
                {isFollowingSelected ? '✓ Following' : '■ Follow'}
              </button>
            )}
          </div>
        </div>
      )}

      {showAuthModal && (
        <div style={{ ...styles.modalOverlay, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(3,0,8,.95)' }}>
          <div style={{ ...styles.modalContent, border: '2px solid #7e22ce' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h1 style={{ ...styles.logo, fontSize: 32 }}>BMAX</h1>
              <p style={{ color: '#94a3b8', fontSize: 14 }}>Global Builder Ecosystem</p>
            </div>
            <h3 style={{ margin: '0 0 16px', textAlign: 'center' }}>{authMode === 'signin' ? 'Sign In to Proceed' : 'Create your Account'}</h3>
            {authMessage && <div style={authMessageType === 'error' ? styles.errorBox : styles.successBox}>{authMessage}</div>}
            <button type="button" onClick={handleGoogleSignIn} style={styles.googleBtn}>Continue with Google</button>
            <div style={styles.divider}><span style={styles.dividerText}>OR</span></div>
            <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} style={styles.authForm}>
              <input type="email" required placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} />
              <input type="password" required minLength={6} placeholder="Password (6+ characters)" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} />
              <button type="submit" style={{ ...styles.primaryBtn, width: '100%' }}>{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</button>
            </form>
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13 }}>
              {authMode === 'signin' ? (
                <>No account? <button onClick={() => { setAuthMode('signup'); setAuthMessage(''); }} style={styles.inlineLink}>Sign Up</button></>
              ) : (
                <>Have an account? <button onClick={() => { setAuthMode('signin'); setAuthMessage(''); }} style={styles.inlineLink}>Sign In</button></>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={styles.layoutContainer} className="responsive-grid">
        {activeTab === 'discover' ? renderDiscover() : activeTab === 'hubs' ? renderHubs() : activeTab === 'create' ? renderCreate() : activeTab === 'profile' ? (
          <main style={styles.singleColumn}>
            <PageTitle title="Your Profile" subtitle="Your identity, work and reputation on BMAX." />
            <div style={styles.profileCard}>
              <div style={styles.profileHeader}>
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={styles.avatarImg} /> : <div style={styles.avatar}>■</div>}
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0 }}>@{username || user?.email}</h2>
                  <p style={styles.pageSubtitle}>{bio || 'Add a bio to tell builders what you do.'}</p>
                </div>
                <button onClick={() => setIsEditingProfile(!isEditingProfile)} style={styles.primaryBtn}>{isEditingProfile ? 'Close Edit' : 'Edit Profile'}</button>
              </div>
              <div style={styles.statsGrid}>
                <div><strong>{reputation.toLocaleString()}</strong><span>Reputation</span></div>
                <div><strong>{followersCount}</strong><span>Followers</span></div>
                <div><strong>{followingCount}</strong><span>Following</span></div>
                <div><strong>{posts.filter(p => p.user_id === user?.id).length}</strong><span>Broadcasts</span></div>
              </div>
              {isEditingProfile && (
                <div style={styles.editSection}>
                  <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={styles.input} />
                  <textarea placeholder="Bio" value={bio} onChange={e => setBio(e.target.value)} style={{ ...styles.textArea, minHeight: 80 }} />
                  <label style={styles.miniText}>Profile photo<input type="file" accept="image/*" onChange={handleAvatarSelect} style={{ ...styles.input, marginTop: 6 }} /></label>
                  <button onClick={handleSaveProfile} style={styles.primaryBtn}>Save Profile</button>
                </div>
              )}
            </div>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>■ Broadcast New Post</h3>
              <form onSubmit={handleCreatePost} style={styles.composerForm}>
                <textarea value={postText} onChange={e => setPostText(e.target.value)} placeholder="Share a project update..." style={styles.textArea} />
                {isProcessingMedia && <div style={styles.processing}>Processing media...</div>}
                {mediaPreview && (
                  <div style={styles.previewContainer}>
                    {mediaType === 'image' ? <img src={mediaPreview} alt="Preview" style={styles.mediaPreview} /> : <video src={mediaPreview} controls style={styles.mediaPreview} />}
                    <button type="button" onClick={clearMediaPreview} style={styles.removeMediaBtn}>✕</button>
                  </div>
                )}
                <div style={styles.composerFooter}>
                  <label style={styles.iconBtn}>■ Attach<input type="file" accept="image/*,video/*" onChange={handleMediaSelect} style={{ display: 'none' }} /></label>
                  <button type="submit" disabled={uploading || isProcessingMedia} style={styles.broadcastBtn}>{uploading ? 'Publishing...' : '■ Broadcast'}</button>
                </div>
              </form>
            </div>
          </main>
        ) : activeTab === 'messages' ? (
          <main style={styles.singleColumn}>
            <PageTitle title="Messages" subtitle="Connect privately with builders and collaborators." />
            {activeChat ? (
              <div style={styles.card}>
                <button onClick={() => setActiveChat(null)} style={styles.secondaryBtn}>← Back</button>
                <h3 style={{ color: '#fbbf24' }}>Chat with @{activeChat}</h3>
                <div style={styles.chatWindow}>
                  {chatHistory.length ? (
                    chatHistory.map((msg, idx) => (
                      <div key={idx} style={{ alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start', backgroundColor: msg.sender === 'me' ? '#7e22ce' : '#1e1b4b', padding: '10px 13px', borderRadius: 10, maxWidth: '78%' }}>
                        {msg.text}
                      </div>
                    ))
                  ) : (
                    <EmptyState icon="■" title="Start the conversation" text="Say hello and start collaborating." />
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={handleChatKeyDown} placeholder="Write a message..." style={{ ...styles.textArea, minHeight: 44, flex: 1 }} />
                  <button onClick={handleSendMessage} style={styles.primaryBtn}>Send</button>
                </div>
              </div>
            ) : (
              <div style={styles.card}>
                {conversations.map(conv => (
                  <button key={conv.id} onClick={() => { setActiveChat(conv.user); setChatHistory([]); }} style={styles.conversationCard}>
                    <span><strong>@{conv.user}</strong><small>{conv.lastMsg}</small></span>
                    {conv.unread && <span style={styles.unreadBadge}>New</span>}
                  </button>
                ))}
              </div>
            )}
          </main>
        ) : (
          <>
            <main style={styles.feedColumn}>
              <div style={styles.filterRow}>
                {['for you', 'following', 'trending', 'ai labs'].map(filter => (
                  <button key={filter} onClick={() => setFeedFilter(filter)} style={feedFilter === filter ? styles.activeFilterChip : styles.filterChip}>
                    {filter}
                  </button>
                ))}
              </div>
              {filteredPosts.length ? (
                <div style={styles.streamContainer}>
                  {filteredPosts.map(post => {
                    const isLiked = userLikes.includes(post.id);
                    const isAuthor = user?.id === post.user_id;
                    const isEditing = editingPostId === post.id;
                    const isCommentsOpen = activeCommentPostId === post.id;
                    const postComments = commentsMap[post.id] || [];
                    return (
                      <div key={post.id} style={styles.postCard}>
                        <div style={styles.postHeader}>
                          <div className="author-link" onClick={() => handleOpenAuthorProfile(post.profiles)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="Avatar" style={styles.feedAvatarImg} /> : <div style={styles.feedAvatar}>■</div>}
                            <span style={styles.username}>@{post.profiles?.username || 'builder'}</span>
                          </div>
                          {isAuthor && !isEditing && (
                            <div>
                              <button onClick={() => handleStartEdit(post)} style={styles.iconActionBtn}>✏■</button>
                              <button onClick={() => handleDeletePost(post.id)} style={styles.iconActionBtn}>■■</button>
                            </div>
                          )}
                        </div>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <textarea value={editCaption} onChange={e => setEditCaption(e.target.value)} style={styles.textArea} />
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button onClick={() => setEditingPostId(null)} style={styles.secondaryBtn}>Cancel</button>
                              <button onClick={() => handleSaveEdit(post.id)} style={styles.primaryBtn}>Save</button>
                            </div>
                          </div>
                        ) : (
                          <p style={styles.postContent}>{post.caption}</p>
                        )}
                        {post.media_url && (post.media_type === 'image' ? <img src={post.media_url} alt="Broadcast" style={styles.postMedia} /> : <video src={post.media_url} controls style={styles.postMedia} />)}
                        <div style={styles.postActions}>
                          <button onClick={() => handleLike(post.id)} style={styles.actionBtn}>{isLiked ? '❤■ Liked' : '■ Like'}</button>
                          <button onClick={() => toggleComments(post.id)} style={styles.actionBtn}>■ Reply {postComments.length ? `(${postComments.length})` : ''}</button>
                          <button onClick={() => { navigator.clipboard?.writeText(window.location.href); showToast('Link copied'); }} style={styles.actionBtn}>■ Share</button>
                        </div>
                        {isCommentsOpen && (
                          <div style={styles.commentsContainer}>
                            {postComments.map(c => (
                              <div key={c.id} style={styles.commentItem}>
                                <div style={{ width: '100%' }}>
                                  <strong style={{ color: '#c084fc', fontSize: 12 }}>@{c.profiles?.username || 'builder'}</strong>
                                  <div style={{ fontSize: 13, marginTop: 4 }}>{c.comment_text}</div>
                                </div>
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input id="replyInput" value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="Write a reply..." style={{ ...styles.input, flex: 1 }} />
                              <button onClick={() => handleAddComment(post.id)} style={styles.primaryBtn}>Post</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon="■" title="No broadcasts yet" text="Be one of the first builders to publish something on BMAX." />
              )}
            </main>
            <aside style={styles.sidebarColumn} className="desktop-only">
              <div style={styles.card}>
                <h3 style={styles.sidebarTitle}>Your Reputation</h3>
                <div style={styles.repNumber}>{reputation.toLocaleString()}</div>
                <p style={styles.pageSubtitle}>Keep contributing useful work to grow your BMAX reputation.</p>
                <button onClick={() => setActiveTab('profile')} style={styles.secondaryBtn}>View Profile →</button>
              </div>
              <div style={styles.card}>
                <h3 style={styles.sidebarTitle}>Popular Hubs</h3>
                {hubs.slice(0, 3).map(h => (
                  <div key={h.id} style={styles.miniHub}>
                    <span>{h.icon}</span>
                    <div style={styles.miniHubText}>
                      <strong>{h.name}</strong>
                      <small>{h.members.toLocaleString()} members</small>
                    </div>
                    <button onClick={() => setActiveTab('hubs')} style={styles.linkBtn}>View</button>
                  </div>
                ))}
              </div>
              <div style={styles.card}>
                <h3 style={styles.sidebarTitle}>■ Quick Create</h3>
                <button onClick={() => setActiveTab('create')} style={{ ...styles.primaryBtn, width: '100%' }}>■ Create something</button>
              </div>
            </aside>
          </>
        )}
      </div>
      {toast && <div style={styles.toast}>{toast}</div>}
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
  postCard: { backgroundColor: '#090514', border: '1px solid #1e1b4b', borderRadius: '16px', padding: '20px', width: '100%' },
  composerForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  textArea: { backgroundColor: '#030008', border: '1px solid #1e1b4b', borderRadius: '10px', color: '#fff', padding: '14px', resize: 'vertical', fontFamily: 'inherit', width: '100%', fontSize: '14px' },
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
  feedAvatarImg: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' },
  username: { color: '#c084fc', fontWeight: 'bold', fontSize: '14px' },
  iconActionBtn: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.8 },
  postContent: { margin: '0 0 14px 0', lineHeight: '1.5', wordBreak: 'break-word', fontSize: '15px' },
  mediaWrapper: { borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', marginBottom: '14px', border: '1px solid #1e1b4b' },
  postMedia: { width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' },
  postActions: { display: 'flex', gap: '20px', borderTop: '1px solid #1e1b4b', paddingTop: '12px' },
  actionBtn: { backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  commentsContainer: { marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #1e1b4b' },
  commentItem: { backgroundColor: '#030008', padding: '8px 12px', borderRadius: '8px', border: '1px solid #120b24', display: 'flex', gap: '8px', alignItems: 'flex-start' },
  sidebarTitle: { margin: '0 0 12px 0', fontSize: '15px', color: '#f8fafc' },
  authForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { backgroundColor: '#030008', border: '1px solid #1e1b4b', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', width: '100%' },
  primaryBtn: { backgroundColor: '#7e22ce', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  secondaryBtn: { backgroundColor: '#120b24', border: '1px solid #1e1b4b', color: '#fff', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  googleBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', color: '#1f2937', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', width: '100%' },
  divider: { display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px 0', borderBottom: '1px solid #1e1b4b', position: 'relative' },
  dividerText: { backgroundColor: '#090514', padding: '0 8px', color: '#64748b', fontSize: '11px', position: 'relative', top: '1px' },
  errorBox: { backgroundColor: '#450a0a', color: '#fecaca', padding: '8px', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' },
  successBox: { backgroundColor: '#052e16', color: '#bbf7d0', padding: '8px', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' },
  profileHeader: { display: 'flex', gap: '20px', alignItems: 'center' },
  avatar: { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#1e1b4b', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px' },
  avatarImg: { width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' },
  profileActions: { display: 'flex', gap: '8px', marginTop: '16px' },
  editSection: { marginTop: '16px', borderTop: '1px solid #1e1b4b', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  conversationCard: { backgroundColor: '#030008', border: '1px solid #1e1b4b', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  unreadBadge: { backgroundColor: '#7e22ce', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' },
  modalContent: { backgroundColor: '#090514', border: '1px solid #7e22ce', borderRadius: '16px', padding: '30px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' },
  closeBtn: { backgroundColor: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' },
  brandButton: { background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  headerSearch: { display: 'flex', alignItems: 'center', gap: 8, background: '#030008', border: '1px solid #1e1b4b', borderRadius: 10, padding: '7px 10px', width: 220 },
  headerSearchInput: { flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 0, color: '#fff', fontSize: 13 },
  bellBtn: { position: 'relative', background: '#120b24', border: '1px solid #1e1b4b', color: '#fff', borderRadius: 9, padding: '8px 10px', cursor: 'pointer' },
  notificationDot: { position: 'absolute', top: -6, right: -6, minWidth: 17, height: 17, borderRadius: 20, background: '#fbbf24', color: '#090514', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mobileNav: { display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: '#090514', borderTop: '1px solid #1e1b4b', justifyContent: 'space-around', padding: '6px 4px calc(6px + env(safe-area-inset-bottom))' },
  mobileNavBtn: { flex: 1, background: 'transparent', border: 0, color: '#64748b', padding: '5px 2px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' },
  mobileNavActive: { flex: 1, background: '#1e1b4b', border: '1px solid #7e22ce', color: '#fbbf24', borderRadius: 8, padding: '5px 2px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' },
  singleColumn: { gridColumn: '1 / -1', maxWidth: 900, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 16 },
  pageTitleRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 850, letterSpacing: '-0.5px' },
  pageSubtitle: { margin: '6px 0 0', color: '#94a3b8', fontSize: 13, lineHeight: 1.5 },
  searchBox: { display: 'flex', gap: 8, alignItems: 'center', background: '#090514', border: '1px solid #1e1b4b', borderRadius: 14, padding: 8 },
  searchInput: { flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 0, color: '#fff', padding: 8 },
  topicGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  topicCard: { background: '#090514', border: '1px solid #1e1b4b', borderRadius: 14, color: '#fff', padding: 16, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 7 },
  linkBtn: { background: 'transparent', border: 0, color: '#c084fc', cursor: 'pointer', padding: 4 },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { margin: 0, fontSize: 16, color: '#f8fafc' },
  miniTag: { display: 'inline-flex', alignItems: 'center', background: '#1e1b4b', border: '1px solid #3b0764', color: '#c084fc', borderRadius: 999, padding: '3px 7px', fontSize: 9, fontWeight: 800, textTransform: 'uppercase' },
  hubGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 },
  hubCard: { background: '#090514', border: '1px solid #1e1b4b', borderRadius: 16, padding: 18 },
  hubIcon: { width: 48, height: 48, borderRadius: 13, background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 10 },
  hubName: { margin: '0 0 5px', fontSize: 17 },
  hubDescription: { color: '#94a3b8', minHeight: 42, fontSize: 13, lineHeight: 1.5, margin: 0 },
  hubMeta: { display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 11, margin: '14px 0' },
  largeModal: { background: '#090514', border: '1px solid #7e22ce', borderRadius: 18, padding: 24, maxWidth: 650, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.8)' },
  modalTop: { display: 'flex', justifyContent: 'space-between', gap: 16 },
  hubHero: { display: 'flex', gap: 10, color: '#94a3b8', borderTop: '1px solid #1e1b4b', borderBottom: '1px solid #1e1b4b', padding: '14px 0', margin: '16px 0' },
  placeholderPanel: { textAlign: 'center', padding: '36px 20px', border: '1px dashed #3b0764', borderRadius: 14, background: '#030008' },
  createGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 },
  createIcon: { fontSize: 30, marginBottom: 10 },
  challengeBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, background: 'linear-gradient(135deg,#120b24,#1e1b4b)', border: '1px solid #7e22ce', borderRadius: 16, padding: 20 },
  profileCard: { background: '#090514', border: '1px solid #1e1b4b', borderRadius: 16, padding: 20 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 20, borderTop: '1px solid #1e1b4b', paddingTop: 16 },
  statsCell: { background: '#030008', borderRadius: 10, padding: 12 },
  repNumber: { fontSize: 36, fontWeight: 900, color: '#fbbf24', margin: '10px 0' },
  miniText: { color: '#64748b', fontSize: 11, margin: '5px 0' },
  inlineLink: { background: 'transparent', border: 0, color: '#c084fc', cursor: 'pointer', padding: 0 },
  processing: { color: '#fbbf24', fontSize: 12 },
  chatWindow: { height: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 9, padding: '10px 0', marginBottom: 10 },
  miniHub: { display: 'flex', alignItems: 'center', gap: 9, padding: '9px 0', borderBottom: '1px solid #1e1b4b' },
  miniHubText: { flex: 1 },
  miniHubSmall: { display: 'block', color: '#64748b', fontSize: 10, marginTop: 2 },
  emptyState: { textAlign: 'center', padding: '60px 20px', background: '#090514', border: '1px dashed #1e1b4b', borderRadius: 16 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  toast: { position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#f8fafc', color: '#090514', padding: '10px 15px', borderRadius: 10, fontWeight: 700, fontSize: 12, boxShadow: '0 10px 30px rgba(0,0,0,.4)' }
};
