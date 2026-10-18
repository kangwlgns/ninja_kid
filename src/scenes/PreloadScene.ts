import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('preload');
  }

  preload(): void {
    // 실제 리소스가 생기면 public/assets의 이미지·사운드를 여기에서 로딩합니다.
  }

  create(): void {
    this.scene.start('lobby');
  }
}
