import Phaser from 'phaser';
import type { GameEntity, Position } from './match-types';

export class BoardView extends Phaser.GameObjects.Container {
  private readonly pieces: Phaser.GameObjects.Container;
  private selectedId: string | null = null;

  constructor(scene: Phaser.Scene, private readonly onMove: (entityId: string, position: Position) => void) {
    super(scene, 80, 160);
    scene.add.existing(this);
    const surface = scene.add.rectangle(0, 0, 800, 350, 0x1c2940)
      .setOrigin(0).setStrokeStyle(1, 0x3b4c66).setInteractive();
    surface.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.selectedId) return;
      this.onMove(this.selectedId, {
        x: Phaser.Math.Clamp((pointer.x - this.x) / 800, 0, 1),
        y: Phaser.Math.Clamp((pointer.y - this.y) / 350, 0, 1),
      });
    });
    this.add(surface);
    this.pieces = scene.add.container(0, 0);
    this.add(this.pieces);
  }

  render(entities: GameEntity[], playerId: string | null, enabled: boolean): void {
    if (!entities.some(entity => entity.id === this.selectedId && entity.ownerId === playerId)) {
      this.selectedId = null;
    }
    this.pieces.removeAll(true);
    for (const entity of entities) {
      const own = entity.ownerId === playerId;
      const token = this.scene.add.circle(0, 0, 24, own ? 0xfbbf24 : 0x60a5fa)
        .setStrokeStyle(entity.id === this.selectedId ? 4 : 1, 0xffffff);
      const label = this.scene.add.text(0, 0, entity.label, {
        fontFamily: 'Arial', fontSize: '20px', color: '#111827',
      }).setOrigin(0.5);
      const piece = this.scene.add.container(entity.position.x * 800, entity.position.y * 350, [token, label]);
      if (own && enabled) {
        token.setInteractive({ useHandCursor: true });
        token.on('pointerdown', () => {
          this.selectedId = entity.id;
          this.render(entities, playerId, enabled);
        });
      }
      this.pieces.add(piece);
    }
    // 배경 입력도 상태에 따라 차단합니다.
    const surface = this.list[0] as Phaser.GameObjects.Rectangle;
    if (surface.input) surface.input.enabled = enabled;
  }
}
