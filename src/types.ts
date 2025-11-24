export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facingRight: boolean;
}

export interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'static' | 'moving' | 'boost';
  vx: number; // For moving platforms
  active: boolean; // Kept for compatibility, though boost/static/moving usually stay active
}

export interface RobotPersona {
  name: string;
  mission: string;
  color: string;
}

export interface GameConfig {
  gravity: number;
  jumpForce: number;
  moveSpeed: number;
  width: number;
  height: number;
}