import Phaser from 'phaser';
import { useStore } from '../../store/useStore';

export class MainScene extends Phaser.Scene {
  ship!: Phaser.Physics.Arcade.Sprite;
  stars!: Phaser.GameObjects.Group;
  obstacles!: Phaser.Physics.Arcade.Group;
  cargoGroup!: Phaser.Physics.Arcade.Group;
  fuelTanks!: Phaser.Physics.Arcade.Group;
  
  baseSpeed = 300;
  distance = 0;
  isPlaying = false;
  isInvulnerable = false;
  fuelDrainTimer!: Phaser.Time.TimerEvent;
  spawnTimer = 0;
  lastDistanceUpdate = 0;
  
  constructor() {
    super('MainScene');
  }

  create() {
    const { width, height } = this.scale;

    // Create scrolling stars
    this.stars = this.add.group({
      key: 'star',
      repeat: 200,
      setXY: {
        x: Phaser.Math.Between(0, width),
        y: Phaser.Math.Between(0, height),
      }
    });

    this.stars.getChildren().forEach((star: any) => {
      star.x = Phaser.Math.Between(0, width);
      star.y = Phaser.Math.Between(0, height);
      star.alpha = Phaser.Math.FloatBetween(0.3, 1);
    });

    // Create ship
    this.ship = this.physics.add.sprite(width / 2, height - 100, 'ship');
    this.ship.setScale(0.1);
    this.ship.setAngle(-90); // Rotate to face upwards
    this.ship.setBlendMode(Phaser.BlendModes.SCREEN);
    this.ship.setCollideWorldBounds(true);
    // Reduce hitbox slightly for fair gameplay
    this.ship.body?.setSize(this.ship.width * 0.7, this.ship.height * 0.7);
    
    // Groups
    this.obstacles = this.physics.add.group();
    this.cargoGroup = this.physics.add.group();
    this.fuelTanks = this.physics.add.group();

    // Physics overlaps
    this.physics.add.overlap(this.ship, this.obstacles, this.hitObstacle, undefined, this);
    this.physics.add.overlap(this.ship, this.cargoGroup, this.collectCargo, undefined, this);
    this.physics.add.overlap(this.ship, this.fuelTanks, this.handleFuelCollection, undefined, this);

    // Store the initial distance
    this.distance = 0;
  }

  startGame() {
    this.isPlaying = true;
    this.distance = 0;
    this.baseSpeed = 300;
    this.obstacles.clear(true, true);
    this.cargoGroup.clear(true, true);
    this.fuelTanks.clear(true, true);
    this.ship.setPosition(this.scale.width / 2, this.scale.height - 100);
    this.ship.alpha = 1;
    this.ship.setScale(0.1);
    this.ship.clearTint();
    this.isInvulnerable = false;
    this.physics.resume();

    if (this.fuelDrainTimer) this.fuelDrainTimer.destroy();
    this.fuelDrainTimer = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        useStore.getState().drainFuel(2);
      }
    });
  }

  update(time: number, delta: number) {
    const state = useStore.getState();
    
    if (state.gameState === 'PLAYING' && !this.isPlaying) {
      this.startGame();
    } else if (state.gameState === 'GAME_OVER' && this.isPlaying) {
      this.gameOver();
    }

    if (!this.isPlaying) return;

    // Scroll stars
    this.stars.getChildren().forEach((star: any) => {
      star.y += (this.baseSpeed * delta) / 1000 * star.alpha; // Parallax based on alpha
      if (star.y > this.scale.height) {
        star.y = 0;
        star.x = Phaser.Math.Between(0, this.scale.width);
      }
    });

    // Move objects
    [this.obstacles, this.cargoGroup, this.fuelTanks].forEach(group => {
      group.getChildren().forEach((child: any) => {
        child.y += (this.baseSpeed * delta) / 1000;
        if (child.y > this.scale.height + 50) {
          child.destroy();
        }
      });
    });

    // Spawning logic
    this.spawnTimer += delta;
    if (this.spawnTimer > 1000) { // Spawn every second
      this.spawnTimer = 0;
      this.spawnEntity();
    }

    // Ship controls
    const cursors = this.input.keyboard?.createCursorKeys();
    const pointer = this.input.activePointer;

    if (cursors?.left.isDown || (pointer.isDown && pointer.x < this.scale.width / 2)) {
      this.ship.setVelocityX(-400);
    } else if (cursors?.right.isDown || (pointer.isDown && pointer.x > this.scale.width / 2)) {
      this.ship.setVelocityX(400);
    } else {
      this.ship.setVelocityX(0);
    }

    // Update Distance
    this.distance += (this.baseSpeed * delta) / 10000;

    // Report to Zustand every ~100ms
    if (!this.lastDistanceUpdate || time - this.lastDistanceUpdate > 100) {
      this.lastDistanceUpdate = time;
      useStore.getState().setDistance(Math.floor(this.distance));
    }

    // Gradual speed increase
    this.baseSpeed += delta / 100;
  }

  spawnEntity() {
    const x = Phaser.Math.Between(50, this.scale.width - 50);
    const rand = Math.random();

    if (rand < 0.6) {
      // Spawn Obstacle
      const asteroid = this.obstacles.create(x, -50, 'asteroid');
      asteroid.setScale(0.12);
      asteroid.setBlendMode(Phaser.BlendModes.SCREEN);
      asteroid.body?.setSize(asteroid.width * 0.6, asteroid.height * 0.6);
    } else if (rand < 0.9) {
      // Spawn Cargo
      const cargo = this.cargoGroup.create(x, -50, 'cargo');
      cargo.setScale(0.08);
      cargo.setBlendMode(Phaser.BlendModes.SCREEN);
    } else {
      // Spawn Fuel
      const fuel = this.fuelTanks.create(x, -50, 'fuel');
      fuel.setScale(0.08);
      fuel.setBlendMode(Phaser.BlendModes.SCREEN);
      fuel.body?.setSize(fuel.width * 0.8, fuel.height * 0.8);
    }
  }

  hitObstacle(ship: any, obstacle: any) {
    if (this.isInvulnerable) return;

    obstacle.destroy();
    
    // Apply Damage
    useStore.getState().damageShip(25);
    this.cameras.main.shake(150, 0.02);
    
    // I-Frames
    this.isInvulnerable = true;
    this.ship.setTint(0xff0000);
    
    // Blink effect during i-frames
    const blink = this.time.addEvent({
      delay: 100,
      repeat: 8,
      callback: () => {
        this.ship.alpha = this.ship.alpha === 1 ? 0.3 : 1;
      }
    });

    this.time.delayedCall(1000, () => {
      this.isInvulnerable = false;
      this.ship.clearTint();
      this.ship.alpha = 1;
    });
  }

  collectCargo(ship: any, cargo: any) {
    cargo.destroy();
    useStore.getState().addCoins(10);
    useStore.getState().incrementCargo();
    
    // Flash cargo yellow
    this.ship.setTint(0xffff00);
    this.time.delayedCall(100, () => this.ship.clearTint());
  }

  handleFuelCollection(_ship: any, fuelPickup: any) {
    fuelPickup.destroy();
    
    useStore.getState().replenishFuel(30);
    this.cameras.main.flash(100, 0, 240, 255);
    
    // Flash ship blue
    this.ship.setTint(0x00aaff);
    this.time.delayedCall(100, () => this.ship.clearTint());
  }

  gameOver() {
    this.isPlaying = false;
    this.time.removeAllEvents(); // Resolves lingering fuel timer, blink, and tint leaks
    
    const finalDistance = Math.floor(this.distance);
    const coinsCollected = useStore.getState().coinsCollected;
    
    useStore.getState().setDistance(finalDistance);
    useStore.getState().syncRunResults(finalDistance, coinsCollected);
    
    useStore.getState().setGameState('GAME_OVER');
    this.physics.pause();
    
    // Explosion effect placeholder
    this.ship.setTint(0xff0000);
    this.ship.setScale(2);
    this.ship.alpha = 0;
  }
}
