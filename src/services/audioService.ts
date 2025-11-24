
// Web Audio API Service for synthesising sounds without external assets

let audioCtx: AudioContext | null = null;
let isMuted = false;
let bgmOscillators: OscillatorNode[] = [];
let bgmGain: GainNode | null = null;

// Initialize Audio Context (must be called after user interaction)
export const initAudio = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const toggleMute = (mute: boolean) => {
  isMuted = mute;
  if (!audioCtx) return;
  
  if (isMuted) {
    if (bgmGain) bgmGain.disconnect();
  } else {
    if (bgmGain) bgmGain.connect(audioCtx.destination);
  }
};

export const getMuted = () => isMuted;

export const playJumpSound = () => {
  if (isMuted || !audioCtx) return;
  
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    // Jump 'pew' sound - rapid frequency ramp up
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.1);
    
    // Volume envelope
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playGameOverSound = () => {
    if (isMuted || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
};

export const startMusic = () => {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;
  
  // Prevent multiple BGM stacks
  if (bgmOscillators.length > 0) return;

  try {
    // Simple ambient drone
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const lfo = audioCtx.createOscillator();
    bgmGain = audioCtx.createGain();
    const lfoGain = audioCtx.createGain();

    // Osc 1: Low Drone
    osc1.type = 'triangle';
    osc1.frequency.value = 110; // A2

    // Osc 2: Harmony
    osc2.type = 'sine';
    osc2.frequency.value = 164.81; // E3

    // LFO for slight movement
    lfo.type = 'sine';
    lfo.frequency.value = 0.5; // 0.5 Hz
    lfoGain.gain.value = 50; // Modulate frequency by 50Hz

    lfo.connect(lfoGain);
    // lfoGain.connect(osc1.frequency); // Optional modulation

    // Mix
    bgmGain.gain.value = 0.05; // Keep it quiet

    osc1.connect(bgmGain);
    osc2.connect(bgmGain);
    bgmGain.connect(audioCtx.destination);

    osc1.start();
    osc2.start();
    lfo.start();

    bgmOscillators = [osc1, osc2, lfo];
  } catch (e) {
    console.error("BGM failed", e);
  }
};

export const stopMusic = () => {
  bgmOscillators.forEach(o => {
      try { o.stop(); } catch(e) {}
  });
  bgmOscillators = [];
  if (bgmGain) {
      try { bgmGain.disconnect(); } catch(e) {}
      bgmGain = null;
  }
};
