import { describe, expect, it } from 'vitest';
import type { ClientMessage } from '../../network/protocol';
import type { MatchTransport, TransportHandlers } from '../../network/transport';
import { DemoTransport } from './demo-transport';
import { MatchSession } from './match-session';
import type { SessionView } from './match-session';
import type { MatchState } from './match-types';

const initialState: MatchState = {
  matchId: 'room', revision: 0, phase: 'playing',
  players: [{ id: 'me', name: 'Player' }],
  entities: [{ id: 'a', ownerId: 'me', label: 'A', position: { x: 0.2, y: 0.3 } }],
};

class TestTransport implements MatchTransport {
  handlers!: TransportHandlers;
  sent: ClientMessage[] = [];
  closed = false;
  connect(handlers: TransportHandlers): void {
    this.handlers = handlers;
    handlers.onStatus('connected');
  }
  send(message: ClientMessage): void { this.sent.push(message); }
  close(): void { this.closed = true; }
}

describe('MatchSession', () => {
  it('서버 응답 전에는 요청만 보내고 경기 상태를 임의로 변경하지 않는다', () => {
    const transport = new TestTransport();
    const session = new MatchSession(transport, 'room');
    let view: SessionView | undefined;
    session.subscribe(next => { view = next; });
    session.connect();
    expect(transport.sent[0]).toEqual({ type: 'join', matchId: 'room' });
    transport.handlers.onMessage({ type: 'snapshot', playerId: 'me', state: initialState });
    session.dispatch({ kind: 'move', entityId: 'a', position: { x: 0.8, y: 0.7 } });
    expect(transport.sent[1]).toMatchObject({ type: 'action', expectedRevision: 0 });
    expect(view?.state?.entities[0].position).toEqual({ x: 0.2, y: 0.3 });
  });

  it('다른 경기와 이전 버전의 상태를 무시하고 연결 종료 후 입력을 차단한다', () => {
    const transport = new TestTransport();
    const session = new MatchSession(transport, 'room');
    let view: SessionView | undefined;
    session.subscribe(next => { view = next; });
    session.connect();
    transport.handlers.onMessage({ type: 'snapshot', playerId: 'me', state: { ...initialState, revision: 3 } });
    transport.handlers.onMessage({ type: 'snapshot', playerId: 'me', state: initialState });
    transport.handlers.onMessage({ type: 'snapshot', playerId: 'me', state: { ...initialState, matchId: 'other', revision: 8 } });
    expect(view?.state?.revision).toBe(3);
    transport.handlers.onStatus('disconnected');
    session.dispatch({ kind: 'move', entityId: 'a', position: { x: 0.8, y: 0.7 } });
    expect(transport.sent).toHaveLength(1);
    session.dispose();
    expect(transport.closed).toBe(true);
  });

  it('로컬 시연에서 내 오브젝트만 이동시키고 구독을 해제할 수 있다', () => {
    const session = new MatchSession(new DemoTransport(), 'demo');
    let view: SessionView | undefined;
    let count = 0;
    const unsubscribe = session.subscribe(next => { view = next; count += 1; });
    session.connect();
    session.dispatch({ kind: 'move', entityId: 'a', position: { x: 0.4, y: 0.6 } });
    expect(view?.state?.revision).toBe(1);
    expect(view?.state?.entities[0].position).toEqual({ x: 0.4, y: 0.6 });
    session.dispatch({ kind: 'move', entityId: 'b', position: { x: 0.1, y: 0.1 } });
    expect(view?.error).toBeTruthy();
    expect(view?.state?.revision).toBe(1);
    unsubscribe();
    const previousCount = count;
    session.dispatch({ kind: 'move', entityId: 'a', position: { x: 0.5, y: 0.5 } });
    expect(count).toBe(previousCount);
    session.dispose();
  });
});
