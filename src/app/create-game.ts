import Phaser from 'phaser';
import { LobbyScene } from '../scenes/LobbyScene';
import { MatchScene } from '../scenes/MatchScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { gameConfig } from './game-config';

export function createGame(): Phaser.Game {
  return new Phaser.Game({
    ...gameConfig,
    scene: [PreloadScene, LobbyScene, MatchScene],
  });
}
