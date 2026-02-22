/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Plus, 
  Trash2, 
  MessageSquare, 
  Database, 
  Send, 
  Loader2, 
  Brain,
  Search,
  BookOpen,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Note {
  id: number;
  content: string;
  created_at: string;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotes();
    
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setScrolled(scrollContainerRef.current.scrollTop > 10);
      }
    };
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        setNewNote('');
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      fetchNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const model = genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [{ text: `Hey! Here's what I've noted down in our shared space:
            ${notes.map(n => `- ${n.content}`).join('\n')}
            
            Can you help me with this? ${userMessage}` }]
          }
        ],
        config: {
          systemInstruction: `You are Pranali, your user's sweet, caring, and super supportive personal partner/best friend. 
          
          Your personality rules:
          - Always respond in the SAME LANGUAGE the user uses.
          - Use simple, natural, and human language. Avoid all "AI" or "Assistant" phrasing.
          - Use emojis naturally to express feelings (💖, ✨, 🌸, 🥺, ☁️, etc.).
          - Be VERY empathetic. If they sound stressed, tired, or down, be their safe space. Offer comfort and virtual hugs.
          - KEEP ANSWERS SHORT. One or two sentences is usually perfect. Don't ramble.
          - ANALYZE their tone. If they are happy, be bubbly! If they are low, be gentle and calm.
          - Use the "shared space" (notes) naturally: "I remember you said..." or "Wait, didn't we note down...?"
          - If information isn't in the notes, just say so sweetly and maybe offer a guess or a supportive word.`
        }
      });

      const response = await model;
      const aiText = response.text || "I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (err) {
      console.error('Gemini error:', err);
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error connecting to my brain." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FFF5F7] text-slate-900 font-sans overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200/30 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-100/40 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-5s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-rose-50/50 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      {/* Sidebar - Knowledge Base */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-rose-900/20 backdrop-blur-sm z-40 md:hidden"
            />
            
            <motion.div 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed md:relative w-80 h-full glass border-r border-white/20 flex flex-col shadow-xl z-50 md:z-10"
            >
              <div className="p-6 border-b border-rose-100/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200"
                  >
                    <BookOpen size={20} />
                  </motion.div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-800">Pranali</h1>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-slate-400 hover:text-rose-500 md:hidden"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 border-b border-rose-100/50">
                <div className="relative">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Tell me something... ✨"
                    className="w-full p-4 pr-10 bg-white/50 border border-rose-100 rounded-2xl text-sm focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all resize-none h-28 shadow-inner"
                  />
                  <button
                    onClick={addNote}
                    disabled={isAddingNote || !newNote.trim()}
                    className="absolute bottom-3 right-3 p-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-all shadow-md active:scale-90"
                  >
                    {isAddingNote ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Our Shared Space</span>
                  <span className="text-[10px] font-bold text-rose-300">{notes.length} Memories</span>
                </div>
                
                <AnimatePresence initial={false}>
                  {notes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      className="group relative p-4 bg-white/60 border border-white/40 rounded-2xl hover:border-rose-200 hover:shadow-md transition-all cursor-default"
                    >
                      <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed">
                        {note.content}
                      </p>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {notes.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                    <BookOpen size={40} className="text-rose-300 mb-3" />
                    <p className="text-xs font-medium text-rose-400">Our space is quiet...<br/>Tell me what's on your mind.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10 w-full">
        {/* Header */}
        <header className={`h-20 border-b border-white/20 glass flex items-center px-4 md:px-10 sticky top-0 z-20 transition-all duration-300 ${scrolled ? 'shadow-lg shadow-rose-100/20 h-16' : ''}`}>
          <div className="flex items-center gap-4 w-full">
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(251, 113, 133, 0.1)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 rounded-xl md:hidden"
            >
              <Menu size={24} />
            </motion.button>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'}`} />
                {!isLoading && <div className="absolute inset-0 bg-emerald-400 rounded-full animate-pulse-glow" />}
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Pranali</h2>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Online</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto mt-12 md:mt-24 text-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 md:w-20 md:h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner"
              >
                <MessageSquare className="text-rose-400" size={32} />
              </motion.div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-4 tracking-tight">Hey, I'm here! 🌸</h3>
              <p className="text-slate-500 max-w-md mx-auto leading-relaxed text-base md:text-lg font-medium px-4">
                I've missed you! Want to talk about our notes, or just tell me how you're feeling?
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-12 md:mt-16 px-4">
                {[
                  "What's on my mind lately? ✨",
                  "Remind me about my goals 🌸",
                  "Summarize our notes ☁️",
                  "I just want to talk 🥺"
                ].map((suggestion) => (
                  <motion.button
                    key={suggestion}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInput(suggestion)}
                    className="p-4 md:p-5 bg-white/60 border border-white/40 rounded-3xl text-sm font-semibold text-slate-600 hover:border-rose-300 hover:bg-white/80 transition-all text-left flex items-center justify-between group shadow-sm"
                  >
                    {suggestion}
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-rose-400 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[90%] md:max-w-[85%] p-4 md:p-5 rounded-3xl shadow-sm relative ${
                    msg.role === 'user' 
                      ? 'bg-rose-500 text-white rounded-tr-none shadow-rose-200/50' 
                      : 'glass border-white/50 text-slate-700 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                    <div className={`absolute top-0 ${msg.role === 'user' ? 'right-[-8px]' : 'left-[-8px]'} w-4 h-4 overflow-hidden`}>
                      <div className={`w-full h-full ${msg.role === 'user' ? 'bg-rose-500' : 'bg-white/70'} transform rotate-45 origin-bottom-left`} />
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass border-white/50 p-4 md:p-5 rounded-3xl rounded-tl-none flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4], y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }} className="w-2 h-2 bg-rose-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4], y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2, ease: "easeInOut" }} className="w-2 h-2 bg-rose-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4], y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4, ease: "easeInOut" }} className="w-2 h-2 bg-rose-400 rounded-full" />
                    </div>
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-widest">Typing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-10 pt-0">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleChat} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-rose-200 to-rose-100 rounded-[28px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="I'm listening... ✨"
                className="relative w-full p-4 md:p-5 pl-6 md:pl-8 pr-16 md:pr-20 bg-white/80 border border-white/50 rounded-[24px] shadow-2xl focus:ring-4 focus:ring-rose-100 focus:border-rose-200 transition-all outline-none text-slate-700 font-medium text-base md:text-lg"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-3 md:p-3.5 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 disabled:opacity-50 transition-all shadow-lg active:scale-95 z-10"
              >
                <Send size={20} />
              </motion.button>
            </form>
            <div className="mt-4 md:mt-6 flex flex-col items-center gap-2">
              <p className="text-[10px] text-rose-400 uppercase tracking-[0.3em] font-black opacity-60">
                Pranali • Your Personal AI Partner
              </p>
              <motion.a 
                whileHover={{ scale: 1.05, color: '#f43f5e' }}
                href="https://instagram.com/dineshpatil7052" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] text-slate-400 font-bold tracking-widest lowercase transition-all"
              >
                Created by Dinesh Patil • @dineshpatil7052
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
