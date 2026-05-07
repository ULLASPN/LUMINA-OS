import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Float, 
  MeshDistortMaterial, 
  Sphere, 
  Stars, 
  Text, 
  PresentationControls,
  PerspectiveCamera,
  Environment,
  OrbitControls,
  MeshWobbleMaterial
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

// --- Constants & Commands ---
const COMMANDS = {
  YOUTUBE: 'https://www.youtube.com',
  GOOGLE: 'https://www.google.com',
  SPOTIFY: 'https://open.spotify.com',
  GITHUB: 'https://github.com',
  NETFLIX: 'https://www.netflix.com',
  CHATGPT: 'https://chat.openai.com',
  CALCULATOR: 'https://www.google.com/search?q=calculator',
};

const MUSIC_TRACKS = {
  'BELIEVER': 'https://www.youtube.com/results?search_query=believer+imagine+dragons',
  'RELAXING': 'https://www.youtube.com/results?search_query=relaxing+music',
  'LO-FI': 'https://www.youtube.com/results?search_query=lofi+hip+hop',
  'CINEMATIC': 'https://www.youtube.com/results?search_query=cinematic+music',
};

const CONTACTS = {
  "ullas": "+916361258145",
  "aryan": "+919142817966",
  "akshata": "+919980965961",
  "ganesh": "+918197900121"
};

// --- 3D Components ---

const ParticleField = ({ count = 2000, dreamMode }) => {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 50;
      p[i * 3 + 1] = (Math.random() - 0.5) * 50;
      p[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return p;
  }, [count]);

  const pointsRef = useRef();
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = time * 0.05;
    pointsRef.current.rotation.x = time * 0.02;
    if (dreamMode) {
      pointsRef.current.scale.setScalar(1 + Math.sin(time) * 0.2);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={dreamMode ? "#a78bfa" : "#06b6d4"}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

const FloatingGrid = ({ dreamMode }) => {
  const gridRef = useRef();
  useFrame((state) => {
    gridRef.current.position.z = (state.clock.getElapsedTime() * 2) % 2;
  });

  return (
    <group ref={gridRef}>
      <gridHelper 
        args={[100, 50, dreamMode ? "#8b5cf6" : "#06b6d4", dreamMode ? "#4c1d95" : "#083344"]} 
        position={[0, -5, 0]} 
        rotation={[0, 0, 0]}
      />
    </group>
  );
};

const AIOrb = ({ active, dreamMode }) => {
  const orbRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    orbRef.current.position.y = Math.sin(t) * 0.2;
    ring1Ref.current.rotation.z = t * 0.5;
    ring1Ref.current.rotation.x = t * 0.3;
    ring2Ref.current.rotation.z = -t * 0.8;
    ring2Ref.current.rotation.y = t * 0.4;
    
    if (active) {
      orbRef.current.scale.setScalar(1.2 + Math.sin(t * 10) * 0.1);
    } else {
      orbRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <Sphere ref={orbRef} args={[1, 64, 64]}>
          <MeshDistortMaterial
            color={dreamMode ? "#8b5cf6" : "#06b6d4"}
            speed={3}
            distort={0.4}
            radius={1}
            emissive={dreamMode ? "#4c1d95" : "#083344"}
            emissiveIntensity={2}
          />
        </Sphere>
      </Float>

      {/* Holographic Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.5, 0.02, 16, 100]} />
        <meshStandardMaterial color={dreamMode ? "#a78bfa" : "#22d3ee"} emissive={dreamMode ? "#a78bfa" : "#22d3ee"} emissiveIntensity={5} transparent opacity={0.5} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.8, 0.01, 16, 100]} />
        <meshStandardMaterial color={dreamMode ? "#c4b5fd" : "#67e8f9"} emissive={dreamMode ? "#c4b5fd" : "#67e8f9"} emissiveIntensity={3} transparent opacity={0.3} />
      </mesh>

      <pointLight intensity={10} color={dreamMode ? "#a78bfa" : "#06b6d4"} distance={10} />
    </group>
  );
};

// --- UI Components ---

const GlassCard = ({ children, className = "", title = "" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass-panel p-6 neon-border-cyan ${className}`}
  >
    {title && <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
      {title}
    </h3>}
    {children}
  </motion.div>
);

const Terminal = ({ logs }) => (
  <div className="font-mono text-xs text-cyan-300/80 space-y-1 h-48 overflow-y-auto scroll-smooth">
    {logs.map((log, i) => (
      <div key={i} className="flex gap-2">
        <span className="text-violet-400">[SYSTEM]</span>
        <span className={log.startsWith('>') ? 'text-white' : ''}>{log}</span>
      </div>
    ))}
  </div>
);

const MusicPlayer = ({ track, isPlaying }) => (
  <div className="flex items-center gap-4">
    <div className="relative w-12 h-12 flex items-end justify-center gap-1">
      {[...Array(5)].map((_, i) => (
        <div 
          key={i} 
          className="music-bar" 
          style={{ animationDelay: `${i * 0.15}s`, animationPlayState: isPlaying ? 'running' : 'paused' }} 
        />
      ))}
    </div>
    <div>
      <p className="text-xs text-cyan-500 uppercase tracking-tighter">Now Playing</p>
      <p className="text-sm font-bold text-white truncate w-32">{track || 'System Idle'}</p>
    </div>
  </div>
);

const StartupSequence = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      <div className="relative w-64 h-64">
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"
        />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-t-4 border-cyan-400 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)]"
        />
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-black tracking-tighter text-cyan-400 neon-text-cyan"
          >
            JARVIS
          </motion.h1>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "60%" }}
            transition={{ delay: 1, duration: 2 }}
            className="h-1 bg-cyan-400 mt-2"
          />
          <p className="text-[10px] mt-2 text-cyan-600 font-mono">INITIALIZING SYSTEM v2.0.4...</p>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [booted, setBooted] = useState(false);
  const [dreamMode, setDreamMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [commandLog, setCommandLog] = useState(['JARVIS OS Online', 'Awaiting command...']);
  const [musicTrack, setMusicTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [pendingUrl, setPendingUrl] = useState(null);
  const [systemState, setSystemState] = useState('online'); 
  const [isLocked, setIsLocked] = useState(true);
  const videoRef = useRef(null);
  
  // Cursor Trail
  const cursorRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.5,
          ease: "power2.out"
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Hand Gesture Detection (Disabled for Manual Demo)
  useEffect(() => {
    // MediaPipe detection removed for stable manual demo
  }, [isLocked]);

  // Voice Recognition Setup
  const recognition = useMemo(() => {
    if (!window.webkitSpeechRecognition && !window.SpeechRecognition) return null;
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';
    return rec;
  }, []);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event) => {
      const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
      handleVoiceCommand(command);
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    return () => recognition.stop();
  }, [recognition]);

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const addLog = (msg) => setCommandLog(prev => [msg, ...prev].slice(0, 50));

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    
    // Voices load asynchronously in some browsers
    const voices = window.speechSynthesis.getVoices();
    const jarvisVoice = voices.find(v => v.name.includes('English') && (v.name.includes('Male') || v.name.includes('UK')));
    if (jarvisVoice) utterance.voice = jarvisVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  const respond = (text, url = null) => {
    setAiResponse(text);
    setPendingUrl(url);
    addLog(`AI: ${text}`);
    speak(text); 
    
    if (url) {
      // Attempt automatic open (might be blocked)
      const win = window.open(url, '_blank');
      if (!win) {
        addLog("System: Popup blocked. Please use manual launch button.");
      }
    }

    setTimeout(() => {
      setAiResponse('');
      setPendingUrl(null);
    }, 5000); // Keep open longer for manual click if blocked
  };

  const handleVoiceCommand = (rawCmd) => {
    let cmd = rawCmd.toLowerCase();
    
    // Check for "Jarvis" wake word or prefix
    if (cmd.includes('jarvis')) {
      cmd = cmd.replace('jarvis', '').trim();
    } else {
      // If the user didn't say Jarvis, we ignore it or just log it as background noise
      // For this demo, let's allow it but prefix the log
    }

    addLog(`> ${rawCmd}`);
    
    if (cmd === "") {
      respond("Yes, sir? How can I help you?");
      return;
    }
    
    // Web Navigation
    if (cmd.includes('open youtube')) {
      respond('Opening YouTube.', COMMANDS.YOUTUBE);
    } else if (cmd.includes('open google')) {
      respond('Opening Google Search.', COMMANDS.GOOGLE);
    } else if (cmd.includes('open spotify')) {
      respond('Launching Spotify.', COMMANDS.SPOTIFY);
    } else if (cmd.includes('open github')) {
      respond('Accessing GitHub repositories.', COMMANDS.GITHUB);
    } else if (cmd.includes('open netflix')) {
      respond('Initiating Netflix.', COMMANDS.NETFLIX);
    } else if (cmd.includes('open chatgpt')) {
      respond('Connecting to AI Neural Link.', COMMANDS.CHATGPT);
    } else if (cmd.includes('open calculator')) {
      respond('Opening System Calculator.', COMMANDS.CALCULATOR);
    }
    
    // System Commands
    else if (cmd.includes('activate dream mode')) {
      respond('Dream Mode sequence initiated.');
      setDreamMode(true);
    } else if (cmd.includes('deactivate dream mode') || cmd.includes('exit dream mode')) {
      respond('Exiting Dream Mode. Returning to standard UI.');
      setDreamMode(false);
    } else if (cmd.includes('open dashboard')) {
      respond('Displaying holographic dashboard.');
    } else if (cmd.includes('start scan')) {
      respond('Scanning local environment for anomalies...');
    } else if (cmd.includes('open galaxy view')) {
      respond('Mapping stellar coordinates.');
    } else if (cmd.includes('launch simulation')) {
      respond('Loading simulation kernel v.X72.');
    }
    
    // Music Commands
    else if (cmd.includes('play believer')) {
      setMusicTrack('Believer - Imagine Dragons');
      setIsPlaying(true);
      respond('Playing Believer by Imagine Dragons.', MUSIC_TRACKS.BELIEVER);
    } else if (cmd.includes('play relaxing music')) {
      setMusicTrack('Ambient Meditations');
      setIsPlaying(true);
      respond('Playing soothing ambient tracks.', MUSIC_TRACKS.RELAXING);
    } else if (cmd.includes('play lo-fi beats')) {
      setMusicTrack('Lofi Hip Hop Radio');
      setIsPlaying(true);
      respond('Playing Lo-Fi Study Beats.', MUSIC_TRACKS['LO-FI']);
    } else if (cmd.includes('play cinematic music')) {
      setMusicTrack('Cinematic Masterpieces');
      setIsPlaying(true);
      respond('Playing Orchestral Epic tracks.', MUSIC_TRACKS.CINEMATIC);
    } else if (cmd.includes('pause music') || cmd.includes('stop music')) {
      respond('Music playback suspended.');
      setIsPlaying(false);
    } 
    
    // WhatsApp Messaging
    else if (cmd.includes('message')) {
      const contactName = Object.keys(CONTACTS).find(name => cmd.includes(name));
      if (contactName) {
        const phone = CONTACTS[contactName];
        respond(`Opening WhatsApp to message ${contactName}.`);
        window.open(`https://web.whatsapp.com/send?phone=${phone}`, '_blank');
      } else {
        respond("Contact not found in neural database.");
      }
    }

    // System Controls (Cinematic Simulation)
    else if (cmd.includes('shutdown')) {
      respond("Initiating full system shutdown. Goodbye, sir.");
      setTimeout(() => setSystemState('shutdown'), 2000);
    } else if (cmd.includes('restart')) {
      respond("Rebooting JARVIS core systems.");
      setTimeout(() => {
        setSystemState('restarting');
        setTimeout(() => window.location.reload(), 3000);
      }, 2000);
    }
    
    else {
      // Stay silent for unknown commands or just log them
      addLog(`System: Unknown command structure detected.`);
    }
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${dreamMode ? 'bg-purple-950/20' : 'bg-black'}`}>
      <AnimatePresence>
        {!booted && <StartupSequence onComplete={() => setBooted(true)} />}
      </AnimatePresence>

      {/* Interactive Cursor Trail */}
      <div 
        ref={cursorRef}
        className="fixed w-8 h-8 pointer-events-none z-[9999] rounded-full border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
      >
        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
      </div>

      {/* Background Visuals */}
      <div className="fixed inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
          <Suspense fallback={null}>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <ParticleField count={dreamMode ? 4000 : 2000} dreamMode={dreamMode} />
            <FloatingGrid dreamMode={dreamMode} />
            <AIOrb active={isListening} dreamMode={dreamMode} />
            
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
            <Environment preset="city" />
            
            <EffectComposer>
              <Bloom intensity={1.5} luminanceThreshold={0.2} radius={0.4} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>

      {/* HUD & UI Layout */}
      {booted && (
        <div className="relative z-10 w-full h-full p-8 flex flex-col justify-between pointer-events-none">
          
          {/* Top Bar */}
          <div className="flex justify-between items-start pointer-events-auto">
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/50 rounded-full flex items-center justify-center neon-border-cyan">
                <span className="font-black text-xl text-cyan-400">L</span>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-widest text-cyan-400 neon-text-cyan">JARVIS</h1>
                <p className="text-[10px] font-mono text-cyan-600/80 tracking-[0.2em]">KINETIC NEURAL INTERFACE v2.0</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-right"
            >
              <p className="text-xs font-mono text-cyan-400">SESSION ID: #LX-9902</p>
              <p className="text-sm font-bold text-white tracking-widest">
                {new Date().toLocaleTimeString()}
              </p>
              <div className="flex gap-2 justify-end mt-2">
                <span className={`w-2 h-2 rounded-full ${dreamMode ? 'bg-violet-400 shadow-[0_0_10px_#a78bfa]' : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'}`} />
                <span className="text-[10px] text-cyan-500 uppercase">{dreamMode ? 'DREAM MODE ACTIVE' : 'SYSTEM NOMINAL'}</span>
              </div>
            </motion.div>
          </div>

          {/* Center Visual/Voice */}
          <div className="flex-1 flex items-center justify-center relative">
            <AnimatePresence>
              {aiResponse && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1, y: -20 }}
                  className="absolute bottom-1/4 glass-panel px-8 py-4 neon-border-cyan flex flex-col items-center gap-4"
                >
                  <p className="text-xl font-medium text-cyan-300 neon-text-cyan tracking-wide italic">
                    "{aiResponse}"
                  </p>
                  {pendingUrl && (
                    <motion.a 
                      href={pendingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-6 py-2 bg-cyan-500/20 border border-cyan-400 text-cyan-400 text-xs font-bold uppercase tracking-widest rounded-full hover:bg-cyan-500 hover:text-white transition-all pointer-events-auto"
                    >
                      Click to Launch App
                    </motion.a>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-10 flex flex-col items-center gap-4 pointer-events-auto">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isListening 
                    ? 'bg-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.8)]' 
                    : 'bg-cyan-500/10 border border-cyan-500/50 backdrop-blur-md'
                }`}
              >
                {isListening ? (
                  <div className="flex gap-1 items-center h-6">
                    <motion.div animate={{ height: [8, 24, 8] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white" />
                    <motion.div animate={{ height: [12, 32, 12] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-1 bg-white" />
                    <motion.div animate={{ height: [8, 24, 8] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-1 bg-white" />
                  </div>
                ) : (
                  <svg className="w-8 h-8 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                )}
              </motion.button>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.4em]">
                {isListening ? 'LISTENING...' : 'TAP TO TRANSMIT'}
              </p>
            </div>
          </div>

          {/* Bottom Grid Layout */}
          <div className="grid grid-cols-12 gap-6 items-end pointer-events-auto">
            
            {/* Left: Terminal */}
            <div className="col-span-3">
              <GlassCard title="Command Stream" className="h-64">
                <Terminal logs={commandLog} />
              </GlassCard>
            </div>

            {/* Center: Quick Links / Apps */}
            <div className="col-span-6 flex flex-wrap justify-center gap-4 pb-4">
              {Object.keys(COMMANDS).map((key) => (
                <motion.button
                  key={key}
                  whileHover={{ y: -5, scale: 1.05 }}
                  onClick={() => handleVoiceCommand(`open ${key.toLowerCase()}`)}
                  className="btn-futuristic flex flex-col items-center gap-2 min-w-[100px]"
                >
                  <span className="text-[10px] font-bold text-cyan-400 tracking-widest">{key}</span>
                  <div className="w-1 h-1 bg-cyan-400 rounded-full" />
                </motion.button>
              ))}
            </div>

            {/* Right: Status & Music */}
            <div className="col-span-3 space-y-4">
              <GlassCard title="Network Diagnostics">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-cyan-600">ENCRYPTION</span>
                    <span className="text-cyan-400">AES-256-GCM</span>
                  </div>
                  <div className="w-full bg-cyan-900/30 h-1 rounded-full overflow-hidden">
                    <motion.div animate={{ width: ['20%', '80%', '40%', '90%'] }} transition={{ duration: 10, repeat: Infinity }} className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                  </div>
                  <div className="flex justify-between text-[10px] pt-1">
                    <span className="text-cyan-600">NEURAL LINK</span>
                    <span className="text-cyan-400">STABLE</span>
                  </div>
                  <div className="w-full bg-cyan-900/30 h-1 rounded-full overflow-hidden">
                    <motion.div animate={{ width: ['90%', '95%', '88%', '92%'] }} transition={{ duration: 5, repeat: Infinity }} className="h-full bg-violet-400 shadow-[0_0_10px_#a78bfa]" />
                  </div>
                </div>
              </GlassCard>

              <GlassCard title="Media Controller">
                <MusicPlayer track={musicTrack} isPlaying={isPlaying} />
              </GlassCard>
            </div>

          </div>
        </div>
      )}

      {/* Scanning Effect Overlay */}
      <div className="scanline" />
      <div className="fixed inset-0 pointer-events-none hologram-grid opacity-20" />

      {/* Shutdown Overlay */}
      <AnimatePresence>
        {systemState !== 'online' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center"
          >
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-cyan-500 font-mono text-xl tracking-[0.5em]"
            >
              {systemState === 'shutdown' ? 'SYSTEM SHUTDOWN' : 'REBOOTING SYSTEM...'}
            </motion.div>
            <div className="mt-8 w-64 h-1 bg-cyan-900 overflow-hidden">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-full h-full bg-cyan-400"
              />
            </div>
            {systemState === 'shutdown' && (
              <button 
                onClick={() => setSystemState('online')}
                className="mt-12 text-xs text-cyan-800 hover:text-cyan-400 transition-colors pointer-events-auto"
              >
                [ EMERGENCY OVERRIDE ]
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Lock Screen Overlay */}
      <AnimatePresence>
        {isLocked && booted && (
          <motion.div 
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center"
          >
            <div className="relative w-80 h-80 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-cyan-500/30 rounded-full"
              />
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setIsLocked(false); respond("Biometric scan complete. Welcome back, sir."); }}
                className="w-48 h-48 border-4 border-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.5)] bg-cyan-500/10 pointer-events-auto cursor-pointer"
              >
                <div className="text-6xl animate-pulse">👋</div>
              </motion.button>
            </div>
            
            <h2 className="mt-12 text-2xl font-black tracking-[0.3em] text-cyan-400 neon-text-cyan">
              BIOMETRIC LOCK ACTIVE
            </h2>
            <p className="mt-4 text-cyan-600 font-mono text-sm uppercase tracking-widest animate-pulse">
              TAP SENSOR TO UNLOCK JARVIS
            </p>

            <button 
              onClick={() => { setIsLocked(false); respond("Manual override accepted."); }}
              className="mt-8 px-4 py-2 border border-cyan-900 text-[10px] text-cyan-800 hover:text-cyan-400 transition-all pointer-events-auto"
            >
              [ MANUAL OVERRIDE ]
            </button>

            {/* Hidden Video for Detection */}
            <video ref={videoRef} className="hidden" playsInline muted />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
