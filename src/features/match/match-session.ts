import type { ConnectionStatus, MatchTransport } from '../../network/transport';
import type { GameAction, MatchState } from './match-types';

export interface SessionView {
  status: ConnectionStatus;
  playerId: string | null;
  state: MatchState | null;
  error: string | null;
}

export class MatchSession {
  private view: SessionView = { status: 'disconnected', playerId: null, state: null, error: null };
  private readonly listeners = new Set<(view: SessionView) => void>();

  constructor(private readonly transport: MatchTransport, private readonly matchId: string) {}

  subscribe(listener: (view: SessionView) => void): () => void {
    this.listeners.add(listener);
    listener(this.view);
    return () => { this.listeners.delete(listener); };
  }

  connect(): void {
    this.view = { status: 'connecting', playerId: null, state: null, error: null };
    this.publish();
    try {
      this.transport.connect({
        onStatus: status => {
          this.view = { ...this.view, status };
          this.publish();
          if (status === 'connected') this.send({ type: 'join', matchId: this.matchId });
        },
        onError: error => this.fail(error),
        onMessage: message => {
          if (message.type === 'error') return this.fail(message.message);
          if (message.state.matchId !== this.matchId) return;
          if (this.view.state && message.state.revision <= this.view.state.revision) return;
          this.view = { ...this.view, playerId: message.playerId, state: message.state, error: null };
          this.publish();
        },
      });
    } catch (error) {
      this.view = { ...this.view, status: 'disconnected' };
      this.fail(error instanceof Error ? error.message : '연결에 실패했습니다.');
    }
  }

  dispatch(action: GameAction): void {
    if (this.view.status !== 'connected' || this.view.state?.phase !== 'playing') return;
    this.send({ type: 'action', matchId: this.matchId, expectedRevision: this.view.state.revision, action });
  }

  dispose(): void {
    this.transport.close();
    this.listeners.clear();
    this.view = { status: 'disconnected', playerId: null, state: null, error: null };
  }

  private send(message: Parameters<MatchTransport['send']>[0]): void {
    try {
      this.transport.send(message);
    } catch (error) {
      this.fail(error instanceof Error ? error.message : '전송에 실패했습니다.');
    }
  }

  private fail(error: string): void {
    this.view = { ...this.view, error };
    this.publish();
  }

  private publish(): void {
    for (const listener of this.listeners) listener(this.view);
  }
}
