import Phaser from 'phaser';
import type { SessionView } from './match-session';

export class MatchHud {
  private readonly status: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, remote: boolean) {
    scene.add.text(80, 55, '대국 미리보기', {
      fontFamily: 'Arial', fontSize: '32px', color: '#f8fafc',
    });
    scene.add.text(80, 105, remote ? '서버 연결 모드' : '로컬 시연 · 게임 규칙 미적용', {
      fontFamily: 'Arial', fontSize: '16px', color: '#fbbf24',
    });
    this.status = scene.add.text(80, 530, '', {
      fontFamily: 'Arial', fontSize: '17px', color: '#aab8cc',
    });
    this.hint = scene.add.text(80, 570, '', {
      fontFamily: 'Arial', fontSize: '16px', color: '#aab8cc', wordWrap: { width: 800 },
    });
  }

  render(view: SessionView): void {
    const status = { connecting: '연결 중', connected: '연결됨', disconnected: '연결 종료' }[view.status];
    const phase = view.state ? { waiting: '대기', playing: '진행', finished: '종료' }[view.state.phase] : '상태 수신 대기';
    this.status.setText(`${status}  ·  ${phase}  ·  상태 버전 ${view.state?.revision ?? '—'}`);
    this.hint.setColor(view.error ? '#fca5a5' : '#aab8cc');
    this.hint.setText(view.error ?? (view.status === 'disconnected'
      ? '대기실로 돌아가 다시 연결할 수 있습니다.'
      : '노란 오브젝트를 선택한 뒤 보드의 빈 곳을 누르면 이동합니다.'));
  }
}
