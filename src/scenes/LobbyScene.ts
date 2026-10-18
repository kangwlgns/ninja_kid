import Phaser from 'phaser';

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super('lobby');
  }

  create(): void {
    this.add.text(80, 100, 'NINJA KID', {
      fontFamily: 'Arial', fontSize: '18px', color: '#fbbf24', letterSpacing: 4,
    });
    this.add.text(80, 160, '보드 위에서 시작되는 대결', {
      fontFamily: 'Arial', fontSize: '40px', color: '#f8fafc',
    });
    this.add.text(80, 240, '게임 규칙을 연결하기 위한 프론트엔드 기본 구성입니다.\n오브젝트 선택과 이동으로 화면·상태·행동의 연결을 확인하세요.', {
      fontFamily: 'Arial', fontSize: '20px', color: '#aab8cc', lineSpacing: 12,
    });

    const remote = Boolean(import.meta.env.VITE_GAME_SERVER_URL);
    const button = this.add.text(80, 360, remote ? '서버 연결 시작  →' : '로컬 미리보기 시작  →', {
      fontFamily: 'Arial', fontSize: '22px', color: '#111827',
      backgroundColor: '#fbbf24', padding: { x: 24, y: 18 },
    }).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setBackgroundColor('#fde68a'));
    button.on('pointerout', () => button.setBackgroundColor('#fbbf24'));
    button.on('pointerdown', () => this.scene.start('match'));

    this.add.text(80, 540, remote ? '서버 연결 모드 · 인증 및 방 찾기는 추후 구현' : '로컬 시연 모드 · 멀티플레이 서버 연결 없음', {
      fontFamily: 'Arial', fontSize: '16px', color: '#8393aa',
    });
  }
}
