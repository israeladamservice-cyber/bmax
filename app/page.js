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

  // Force Auth Modal if not signed in & sync Google user data
  useEffect(() => {
    let mounted = true;

    const syncProfileData = async (sessionUser) => {
      if (!sessionUser) return;
      const meta = sessionUser.user_metadata || {};
      const fallbackUsername = meta.full_name?.replace(/\s+/g, '_').toLowerCase() || meta.name || sessionUser.email.split('@')[0];
      const googleAvatar = meta.avatar_url || meta.picture || '';

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle();
      
      if (!profile) {
        await supabase.from('profiles').upsert({
          id: sessionUser.id,
          username: fallbackUsername,
          avatar_url: googleAvatar,
          reputation: 0
        });
      } else if (!profile.avatar_url && googleAvatar) {
        await supabase.from('profiles').update({ avatar_url: googleAvatar }).eq('id', sessionUser.id);
      }
    };

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user || null);
        setInitialLoad(false);
        if (!session?.user) {
          setShowAuthModal(true);
        } else {
          await syncProfileData(session.user);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setUser(session?.user || null);
        if (session?.user) {
          setShowAuthModal(false);
          await syncProfileData(session.user);
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

  useEffect(() => {
    if (initialLoad) return;
    let cancelled = false;

    const loadUserData = async () => {
      const tasks = [fetchPosts()];
      if (user?.id) {
        tasks.push(fetchUserProfile(), fetchUserLikes(), fetchFollowCounts());
      }
      await Promise.allSettled(tasks);
      if (cancelled) return;

      if (!user?.id) {
        setUserLikes([]);
        setReputation(0);
        setFollowersCount(0);
        setFollowingCount(0);
      }
    };

    loadUserData();
    return () => { cancelled = true; };
  }, [user?.id, initialLoad]);

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    const meta = user.user_metadata || {};
    const fallbackUsername = meta.full_name?.replace(/\s+/g, '_').toLowerCase() || (user.email || 'builder').split('@')[0];
    const fallbackAvatar = meta.avatar_url || meta.picture || '';

    if (!data) {
      const { data: createdProfile } = await supabase.from('profiles').upsert({
        id: user.id,
        username: fallbackUsername,
        avatar_url: fallbackAvatar,
        reputation: 0
      }).select().single();
      
      setUsername(createdProfile?.username || fallbackUsername);
      setBio(createdProfile?.bio || '');
      setReputation(Number(createdProfile?.reputation) || 0);
      setAvatarUrl(createdProfile?.avatar_url || fallbackAvatar);
      return;
    }
    setUsername(data.username || fallbackUsername);
    setBio(data.bio || '');
    setReputation(Number(data.reputation) || 0);
    setAvatarUrl(data.avatar_url || fallbackAvatar);
  };

  const fetchFollowCounts = async () => {
    if (!user?.id) return;
    const [followersResult, followingResult] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
    ]);
    setFollowersCount(followersResult.count || 0);
    setFollowingCount(followingResult.count || 0);
  };

  const fetchPosts = async () => {
    const { data: rows } = await supabase.from('posts').select('id, user_id, caption, post_type, media_url, media_type, created_at').order('created_at', { ascending: false });
    if (!rows) return;
    const userIds = [...new Set(rows.map(post => post.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase.from('profiles').select('id, username, bio, reputation, avatar_url').in('id', userIds);
      profileMap = Object.fromEntries((profilesData || []).map(p => [p.id, p]));
    }
    setPosts(rows.map(post => ({ ...post, profiles: profileMap[post.user_id] || null })));
  };

  const fetchUserLikes = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
    setUserLikes((data || []).map(row => row.post_id));
  };

  // GOOGLE OAUTH AUTHENTICATION
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : '',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        setAuthMessage(error.message);
        setAuthMessageType('error');
      }
    } catch (err) {
      setAuthMessage('An error occurred during Google Sign-In.');
      setAuthMessageType('error');
    }
  };

  // EMAIL AUTHENTICATION
  const handleSignIn = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthMessage(error.message); setAuthMessageType('error'); return; }
    setShowAuthModal(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setAuthMessage(error.message); setAuthMessageType('error'); return; }
    if (data?.user) await supabase.from('profiles').upsert({ id: data.user.id, username: email.split('@')[0], reputation: 0 });
    setAuthMessage('Account created.'); setAuthMessageType('success');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowAuthModal(true);
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this broadcast?')) return;
    await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleStartEdit = (post) => {
    setEditingPostId(post.id);
    setEditCaption(post.caption || '');
  };

  const handleSaveEdit = async (postId) => {
    if (!editCaption.trim()) return alert('Caption cannot be empty.');
    await supabase.from('posts').update({ caption: editCaption.trim() }).eq('id', postId).eq('user_id', user.id);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, caption: editCaption.trim() } : p));
    setEditingPostId(null);
    setEditCaption('');
  };

  const toggleComments = async (postId) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }
    setActiveCommentPostId(postId);
    const { data } = await supabase.from('comments').select('id, user_id, comment_text, created_at, profiles(username, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true });
    setCommentsMap(prev => ({ ...prev, [postId]: data || [] }));
  };

  const handleReplyToUser = (username) => {
    setCommentInput(`@${username} `);
    document.getElementById('replyInput')?.focus();
  };

  const handleAddComment = async (postId) => {
    if (!user?.id) return setShowAuthModal(true);
    if (!commentInput.trim()) return;

    const { data, error } = await supabase.from('comments').insert({
      post_id: postId, user_id: user.id, comment_text: commentInput.trim(),
    }).select('id, user_id, comment_text, created_at, profiles(username, avatar_url)').single();

    if (error) return alert(`Could not post reply: ${error.message}`);
    setCommentsMap(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data] }));
    setCommentInput('');
  };

  const handleOpenAuthorProfile = async (authorProfile) => {
    if (!authorProfile) return;
    setSelectedProfile(authorProfile);
    if (user?.id && authorProfile.id !== user.id) {
      const { data } = await supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', authorProfile.id).maybeSingle();
      setIsFollowingSelected(!!data);
    } else {
      setIsFollowingSelected(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user?.id) return setShowAuthModal(true);
    if (!selectedProfile?.id || selectedProfile.id === user.id) return;

    if (isFollowingSelected) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', selectedProfile.id);
      setIsFollowingSelected(false);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: selectedProfile.id });
      setIsFollowingSelected(true);
    }
    fetchFollowCounts();
  };

  const processImageTo500 = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 500;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const scale = Math.max(size / img.width, size / img.height);
        const x = (size / scale - img.width) / 2;
        const y = (size / scale - img.height) / 2;
        
        ctx.drawImage(img, x, y, img.width, img.height, 0, 0, img.width * scale, img.height * scale);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const processVideoTo60s = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.crossOrigin = 'anonymous';
      
      video.onloadedmetadata = () => {
        if (video.duration <= 60) {
          resolve(file);
          return;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks = [];
        
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(new File([blob], 'trimmed_video.webm', { type: 'video/webm' }));
        };

        video.play();
        recorder.start();

        const drawFrame = () => {
          if (video.paused || video.ended) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        };
        drawFrame();

        setTimeout(() => {
          video.pause();
          recorder.stop();
        }, 60000);
      };
      video.onerror = () => reject(new Error("Video processing failed"));
    });
  };

  const handleMediaSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessingMedia(true);
    try {
      if (file.type.startsWith('image/')) {
        const croppedImage = await processImageTo500(file);
        clearMediaPreview();
        setMediaFile(croppedImage);
        setMediaType('image');
        setMediaPreview(URL.createObjectURL(croppedImage));
      } else if (file.type.startsWith('video/')) {
        const trimmedVideo = await processVideoTo60s(file);
        clearMediaPreview();
        setMediaFile(trimmedVideo);
        setMediaType('video');
        setMediaPreview(URL.createObjectURL(trimmedVideo));
      } else {
        alert('Please select an image or video file.');
      }
    } catch (err) {
      alert("Error processing media.");
    } finally {
      setIsProcessingMedia(false);
    }
  };

  const clearMediaPreview = () => {
    if (mediaPreview?.startsWith('blob:')) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const croppedImage = await processImageTo500(file);
    setAvatarFile(croppedImage);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    let finalAvatarUrl = avatarUrl;
    try {
      if (avatarFile) {
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const { error } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
        if (error) throw error;
        finalAvatarUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data?.publicUrl || finalAvatarUrl;
      }
      await supabase.from('profiles').upsert({ id: user.id, username: username.trim(), bio: bio.trim(), avatar_url: finalAvatarUrl });
      setAvatarUrl(finalAvatarUrl);
      setAvatarFile(null);
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user?.id) return setShowAuthModal(true);
    if (!postText.trim() && !mediaFile) return alert('Broadcast content or media cannot be empty.');

    setUploading(true);
    try {
      let mediaUrl = null;
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop()?.toLowerCase() || 'bin';
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        const { error } = await supabase.storage.from('posts').upload(`post-media/${fileName}`, mediaFile);
        if (error) throw error;
        mediaUrl = supabase.storage.from('posts').getPublicUrl(`post-media/${fileName}`).data?.publicUrl;
      }
      await supabase.from('posts').insert({ user_id: user.id, caption: postText.trim(), post_type: composerType, media_url: mediaUrl, media_type: mediaUrl ? mediaType : null });
      
      await Promise.all([fetchPosts(), fetchUserProfile()]);
      setPostText('');
      clearMediaPreview();
      alert('Broadcast published!');
    } catch (error) {
      alert(error?.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user?.id) return setShowAuthModal(true);
    const isLiked = userLikes.includes(postId);
    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
      setUserLikes(prev => prev.filter(id => id !== postId));
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
      setUserLikes(prev => [...prev, postId]);
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatHistory(prev => [...prev, { sender: 'me', text: chatInput.trim(), time: 'Just now' }]);
    setChatInput('');
  };

  if (initialLoad) return <div style={{ backgroundColor: '#030008', height: '100vh' }}></div>;

  return (
    <div style={styles.appWrapper}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background-color: #030008; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .desktop-only { display: flex; }
        .mobile-only { display: none; }
        .author-link { cursor: pointer; transition: opacity 0.2s; }
        .author-link:hover { opacity: 0.8; text-decoration: underline; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #3b0764; border-radius: 10px; }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          .responsive-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.brandGroup}>
          <h1 style={styles.logo}>BMAX</h1>
          <span style={styles.badge}>GLOBAL v2.7</span>
        </div>
        
        <nav style={styles.topNav} className="desktop-only">
          {['home', 'discover', 'create', 'messages', 'profile'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={activeTab === tab ? styles.activeNavBtn : styles.navBtn}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
        <div>
          {user && <button onClick={handleSignOut} style={styles.secondaryBtn}>Sign Out</button>}
        </div>
      </header>

      {/* PUBLIC PROFILE MODAL */}
      {selectedProfile && (
        <div style={styles.modalOverlay} onClick={() => setSelectedProfile(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc' }}>👤 Public Profile</h3>
              <button onClick={() => setSelectedProfile(null)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
              {selectedProfile.avatar_url ? <img src={selectedProfile.avatar_url} alt="Avatar" style={styles.avatarImg} /> : <div style={styles.avatar}>👤</div>}
              <div>
                <h3 style={{ margin: 0, color: '#c084fc' }}>@{selectedProfile.username}</h3>
                <p style={{ margin: '4px 0', fontSize: '13px', color: '#94a3b8' }}>{selectedProfile.bio}</p>
              </div>
            </div>
            {user?.id !== selectedProfile.id && (
              <button onClick={handleToggleFollow} style={{ ...styles.primaryBtn, width: '100%', backgroundColor: isFollowingSelected ? '#374151' : '#7e22ce' }}>
                {isFollowingSelected ? '✓ Following' : '➕ Follow Broadcaster'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* FORCED AUTH MODAL WITH GOOGLE AUTH */}
      {showAuthModal && (
        <div style={{ ...styles.modalOverlay, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(3,0,8,0.95)' }}>
          <div style={{ ...styles.modalContent, border: '2px solid #7e22ce' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{ ...styles.logo, fontSize: '32px' }}>BMAX</h1>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Global Builder Ecosystem</p>
            </div>
            <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: '18px', textAlign: 'center' }}>
              {authMode === 'signin' ? 'Sign In to Proceed' : 'Create your Account'}
            </h3>
            {authMessage && <div style={authMessageType === 'error' ? styles.errorBox : styles.successBox}>{authMessage}</div>}
            
            {/* GOOGLE SIGN IN BUTTON */}
            <button type="button" onClick={handleGoogleSignIn} style={styles.googleBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>

            <div style={styles.divider}>
              <span style={styles.dividerText}>OR</span>
            </div>

            <form style={styles.authForm}>
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
              <button type="button" onClick={authMode === 'signin' ? handleSignIn : handleSignUp} style={{ ...styles.primaryBtn, width: '100%', marginTop: '8px' }}>
                {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>
            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
              {authMode === 'signin' ? <span>No account? <a href="#" onClick={() => setAuthMode('signup')} style={{ color: '#c084fc' }}>Sign Up</a></span> : <span>Have an account? <a href="#" onClick={() => setAuthMode('signin')} style={{ color: '#c084fc' }}>Sign In</a></span>}
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW */}
      <div style={styles.layoutContainer} className="responsive-grid">
        {activeTab === 'profile' ? (
          <main style={{ gridColumn: '1 / -1', maxWidth: '700px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={styles.card}>
              <div style={styles.profileHeader}>
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={styles.avatarImg} /> : <div style={styles.avatar}>👤</div>}
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, color: '#f8fafc' }}>@{username || user?.email}</h2>
                  <p style={{ color: '#94a3b8', fontSize: '13px' }}>{bio || 'No bio configured yet.'}</p>
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
                  <textarea placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} style={{ ...styles.textArea, minHeight: '60px' }} />
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Profile Photo (Auto-crops to 500x500):
                    <input type="file" accept="image/*" onChange={handleAvatarSelect} style={{ ...styles.input, marginTop: '4px' }} />
                  </label>
                  <button onClick={handleSaveProfile} style={{ ...styles.primaryBtn, marginTop: '8px' }}>Save Profile</button>
                </div>
              )}
            </div>

            {/* BROADCAST COMPOSER */}
            <div style={styles.card}>
              <h3 style={{ margin: '0 0 12px 0', color: '#c084fc', fontSize: '16px' }}>📡 Broadcast New Post</h3>
              <form onSubmit={handleCreatePost} style={styles.composerForm}>
                <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Share a project update..." style={styles.textArea} />
                {isProcessingMedia && <div style={{ fontSize: '12px', color: '#fbbf24' }}>Processing media (Cropping/Trimming)...</div>}
                {mediaPreview && (
                  <div style={styles.previewContainer}>
                    {mediaType === 'image' ? <img src={mediaPreview} alt="Preview" style={styles.mediaPreview} /> : <video src={mediaPreview} controls style={styles.mediaPreview} />}
                    <button type="button" onClick={clearMediaPreview} style={styles.removeMediaBtn}>✕</button>
                  </div>
                )}
                <div style={styles.composerFooter}>
                  <label style={styles.iconBtn}>
                    📷 Attach Media (Auto-trim video to 60s)
                    <input type="file" accept="image/*,video/*" onChange={handleMediaSelect} style={{ display: 'none' }} />
                  </label>
                  <button type="submit" disabled={uploading || isProcessingMedia} style={styles.broadcastBtn}>
                    {uploading ? 'Publishing...' : '📡 Broadcast'}
                  </button>
                </div>
              </form>
            </div>
          </main>
        ) : activeTab === 'messages' ? (
          <main style={{ gridColumn: '1 / -1', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div style={styles.card}>
              {activeChat ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
                  <button onClick={() => setActiveChat(null)} style={{ ...styles.actionBtn, marginBottom: '8px' }}>← Back</button>
                  <h4 style={{ margin: '0 0 12px 0', color: '#fbbf24' }}>Chat with @{activeChat}</h4>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '10px' }}>
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} style={{ alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start', backgroundColor: msg.sender === 'me' ? '#7e22ce' : '#1e1b4b', padding: '8px 12px', borderRadius: '8px', maxWidth: '70%' }}>
                        <p style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'flex-end' }}>
                    <textarea 
                      placeholder="Write a message... (Shift+Enter for new line)" 
                      value={chatInput} 
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleChatKeyDown}
                      style={{ ...styles.textArea, minHeight: '40px', flex: 1, padding: '10px' }} 
                    />
                    <button onClick={handleSendMessage} style={{ ...styles.primaryBtn, height: '40px' }}>Send</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#f8fafc' }}>💬 Direct Messages</h3>
                  {conversations.map(conv => (
                    <div key={conv.id} onClick={() => setActiveChat(conv.user)} style={styles.conversationCard}>
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
          /* HOME FEED */
          <>
            <main style={styles.feedColumn}>
              <div style={styles.filterRow}>
                {['for you', 'following', 'trending', 'ai labs'].map((filter) => (
                  <button key={filter} onClick={() => setFeedFilter(filter)} style={feedFilter === filter ? styles.activeFilterChip : styles.filterChip}>
                    {filter}
                  </button>
                ))}
              </div>

              <div style={styles.streamContainer}>
                {posts.map((post) => {
                  const isLiked = userLikes.includes(post.id);
                  const isAuthor = user?.id === post.user_id;
                  const isEditing = editingPostId === post.id;
                  const isCommentsOpen = activeCommentPostId === post.id;
                  const postComments = commentsMap[post.id] || [];

                  return (
                    <div key={post.id} style={styles.postCard}>
                      <div style={styles.postHeader}>
                        <div className="author-link" onClick={() => handleOpenAuthorProfile(post.profiles)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="Avatar" style={styles.feedAvatarImg} /> : <div style={styles.feedAvatar}>👤</div>}
                          <span style={styles.username}>@{post.profiles?.username || 'builder'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isAuthor && !isEditing && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => handleStartEdit(post)} style={styles.iconActionBtn}>✏️</button>
                              <button onClick={() => handleDeletePost(post.id)} style={styles.iconActionBtn}>🗑️</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <textarea value={editCaption} onChange={(e) => setEditCaption(e.target.value)} style={styles.textArea} />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditingPostId(null)} style={styles.secondaryBtn}>Cancel</button>
                            <button onClick={() => handleSaveEdit(post.id)} style={styles.primaryBtn}>Save</button>
                          </div>
                        </div>
                      ) : (
                        <p style={styles.postContent}>{post.caption}</p>
                      )}

                      {post.media_url && (
                        <div style={styles.mediaWrapper}>
                          {post.media_type === 'image' ? <img src={post.media_url} style={styles.postMedia} /> : <video src={post.media_url} controls style={styles.postMedia} />}
                        </div>
                      )}

                      <div style={styles.postActions}>
                        <button onClick={() => handleLike(post.id)} style={styles.actionBtn}>{isLiked ? '❤️ Liked' : '🤍 Like'}</button>
                        <button onClick={() => toggleComments(post.id)} style={styles.actionBtn}>
                          💬 Reply {postComments.length > 0 ? `(${postComments.length})` : ''}
                        </button>
                      </div>

                      {isCommentsOpen && (
                        <div style={styles.commentsContainer}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                            {postComments.map((c) => (
                              <div key={c.id} style={styles.commentItem}>
                                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="author-link" onClick={() => handleOpenAuthorProfile(c.profiles)} style={{ fontWeight: 'bold', color: '#c084fc', fontSize: '12px' }}>
                                      @{c.profiles?.username}:
                                    </span>
                                    <button onClick={() => handleReplyToUser(c.profiles?.username)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}>Reply</button>
                                  </div>
                                  <div style={{ fontSize: '13px', color: '#f8fafc', marginTop: '4px' }}>{c.comment_text}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input id="replyInput" type="text" placeholder="Write a reply..." value={commentInput} onChange={(e) => setCommentInput(e.target.value)} style={{ ...styles.input, flex: 1 }} />
                            <button onClick={() => handleAddComment(post.id)} style={styles.primaryBtn}>Post</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </main>

            {/* SIDEBAR WITH GOOGLE SIGN IN */}
            <aside style={styles.sidebarColumn} className="desktop-only">
              <div style={styles.card}>
                <h3 style={styles.sidebarTitle}>Join BMAX Global</h3>
                {!user ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button type="button" onClick={handleGoogleSignIn} style={styles.googleBtn}>
                      <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Continue with Google
                    </button>
                    <div style={styles.divider}>
                      <span style={styles.dividerText}>OR</span>
                    </div>
                    <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleSignIn} style={{ ...styles.primaryBtn, flex: 1 }}>Sign In</button>
                      <button onClick={handleSignUp} style={{ ...styles.secondaryBtn, flex: 1 }}>Sign Up (0 Rep)</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: '#fbbf24', fontWeight: 'bold', margin: '0 0 8px 0' }}>@{username || user?.email}</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Authenticated via Supabase</p>
                  </div>
                )}
              </div>
            </aside>
          </>
        )}
      </div>
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
  closeBtn: { backgroundColor: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }
};
