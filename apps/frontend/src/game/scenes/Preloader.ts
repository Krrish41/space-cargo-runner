import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    // Load high-fidelity generated game assets
    this.load.image('ship', '/assets/ship.png');
    this.load.image('asteroid', '/assets/asteroid.png');
    this.load.image('cargo', '/assets/cargo.png');
    this.load.image('fuel', '/assets/fuel.png');

    // Keep the stars as generated graphics since they are just dots
    const starGraphics = this.add.graphics();
    starGraphics.fillStyle(0xffffff, 1);
    starGraphics.fillCircle(2, 2, 2);
    starGraphics.generateTexture('star', 4, 4);
    starGraphics.destroy();
  }

  create() {
    this.scene.start('MainScene');
  }
}
