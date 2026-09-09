'use client';

import React, { useState, useEffect } from 'react';
import { 
  Home, Compass, PlusSquare, MessageSquare, User, Zap, Users, 
  ShieldCheck, Send, Repeat, Sparkles, Code, BarChart2, Globe, 
  Lock, Image, MapPin, Smile, Heart, MessageCircle, Share2, 
  MoreHorizontal, ChevronRight, Trophy, TrendingUp, Award, X
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function BmaxHome() {
  const [activeTab, setActiveTab] = useState('for-you');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Composer State
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('standard'); // 'standard', 'code', 'poll'
  const [locationTag, setLocationTag] = useState('Port Harcourt, NG');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [privacy, setPrivacy] = useState('public');
  const [isPosting, setIsPosting] = useState(false);

  // Interactive Feed State
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentsMap, setCommentsMap] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [remixModalPost, setRemixModalPost] = useState(null);
  const [remixNote, setRemixNote] = useState('');
  const [showReputationModal, setShowReputationModal] = useState(false);

  // Fetch posts safely from Supabase
  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          feed_type,
          city_tag,
          is_remix,
          created_at,
          user_id,
          profiles (
            username,
            full_name,
            avatar_url,
            city
          )
        `)
        .order('created_at', { ascending: false });

      if (activeTab !== 'for-you') {
        query = query.eq('feed_type', activeTab);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching posts, falling back to simple select:', error.message);
        // Fallback in case table relationship is missing
        const fallback = await supabase
          .from('posts')
          .select('id, content, feed_type, city_tag, is_remix, created_at, user_id')
          .order('created_at', { ascending: false });
        setPosts(fallback.data || []);
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching posts:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  // Handle Post Submission
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsPosting(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        alert('Please log in to share a post on Bmax!');
        setIsPosting(false);
        return;
      }

      const payload = {
        user_id: user.id,
        content: content,
        feed_type: activeTab === 'for-you' ? 'for-you' : activeTab,
        city_tag: locationTag,
      };

      const { error } = await supabase.from('posts').insert([payload]);

      if (error) {
        alert('Could not submit post: ' + error.message);
      } else {
        setContent('');
        setCodeSnippet('');
        setPollOptions(['', '']);
        setPostType('standard');
        fetchPosts();
      }
    } catch (err) {
      console.error('Post creation error:', err);
    } finally {
      setIsPosting(false);
    }
  };

  // Interaction Helpers
  const toggleLike = (postId) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleAddComment = (postId) => {
    if (!commentText.trim()) return;
    const current = commentsMap[postId] || [];
    setCommentsMap({
      ...commentsMap,
      [postId]: [...current, { id: Date.now(), user: 'You', text: commentText, date: 'Just now' }]
    });
    setCommentText('');
  };

  const handleRemixSubmit = async () => {
    if (!remixModalPost) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to remix!');
        return;
      }

      await supabase.from('posts').insert([{
        user_id: user.id,
        content: `Remixed @${remixModalPost.profiles?.username || 'builder'}: "${remixModalPost.content}"\n\n${remixNote}`,
        feed_type: activeTab === 'for-you' ? 'for-you' : activeTab,
        is_remix: true
      }]);

      setRemixModalPost(null);
      setRemixNote('');
      fetchPosts();
    } catch (err) {
      console.error('Remix error:', err);
    }
  };

  return (
    <div className="flex h-screen max-w-7xl mx-auto border-x border-slate-800 bg-slate-950 text-slate-100">
      
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white font-black text-2xl px-3 py-1 rounded-xl shadow-lg shadow-indigo-600/30">B</div>
            <h1 className="text-2xl font-black tracking-wider text-white">BMAX</h1>
          </div>

          <nav className="space-y-3">
            <button className="flex items-center space-x-3 text-indigo-400 font-semibold w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 transition">
              <Home size={20} />
              <span>Home</span>
            </button>
            <button className="flex items-center space-x-3 text-slate-400 hover:text-white w-full p-2.5 rounded-xl transition hover:bg-slate-900/50">
              <Compass size={20} />
              <span>Discover</span>
            </button>
            <button className="flex items-center space-x-3 text-slate-400 hover:text-white w-full p-2.5 rounded-xl transition hover:bg-slate-900/50">
              <PlusSquare size={20} />
              <span>Create</span>
            </button>
            <button className="flex items-center space-x-3 text-slate-400 hover:text-white w-full p-2.5 rounded-xl transition hover:bg-slate-900/50">
              <MessageSquare size={20} />
              <span>Messages</span>
            </button>
            <button className="flex items-center space-x-3 text-slate-400 hover:text-white w-full p-2.5 rounded-xl transition hover:bg-slate-900/50">
              <User size={20} />
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Reputation Card */}
        <div 
          onClick={() => setShowReputationModal(true)}
          className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Reputation</span>
            <ShieldCheck size={16} className="text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold text-white flex items-baseline justify-between">
            <span>88</span>
            <span className="text-xs text-emerald-400 font-normal">+4 this week</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Earn points by creating, helping, & collaborating.</p>
        </div>
      </aside>

      {/* 2. Main Feed Section */}
      <main className="flex-1 flex flex-col border-r border-slate-800 overflow-hidden">
        {/* Navigation Header Tabs */}
        <header className="border-b border-slate-800 p-4 flex space-x-6 text-sm font-semibold overflow-x-auto no-scrollbar">
          {['for-you', 'following', 'trending', 'learning', 'projects', 'local'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize pb-1 whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </header>

        {/* Dynamic Feed Scroll Area */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Advanced Rich Composer */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md">
            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Composer Mode Selectors */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPostType('standard')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                      postType === 'standard' 
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles size={14} /> Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType('code')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                      postType === 'code' 
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code size={14} /> Code Block
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType('poll')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                      postType === 'poll' 
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BarChart2 size={14} /> Poll
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPrivacy(privacy === 'public' ? 'reputation-locked' : 'public')}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-xs bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800"
                >
                  {privacy === 'public' ? <Globe size={12} /> : <Lock size={12} className="text-amber-400" />}
                  <span className="capitalize">{privacy.replace('-', ' ')}</span>
                </button>
              </div>

              {/* Text Input */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`What are you building or creating today in #${activeTab}?`}
                className="w-full bg-transparent border-0 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-0 resize-none min-h-[80px]"
              />

              {/* Code Editor Preview */}
              {postType === 'code' && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
                    <span className="font-mono">Code Snippet</span>
                    <select 
                      value={codeLanguage} 
                      onChange={(e) => setCodeLanguage(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="javascript">JavaScript / React</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="sql">SQL</option>
                    </select>
                  </div>
                  <textarea
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    placeholder="// Paste code here..."
                    className="w-full bg-transparent font-mono text-xs text-emerald-400 focus:outline-none resize-none h-20"
                  />
                </div>
              )}

              {/* Poll Builder Preview */}
              {postType === 'poll' && (
                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold block">Poll Options</span>
                  {pollOptions.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const updated = [...pollOptions];
                        updated[idx] = e.target.value;
                        setPollOptions(updated);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                  ))}
                  {pollOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-xs text-indigo-400 hover:text-indigo-300 block pt-1"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              )}

              {/* Composer Toolbar & Submit */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center space-x-3 text-slate-400">
                  <button type="button" className="hover:text-indigo-400 transition">
                    <Image size={18} />
                  </button>

                  <div className="relative">
                    <button 
                      type="button" 
                      onClick={() => setShowLocationPicker(!showLocationPicker)}
                      className="flex items-center gap-1 text-xs hover:text-indigo-400 transition"
                    >
                      <MapPin size={18} className={locationTag ? 'text-indigo-400' : ''} />
                      {locationTag && <span className="max-w-[100px] truncate">{locationTag}</span>}
                    </button>

                    {showLocationPicker && (
                      <div className="absolute left-0 bottom-8 bg-slate-900 border border-slate-800 rounded-xl p-2 w-48 shadow-2xl z-20 text-xs space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase px-2">Location</span>
                        {['Port Harcourt, NG', 'Lagos, NG', 'Abuja, NG', 'Remote / Global'].map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => { setLocationTag(loc); setShowLocationPicker(false); }}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="button" className="hover:text-indigo-400 transition">
                    <Smile size={18} />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isPosting || !content.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-5 py-2 rounded-xl flex items-center space-x-2 transition disabled:opacity-40 shadow-lg shadow-indigo-600/20"
                >
                  <Send size={14} />
                  <span>{isPosting ? 'Posting...' : 'Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Posts Stream */}
          {loading ? (
            <div className="text-center text-slate-500 text-sm py-12 space-y-2">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p>Fetching real-time updates...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-slate-900/30 rounded-2xl border border-slate-800">
              <p className="text-slate-300 text-sm font-semibold">No posts in this feed yet.</p>
              <p className="text-xs text-slate-500">Be the first to share an update using the composer above!</p>
            </div>
          ) : (
            posts.map((post) => {
              const isLiked = likedPosts[post.id];
              const postComments = commentsMap[post.id] || [];

              return (
                <div key={post.id} className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700/80 transition">
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white uppercase text-xs shadow-md">
                        {post.profiles?.username ? post.profiles.username.substring(0, 2) : 'BM'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-sm">
                            {post.profiles?.full_name || post.profiles?.username || 'Bmax Builder'}
                          </h3>
                          {post.is_remix && (
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
                              <Repeat size={10} /> Remix
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          @{post.profiles?.username || 'builder'} {post.city_tag ? `• ${post.city_tag}` : ''}
                        </p>
                      </div>
                    </div>

                    <button className="text-slate-500 hover:text-slate-300">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">{post.content}</p>

                  {/* Interaction Bar */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center space-x-5">
                      <button 
                        onClick={() => toggleLike(post.id)}
                        className={`flex items-center space-x-1.5 transition ${isLiked ? 'text-rose-500 font-bold' : 'hover:text-rose-400'}`}
                      >
                        <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                        <span>{isLiked ? 1 : 0}</span>
                      </button>

                      <button 
                        onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                        className="flex items-center space-x-1.5 hover:text-indigo-400 transition"
                      >
                        <MessageCircle size={16} />
                        <span>{postComments.length}</span>
                      </button>

                      <button 
                        onClick={() => setRemixModalPost(post)}
                        className="flex items-center space-x-1.5 hover:text-purple-400 transition"
                      >
                        <Repeat size={16} />
                        <span>Remix</span>
                      </button>
                    </div>

                    <button className="hover:text-slate-200 transition">
                      <Share2 size={16} />
                    </button>
                  </div>

                  {/* Threaded Comments Section */}
                  {activeCommentPostId === post.id && (
                    <div className="pt-3 border-t border-slate-800/60 space-y-3 bg-slate-950/50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                      <div className="space-y-2">
                        {postComments.map((c) => (
                          <div key={c.id} className="text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                            <div className="flex justify-between text-slate-400 font-medium">
                              <span>{c.user}</span>
                              <span className="text-[10px]">{c.date}</span>
                            </div>
                            <p className="text-slate-200">{c.text}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a response..."
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-xl transition font-medium"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 3. Right Sidebar - Local Discovery & Trends */}
      <aside className="w-80 p-6 space-y-6 hidden lg:block">
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-400" /> Hyperlocal Trends
            </h2>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 hover:border-slate-700 transition cursor-pointer">
              <span className="text-[10px] text-indigo-400 uppercase font-semibold">Port Harcourt</span>
              <p className="font-semibold text-slate-200 mt-0.5">#PortHarcourtTech Meetup</p>
              <span className="text-[10px] text-slate-500">142 builders discussing</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 hover:border-slate-700 transition cursor-pointer">
              <span className="text-[10px] text-purple-400 uppercase font-semibold">Global</span>
              <p className="font-semibold text-slate-200 mt-0.5">Web3 Builders Challenge</p>
              <span className="text-[10px] text-slate-500">89 submission entries</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Remix Modal Overlay */}
      {remixModalPost && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Repeat size={16} className="text-purple-400" /> Remix Post
              </h3>
              <button onClick={() => setRemixModalPost(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 italic">
              "{remixModalPost.content}"
            </div>

            <textarea
              value={remixNote}
              onChange={(e) => setRemixNote(e.target.value)}
              placeholder="Add your own spin, insight, or build update to this post..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 h-24 resize-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRemixModalPost(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRemixSubmit}
                className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs px-5 py-2 rounded-xl transition shadow-lg shadow-purple-600/20"
              >
                Publish Remix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reputation Modal Overlay */}
      {showReputationModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Award size={16} className="text-emerald-400" /> Reputation Points
              </h3>
              <button onClick={() => setShowReputationModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="text-center space-y-1">
              <span className="text-4xl font-extrabold text-white">88</span>
              <p className="text-xs text-emerald-400 font-medium">Level 3 Contributor</p>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Recent Point Breakdown</span>
              <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Published Code Snippet</span>
                <span className="text-emerald-400 font-bold">+2 pts</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Community Post Remix</span>
                <span className="text-emerald-400 font-bold">+2 pts</span>
              </div>
            </div>

            <button
              onClick={() => setShowReputationModal(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
