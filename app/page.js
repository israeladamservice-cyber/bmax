'use client';

import React, { useState } from 'react';
import { Home, Compass, PlusSquare, MessageSquare, User, Zap, Users, ShieldCheck } from 'lucide-react';

export default function BmaxHome() {
  const [activeTab, setActiveTab] = useState('for-you');

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
      <main className="flex-1 flex flex-col border-r border-slate-800">
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

        {/* Feed Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Post Starter / Remix Card */}
          <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/60 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white">
                BM
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-white">Alex Developer</h3>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">Builder</span>
                </div>
                <p className="text-xs text-slate-400">Building an open-source SaaS • Port Harcourt</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              Just launched the new features on <span className="text-indigo-400 font-semibold">#Bmax</span>! Looking for a UI designer to help refine our remix flows. Anyone interested in collaborating?
            </p>

            <div className="flex items-center space-x-4 text-xs text-slate-400 pt-2 border-t border-slate-700/40">
              <button className="flex items-center space-x-1 hover:text-indigo-400 transition">
                <Zap size={14} />
                <span>Interactions (12)</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-emerald-400 transition">
                <Users size={14} />
                <span>Collab Match</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Discovery & Local */}
      <aside className="w-80 p-6 space-y-6 hidden lg:block">
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
          <h2 className="font-bold text-white mb-3 text-sm">Hyperlocal Discovery</h2>
          <p className="text-xs text-slate-400 mb-3">Popular around Port Harcourt</p>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-slate-800 rounded-lg text-slate-300">#PortHarcourtTech Meetup • Fri 4 PM</div>
            <div className="p-2 bg-slate-800 rounded-lg text-slate-300">Web3 Builders Challenge</div>
          </div>
        </div>
      </aside>
    </div>
  );
}
