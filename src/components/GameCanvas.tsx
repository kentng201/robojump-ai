
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, Player, Platform } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS, COLORS } from '../constants';
import { playJumpSound } from '../services/audioService';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  robotColor: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  onGameOver, 
  onScoreUpdate,
  robotColor 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Ref to track game state inside event listeners without stale closures
  const gameStateRef = useRef(gameState);
  useEffect(() => {
      gameStateRef.current = gameState;
  }, [gameState]);

  // Mobile detection state
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Simple check for touch capability
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  
  // Game State Refs (using refs to avoid closure staleness in loop)
  const playerRef = useRef<Player>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 100,
    vx: 0,
    vy: 0,
    width: PHYSICS.PLAYER_WIDTH,
    height: PHYSICS.PLAYER_HEIGHT,
    facingRight: true,
  });
  
  const platformsRef = useRef<Platform[]>([]);
  const scoreRef = useRef<number>(0);
  const cameraYRef = useRef<number>(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  
  // Initialize inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    // Touch controls for mobile (Background / Swipe logic)
    const handleTouchStart = (e: TouchEvent) => {
      // CRITICAL FIX: Do not capture touch events if we are in a MENU or GAME_OVER state.
      // This allows buttons (HTML elements overlay) to receive clicks properly.
      if (gameStateRef.current !== GameState.PLAYING) return;

      // Check if target is a button or part of UI
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('[role="button"]')) return;
      
      e.preventDefault(); // Only prevent default scrolling during gameplay
      
      if (e.touches.length > 0) {
        const touchX = e.touches[0].clientX;
        const centerX = window.innerWidth / 2;
        
        if (touchX < centerX) {
          keysRef.current['ArrowLeft'] = true;
          keysRef.current['ArrowRight'] = false;
        } else {
          keysRef.current['ArrowRight'] = true;
          keysRef.current['ArrowLeft'] = false;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameStateRef.current !== GameState.PLAYING) return;
      
      e.preventDefault();
      // Global release for safety
      keysRef.current['ArrowLeft'] = false;
      keysRef.current['ArrowRight'] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Initialize Game
  const initGame = useCallback(() => {
    playerRef.current = {
      x: GAME_WIDTH / 2 - PHYSICS.PLAYER_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      vx: 0,
      vy: PHYSICS.JUMP_FORCE, // Initial pop
      width: PHYSICS.PLAYER_WIDTH,
      height: PHYSICS.PLAYER_HEIGHT,
      facingRight: true,
    };
    
    scoreRef.current = 0;
    cameraYRef.current = 0;
    keysRef.current = {}; // Reset keys
    
    // Create initial platforms
    const initialPlatforms: Platform[] = [];
    // Start platform
    initialPlatforms.push({
      id: 0,
      x: GAME_WIDTH / 2 - 50,
      y: GAME_HEIGHT - 50,
      width: 100,
      height: PHYSICS.PLATFORM_HEIGHT,
      type: 'static',
      vx: 0,
      active: true,
    });

    // Generate some starter platforms
    for (let i = 1; i < 10; i++) {
      initialPlatforms.push(generatePlatform(GAME_HEIGHT - 50 - (i * 100)));
    }
    platformsRef.current = initialPlatforms;
  }, []);

  const generatePlatform = (y: number): Platform => {
    const typeRandom = Math.random();
    let type: 'static' | 'moving' | 'breaking' = 'static';
    
    if (scoreRef.current > 1000 && typeRandom > 0.7) type = 'moving';
    if (scoreRef.current > 2000 && typeRandom > 0.9) type = 'breaking';

    const width = Math.random() * (PHYSICS.PLATFORM_WIDTH_MAX - PHYSICS.PLATFORM_WIDTH_MIN) + PHYSICS.PLATFORM_WIDTH_MIN;
    const x = Math.random() * (GAME_WIDTH - width);

    return {
      id: Math.random(),
      x,
      y,
      width,
      height: PHYSICS.PLATFORM_HEIGHT,
      type,
      vx: type === 'moving' ? (Math.random() > 0.5 ? 2 : -2) : 0,
      active: true,
    };
  };

  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    const player = playerRef.current;
    
    // Physics: Gravity
    player.vy += PHYSICS.GRAVITY;

    // Physics: Horizontal Movement (Acceleration based)
    if (keysRef.current['ArrowLeft']) {
      player.vx -= PHYSICS.ACCELERATION;
      if (player.vx < -PHYSICS.MAX_SPEED) player.vx = -PHYSICS.MAX_SPEED;
      player.facingRight = false;
    } else if (keysRef.current['ArrowRight']) {
      player.vx += PHYSICS.ACCELERATION;
      if (player.vx > PHYSICS.MAX_SPEED) player.vx = PHYSICS.MAX_SPEED;
      player.facingRight = true;
    } else {
      player.vx *= PHYSICS.FRICTION; // Friction
      if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    // Apply movement
    player.x += player.vx;
    player.y += player.vy;

    // Wrap around screen X
    if (player.x + player.width < 0) player.x = GAME_WIDTH;
    if (player.x > GAME_WIDTH) player.x = -player.width;

    // Camera movement (up only)
    if (player.y < GAME_HEIGHT / 2) {
      const diff = (GAME_HEIGHT / 2) - player.y;
      player.y = GAME_HEIGHT / 2;
      cameraYRef.current += diff;
      scoreRef.current += Math.floor(diff);
      onScoreUpdate(scoreRef.current);
      
      // Move platforms down
      platformsRef.current.forEach(p => p.y += diff);
    }

    // Platform Logic
    platformsRef.current.forEach(p => {
      // Move moving platforms
      if (p.type === 'moving') {
        p.x += p.vx;
        if (p.x < 0 || p.x + p.width > GAME_WIDTH) p.vx *= -1;
      }
    });

    // Remove off-screen platforms
    platformsRef.current = platformsRef.current.filter(p => p.y < GAME_HEIGHT);

    // BUG FIX: Safeguard against empty platforms array
    if (platformsRef.current.length === 0) {
       const startY = GAME_HEIGHT;
       for (let y = startY; y > -100; y -= 100) {
           platformsRef.current.push(generatePlatform(y));
       }
    }
    
    const lastPlatform = platformsRef.current[platformsRef.current.length - 1];
    // Check if we need to add new platforms
    if (lastPlatform && lastPlatform.y > 100) {
        // Gap reduces as score gets higher, increasing difficulty
        const gap = Math.max(PHYSICS.PLATFORM_GAP_MIN, PHYSICS.PLATFORM_GAP_MAX - (scoreRef.current / 100));
        platformsRef.current.push(generatePlatform(lastPlatform.y - gap));
    }

    // Collision Detection (Only falling down)
    if (player.vy > 0) {
      platformsRef.current.forEach(p => {
        if (!p.active) return;
        
        // Simple AABB collision for feet
        if (
          player.y + player.height > p.y &&
          player.y + player.height < p.y + p.height + player.vy + 2 && // tolerance
          player.x + player.width > p.x &&
          player.x < p.x + p.width
        ) {
          if (p.type === 'breaking') {
            p.active = false; // Break it
            player.vy = PHYSICS.JUMP_FORCE * 0.5;
            playJumpSound();
          } else {
            // Bounce
            player.vy = PHYSICS.JUMP_FORCE;
            playJumpSound();
          }
        }
      });
    }

    // Game Over
    if (player.y > GAME_HEIGHT) {
      onGameOver(scoreRef.current);
    }

  }, [gameState, onGameOver, onScoreUpdate]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Platforms
    platformsRef.current.forEach(p => {
      if (!p.active) return;
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(p.x + 4, p.y + 4, p.width, p.height);

      if (p.type === 'static') ctx.fillStyle = COLORS.PLATFORM_STATIC;
      else if (p.type === 'moving') ctx.fillStyle = COLORS.PLATFORM_MOVING;
      else if (p.type === 'breaking') ctx.fillStyle = COLORS.PLATFORM_BREAKING;
      
      // Rounded rect style
      ctx.fillRect(p.x, p.y, p.width, p.height);
      
      // Detail lines
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(p.x, p.y, p.width, 4);
    });

    // Draw Player (The Robot)
    const p = playerRef.current;
    
    // Robot Body
    ctx.fillStyle = robotColor;
    ctx.fillRect(p.x, p.y, p.width, p.height);
    
    // Robot Eyes
    ctx.fillStyle = 'white';
    const eyeSize = 8;
    const eyeOffset = p.facingRight ? 4 : -4;
    
    // Left eye
    ctx.fillRect(p.x + p.width/2 - eyeSize - 2 + eyeOffset, p.y + 8, eyeSize, eyeSize);
    // Right eye
    ctx.fillRect(p.x + p.width/2 + 2 + eyeOffset, p.y + 8, eyeSize, eyeSize);
    
    // Antenna
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x + p.width / 2, p.y);
    ctx.lineTo(p.x + p.width / 2, p.y - 10);
    ctx.stroke();
    
    // Antenna Bulb
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(p.x + p.width / 2, p.y - 12, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Robot Legs (Animated slightly based on vy)
    const legLength = p.vy < 0 ? 5 : 10; // Retract legs when jumping
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(p.x + 5, p.y + p.height, 8, legLength);
    ctx.fillRect(p.x + p.width - 13, p.y + p.height, 8, legLength);

  }, [robotColor]);

  const loop = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  // Handle Game State Changes
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      if (playerRef.current.y > GAME_HEIGHT) {
         initGame();
      }
    }
    
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, loop, initGame]);

  // Init on mount if already playing (mostly for HMR or resets)
  useEffect(() => {
    if (gameState === GameState.MENU) {
        initGame();
        // Draw once for menu background
        const tId = setTimeout(() => draw(), 100);
        return () => clearTimeout(tId);
    }
  }, [gameState, initGame, draw]);

  // Button handlers for on-screen controls
  const handleBtnStart = (direction: 'ArrowLeft' | 'ArrowRight') => (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation(); // Stop window touch listeners
    // e.preventDefault(); // Optional, might block scrolling
    keysRef.current['ArrowLeft'] = direction === 'ArrowLeft';
    keysRef.current['ArrowRight'] = direction === 'ArrowRight';
  };
  
  const handleBtnEnd = (e: React.TouchEvent | React.MouseEvent) => {
     e.stopPropagation();
     keysRef.current['ArrowLeft'] = false;
     keysRef.current['ArrowRight'] = false;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900 rounded-lg shadow-2xl ring-4 ring-gray-800">
        <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="block w-full h-full object-contain"
        style={{ maxHeight: '100vh', maxWidth: '500px', touchAction: 'none' }}
        />
        
        {/* Mobile Controls Overlay */}
        {isTouchDevice && gameState === GameState.PLAYING && (
            <>
                <button
                    className="absolute bottom-6 left-6 w-20 h-20 bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors z-30 border-2 border-white/30"
                    onTouchStart={handleBtnStart('ArrowLeft')}
                    onTouchEnd={handleBtnEnd}
                    onMouseDown={handleBtnStart('ArrowLeft')}
                    onMouseUp={handleBtnEnd}
                    onMouseLeave={handleBtnEnd}
                    aria-label="Move Left"
                >
                    <svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                <button
                    className="absolute bottom-6 right-6 w-20 h-20 bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors z-30 border-2 border-white/30"
                    onTouchStart={handleBtnStart('ArrowRight')}
                    onTouchEnd={handleBtnEnd}
                    onMouseDown={handleBtnStart('ArrowRight')}
                    onMouseUp={handleBtnEnd}
                    onMouseLeave={handleBtnEnd}
                    aria-label="Move Right"
                >
                    <svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </button>
            </>
        )}
    </div>
  );
};
