'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dcdvbglobtmeppfceapj.supabase.co';
const supabaseAnonKey = 'sb_publishable_mzHTU0PoV5vmNeVUFG2eqw_-OWu0a0-1';
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
 const [avatarFile, setAvatarFile] = useState(null);
 const [bio, setBio] = useState('');
 const [avatarUrl, setAvatarUrl] = useState('');
 const [reputation, setReputation] = useState(0);
 const [isEditingProfile, setIsEditingProfile] = useState(false);
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
   { id: 2, text: 'Your profile is ready to customize.', read: false }
 ]);

 const [hubs, setHubs] = useState([
   { id: 'web', name: 'Web Builders', description: 'Build, ship and discuss modern websites.', members: 1284, joined: false, icon: '■' },
   { id: 'ai', name: 'AI Labs', description: 'AI tools, workflows, experiments and ideas.', members: 962, joined: false, icon: '■' },
   { id: 'design', name: 'Design Studio', description: 'UI/UX, branding, graphics and creative work.', members: 741, joined: false, icon: '■' },
   { id: 'growth', name: 'Creators & Growth', description: 'Marketing, personal brands and creator economy.', members: 523, joined: false, icon: '■' }
 ]);
 const [hubSearch, setHubSearch] = useState('');
 const [selectedHub, setSelectedHub] = useState(null);
 const [challengeJoined, setChallengeJoined] = useState(false);
 const [toast, setToast] = useState('');

 const showToast = (message) => {
   setToast(message);
   window.clearTimeout(window._bmaxToastTimer);
   window._bmaxToastTimer = window.setTimeout(() => setToast(''), 2500);
 };

 const fetchPosts = async () => {
   const { data, error } = await supabase
     .from('posts')
     .select('*, profiles (username, avatar_url)')
     .order('created_at', { ascending: false });

   if (!error && data) {
     setPosts(data);
   }
 };

 useEffect(() => {
   fetchPosts();
 }, []);

 const markNotificationsRead = () => {
   setNotifications(prev => prev.map(n => ({ ...n, read: true })));
 };

 const toggleHubJoin = (hubId) => {
   setHubs(prev => prev.map(h => h.id === hubId ? { ...h, joined: !h.joined, members: h.members + (!h.joined ? 1 : -1) } : h));
   const hub = hubs.find(h => h.id === hubId);
   if (hub) showToast(hub.joined ? `Left ${hub.name}` : `Joined ${hub.name}`);
 };

 const handleSearchSubmit = (e) => {
   e.preventDefault();
   if (!searchQuery.trim()) return;
   setActiveTab('discover');
 };

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

 const MAX_IMAGE_UPLOAD_BYTES = 800 * 1024;
 const MAX_IMAGE_INPUT_BYTES = 25 * 1024 * 1024;

 const blobToFile = (blob, originalName) => {
   const baseName = originalName.replace(/\.[^/.]+$/, '') || 'bmax-image';
   const extension = blob.type === 'image/webp' ? '.webp' : '.jpg';
   return new File([blob], `${baseName}${extension}`, {
     type: blob.type,
     lastModified: Date.now(),
   });
 };

 const loadImageElement = (file) => new Promise((resolve, reject) => {
   const objectUrl = URL.createObjectURL(file);
   const image = new Image();
   image.onload = () => {
     URL.revokeObjectURL(objectUrl);
     resolve(image);
   };
   image.onerror = () => {
     URL.revokeObjectURL(objectUrl);
     reject(new Error('This image format could not be processed by your browser.'));
   };
   image.src = objectUrl;
 });

 const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
   canvas.toBlob((blob) => {
     if (blob) resolve(blob);
     else reject(new Error('The browser could not compress this image.'));
   }, type, quality);
 });

 const compressImageForStorage = async (file) => {
   if (!file || !file.type.startsWith('image/')) {
     throw new Error('Only image/photo uploads are supported.');
   }
   if (file.size > MAX_IMAGE_INPUT_BYTES) {
     throw new Error('Images must be 25MB or smaller before compression.');
   }
   if (file.size <= MAX_IMAGE_UPLOAD_BYTES) {
     return file;
   }

   const image = await loadImageElement(file);
   const sourceWidth = image.naturalWidth || image.width;
   const sourceHeight = image.naturalHeight || image.height;

   if (!sourceWidth || !sourceHeight) {
     throw new Error('The selected image has invalid dimensions.');
   }

   const supportsWebP = (() => {
     const testCanvas = document.createElement('canvas');
     return testCanvas.toDataURL('image/webp').startsWith('data:image/webp');
   })();

   const outputType = supportsWebP ? 'image/webp' : 'image/jpeg';
   const maxDimension = 2560;
   let scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));

   for (let attempt = 0; attempt < 10; attempt += 1) {
     const width = Math.max(1, Math.round(sourceWidth * scale));
     const height = Math.max(1, Math.round(sourceHeight * scale));

     const canvas = document.createElement('canvas');
     canvas.width = width;
     canvas.height = height;

     const context = canvas.getContext('2d', { alpha: outputType === 'image/webp' });
     if (!context) {
       throw new Error('Image processing is not supported on this device.');
     }

     context.imageSmoothingEnabled = true;
     context.imageSmoothingQuality = 'high';

     if (outputType === 'image/jpeg') {
       context.fillStyle = '#ffffff';
       context.fillRect(0, 0, width, height);
     }

     context.drawImage(image, 0, 0, width, height);
     const qualities = [0.88, 0.82, 0.76, 0.70, 0.64, 0.58, 0.52, 0.46];

     for (const quality of qualities) {
       const blob = await canvasToBlob(canvas, outputType, quality);
       if (blob.size <= MAX_IMAGE_UPLOAD_BYTES) {
         return blobToFile(blob, file.name);
       }
     }
     scale *= 0.82;
   }
   throw new Error('This image could not be compressed below 800 KB. Please choose a smaller image.');
 };

 const uploadToImageKit = async (file, userId) => {
   if (!file) return null;
   if (!userId) throw new Error('You must be signed in to upload an image.');

   const compressedFile = await compressImageForStorage(file);
   const authResponse = await fetch('/api/imagekit-auth');
   if (!authResponse.ok) {
     const text = await authResponse.text();
     console.error('ImageKit auth route failed:', authResponse.status, text);
     throw new Error('Image upload auth failed (ImageKit).');
   }

   const auth = await authResponse.json();
   if (auth?.error) {
     console.error('ImageKit auth payload error:', auth);
     throw new Error(auth.error);
   }

   if (!auth?.token || !auth?.signature || !auth?.expire || !auth?.publicKey) {
     console.error('ImageKit auth missing fields:', auth);
     throw new Error('Image upload auth is missing required fields.');
   }

   const formData = new FormData();
   formData.append('file', compressedFile);
   formData.append('fileName', `${crypto.randomUUID()}${compressedFile.type === 'image/webp' ? '.webp' : '.jpg'}`);
   formData.append('token', auth.token);
   formData.append('signature', auth.signature);
   formData.append('expire', String(auth.expire));
   formData.append('publicKey', auth.publicKey);
   formData.append('folder', `/bmax/images/${userId}`);

   const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
     method: 'POST',
     body: formData,
   });

   if (!uploadResponse.ok) {
     const errorText = await uploadResponse.text();
     console.error('ImageKit upload failed:', uploadResponse.status, errorText);
     throw new Error('Image upload failed. Please try again.');
   }

   const result = await uploadResponse.json();
   return {
     ...result,
     fileType: 'image',
     uploadedSize: compressedFile.size,
   };
 };

 const handleCreatePost = async (e) => {
   e.preventDefault();
   if (!postText.trim() && !mediaFile) return;

   const { data: { session }, error: sessionError } = await supabase.auth.getSession();
   if (sessionError || !session?.user) {
     console.error('SESSION ERROR:', sessionError);
     showToast('Please sign in before posting');
     return;
   }

   setUploading(true);
   try {
     let uploadedMedia = null;
     if (mediaFile) {
       uploadedMedia = await uploadToImageKit(mediaFile, session.user.id);
     }

     const insertPayload = {
       user_id: session.user.id,
       caption: postText.trim(),
       post_type: composerType,
       media_url: uploadedMedia?.url || null,
       media_type: uploadedMedia?.fileType || (mediaFile ? mediaType : null),
     };

     const { data, error } = await supabase
       .from('posts')
       .insert(insertPayload)
       .select('*, profiles(username, avatar_url)')
       .single();

     if (error) {
       console.error('CREATE POST ERROR (Supabase):', error);
       showToast(error.message || 'Failed to create post');
       return;
     }

     setPosts((currentPosts) => [data, ...currentPosts]);
     setPostText('');
     clearMediaPreview();
     showToast('Post published!');
   } catch (error) {
     console.error('POST ERROR (general):', error);
     showToast(error.message || 'Failed to create post');
   } finally {
     setUploading(false);
   }
 };

 const handleStartEdit = (post) => {
   setEditingPostId(post.id);
   setEditCaption(post.caption);
 };

 const handleSaveEdit = async (postId) => {
   const { error } = await supabase
     .from('posts')
     .update({ caption: editCaption })
     .eq('id', postId);

   if (error) {
     showToast('Failed to update post');
     return;
   }

   setPosts(posts.map(p => p.id === postId ? { ...p, caption: editCaption } : p));
   setEditingPostId(null);
   showToast('Post updated');
 };

 const handleDeletePost = async (postId) => {
   const { error } = await supabase
     .from('posts')
     .delete()
     .eq('id', postId);

   if (error) {
     showToast('Failed to delete post');
     return;
   }

   setPosts(posts.filter(p => p.id !== postId));
   showToast('Post deleted');
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

 const handleMediaSelect = async (e) => {
   const file = e.target.files?.[0];
   e.target.value = '';
   if (!file) return;

   if (!file.type.startsWith('image/')) {
     showToast('BMAX supports photo/image uploads only.');
     return;
   }

   if (file.size > MAX_IMAGE_INPUT_BYTES) {
     showToast('Image is larger than 25MB. Please choose a smaller image.');
     return;
   }

   setIsProcessingMedia(true);
   try {
     const compressedFile = await compressImageForStorage(file);
     const previewUrl = URL.createObjectURL(compressedFile);
     setMediaFile(compressedFile);
     setMediaType('image');
     setMediaPreview(previewUrl);

     const originalKb = Math.round(file.size / 1024);
     const finalKb = Math.round(compressedFile.size / 1024);
     if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
       showToast(`Image optimized: ${originalKb}KB → ${finalKb}KB`);
     }
   } catch (error) {
     console.error('IMAGE PROCESSING ERROR:', error);
     showToast(error.message || 'Could not process this image.');
     clearMediaPreview();
   } finally {
     setIsProcessingMedia(false);
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
   ['home', '■', 'Home'],
   ['create', '■', 'Create'],
   ['discover', '■', 'Discover'],
   ['hubs', '■', 'Hubs'],
   ['messages', '■', 'Messages'],
   ['profile', '■', 'Profile']
 ];

 const PageTitle = ({ title, subtitle, action }) => (
   <div style={styles.pageTitleRow}>
     <div>
       <h2 style={styles.pageTitle}>{title}</h2>
       {subtitle && <p style={styles.pageSubtitle}>{subtitle}</p>}
     </div>
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
         <span>■</span>
         <input
           value={searchQuery}
           onChange={e => setSearchQuery(e.target.value)}
           placeholder="Search BMAX..."
           style={styles.searchInput}
         />
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
         <h3 style={styles.sectionTitle}>Trending posts</h3>
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
           {post.media_url && (
             <img src={post.media_url} alt="Post" style={styles.postMedia} loading="lazy" />
           )}
           <div style={styles.postActions}>
             <button onClick={() => handleLike(post.id)} style={styles.actionBtn}>
               {userLikes.includes(post.id) ? '❤■ Liked' : '■ Like'}
             </button>
             <button onClick={() => { setActiveTab('home'); setActiveCommentPostId(post.id); }} style={styles.actionBtn}>Reply</button>
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
             Create Hub
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
             <div style={styles.hubMeta}><span>{hub.members.toLocaleString()} members</span><span>Public</span></div>
             <div style={{ display: 'flex', gap: '8px' }}>
               <button onClick={() => setSelectedHub(hub)} style={{ ...styles.secondaryBtn, flex: 1 }}>Open Hub</button>
               <button onClick={() => toggleHubJoin(hub.id)} style={{ ...styles.primaryBtn, flex: 1 }}>{hub.joined ? 'Joined' : 'Join'}</button>
             </div>
           </div>
         ))}
       </div>
       {selectedHub && (
         <div style={styles.modaloverlay} onClick={() => setSelectedHub(null)}>
           <div style={styles.largeModal} onClick={e => e.stopPropagation()}>
             <div style={styles.modalTop}>
               <div>
                 <div style={styles.hubIcon}>{selectedHub.icon}</div>
                 <h2 style={styles.pageTitle}>{selectedHub.name}</h2>
                 <p style={styles.pageSubtitle}>{selectedHub.description}</p>
               </div>
               <button onClick={() => setSelectedHub(null)} style={styles.closeBtn}>X</button>
             </div>
             <div style={styles.hubHero}><strong>{selectedHub.members.toLocaleString()} builders</strong><span>•</span><span>Public community</span></div>
             <div style={styles.placeholderPanel}>
               <div style={{ fontSize: 32 }}>■</div>
               <h3>Hub feed ready</h3>
               <p>Members can post projects, ask questions and collaborate here. This frontend is wired for Supabase hub tables.</p>
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
     <PageTitle title="Create" subtitle="Turn an idea into a post and start building your reputation." />
     <div style={styles.createGrid}>
       <div style={styles.card}>
         <div style={styles.createIcon}>■</div>
         <h3>Post</h3>
         <p>Share an update, project, question or photo with the BMAX community.</p>
         <button onClick={() => setActiveTab('profile')} style={styles.primaryBtn}>Create Post</button>
       </div>
       <div style={styles.card}>
         <div style={styles.createIcon}>■</div>
         <h3>Challenge</h3>
         <p>Join a public challenge, build something and earn reputation through your contribution.</p>
         <button onClick={() => { setChallengeJoined(true); showToast('You joined the BMAX Builder Challenge'); }} style={styles.primaryBtn}>
           {challengeJoined ? 'Joined Challenge' : 'Join Challenge'}
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
         {challengeJoined ? 'Joined' : 'Join Challenge!'}
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
       html {
         scroll-behavior: smooth;
         width: 100%;
         min-width: 0;
       }
       body {
         margin: 0;
         padding: 0;
         width: 100%;
         min-width: 0;
         min-height: 100vh;
         min-height: 100svh;
         background-color: #030008;
         color: #f8fafc;
         font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
         overflow-x: hidden;
       }
       button, input, textarea { font: inherit; max-width: 100%; }
       button { transition: transform 0.15s ease, opacity 0.15s ease, border-color 0.15s ease, background 0.15s ease; }
       button:active { transform: translateY(1px); }
       button:disabled { opacity: 0.55; cursor: not-allowed; }
       img { max-width: 100%; height: auto; }
       .author-link { cursor: pointer; transition: opacity 0.2s; }
       .author-link:hover { opacity: 0.8; text-decoration: underline; }
       ::-webkit-scrollbar { width: 6px; height: 6px; }
       ::-webkit-scrollbar-thumb { background: #3b0764; border-radius: 10px; }
       @media (max-width: 1100px) {
         .layoutContainer { max-width: 100%; }
       }
       @media (max-width: 900px) {
         .topicGrid, .hubGrid, .createGrid { grid-template-columns: 1fr !important; }
         .statsGrid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
         .layoutContainer { grid-template-columns: minmax(0, 1fr) !important; }
         .sidebarColumn { display: none !important; }
       }
       @media (max-width: 768px) {
         .responsive-grid { grid-template-columns: minmax(0, 1fr) !important; }
         .desktopNav { display: none !important; }
         .mobileNav { display: flex !important; }
         .headerSearch { display: none !important; }
         .appHeader {
           padding: 10px 12px !important;
           gap: 8px;
         }
         .headerRight .secondaryBtn { display: none !important; }
         .layoutContainer {
           padding: 16px 12px calc(88px + env(safe-area-inset-bottom)) !important;
           gap: 16px !important;
         }
         .card, .postCard, .profileCard { padding: 16px !important; }
         .profileHeader {
           align-items: flex-start !important;
           flex-wrap: wrap !important;
         }
         .profileHeader > button { width: 100%; }
         .challengeBanner {
           flex-direction: column !important;
           align-items: stretch !important;
         }
         .challengeBanner > button { width: 100%; }
       }
       @media (max-width: 480px) {
         .brandGroup { gap: 6px !important; }
         .logo { font-size: 21px !important; }
         .badge { display: none !important; }
         .pageTitle { font-size: clamp(22px, 7vw, 28px) !important; }
         .statsGrid { grid-template-columns: 1fr 1fr !important; }
         .postActions { gap: 10px !important; justify-content: space-between; }
         .postActions .actionBtn { padding: 6px 2px !important; }
         .composerFooter { gap: 8px; }
       }
       @media (max-width: 340px) {
         .statsGrid { grid-template-columns: 1fr !important; }
         .headerRight .bellBtn { display: none !important; }
         .mobileNav small { font-size: 9px !important; }
       }
       .appHeader { padding: 10px 14px !important; }
     `}</style>
     <header style={styles.header} className="appHeader">
       <button onClick={() => setActiveTab('home')} style={styles.brandButton}>
         <div style={styles.brandGroup}>
           <h1 style={styles.logo}>BMAX</h1>
           <span style={styles.badge}>GLOBAL v2.7</span>
         </div>
       </button>
       <form onSubmit={handleSearchSubmit} style={styles.headerSearch} className="headerSearch">
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
         <a
           href="/my-app.apk"
           download="BMAX.apk"
           style={{
             ...styles.primaryBtn,
             display: 'inline-flex',
             alignItems: 'center',
             gap: '6px',
             textDecoration: 'none',
           }}
         >
           <span>■</span> App (APK)
         </a>
         <button
           onClick={() => {
             markNotificationsRead();
             showToast(unreadCount ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} marked read` : 'No new notifications');
           }}
           style={styles.bellBtn}
         >
           ■
           {unreadCount > 0 && <span style={styles.notificationDot}>{unreadCount}</span>}
         </button>
         {user && <button onClick={handleSignOut} style={styles.secondaryBtn}>Sign Out</button>}
       </div>
     </header>

     <div style={styles.mobileNav} className="mobileNav">
       {navItems.map(([tab, icon, label]) => (
         <button key={tab} onClick={() => setActiveTab(tab)} style={activeTab === tab ? styles.mobileNavActive : styles.mobileNavBtn}>
           <span>{icon}</span>
           <small>{label}</small>
         </button>
       ))}
     </div>

     {selectedProfile && (
       <div style={styles.modaloverlay} onClick={() => setSelectedProfile(null)}>
         <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
             <h3 style={{ margin: 0 }}>Public Profile</h3>
             <button onClick={() => setSelectedProfile(null)} style={styles.closeBtn}>X</button>
           </div>
           <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
             {selectedProfile.avatar_url ? <img src={selectedProfile.avatar_url} alt="Avatar" style={styles.avatarImg} /> : <div style={styles.avatar}>■</div>}
             <div>
               <h3 style={{ margin: 0, color: '#c084fc' }}>@{selectedProfile.username}</h3>
               <p style={{ margin: '4px 0', fontSize: 13, color: '#94a3b8' }}>{selectedProfile.bio || 'BMAX builder'}</p>
               <p style={styles.miniText}>{Number(selectedProfile.reputation || 0).toLocaleString()} reputation</p>
             </div>
           </div>
           {user?.id !== selectedProfile.id && (
             <button onClick={handleToggleFollow} style={{ ...styles.primaryBtn, width: '100%', backgroundColor: isFollowingSelected ? '#374151' : '#7e22ce' }}>
               {isFollowingSelected ? 'Following' : 'Follow'}
             </button>
           )}
         </div>
       </div>
     )}

     {showAuthModal && (
       <div style={{ ...styles.modaloverlay, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(3,0,8,.95)' }}>
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
       {activeTab === 'discover' ? renderDiscover() :
        activeTab === 'hubs' ? renderHubs() :
        activeTab === 'create' ? renderCreate() :
        activeTab === 'profile' ? (
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
             <div style={styles.statsGrid} className="statsGrid">
               <div style={styles.statsCell}><strong>{reputation.toLocaleString()}</strong><span>Reputation</span></div>
               <div style={styles.statsCell}><strong>{followersCount}</strong><span>Followers</span></div>
               <div style={styles.statsCell}><strong>{followingCount}</strong><span>Following</span></div>
               <div style={styles.statsCell}><strong>{posts.filter(p => p.user_id === user?.id).length}</strong><span>Posts</span></div>
             </div>
             {isEditingProfile && (
               <div style={styles.editSection}>
                 <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={styles.input} />
                 <textarea placeholder="Bio" value={bio} onChange={e => setBio(e.target.value)} style={{ ...styles.textArea, minHeight: 80 }} />
                 <label style={styles.miniText}>Profile photo<input type="file" accept="image/*" onChange={handleAvatarSelect} style={{ ...styles.input, marginTop: 4 }} /></label>
                 <button onClick={handleSaveProfile} style={styles.primaryBtn}>Save Profile</button>
               </div>
             )}
           </div>
           <div style={styles.card}>
             <h3 style={styles.sectionTitle}>Create New Post</h3>
             <form onSubmit={handleCreatePost} style={styles.composerForm}>
               <textarea value={postText} onChange={e => setPostText(e.target.value)} placeholder="Share a project update..." style={styles.textArea} />
               {isProcessingMedia && <div style={styles.processing}>Processing media...</div>}
               {mediaPreview && (
                 <div style={styles.previewContainer}>
                   <img src={mediaPreview} alt="Preview" style={styles.mediaPreview} />
                   <button type="button" onClick={clearMediaPreview} style={styles.removeMediaBtn}>X</button>
                 </div>
               )}
               <div style={styles.composerFooter}>
                 <label style={styles.iconBtn}>Add Photo<input type="file" accept="image/*" onChange={handleMediaSelect} style={{ display: 'none' }} /></label>
                 <button type="submit" disabled={uploading || isProcessingMedia} style={styles.primaryBtn}>{uploading ? 'Publishing...' : 'Post'}</button>
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
                     <div key={idx} style={{ alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start', backgroundColor: msg.sender === 'me' ? '#7e22ce' : '#120b24', padding: '8px 12px', borderRadius: '8px' }}>
                       {msg.text}
                     </div>
                   ))
                 ) : (
                   <EmptyState icon="■" title="Start the conversation" text="Say hello and start collaborating." />
                 )}
                 <div ref={chatEndRef} />
               </div>
               <div style={{ display: 'flex', gap: 8 }}>
                 <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={handleChatKeyDown} placeholder="Write a message..." style={styles.textArea} />
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
                         <div className="author-link" onClick={() => handleOpenAuthorProfile(post.profiles)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                       {post.media_url && (
                         <img src={post.media_url} alt="Post" style={styles.postMedia} loading="lazy" />
                       )}
                       <div style={styles.postActions}>
                         <button onClick={() => handleLike(post.id)} style={styles.actionBtn}>
                           {isLiked ? '❤■ Liked' : '■ Like'}
                         </button>
                         <button onClick={() => toggleComments(post.id)} style={styles.actionBtn}>Reply {postComments.length ? `(${postComments.length})` : ''}</button>
                         <button onClick={() => { navigator.clipboard?.writeText(window.location.href); showToast('Link copied'); }} style={styles.actionBtn}>Share</button>
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
                             <input id="replyInput" value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="Write a reply..." style={styles.input} />
                             <button onClick={() => handleAddComment(post.id)} style={styles.primaryBtn}>Post</button>
                           </div>
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
             ) : (
               <EmptyState icon="■" title="No posts yet" text="Be one of the first builders to publish something on BMAX." />
             )}
           </main>
           <aside style={styles.sidebarColumn}>
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
                     <small style={styles.miniHubSmall}>{h.members.toLocaleString()} members</small>
                   </div>
                   <button onClick={() => setActiveTab('hubs')} style={styles.linkBtn}>View</button>
                 </div>
               ))}
             </div>
             <div style={styles.card}>
               <h3 style={styles.sidebarTitle}>Quick Create</h3>
               <button onClick={() => setActiveTab('create')} style={{ ...styles.primaryBtn, width: '100%' }}>Create something</button>
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
 appWrapper: { backgroundColor: '#030008', color: '#f8fafc', minHeight: '100vh', minHeight: '100svh', minHeight: '100dvh', paddingBottom: '80px', width: '100%' },
 header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '14px clamp(12px, 3vw, 28px)', backgroundColor: '#090514', borderBottom: '1px solid #1e1b4b' },
 brandGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
 logo: { margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '2px', color: '#c084fc' },
 badge: { backgroundColor: '#581c87', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', color: '#f8fafc', fontWeight: 'bold' },
 topNav: { display: 'flex', gap: '6px' },
 navBtn: { backgroundColor: 'transparent', border: 'none', color: '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
 activeNavBtn: { backgroundColor: '#1e1b4b', border: '1px solid #7e22ce', color: '#fbbf24', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
 layoutContainer: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 340px)', gap: 'clamp(14px, 2vw, 24px)', maxWidth: '1100px', margin: '0 auto', padding: '24px clamp(12px, 3vw, 24px)' },
 feedColumn: { display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' },
 sidebarColumn: { display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' },
 card: { backgroundColor: '#090514', border: '1px solid #1e1b4b', borderRadius: '16px', padding: '20px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
 postCard: { backgroundColor: '#090514', border: '1px solid #1e1b4b', borderRadius: '16px', padding: '20px', width: '100%' },
 composerForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
 textArea: { backgroundColor: '#030008', border: '1px solid #1e1b4b', borderRadius: '10px', color: '#fff', padding: '14px', resize: 'vertical', fontSize: '14px', width: '100%' },
 previewContainer: { position: 'relative', width: '100%', maxHeight: 'min(55vw, 420px)', minHeight: '120px', overflow: 'hidden', borderRadius: '10px' },
 mediaPreview: { width: '100%', height: 'auto', maxHeight: 'min(55vw, 420px)', objectFit: 'contain', display: 'block', margin: '0 auto' },
 removeMediaBtn: { position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' },
 composerFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
 iconBtn: { backgroundColor: '#120b24', border: '1px solid #1e1b4b', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', color: '#e879f9', fontSize: '13px' },
 filterRow: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' },
 filterChip: { backgroundColor: '#090514', color: '#94a3b8', border: '1px solid #1e1b4b', padding: '8px 16px', borderRadius: '14px', fontSize: '13px', cursor: 'pointer' },
 activeFilterChip: { backgroundColor: '#1e1b4b', color: '#fbbf24', border: '1px solid #fbbf24', padding: '8px 16px', borderRadius: '14px', fontSize: '13px', cursor: 'pointer' },
 streamContainer: { display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' },
 postHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
 feedAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1e1b4b', display: 'flex', justifyContent: 'center', alignItems: 'center' },
 feedAvatarImg: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' },
 username: { color: '#c084fc', fontWeight: 'bold', fontSize: '14px' },
 iconActionBtn: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.8 },
 postContent: { margin: '0 0 14px 0', lineHeight: 1.5, wordBreak: 'break-word', fontSize: '15px' },
 postMedia: { width: '100%', height: 'auto', maxHeight: 'min(70vh, 560px)', objectFit: 'contain', display: 'block', borderRadius: '12px', backgroundColor: '#030008' },
 postActions: { display: 'flex', gap: '20px', borderTop: '1px solid #1e1b4b', paddingTop: '12px' },
 actionBtn: { backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
 commentsContainer: { marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #1e1b4b' },
 commentItem: { backgroundColor: '#030008', padding: '8px 12px', borderRadius: '8px', border: '1px solid #120b24', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' },
 sidebarTitle: { margin: '0 0 12px 0', fontSize: '15px', color: '#f8fafc' },
 authForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
 input: { backgroundColor: '#030008', border: '1px solid #1e1b4b', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', width: '100%' },
 primaryBtn: { backgroundColor: '#7e22ce', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
 secondaryBtn: { backgroundColor: '#120b24', border: '1px solid #1e1b4b', color: '#fff', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
 googleBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', color: '#1f2937', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', width: '100%' },
 divider: { display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px 0', borderBottom: '1px solid #1e1b4b', position: 'relative' },
 dividerText: { backgroundColor: '#090514', padding: '0 8px', color: '#64748b', fontSize: '11px', position: 'relative', top: '1px' },
 errorBox: { backgroundColor: '#450a0a', color: '#fecaca', padding: '8px', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' },
 successBox: { backgroundColor: '#052e16', color: '#bbf7d0', padding: '8px', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' },
 profileHeader: { display: 'flex', gap: '20px', alignItems: 'center' },
 avatar: { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#1e1b4b', display: 'flex', justifyContent: 'center', alignItems: 'center' },
 avatarImg: { width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' },
 editSection: { marginTop: '16px', borderTop: '1px solid #1e1b4b', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
 conversationCard: { backgroundColor: '#030008', border: '1px solid #1e1b4b', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer', margin: '0 0 8px 0' },
 unreadBadge: { backgroundColor: '#7e22ce', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' },
 modaloverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' },
 modalContent: { backgroundColor: '#090514', border: '1px solid #7e22ce', borderRadius: '16px', padding: '30px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' },
 closeBtn: { backgroundColor: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' },
 brandButton: { background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' },
 headerRight: { display: 'flex', alignItems: 'center', gap: '8px' },
 headerSearch: { display: 'flex', alignItems: 'center', gap: '8px', background: '#030008', border: '1px solid #1e1b4b', borderRadius: '10px', padding: '6px 12px' },
 headerSearchInput: { flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 0, color: '#fff', fontSize: '13px' },
 bellBtn: { position: 'relative', background: '#120b24', border: '1px solid #1e1b4b', color: '#fff', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer' },
 notificationDot: { position: 'absolute', top: '-6px', right: '-6px', minWidth: '17px', height: '17px', borderRadius: '20px', background: '#fbbf24', color: '#090514', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' },
 mobileNav: { display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: '#090514', borderTop: '1px solid #1e1b4b', padding: '6px 8px calc(6px + env(safe-area-inset-bottom))' },
 mobileNavBtn: { flex: 1, background: 'transparent', border: 0, color: '#64748b', padding: '5px 2px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
 mobileNavActive: { flex: 1, background: '#1e1b4b', border: '1px solid #7e22ce', color: '#fbbf24', borderRadius: '8px', padding: '5px 2px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
 singleColumn: { gridColumn: '1 / -1', maxWidth: '900px', margin: '0 auto', width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' },
 pageTitleRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' },
 pageTitle: { margin: 0, fontSize: '28px', fontWeight: 850, letterSpacing: '-0.5px' },
 pageSubtitle: { margin: '6px 0 0', color: '#94a3b8', fontSize: '13px', lineHeight: 1.5 },
 searchBox: { display: 'flex', gap: '8px', alignItems: 'center', background: '#090514', border: '1px solid #1e1b4b', borderRadius: '14px', padding: '8px 14px' },
 searchInput: { flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 0, color: '#fff', padding: '8px' },
 topicGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
 topicCard: { background: '#090514', border: '1px solid #1e1b4b', borderRadius: '14px', color: '#fff', padding: '16px', textAlign: 'left', cursor: 'pointer' },
 linkBtn: { background: 'transparent', border: 0, color: '#c084fc', cursor: 'pointer', padding: '4px' },
 sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' },
 sectionTitle: { margin: 0, fontSize: '16px', color: '#f8fafc' },
 miniTag: { display: 'inline-flex', alignItems: 'center', background: '#1e1b4b', border: '1px solid #3b0764', color: '#c084fc', borderRadius: '999px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold' },
 hubGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' },
 hubCard: { background: '#090514', border: '1px solid #1e1b4b', borderRadius: '16px', padding: '18px' },
 hubIcon: { width: '48px', height: '48px', borderRadius: '13px', background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' },
 hubName: { margin: '0 0 5px', fontSize: '17px' },
 hubDescription: { color: '#94a3b8', minHeight: '42px', fontSize: '13px', lineHeight: 1.5, margin: 0 },
 hubMeta: { display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '11px', margin: '14px 0' },
 largeModal: { background: '#090514', border: '1px solid #7e22ce', borderRadius: '18px', padding: '24px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
 modalTop: { display: 'flex', justifyContent: 'space-between', gap: '16px' },
 hubHero: { display: 'flex', gap: '10px', color: '#94a3b8', borderTop: '1px solid #1e1b4b', borderBottom: '1px solid #1e1b4b', padding: '14px 0', margin: '16px 0' },
 placeholderPanel: { textAlign: 'center', padding: '36px 20px', border: '1px dashed #3b0764', borderRadius: '14px', background: '#030008' },
 createGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' },
 createIcon: { fontSize: '30px', marginBottom: '10px' },
 challengeBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: 'linear-gradient(135deg, #120b24, #1e1b4b)', border: '1px solid #7e22ce', borderRadius: '16px', padding: '20px' },
 profileCard: { background: '#090514', border: '1px solid #1e1b4b', borderRadius: '16px', padding: '20px' },
 statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '20px', borderTop: '1px solid #1e1b4b', paddingTop: '16px' },
 statsCell: { background: '#030008', borderRadius: '10px', padding: '12px', textAlign: 'center' },
 repNumber: { fontSize: '36px', fontWeight: 900, color: '#fbbf24', margin: '10px 0' },
 miniText: { color: '#64748b', fontSize: '11px', margin: '5px 0' },
 inlineLink: { background: 'transparent', border: 0, color: '#c084fc', cursor: 'pointer', padding: 0 },
 processing: { color: '#fbbf24', fontSize: '12px' },
 chatWindow: { height: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '9px', padding: '10px 0', marginBottom: '10px' },
 miniHub: { display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 0', borderBottom: '1px solid #1e1b4b' },
 miniHubText: { flex: 1 },
 miniHubSmall: { display: 'block', color: '#64748b', fontSize: '10px', marginTop: '2px' },
 emptyState: { textAlign: 'center', padding: '60px 20px', background: '#090514', border: '1px dashed #1e1b4b', borderRadius: '16px' },
 emptyIcon: { fontSize: '32px', marginBottom: '8px' },
 toast: { position: 'fixed', bottom: '26px', left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#f8fafc', color: '#090514', padding: '10px 18px', borderRadius: '30px', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }
};
