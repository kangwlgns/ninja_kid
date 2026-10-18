import type { GameAction, MatchState } from '../features/match/match-types';

export type ClientMessage =
  | { type: 'join'; matchId: string }
  | { type: 'action'; matchId: string; expectedRevision: number; action: GameAction };

export type ServerMessage =
  | { type: 'snapshot'; playerId: string; state: MatchState }
  | { type: 'error'; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPosition(value: unknown): boolean {
  return isRecord(value)
    && typeof value.x === 'number' && Number.isFinite(value.x) && value.x >= 0 && value.x <= 1
    && typeof value.y === 'number' && Number.isFinite(value.y) && value.y >= 0 && value.y <= 1;
}

export function parseServerMessage(raw: string): ServerMessage {
  const data: unknown = JSON.parse(raw);
  if (!isRecord(data)) throw new Error('서버 메시지 형식이 올바르지 않습니다.');
  if (data.type === 'error' && typeof data.message === 'string') {
    return { type: 'error', message: data.message };
  }
  if (data.type !== 'snapshot' || typeof data.playerId !== 'string' || !isRecord(data.state)) {
    throw new Error('지원하지 않는 서버 메시지입니다.');
  }
  const state = data.state;
  if (
    typeof state.matchId !== 'string'
    || typeof state.revision !== 'number' || !Number.isSafeInteger(state.revision) || state.revision < 0
    || !['waiting', 'playing', 'finished'].includes(String(state.phase))
    || !Array.isArray(state.players)
    || !state.players.every(p => isRecord(p) && typeof p.id === 'string' && typeof p.name === 'string')
    || !Array.isArray(state.entities)
    || !state.entities.every(e => isRecord(e) && typeof e.id === 'string'
      && typeof e.ownerId === 'string' && typeof e.label === 'string' && isPosition(e.position))
  ) throw new Error('경기 상태 형식이 올바르지 않습니다.');

  const players = state.players as MatchState['players'];
  const entities = state.entities as MatchState['entities'];
  const playerIds = new Set(players.map(player => player.id));
  if (playerIds.size !== players.length || !playerIds.has(data.playerId)
    || new Set(entities.map(entity => entity.id)).size !== entities.length
    || entities.some(entity => !playerIds.has(entity.ownerId))) {
    throw new Error('플레이어 또는 오브젝트 식별자가 올바르지 않습니다.');
  }
  return { type: 'snapshot', playerId: data.playerId, state: state as unknown as MatchState };
}
