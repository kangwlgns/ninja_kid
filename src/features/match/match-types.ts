export interface Position {
  /** 보드 표시 영역 안에서의 비율 좌표입니다. 특정 격자 규칙을 가정하지 않습니다. */
  x: number;
  y: number;
}

export interface GameEntity {
  id: string;
  ownerId: string;
  label: string;
  position: Position;
}

export interface Player {
  id: string;
  name: string;
}

export interface MatchState {
  matchId: string;
  revision: number;
  phase: 'waiting' | 'playing' | 'finished';
  players: Player[];
  entities: GameEntity[];
}

// 이동은 구조를 확인하기 위한 예시 행동입니다. 실제 게임의 행동을 여기에 추가합니다.
export interface GameAction {
  kind: 'move';
  entityId: string;
  position: Position;
}
