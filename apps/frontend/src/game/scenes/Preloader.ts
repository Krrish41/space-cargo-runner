import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading bar background
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x111624, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 8);
    progressBox.lineStyle(2, 0x3a4863, 1);
    progressBox.strokeRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 8);

    // Loading text
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'INITIALIZING SYSTEMS...',
      style: {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '18px',
        color: '#00ffcc'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    // Percentage text
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: '0%',
      style: {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '16px',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      percentText.setText(parseInt(String(value * 100)) + '%');
      progressBar.clear();
      progressBar.fillStyle(0x00ffcc, 1);
      progressBar.fillRoundedRect(width / 2 - 150, height / 2 - 15, 300 * value, 30, 4);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

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

    const dustGraphics = this.add.graphics();
    dustGraphics.fillStyle(0x5de8ff, 0.7);
    dustGraphics.fillRect(0, 0, 2, 18);
    dustGraphics.generateTexture('dust-streak', 2, 18);
    dustGraphics.destroy();

    // High contrast + glow for mines (Obstacle)
    const mineGraphics = this.add.graphics();
    mineGraphics.fillStyle(0x1a0510, 1); // Darker base for contrast
    mineGraphics.lineStyle(4, 0xff005a, 1); // Thicker, brighter red
    mineGraphics.fillCircle(24, 24, 18);
    mineGraphics.strokeCircle(24, 24, 18);
    // Add glow ring
    mineGraphics.lineStyle(2, 0xff005a, 0.4);
    mineGraphics.strokeCircle(24, 24, 22);
    mineGraphics.lineBetween(24, 0, 24, 48);
    mineGraphics.lineBetween(0, 24, 48, 24);
    mineGraphics.lineBetween(6, 6, 42, 42);
    mineGraphics.lineBetween(42, 6, 6, 42);
    mineGraphics.generateTexture('mine', 48, 48);
    mineGraphics.destroy();

    // High contrast + glow for debris (Obstacle)
    const debrisGraphics = this.add.graphics();
    debrisGraphics.fillStyle(0x4a5a6d, 1);
    debrisGraphics.lineStyle(3, 0xffffff, 0.8);
    debrisGraphics.fillTriangle(6, 42, 42, 8, 34, 44);
    debrisGraphics.strokeTriangle(6, 42, 42, 8, 34, 44);
    // Add glow outline
    debrisGraphics.lineStyle(2, 0xffffff, 0.3);
    debrisGraphics.strokeTriangle(4, 44, 44, 6, 36, 46);
    debrisGraphics.generateTexture('debris', 48, 48);
    debrisGraphics.destroy();

    // High contrast + glow for data cache (Collectible)
    const dataGraphics = this.add.graphics();
    dataGraphics.fillStyle(0x021118, 1);
    dataGraphics.lineStyle(4, 0x00ffcc, 1);
    dataGraphics.fillRoundedRect(6, 8, 36, 32, 6);
    dataGraphics.strokeRoundedRect(6, 8, 36, 32, 6);
    // Add glow ring
    dataGraphics.lineStyle(2, 0x00ffcc, 0.4);
    dataGraphics.strokeRoundedRect(2, 4, 44, 40, 8);
    dataGraphics.fillStyle(0x00ffcc, 1);
    dataGraphics.fillRect(14, 16, 20, 4);
    dataGraphics.fillRect(14, 24, 14, 4);
    dataGraphics.fillRect(14, 32, 18, 4);
    dataGraphics.generateTexture('data-cache', 48, 48);
    dataGraphics.destroy();

    // High contrast + glow for power-ups
    const powerGraphics = this.add.graphics();
    const powerTextures = [
      { key: 'power-shield', color: 0x63ff8f },
      { key: 'power-magnet', color: 0xff4fd8 },
      { key: 'power-double', color: 0xffd166 },
      { key: 'power-slow', color: 0x73c2ff }
    ];

    powerTextures.forEach(({ key, color }) => {
      powerGraphics.clear();
      powerGraphics.fillStyle(0x020610, 1);
      powerGraphics.lineStyle(4, color, 1);
      powerGraphics.fillCircle(24, 24, 18);
      powerGraphics.strokeCircle(24, 24, 18);
      // Glow ring
      powerGraphics.lineStyle(2, color, 0.4);
      powerGraphics.strokeCircle(24, 24, 22);
      powerGraphics.fillStyle(color, 1);
      powerGraphics.fillCircle(24, 24, 8);
      powerGraphics.generateTexture(key, 48, 48);
    });
    powerGraphics.destroy();
  }

  create() {
    this.scene.start('MainScene');
  }
}
