import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    // Load high-fidelity generated game assets
    this.load.image('ship', `${import.meta.env.BASE_URL}assets/ship.png`);
    this.load.image('asteroid', `${import.meta.env.BASE_URL}assets/asteroid.png`);
    this.load.image('cargo', `${import.meta.env.BASE_URL}assets/cargo.png`);
    this.load.image('fuel', `${import.meta.env.BASE_URL}assets/fuel.png`);

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
