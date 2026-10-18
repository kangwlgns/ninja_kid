import type { ClientMessage } from '../../network/protocol';
import type { MatchTransport, TransportHandlers } from '../../network/transport';
import type { MatchState } from './match-types';

/** 서버 응답 흐름을 시연하는 메모리 구현입니다. 실제 게임 규칙이 아닙니다. */
export class DemoTransport implements MatchTransport {
  private handlers?: TransportHandlers;
  private state?: MatchState;

  connect(handlers: TransportHandlers): void {
    this.handlers = handlers;
    handlers.onStatus('connected');
  }

  send(message: ClientMessage): void {
    if (!this.handlers) throw new Error('미리보기가 종료되었습니다.');
    if (message.type === 'join') {
      this.state = {
        matchId: message.matchId, revision: 0, phase: 'playing',
        players: [{ id: 'local', name: '나' }, { id: 'other', name: '상대 (시연용)' }],
        entities: [
          { id: 'a', ownerId: 'local', label: 'A', position: { x: 0.25, y: 0.5 } },
          { id: 'b', ownerId: 'other', label: 'B', position: { x: 0.75, y: 0.5 } },
        ],
      };
    } else {
      const state = this.state;
      if (!state || message.matchId !== state.matchId || message.expectedRevision !== state.revision) {
        this.handlers.onMessage({ type: 'error', message: '경기 상태가 일치하지 않습니다.' });
        return;
      }
      const entity = state.entities.find(item => item.id === message.action.entityId);
      const { x, y } = message.action.position;
      if (state.phase !== 'playing' || !entity || entity.ownerId !== 'local'
        || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
        this.handlers.onMessage({ type: 'error', message: '이 미리보기에서는 내 오브젝트만 이동할 수 있습니다.' });
        return;
      }
      this.state = {
        ...state, revision: state.revision + 1,
        entities: state.entities.map(item => item.id === entity.id
          ? { ...item, position: { ...message.action.position } } : item),
      };
    }
    this.handlers.onMessage({ type: 'snapshot', playerId: 'local', state: structuredClone(this.state!) });
  }

  close(): void {
    this.handlers = undefined;
    this.state = undefined;
  }
}
