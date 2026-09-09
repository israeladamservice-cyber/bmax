'use client';

import React, { useState } from 'react';
import { 
  Send, Image, Code, MapPin, BarChart2, Smile, 
  Sparkles, Shield, X, Check, Lock, Globe 
} from 'lucide-react';

export default function PostComposer({ activeTab, onPostCreated }) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('standard'); // standard, code, poll, remix
  const [locationTag, setLocationTag] = useState('Port Harcourt, NG');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [privacy, setPrivacy] = useState('public');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handlePollChange = (index, value) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    
    // Construct rich payload structure
    const payload = {
      content,
      feed_type: activeTab === 'for-you' ? 'for-you' : activeTab,
      city_tag: locationTag,
      metadata: {
        post_type: postType,
        privacy,
        code_snippet: postType === 'code' ? { code: codeSnippet, lang: codeLanguage } : null,
        poll: postType === 'poll' ? pollOptions.filter(opt => opt.trim() !== '') : null
      }
    };

    if (onPostCreated) {
      await onPostCreated(payload);
    }

    // Reset composer form
    setContent('');
    setCodeSnippet('');
    setPollOptions(['', '']);
    setPostType('standard');
    setIsSubmitting(false);
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md transition-all">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Top Controls: Post Type Selector */}
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
              <BarChart2 size={14} /> Community Poll
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setPrivacy(privacy === 'public' ? 'reputation-locked' : 'public')}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-xs bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700/50"
            >
              {privacy === 'public' ? <Globe size={12} /> : <Lock size={12} className="text-amber-400" />}
              <span className="capitalize">{privacy.replace('-', ' ')}</span>
            </button>
          </div>
        </div>

        {/* Main Text Input Area */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Share build updates, ask questions, or broadcast to #${activeTab}...`}
          className="w-full bg-transparent border-0 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-0 resize-none min-h-[90px]"
        />

        {/* Dynamic Input: Code Editor Block */}
        {postType === 'code' && (
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-mono">Code Snippet</span>
              <select 
                value={codeLanguage} 
                onChange={(e) => setCodeLanguage(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="javascript">JavaScript / JSX</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="sql">SQL</option>
                <option value="html">HTML / CSS</option>
              </select>
            </div>
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="// Paste code snippet here..."
              className="w-full bg-transparent font-mono text-xs text-emerald-400 focus:outline-none resize-none h-24"
            />
          </div>
        )}

        {/* Dynamic Input: Poll Creation */}
        {postType === 'poll' && (
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Poll Options</span>
            {pollOptions.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                value={opt}
                onChange={(e) => handlePollChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            ))}
            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={handleAddPollOption}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium pt-1 block"
              >
                + Add Option
              </button>
            )}
          </div>
        )}

        {/* Bottom Toolbars & Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-3 text-slate-400">
            <button type="button" className="hover:text-indigo-400 transition" title="Attach Media">
              <Image size={18} />
            </button>
            
            <div className="relative">
              <button 
                type="button" 
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className={`flex items-center gap-1 text-xs hover:text-indigo-400 transition ${locationTag ? 'text-indigo-400' : ''}`}
              >
                <MapPin size={18} />
                {locationTag && <span className="max-w-[100px] truncate">{locationTag}</span>}
              </button>

              {showLocationPicker && (
                <div className="absolute left-0 bottom-8 bg-slate-900 border border-slate-700 rounded-xl p-2 w-48 shadow-2xl z-20 text-xs space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase px-2">Select Location</span>
                  {['Port Harcourt, NG', 'Lagos, NG', 'Abuja, NG', 'Global / Remote'].map((loc) => (
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

            <button type="button" className="hover:text-indigo-400 transition" title="Add Emoji">
              <Smile size={18} />
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-5 py-2 rounded-xl flex items-center space-x-2 transition disabled:opacity-40 shadow-lg shadow-indigo-600/20"
          >
            <Send size={14} />
            <span>{isSubmitting ? 'Publishing...' : 'Broadcast'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
