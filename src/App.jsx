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

  const respond = (text) => {
    setAiResponse(text);
    addLog(`AI: ${text}`);
    setTimeout(() => setAiResponse(''), 3000);
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
      respond('Opening YouTube.');
      window.open(COMMANDS.YOUTUBE, '_blank');
    } else if (cmd.includes('open google')) {
      respond('Opening Google Search.');
      window.open(COMMANDS.GOOGLE, '_blank');
    } else if (cmd.includes('open spotify')) {
      respond('Launching Spotify.');
      window.open(COMMANDS.SPOTIFY, '_blank');
    } else if (cmd.includes('open github')) {
      respond('Accessing GitHub repositories.');
      window.open(COMMANDS.GITHUB, '_blank');
    } else if (cmd.includes('open netflix')) {
      respond('Initiating Netflix.');
      window.open(COMMANDS.NETFLIX, '_blank');
    } else if (cmd.includes('open chatgpt')) {
      respond('Connecting to AI Neural Link.');
      window.open(COMMANDS.CHATGPT, '_blank');
    } else if (cmd.includes('open calculator')) {
      respond('Opening System Calculator.');
      window.open(COMMANDS.CALCULATOR, '_blank');
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
      respond('Playing Believer by Imagine Dragons.');
      setMusicTrack('Believer - Imagine Dragons');
      setIsPlaying(true);
      window.open(MUSIC_TRACKS.BELIEVER, '_blank');
    } else if (cmd.includes('play relaxing music')) {
      respond('Playing soothing ambient tracks.');
      setMusicTrack('Ambient Meditations');
      setIsPlaying(true);
      window.open(MUSIC_TRACKS.RELAXING, '_blank');
    } else if (cmd.includes('play lo-fi beats')) {
      respond('Playing Lo-Fi Study Beats.');
      setMusicTrack('Lofi Hip Hop Radio');
      setIsPlaying(true);
      window.open(MUSIC_TRACKS['LO-FI'], '_blank');
    } else if (cmd.includes('play cinematic music')) {
      respond('Playing Orchestral Epic tracks.');
      setMusicTrack('Cinematic Masterpieces');
      setIsPlaying(true);
      window.open(MUSIC_TRACKS.CINEMATIC, '_blank');
    } else if (cmd.includes('pause music') || cmd.includes('stop music')) {
      respond('Music playback suspended.');
      setIsPlaying(false);
    } else {
      respond("Command recognized. Executing...");
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
                  className="absolute bottom-1/4 glass-panel px-8 py-4 neon-border-cyan"
                >
                  <p className="text-xl font-medium text-cyan-300 neon-text-cyan tracking-wide italic">
                    "{aiResponse}"
                  </p>
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
    </div>
  );
}
