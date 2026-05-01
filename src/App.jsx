import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  User, 
  Mail, 
  ExternalLink, 
  Code2, 
  Briefcase, 
  Send, 
  ChevronRight,
  ChevronLeft,
  Terminal,
  Cpu,
  Layers,
  Menu,
  X,
  Play,
  SkipForward,
  SkipBack,
  MessageSquare,
  Sparkles,
  Zap,
  Languages,
  Volume2,
  Lock,
  Pause
} from 'lucide-react';

// Advanced Reveal Hook for 3D entry effects
const useScrollReveal = (threshold = 0.1) => {
  const [reveal, setReveal] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (rect.top < windowHeight && rect.bottom > 0) {
        const progress = Math.min(Math.max((windowHeight - rect.top) / (windowHeight + rect.height), 0), 1);
        setReveal(progress);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return [ref, reveal];
};

// Scroll Tick Sound Hook (Web Audio API)
const useScrollTickSound = () => {
  const audioCtxRef = useRef(null);
  const lastScrollY = useRef(0);
  const TICK_INTERVAL = 60; // More frequent ticks

  useEffect(() => {
    // Helper to init/resume audio context and pre-warm hardware
    const resumeAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtxRef.current = new AudioContext();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          // Play a silent tone to instantly wake up mobile audio hardware
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          gain.gain.value = 0; // Silent
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.01);
        });
      }
    };

    const handleScroll = () => {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== 'running') return;

      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY.current) > TICK_INTERVAL) {
        lastScrollY.current = currentScrollY;
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Add a tiny 10ms scheduling buffer. This prevents mobile browsers 
        // from lagging when trying to play audio exactly at 'currentTime'
        const t = ctx.currentTime + 0.01; 
        
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(1000, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.02);
        
        gainNode.gain.setValueAtTime(0.15, t); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(t);
        osc.stop(t + 0.02);
      }
    };

    // Mobile browsers heavily rely on touchstart to wake up audio instantly
    window.addEventListener('touchstart', resumeAudio, { once: true });
    window.addEventListener('click', resumeAudio, { once: true });
    window.addEventListener('keydown', resumeAudio, { once: true });
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('touchstart', resumeAudio);
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
};

// Standalone Horizontal Carousel Hook (Bigger Cards + Independent Scroll)
const useHorizontalCarousel = () => {
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId = null;

    const updateTransforms = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      
      Array.from(container.children).forEach((child) => {
        const childRect = child.getBoundingClientRect();
        const childCenter = childRect.left + childRect.width / 2;
        
        let distance = (childCenter - containerCenter) / (containerRect.width / 2);
        distance = Math.max(-2, Math.min(2, distance));
        
        // Curve Effect
        const translateY = Math.abs(distance) * Math.abs(distance) * 40; 
        const rotateZ = distance * 4; 
        const scale = 1 - Math.abs(distance) * 0.04; 
        
        child.style.transform = `translateY(${translateY}px) rotateZ(${rotateZ}deg) scale(${scale})`;
        
        // Focus Effect
        if (Math.abs(distance) < 0.2) {
          child.setAttribute('data-active', 'true');
        } else {
          child.setAttribute('data-active', 'false');
        }
      });
      
      rafId = null;
    };

    const handleScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(updateTransforms);
    };

    // --- Drag Logic ---
    const onStart = (e) => {
      isDragging.current = true;
      startX.current = (e.pageX || e.touches[0].pageX) - container.offsetLeft;
      scrollLeft.current = container.scrollLeft;
      container.style.cursor = 'grabbing';
      container.style.scrollSnapType = 'none'; // Disable snap while dragging
      container.style.scrollBehavior = 'auto'; // Instant response
    };

    const onMove = (e) => {
      if (!isDragging.current) return;
      
      const x = (e.pageX || e.touches[0].pageX) - container.offsetLeft;
      const walk = (x - startX.current) * 1.5;
      
      // If we've moved enough horizontally, prevent default (important for mobile)
      if (Math.abs(walk) > 5) {
        e.preventDefault();
      }
      
      container.scrollLeft = scrollLeft.current - walk;
    };

    const onEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      container.style.cursor = 'grab';
      container.style.scrollSnapType = 'x mandatory'; // Re-enable snap
      container.style.scrollBehavior = 'smooth'; 
    };

    updateTransforms();
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    container.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    
    container.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      container.removeEventListener('mousedown', onStart);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      container.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return containerRef;
};

const App = () => {
  useScrollTickSound();
  const carouselRef = useHorizontalCarousel();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'));
  const [scrollPixels, setScrollPixels] = useState(0);
  const [activeSection, setActiveSection] = useState('home');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollPixels(window.scrollY);
      const sections = ['home', 'works', 'tech', 'experience'];
      const current = sections.find(id => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          return rect.top <= 300 && rect.bottom >= 300;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    const handleMouseMove = (e) => {
      setMousePos({ x: (e.clientX / window.innerWidth) - 0.5, y: (e.clientY / window.innerHeight) - 0.5 });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Section Refs
  const [heroRef, heroReveal] = useScrollReveal();
  const [worksRef, worksReveal] = useScrollReveal();
  const [techRef, techReveal] = useScrollReveal();
  const [expRef, expReveal] = useScrollReveal();
  const [statementRef, statementReveal] = useScrollReveal();

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 selection:text-white font-sans overflow-x-hidden">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 40s linear infinite; }
        .animate-marquee-fast { animation: marquee 15s linear infinite; }
        
        .perspective-container { perspective: 1200px; }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .bento-card { 
          background: rgba(15, 15, 18, 0.6); 
          border: 1px solid rgba(255,255,255,0.08); 
          border-radius: 32px; 
          backdrop-filter: blur(10px);
          transition: all 0.5s cubic-bezier(0.2, 1, 0.3, 1);
        }
        .bento-card:hover {
          border-color: rgba(255,255,255,0.2);
          background: rgba(25, 25, 30, 0.8);
          transform: translateY(-5px);
        }

        .text-glow {
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.4);
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #050505; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
      `}</style>

      {/* Floating Global Nav */}
      {/* Mobile-Responsive Nav Dock */}
      <nav className="fixed bottom-6 md:top-8 md:bottom-auto left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 md:gap-2 p-1.5 bg-black/60 md:bg-black/40 backdrop-blur-3xl border border-white/10 rounded-full shadow-2xl transition-all duration-500 w-[90%] md:w-auto justify-center">
        {['home', 'works', 'tech', 'experience'].map(id => (
          <a 
            key={id} 
            href={`#${id}`} 
            className={`flex-1 md:flex-none text-center px-4 md:px-6 py-2.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all duration-500 ${activeSection === id ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-gray-500 hover:text-white'}`}
          >
            {id}
          </a>
        ))}
      </nav>

      {/* Hero Section - Custom Design */}
      <section 
        id="home" 
        ref={heroRef} 
        className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black"
        style={{ backgroundColor: '#000' }}
      >
        {/* Smaller, High-Intensity Parallax Frame */}
        <div 
          className="absolute inset-0 flex items-center justify-center p-6 md:p-12 z-0"
        >
          <div 
            className="w-full max-w-4xl h-[60vh] md:h-[70vh] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)] relative group"
            style={{ 
              transform: `scale(${1 + scrollPixels * (window.innerWidth < 768 ? 0.0012 : 0.0006)}) translateY(${scrollPixels * -0.1}px)`,
              transition: 'transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)'
            }}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-1000"
              style={{ backgroundImage: "url('/hero_image_final.png')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10"></div>
            
            {/* Moving Fog Layers */}
            <div className="absolute inset-0 z-20 pointer-events-none opacity-40">
              <div className="absolute -bottom-[20%] -left-[10%] w-[120%] h-[60%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)] blur-3xl animate-drift"></div>
              <div className="absolute -bottom-[10%] -right-[10%] w-[120%] h-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)] blur-3xl animate-drift-slow"></div>
            </div>
          </div>
        </div>
        {/* Floating Background Cards (Parallax) */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute top-[15%] left-[15%] w-64 h-40 bg-white/5 rounded-2xl backdrop-blur-sm -rotate-12 opacity-30 flex items-center justify-center p-6 text-center"
            style={{ transform: `translateY(${scrollPixels * -0.15}px) rotate(-12deg)` }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Brain Check<br/>Solution Challenge</span>
          </div>
          <div 
            className="absolute top-[25%] right-[20%] w-72 h-48 bg-white/5 rounded-2xl backdrop-blur-sm rotate-6 opacity-30 flex items-center justify-center p-6"
            style={{ transform: `translateY(${scrollPixels * -0.2}px) rotate(6deg)` }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Agentic Secure SAST</span>
          </div>
          <div 
            className="absolute bottom-[25%] left-[25%] w-56 h-36 bg-white/5 rounded-2xl backdrop-blur-sm rotate-12 opacity-20 flex items-center justify-center p-6"
            style={{ transform: `translateY(${scrollPixels * -0.1}px) rotate(12deg)` }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Sentinel Analytics</span>
          </div>
          <div 
            className="absolute bottom-[15%] right-[15%] w-80 h-56 bg-white/5 rounded-2xl backdrop-blur-sm -rotate-6 opacity-20 flex items-center justify-center p-6"
            style={{ transform: `translateY(${scrollPixels * -0.25}px) rotate(-6deg)` }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">CodersMeet P2P</span>
          </div>
        </div>

        {/* Title & Stats Banner - Pushed to bottom */}
        <div className="absolute bottom-20 left-10 z-20 text-left">
          <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-md">
            <Globe size={20} className="text-white" />
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="absolute top-10 right-10 z-20 flex gap-4">
           <a href="#" className="px-6 py-2 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors backdrop-blur-md">LinkedIn</a>
           <a href="#" className="px-6 py-2 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors backdrop-blur-md">Email</a>
        </div>

        {/* Bottom Content Area */}
        <div className="absolute bottom-10 left-10 right-10 z-20 flex flex-col md:flex-row justify-between items-end gap-10 pointer-events-none">
          {/* Left Text */}
          <div className="pointer-events-auto">
            <h1 className="text-5xl sm:text-6xl md:text-[120px] font-medium tracking-tighter leading-[0.85] text-white">
              AI/ML<br/>Engineer
            </h1>
          </div>
          
          {/* Right Text & Scroll Indicator */}
          <div className="flex flex-col items-start md:items-end gap-6 text-left md:text-right max-w-sm pointer-events-auto">
            <p className="text-gray-300 text-sm md:text-base font-light leading-relaxed">
              Working at WorknAI, applying AI and ML to solve real-world business problems.
            </p>
            <a href="#works" className="w-12 h-12 border border-white/20 hover:border-white/60 rounded-full flex items-center justify-center transition-all hover:translate-y-2 cursor-pointer">
              <span className="text-white">↓</span>
            </a>
          </div>
        </div>
      </section>

      {/* Decorative Marquee Banner */}
      <div className="w-full overflow-hidden py-4 flex bg-[#050505] border-y border-white/5 opacity-80">
        <div className="flex animate-marquee whitespace-nowrap items-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center">
              {['AGENTIC AI', 'GENERATIVE AI', 'LLMs', 'RAG', 'GOOGLE CLOUD'].map((text, j) => (
                <React.Fragment key={j}>
                  <span className="text-4xl md:text-6xl font-black tracking-widest text-transparent uppercase mx-8" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.6)' }}>
                    {text}
                  </span>
                  <span className="text-2xl text-white/30">•</span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Statement Section */}
      <section ref={statementRef} className="px-6 max-w-4xl mx-auto snap-center snap-always py-16 flex flex-col justify-center items-center w-full">
        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-8 text-white/50">
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
        </div>
        
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center leading-[1.4] tracking-tight mb-12">
          {['I', 'blend', 'creativity', 'with', 'technical', 'expertise', 'to', 'build', 'AI/ML', 'solutions', 'that', 'drive', 'real-world', 'impact.'].map((word, i, arr) => {
            // Expanded scroll range (0.0 to 0.5) so it starts earlier and finishes exactly at center snap
            const progress = Math.min(Math.max((statementReveal - 0.05) / 0.45, 0), 1);
            const wordThreshold = i / arr.length;
            const opacity = Math.min(Math.max((progress - wordThreshold) * arr.length, 0.15), 1);
            return (
              <span key={i} className="transition-colors duration-700 ease-out" style={{ color: `rgba(255,255,255,${opacity})` }}>
                {word}{' '}
              </span>
            );
          })}
        </h2>

        {/* Action Icons */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded bg-[#1a73e8] flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
            <Languages size={16} className="text-white" />
          </div>
          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors border border-white/10">
            <Volume2 size={16} className="text-white/70" />
          </div>
        </div>
      </section>

      {/* Intro Bento Box Section */}
      <section id="about" className="px-6 max-w-7xl mx-auto snap-start snap-always min-h-screen flex flex-col justify-center w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Top Row: Spiderman & Chat */}
          {/* Spiderman Split Card */}
          <div className="md:col-span-4 bg-[#0f0f11] rounded-[2rem] overflow-hidden flex h-[320px]">
            <div className="w-[70%] h-full bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&q=80&w=800')` }}></div>
            <div className="w-[30%] h-full bg-cover bg-center border-l border-black/50" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542841791-09e86339d675?auto=format&fit=crop&q=80&w=400')` }}></div>
          </div>

          {/* Chat Card */}
          <div className="md:col-span-8 bg-[#0f0f11] rounded-[2rem] p-10 flex flex-col justify-between h-[320px]">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-3 text-white">
                Hi, I'm Sandesh
              </h2>
              <p className="text-gray-400 text-sm font-light leading-relaxed max-w-xl">
                Ready to build something intelligent together? Drop your name and message-let's collaborate!
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-[#18181b] border border-white/5 rounded-2xl p-2 pl-4">
              <input 
                type="text" 
                placeholder="Type your message..." 
                className="bg-transparent border-none outline-none flex-grow text-sm font-light text-white placeholder:text-gray-500"
              />
              <button className="bg-[#8be0e5] hover:bg-[#7bc8cc] text-black w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm">
                <ChevronRight size={20} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Middle Row */}
          <div className="md:col-span-6 flex flex-col gap-4">
            {/* Animated Logos Marquee Card */}
            <div className="bg-[#0f0f11] rounded-[2rem] relative overflow-hidden h-[120px] border border-white/5 flex items-center group">
               {/* Small Circle Icon */}
               <div className="absolute top-4 left-5 w-5 h-5 rounded-full border border-white/20 flex items-center justify-center opacity-50 z-10 transition-opacity group-hover:opacity-100">
                 <div className="w-1.5 h-1.5 border border-white/50 rounded-full"></div>
               </div>

               {/* Marquee Track */}
               <div className="flex animate-marquee-fast whitespace-nowrap items-center w-max">
                 {[...Array(4)].map((_, i) => (
                   <div key={i} className="flex gap-4 px-2 items-center flex-shrink-0">
                     {[
                       'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg',
                       'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/unrealengine/unrealengine-original.svg',
                       'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vscode/vscode-original.svg',
                       'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg',
                       'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
                       'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg',
                       'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg',
                     ].map((url, j) => (
                       <div key={j} className="w-[64px] h-[64px] bg-[#1a1a1f] rounded-[1.2rem] flex items-center justify-center border border-white/5 shadow-sm hover:scale-110 hover:bg-[#222228] transition-all cursor-pointer overflow-hidden flex-shrink-0">
                         <img src={url} alt="tech-logo" className={`w-8 h-8 object-contain transition-all duration-300 ${(url.includes('github') || url.includes('unrealengine')) ? 'filter invert opacity-80' : 'opacity-90'}`} />
                       </div>
                     ))}
                   </div>
                 ))}
               </div>
               
               {/* Fade Gradients */}
               <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#0f0f11] to-transparent z-10 pointer-events-none"></div>
               <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#0f0f11] to-transparent z-10 pointer-events-none"></div>
            </div>
            
            {/* Music Player Card */}
            <div className="bg-[#0f0f11] rounded-[2rem] p-6 flex items-center justify-between h-[184px] relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-orange-900/10 to-transparent opacity-50"></div>
               <div className="flex items-center gap-5 relative z-10">
                 <div className="w-16 h-16 rounded-2xl bg-cover bg-center shadow-lg" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200')` }}></div>
                 <div>
                    <p className="font-bold text-xl tracking-tight text-white mb-0.5">Best of Me</p>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-black">NEFFEX</p>
                 </div>
               </div>
               
               <div className="relative z-10 flex items-center gap-6">
                  <div className="flex gap-1.5 opacity-50">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 10 ? 'bg-white' : 'bg-gray-600'}`}></div>
                    ))}
                  </div>
                   <div 
                     onClick={togglePlay}
                     className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer backdrop-blur-md active:scale-95"
                   >
                     {isPlaying ? (
                       <Pause size={18} className="text-white fill-white" />
                     ) : (
                       <Play size={18} className="text-white fill-white ml-1" />
                     )}
                   </div>
               </div>
            </div>
          </div>

          {/* Bottom Right Vertical Cards */}
          <div className="md:col-span-2 bg-[#0f0f11] rounded-[2rem] relative overflow-hidden h-[320px] group shadow-2xl">
             <div className="absolute inset-0 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-1000 opacity-80 group-hover:opacity-100 group-hover:brightness-[1.2] group-hover:contrast-[1.15] group-hover:saturate-[1.2]" 
                  style={{ backgroundImage: `url('/summit_photo.jpg')` }}></div>
             <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
             <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
             {/* Small circular UI elements from photo */}
             <div className="absolute top-1/2 left-3 w-2 h-2 border-2 border-white/40 rounded-full"></div>
             <div className="absolute bottom-24 right-8 w-10 h-10 border border-white/40 rounded-full"></div>
          </div>
          
          <div className="md:col-span-4 bg-[#0f0f11] rounded-[2rem] relative overflow-hidden h-[320px]">
             <div className="absolute inset-0 bg-cover bg-center opacity-90" 
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=800')` }}></div>
             <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f11] via-transparent to-transparent opacity-80"></div>
             <div className="absolute bottom-5 right-5 z-20">
               <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 text-white cursor-pointer hover:bg-white/20 transition-colors">
                 <span className="text-sm">🔇</span>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Horizontal Stats Banner */}
      <div className="w-full border-y border-white/5 bg-[#0a0a0c] py-6 relative z-10 flex flex-col items-center overflow-hidden my-32">
        <div className="flex animate-marquee whitespace-nowrap items-center w-max">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center flex-shrink-0">
              {[
                { value: "15+", label: "Projects Completed" },
                { value: "2020-24", label: "Best Academic Award" },
                { value: "4+", label: "Years of AI/ML Experience" },
              ].map((stat, j) => (
                <React.Fragment key={j}>
                  <div className="flex items-center gap-3 mx-10 group cursor-pointer">
                    <span className="text-3xl md:text-4xl font-light text-white transition-colors duration-500 group-hover:text-gray-500">
                      {stat.value}
                    </span>
                    <span className="text-sm md:text-base font-light text-gray-500 transition-colors duration-500 group-hover:text-white">
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-white/20 text-xl mx-4">•</span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
        
        {/* Tiny connector icon */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border border-white/10 bg-[#0a0a0c] flex items-center justify-center z-20">
          <div className="w-1.5 h-1.5 bg-white/40 rounded-full border border-white/20"></div>
        </div>
      </div>

      {/* Works Section - Separate Horizontal Scroll */}
      <section 
        id="works" 
        ref={worksRef}
        className="w-full h-auto flex flex-col justify-start bg-[#020202] pt-24 md:pt-40 pb-12 overflow-hidden"
      >
        <div className="mb-12 md:mb-32 text-center px-6">
           <h2 className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black mb-4">Portfolio</h2>
           <h3 className="text-3xl sm:text-5xl md:text-8xl font-black italic tracking-tighter text-white uppercase">Selected Works</h3>
        </div>

        <div className="relative group/carousel">
          {/* Navigation Buttons */}
          <button 
            onClick={() => carouselRef.current.scrollBy({ left: -window.innerWidth * 0.7, behavior: 'smooth' })}
            className="absolute left-2 md:left-8 top-[35%] md:top-1/2 -translate-y-1/2 z-40 w-16 h-16 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 text-white items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-white hover:text-black hover:scale-110 cursor-pointer hidden md:flex"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={() => carouselRef.current.scrollBy({ left: window.innerWidth * 0.7, behavior: 'smooth' })}
            className="absolute right-2 md:right-8 top-[35%] md:top-1/2 -translate-y-1/2 z-40 w-16 h-16 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 text-white items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-white hover:text-black hover:scale-110 cursor-pointer hidden md:flex"
          >
            <ChevronRight size={32} />
          </button>

          <div 
            ref={carouselRef}
            className="flex flex-col md:flex-row md:overflow-x-auto gap-12 md:gap-16 px-6 md:px-[calc(50vw-400px)] py-6 hide-scrollbar cursor-grab active:cursor-grabbing md:snap-x md:snap-mandatory md:scroll-px-[20vw] md:md:scroll-px-[calc(50vw-400px)]"
          >
            {[
              { 
                title: "Agentic Drone Surveillance", 
                tag: "AI / COMPUTER VISION", 
                year: "2026", 
                desc: "An agentic AI-powered drone surveillance system that uses real-time object detection with YOLOv8 and Vision Language Models for autonomous threat assessment and tracking.",
                tech: ["LangChain", "YOLOv8", "Django", "React", "Groq", "VLM"],
                img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200" 
              },
              { 
                title: "OpenClaw", 
                tag: "AGENTIC AI", 
                year: "2026", 
                desc: "A powerful agentic AI system integrated directly with WhatsApp, featuring persistent memory, real-time contextual reasoning, and multi-modal tool use.",
                tech: ["Antigravity", "WhatsApp", "Agentic AI", "LLM", "Node.js"],
                img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200" 
              },
              { 
                title: "Agentic Secure SAST", 
                tag: "SECURITY - AI", 
                year: "2026", 
                desc: "An AI-powered Static Application Security Testing system that identifies vulnerabilities and generates automated fix pull requests.",
                tech: ["Langchain", "FastAPI", "Semgrep", "Trivy", "Python"],
                img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1200" 
              },
              { 
                title: "Optimal RAG", 
                tag: "AI INFRASTRUCTURE", 
                year: "2025", 
                desc: "A production-grade Retrieval-Augmented Generation pipeline with dynamic vector indexing, reranking, and semantic chunking.",
                tech: ["Pinecone", "OpenAI", "Next.js", "Python", "Redis"],
                img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200" 
              },
            ].map((work, i) => (
              <div key={i} className="w-full md:min-w-[800px] flex-shrink-0 group cursor-pointer bg-[#0c0c0e] rounded-[2rem] md:rounded-[3.5rem] border border-white/5 overflow-hidden flex flex-col h-[500px] md:h-[70vh] shadow-2xl relative transition-all duration-700 md:snap-center md:snap-always">
                
                {/* Lock Indicator */}
                <div className="absolute top-8 left-8 z-30 opacity-0 group-data-[active=true]:opacity-100 transition-opacity duration-500">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 shadow-xl">
                    <Lock size={14} className="text-[#8be0e5]" />
                    <span className="text-[10px] font-black tracking-[0.3em] text-white uppercase">Focus Lock</span>
                  </div>
                </div>

                {/* Top Image Section */}
                <div className="h-[280px] md:h-[58vh] w-full relative overflow-hidden bg-[#151518]">
                  <div 
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-1000 opacity-100 brightness-[1.1] contrast-[1.1] saturate-[1.2] group-hover:brightness-[1.3]"
                    style={{ backgroundImage: `url(${work.img})` }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-[#0c0c0e]"></div>
                  
                  <div className="absolute top-8 right-8 z-20">
                     <div className="px-6 py-2 rounded-full bg-black/40 backdrop-blur-md text-white font-black text-xs tracking-widest border border-white/10">
                        {work.year}
                     </div>
                  </div>
                </div>

                {/* Bottom Info Section */}
                <div className="p-8 md:p-10 pt-6 flex flex-col flex-grow justify-between bg-gradient-to-b from-[#0c0c0e] to-[#08080a]">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="h-[1px] w-8 bg-[#8be0e5]/40"></div>
                      <p className="text-[10px] font-black tracking-[0.4em] text-[#8be0e5]">{work.tag}</p>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tighter leading-none">{work.title}</h3>
                  </div>
                  
                  {/* Tech & Action */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 pt-4 border-t border-white/5 gap-6">
                    <div className="flex flex-wrap gap-2">
                      {work.tech.map((t, k) => (
                        <span key={k} className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 text-[9px] font-bold tracking-widest border border-white/5 uppercase">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white flex-shrink-0 group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-lg">
                      <ExternalLink size={20} />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* View All Projects Block */}
            <div className="min-w-[80vw] md:min-w-[400px] flex flex-col items-center justify-center border-2 border-white/5 rounded-[3.5rem] border-dashed hover:border-white/20 hover:bg-white/5 transition-all duration-700 group cursor-pointer p-12 snap-center">
               <div className="text-center">
                  <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-10 group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-700 scale-90 group-hover:scale-110 shadow-2xl">
                     <ChevronRight size={40} />
                  </div>
                  <h4 className="text-2xl font-black text-white mb-4">WANT TO SEE MORE?</h4>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-500 group-hover:text-white transition-colors">Browse Archive</p>
               </div>
            </div>
          </div>

          {/* Pagination Dots for Mobile */}
          <div className="flex md:hidden justify-center gap-2 mt-8">
            {[0, 1, 2, 3].map((dot) => (
              <div 
                key={dot} 
                className="w-1.5 h-1.5 rounded-full bg-white/20"
              ></div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Arsenal - The Tools */}
      <section id="tech" ref={techRef} className="bg-[#020202] overflow-hidden border-y border-white/5 min-h-screen flex flex-col justify-center w-full">
        <div style={{ opacity: techReveal }}>
          <h2 className="text-center text-4xl sm:text-5xl md:text-8xl font-black italic tracking-tighter text-white mb-16 md:mb-24">TECH ARSENAL</h2>
          
          <div className="relative flex overflow-hidden">
             <div className="flex gap-10 animate-marquee whitespace-nowrap py-10">
                {['Python', 'TensorFlow', 'PostgreSQL', 'Git', 'Spring Boot', 'WebRTC', 'MySQL', 'Next.js', 'React', 'Node.js', 'Java', 'Docker', 'AWS', 'Supabase'].map((tech, i) => (
                  <div key={i} className="group relative">
                     <div className="w-32 h-40 bg-[#0a0a0c] border border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-6 hover:border-white/50 hover:bg-white/5 transition-all duration-500 hover:-translate-y-4">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                           <Code2 size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">{tech}</span>
                     </div>
                  </div>
                ))}
                {/* Loop items */}
                {['Python', 'TensorFlow', 'PostgreSQL', 'Git', 'Spring Boot', 'WebRTC', 'MySQL', 'Next.js', 'React', 'Node.js', 'Java', 'Docker', 'AWS', 'Supabase'].map((tech, i) => (
                  <div key={i+20} className="group relative">
                     <div className="w-32 h-40 bg-[#0a0a0c] border border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-6 hover:border-white/50 transition-all duration-500 hover:-translate-y-4">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
                           <Code2 size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{tech}</span>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* Experience Timeline */}
      <section id="experience" ref={expRef} className="px-6 max-w-5xl mx-auto min-h-screen flex flex-col justify-center w-full py-10">
        <div className="mb-24">
           <h2 className="text-sm font-black uppercase tracking-[0.5em] text-gray-400 mb-4">Journey</h2>
           <h3 className="text-6xl font-black tracking-tighter">EXPERIENCE</h3>
        </div>

        <div className="space-y-24 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
           {[
             { date: "PRESENT", role: "AI & Full-Stack Developer", company: "Independent", desc: "Building scalable modern web applications and integrating advanced AI/ML capabilities, with a focus on real-time systems and sophisticated backend architectures." },
             { date: "2024", role: "Software Engineer Intern", company: "Satyra IT", desc: "Developed Sentinel Analytics with Spring Boot backend, partitioned PostgreSQL database, and multi-language SDKs." },
             { date: "2023 - 2024", role: "Full-Stack Developer", company: "CodersMeet", desc: "Implemented advanced P2P video chat application with WebRTC, real-time messaging, and Web Audio API for dynamic speaker spotlighting." }
           ].map((job, i) => (
             <div 
               key={i} 
               className="relative pl-16 group"
               style={{ 
                 opacity: expReveal * 1.5,
                 transform: `translateX(${(1 - expReveal) * 30}px)`
               }}
             >
               <div className="absolute left-0 top-1 w-10 h-10 bg-black border-2 border-white/30 rounded-full flex items-center justify-center z-10 group-hover:scale-125 group-hover:border-white transition-all duration-500">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
               </div>
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                  <span className="text-[11px] font-black text-white uppercase tracking-widest bg-white/10 px-4 py-1 rounded-full border border-white/20">{job.date}</span>
                  <h4 className="text-xl font-bold text-gray-500">{job.company}</h4>
               </div>
               <h3 className="text-3xl font-black mb-4 text-gray-200 group-hover:text-white transition-colors">{job.role}</h3>
               <p className="text-gray-400 text-lg font-light leading-relaxed max-w-2xl">{job.desc}</p>
             </div>
           ))}
        </div>
      </section>

      {/* Footer - The Mile Counter */}
      <footer className="px-6 border-t border-white/10 bg-[#020202] relative overflow-hidden min-h-screen flex flex-col justify-center w-full pb-10 pt-20">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-16 relative z-10">
          <div>
            <h2 className="text-7xl md:text-[140px] font-black tracking-tighter text-white leading-[0.8] mb-12">
              THANKS FOR <br /> 
              <span className="text-transparent" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.2)' }}>SCROLLING</span>
            </h2>
            <div className="flex flex-col md:flex-row items-center gap-6">
               <div className="bg-white p-1 rounded-3xl shadow-2xl shadow-white/10">
                  <div className="bg-black backdrop-blur-xl border border-white/20 px-10 py-6 rounded-[1.4rem]">
                    <span className="text-5xl md:text-7xl font-black italic text-glow tracking-tighter">
                       {Math.floor(scrollPixels)}
                    </span>
                    <span className="ml-4 text-2xl font-black uppercase text-gray-400 tracking-widest italic">Pixels!</span>
                  </div>
               </div>
               <div className="text-center md:text-left">
                  <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                    <Zap size={12} className="text-white" /> Interaction Metrics
                  </p>
                  <p className="text-gray-400 text-sm font-light">Calculated with precision from viewport traversal.</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-16 text-right pb-10">
             <div className="flex flex-col gap-6">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">Digital Presence</span>
                {['LinkedIn', 'GitHub', 'X', 'Instagram'].map(link => (
                  <a key={link} href="#" className="text-lg font-bold text-gray-400 hover:text-white transition-all hover:translate-x-[-10px]">{link}</a>
                ))}
             </div>
             <div className="flex flex-col gap-6">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">Site Index</span>
                {['Home', 'Works', 'Tech', 'Contact'].map(link => (
                  <a key={link} href={`#${link.toLowerCase()}`} className="text-lg font-bold text-gray-400 hover:text-white transition-all hover:translate-x-[-10px]">{link}</a>
                ))}
             </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-40 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-white border border-white/10">S</div>
              <span>© 2026 SANDESH SURVASE</span>
           </div>
           <div className="flex gap-8">
              <span className="hover:text-white cursor-pointer">PRIVACY POLICY</span>
              <span className="hover:text-white cursor-pointer">BACK TO TOP</span>
           </div>
           <span>BUILT WITH PASSION & PIXELS</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
