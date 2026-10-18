import Phaser from 'phaser';
import { BoardView } from '../features/match/BoardView';
import { MatchHud } from '../features/match/MatchHud';
import { DemoTransport } from '../features/match/demo-transport';
import { MatchSession } from '../features/match/match-session';
import { SocketClient } from '../network/socket-client';

export class MatchScene extends Phaser.Scene {
  constructor() {
    super('match');
  }

  create(): void {
    const url = import.meta.env.VITE_GAME_SERVER_URL as string | undefined;
    const matchId = (import.meta.env.VITE_MATCH_ID as string | undefined) || 'preview-room';
    const session = new MatchSession(url ? new SocketClient(url) : new DemoTransport(), matchId);
    const board = new BoardView(this, (entityId, position) => {
      session.dispatch({ kind: 'move', entityId, position });
    });
    const hud = new MatchHud(this, Boolean(url));
    const unsubscribe = session.subscribe(view => {
      board.render(view.state?.entities ?? [], view.playerId,
        view.status === 'connected' && view.state?.phase === 'playing');
      hud.render(view);
    });

    this.add.text(770, 65, '대기실로  ↗', {
      fontFamily: 'Arial', fontSize: '18px', color: '#cbd5e1',
    }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('lobby'));

    const cleanup = () => {
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
      this.events.off(Phaser.Scenes.Events.DESTROY, cleanup);
      unsubscribe();
      session.dispose();
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
    session.connect();
  }
}
