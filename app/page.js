'use client';

import React, { useState, useEffect } from 'react';
import { Home, Compass, PlusSquare, MessageSquare, User, Zap, Users, ShieldCheck, Send, Repeat } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function BmaxHome() {
  const [activeTab, setActiveTab] = useState('for-you');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Fetch real posts from Supabase based on the active tab
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
        console.error('Error fetching posts:', error.message);
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  // Handle creating a dynamic post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Please log in to share a post on Bmax!');
        setIsPosting(false);
        return;
      }

      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          content: newPostContent,
          feed_type: activeTab === 'for-you' ? 'for-you' : activeTab,
        },
      ]);

      if (error) {
        alert('Could not submit post: ' + error.message);
      } else {
        setNewPostContent('');
        fetchPosts(); // Refresh post feed
      }
    } catch (err) {
      console.error('Post creation error:', err);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="flex h-screen max-w-7xl mx-auto border-x border-slate-800">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white font-black text-2xl px-3 py-1 rounded-xl">B</div>
            <h1 className="text-2xl font-black tracking-wider text-white">BMAX</h1>
          </div>

          <nav className="space-y-4">
            <button className="flex items-center space-x-3 text-indigo-400 font-semibold w-full p-2 rounded-lg bg-slate-800">
              <Home size={20} />
              <span>Home</span>
            </button>
            <button className="flex items-center space-x-3 text-slate-400 hover:text-white w-full p-2 rounded-lg transition">
              <Compass size={20} />
              <span>Discover</span>
            </button>
            <button className="flex items-center space-x-3 text-slate-400 hover:text-white w-full p-2 rounded-lg transition">
              <PlusSquare size={20} />
              <span>Create</span>
            </button>
            <button className="flex items-center space-x-3 text-slate-400 hover:text-white w-full p-2 rounded-lg transition">
              <MessageSquare size={20} />
              <span>Messages</span>
            </button>
            <button className="flex items-center space-x-3 text-slate-400 hover:text-white w-full p-2 rounded-lg transition">
              <User size={20} />
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Reputation Badge Card */}
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Reputation</span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">88 <span className="text-xs text-emerald-400 font-normal">+4 this week</span></div>
          <p className="text-xs text-slate-400 mt-1">Earn points by creating, helping, and collaborating.</p>
        </div>
      </aside>

      {/* Main Feed Section */}
      <main className="flex-1 flex flex-col border-r border-slate-800 overflow-hidden">
        {/* Feed Header Tabs */}
        <header className="border-b border-slate-800 p-4 flex space-x-6 text-sm font-semibold">
          {['for-you', 'following', 'trending', 'learning', 'projects', 'local'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize pb-1 ${
                activeTab === tab
                  ? 'text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </header>

        {/* Feed Scroll Area */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Create Post Input Box */}
          <form onSubmit={handleCreatePost} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What are you building or creating today?"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-none h-20"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 capitalize">Posting to: {activeTab.replace('-', ' ')}</span>
              <button
                type="submit"
                disabled={isPosting || !newPostContent.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center space-x-2 transition disabled:opacity-50"
              >
                <Send size={14} />
                <span>{isPosting ? 'Posting...' : 'Post'}</span>
              </button>
            </div>
          </form>

          {/* Dynamic Feed Posts */}
          {loading ? (
            <p className="text-center text-slate-500 text-sm py-10">Loading posts...</p>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-slate-400 text-sm">No posts in this feed yet.</p>
              <p className="text-xs text-slate-500">Be the first to create one above!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/60 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white uppercase">
                    {post.profiles?.username ? post.profiles.username.substring(0, 2) : 'BM'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-white">{post.profiles?.full_name || post.profiles?.username || 'Bmax Builder'}</h3>
                      {post.is_remix && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
                          <Repeat size={10} /> Remix
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      @{post.profiles?.username || 'anonymous'} {post.profiles?.city ? `• ${post.profiles.city}` : ''}
                    </p>
                  </div>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed">{post.content}</p>

                <div className="flex items-center space-x-4 text-xs text-slate-400 pt-2 border-t border-slate-700/40">
                  <button className="flex items-center space-x-1 hover:text-indigo-400 transition">
                    <Zap size={14} />
                    <span>Interact</span>
                  </button>
                  <button className="flex items-center space-x-1 hover:text-emerald-400 transition">
                    <Users size={14} />
                    <span>Collab</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Right Sidebar - Discovery & Local */}
      <aside className="w-80 p-6 space-y-6 hidden lg:block">
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
          <h2 className="font-bold text-white mb-3 text-sm">Hyperlocal Discovery</h2>
          <p className="text-xs text-slate-400 mb-3">Popular activity nearby</p>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-slate-800 rounded-lg text-slate-300">#PortHarcourtTech Meetup</div>
            <div className="p-2 bg-slate-800 rounded-lg text-slate-300">Web3 Builders Challenge</div>
          </div>
        </div>
      </aside>
    </div>
  );
}
