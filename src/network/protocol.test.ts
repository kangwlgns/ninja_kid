import { describe, expect, it } from 'vitest';
import { parseServerMessage } from './protocol';

const snapshot = {
  type: 'snapshot', playerId: 'me',
  state: {
    matchId: 'room', revision: 1, phase: 'playing',
    players: [{ id: 'me', name: 'Player' }],
    entities: [{ id: 'a', ownerId: 'me', label: 'A', position: { x: 0.4, y: 0.6 } }],
  },
};

describe('서버 메시지 검증', () => {
  it('정상적인 경기 상태를 읽는다', () => {
    expect(parseServerMessage(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it.each([
    'not json',
    JSON.stringify({ type: 'snapshot', state: {} }),
    JSON.stringify({ ...snapshot, state: { ...snapshot.state, revision: -1 } }),
    JSON.stringify({ ...snapshot, state: { ...snapshot.state, entities: [{ ...snapshot.state.entities[0], position: { x: 2, y: 0 } }] } }),
    JSON.stringify({ ...snapshot, playerId: 'unknown' }),
    JSON.stringify({ ...snapshot, state: { ...snapshot.state, entities: [...snapshot.state.entities, ...snapshot.state.entities] } }),
  ])('잘못된 데이터가 게임 상태로 들어오는 것을 차단한다', raw => {
    expect(() => parseServerMessage(raw)).toThrow();
  });
});
