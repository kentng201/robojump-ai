import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Button } from './components/Button';
import { GameState, RobotPersona } from './types';
import { generateRobotPersona, generateGameOverMessage } from './services/geminiService';
import { GoogleGenAI } from "@google/genai"; // Import purely for typing if needed, but we use the service

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  console.log('gameState: ', gameState);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Robot Persona State
  const [persona, setPersona] = useState<RobotPersona | null>(null);
  const [loadingPersona, setLoadingPersona] = useState(false);
  
  // Game Over Message
  const [gameOverMsg, setGameOverMsg] = useState<string>("");

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem('roboJumpHighscore');
    if (saved) setHighScore(parseInt(saved, 10));
    
    // Pre-fetch persona on load
    fetchNewPersona();
  }, []);

  const fetchNewPersona = async () => {
    setLoadingPersona(true);
    const p = await generateRobotPersona();
    console.log('p: ', p);
    setPersona(p);
    setLoadingPersona(false);
  };

  const handleStartGame = () => {
    setScore(0);
    setGameState(GameState.PLAYING);
    setGameOverMsg("");
  };

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
  };

  const handleGameOver = async (finalScore: number) => {
    setGameState(GameState.GAME_OVER);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('roboJumpHighscore', finalScore.toString());
    }
    
    // Generate commentary
    const msg = await generateGameOverMessage(finalScore, persona?.name || "Robot");
    setGameOverMsg(msg);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white font-sans p-4 relative">
      
      {/* Header / Score Display */}
      <div className="absolute top-4 left-0 right-0 flex justify-between px-6 max-w-[500px] mx-auto z-10 w-full pointer-events-none">
        <div className="bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-emerald-500/30">
          <span className="text-gray-400 text-xs uppercase tracking-wider block">Score</span>
          <span className="text-2xl font-bold text-white font-mono">{score}</span>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-500/30">
          <span className="text-gray-400 text-xs uppercase tracking-wider block">High Score</span>
          <span className="text-xl font-bold text-purple-300 font-mono">{highScore}</span>
        </div>
      </div>

      {/* Main Game Canvas Container */}
      <div className="relative w-full max-w-[500px] aspect-[2/3]">
        <GameCanvas 
          gameState={gameState}
          onGameOver={handleGameOver}
          onScoreUpdate={handleScoreUpdate}
          robotColor={persona?.color || '#34D399'}
        />

        {/* MENU OVERLAY */}
        {gameState === GameState.MENU && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-lg z-20">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2 drop-shadow-lg">
              ROBO JUMP
            </h1>
            <p className="text-gray-400 mb-8 tracking-widest text-sm">VERTICAL AI PROTOCOL</p>
            
            <div className="bg-gray-800/90 p-6 rounded-xl border border-gray-700 max-w-sm w-full mb-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-purple-500 to-emerald-500 animate-pulse"></div>
              {loadingPersona ? (
                <div className="flex flex-col items-center py-8">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-emerald-400 text-sm animate-pulse">Fabricating Robot Persona...</p>
                </div>
              ) : persona ? (
                <>
                  {/* Character Preview */}
                  <div className="flex justify-center mt-2 mb-6">
                    <div className="relative">
                        {/* Antenna */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-3 bg-gray-400"></div>
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                        
                        {/* Body */}
                        <div 
                          className="w-12 h-12 relative shadow-xl ring-2 ring-white/10"
                          style={{ backgroundColor: persona.color }}
                        >
                            {/* Eyes */}
                            <div className="absolute top-3 left-2 w-2.5 h-2.5 bg-white shadow-sm"></div>
                            <div className="absolute top-3 right-2 w-2.5 h-2.5 bg-white shadow-sm"></div>
                        </div>

                        {/* Legs */}
                        <div className="flex justify-between w-12 px-1.5 absolute -bottom-2">
                            <div className="w-2 h-3 bg-gray-600"></div>
                            <div className="w-2 h-3 bg-gray-600"></div>
                        </div>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-white mb-1">{persona.name}</h2>
                  <p className="text-gray-300 text-sm italic mb-4">"{persona.mission}"</p>
                  
                  <button 
                    onClick={fetchNewPersona}
                    className="mt-2 text-xs text-gray-500 hover:text-emerald-400 transition-colors flex items-center justify-center w-full gap-1 py-2 border-t border-gray-700/50"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Change character
                  </button>
                </>
              ) : (
                <p className="text-red-400">Persona module offline.</p>
              )}
            </div>

            <Button onClick={handleStartGame} disabled={loadingPersona} className="w-full max-w-xs text-lg">
              START!
            </Button>
            
            <p className="mt-6 text-xs text-gray-500">
              Controls: Arrow Keys or Touch Sides
            </p>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center rounded-lg z-20">
            <h2 className="text-4xl font-bold text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              CRITICAL FAILURE
            </h2>
            
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 mb-8 w-full max-w-xs">
               <div className="mb-4">
                 <span className="block text-gray-500 text-xs uppercase">Final Altitude</span>
                 <span className="text-4xl font-mono font-bold text-white">{score}</span>
               </div>
               
               <div className="border-t border-gray-800 pt-4">
                  <span className="block text-xs text-purple-400 mb-1">AI Analysis:</span>
                  {gameOverMsg ? (
                    <p className="text-sm text-gray-300 italic">"{gameOverMsg}"</p>
                  ) : (
                     <div className="h-4 w-24 bg-gray-800 rounded animate-pulse mx-auto"></div>
                  )}
               </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button onClick={handleStartGame} variant="primary">
                  RETRY MISSION
                </Button>
                <Button onClick={() => setGameState(GameState.MENU)} variant="secondary">
                  RETURN TO BASE
                </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-gray-600 text-xs max-w-md">
        Powered by React, Tailwind, and Google Gemini.
      </div>
    </div>
  );
};

export default App;