
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton } from '@ionic/angular/standalone';




import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonButton, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})

export class GamePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private animationId: any;
  
  // Game state
  gameStarted = false;
  gameOver = false;
  score = 0;
  highScore = 0;
  isNewHighScore = false;
  
  // Player (Dragon)
  private player = {
    x: 80,
    y: 0,
    width: 50,
    height: 50,
    velocityY: 0,
    jumping: false,
    jumpPower: -12,
    gravity: 0.6
  };
  
  // Ground
  private ground = {
    y: 0,
    height: 60
  };
  
  // Obstacles
  private obstacles: any[] = [];
  private obstacleTimer = 0;
  private obstacleInterval = 100; // Frames between obstacles
  
  // Game speed
  private gameSpeed = 5;
  
  // Colors and design
  private colors = {
    player: '#ff6b6b',
    obstacle: '#2d3436',
    ground: '#8B7355',
    groundLine: '#6B5945',
    sky1: '#87CEEB',
    sky2: '#B0E0E6',
    cloud: 'rgba(255, 255, 255, 0.8)',
    sun: '#FFD700'
  };
  
  // Clouds for background
  private clouds: any[] = [];
  
  constructor(
    private router: Router,
    private platform: Platform
  ) {}

  ngOnInit() {
    this.loadHighScore();
  }

  ngAfterViewInit() {
    // Small delay to ensure canvas is fully rendered
    setTimeout(() => {
      this.initializeGame();
    }, 100);
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  initializeGame() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    // Set canvas size
    this.resizeCanvas();
    
    // Handle window resize
    this.platform.resize.subscribe(() => {
      this.resizeCanvas();
    });
    
    // Initialize ground position
    this.ground.y = canvas.height - this.ground.height;
    this.player.y = this.ground.y - this.player.height;
    
    // Initialize clouds
    this.initClouds();
    
    // Start game loop
    this.gameLoop();
    
    // Add click event listener to canvas
    canvas.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Canvas clicked!');
      this.handleJump();
    });
    
    // Add touch event listener to canvas
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      console.log('Canvas touched!');
      this.handleJump();
    }, { passive: false });
    
    // Also add event listener to the entire content area as backup
    const content = document.querySelector('.game-canvas-wrapper');
    if (content) {
      content.addEventListener('click', (e) => {
        console.log('Content clicked!');
        this.handleJump();
      });
      
      content.addEventListener('touchstart', (e) => {
        e.preventDefault();
        console.log('Content touched!');
        this.handleJump();
      }, { passive: false });
    }
  }

  resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    this.ground.y = canvas.height - this.ground.height;
  }

  initClouds() {
    const canvas = this.canvasRef.nativeElement;
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height * 0.4),
        width: 60 + Math.random() * 40,
        height: 30 + Math.random() * 20,
        speed: 0.5 + Math.random() * 0.5
      });
    }
  }

  handleJump() {
    console.log('Jump called! gameStarted:', this.gameStarted, 'gameOver:', this.gameOver);
    
    if (!this.gameStarted && !this.gameOver) {
      console.log('Starting game...');
      this.gameStarted = true;
    }
    
    if (this.gameStarted && !this.gameOver && !this.player.jumping) {
      console.log('Player jumping!');
      this.player.velocityY = this.player.jumpPower;
      this.player.jumping = true;
    }
  }

  gameLoop = () => {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  update() {
    if (!this.gameStarted || this.gameOver) return;
    
    const canvas = this.canvasRef.nativeElement;
    
    // Update player physics
    this.player.velocityY += this.player.gravity;
    this.player.y += this.player.velocityY;
    
    // Ground collision
    if (this.player.y >= this.ground.y - this.player.height) {
      this.player.y = this.ground.y - this.player.height;
      this.player.velocityY = 0;
      this.player.jumping = false;
    }
    
    // Update score
    this.score++;
    
    // Increase difficulty
    if (this.score % 500 === 0) {
      this.gameSpeed += 0.5;
      this.obstacleInterval = Math.max(60, this.obstacleInterval - 5);
    }
    
    // Spawn obstacles
    this.obstacleTimer++;
    if (this.obstacleTimer > this.obstacleInterval) {
      this.spawnObstacle();
      this.obstacleTimer = 0;
    }
    
    // Update obstacles
    this.obstacles.forEach((obstacle, index) => {
      obstacle.x -= this.gameSpeed;
      
      // Remove off-screen obstacles
      if (obstacle.x + obstacle.width < 0) {
        this.obstacles.splice(index, 1);
      }
      
      // Collision detection
      if (this.checkCollision(this.player, obstacle)) {
        this.endGame();
      }
    });
    
    // Update clouds
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.width < 0) {
        cloud.x = canvas.width;
        cloud.y = Math.random() * (canvas.height * 0.4);
      }
    });
  }

  draw() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, this.colors.sky1);
    skyGradient.addColorStop(1, this.colors.sky2);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw sun
    ctx.fillStyle = this.colors.sun;
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 60, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw sun rays
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const x1 = canvas.width - 80 + Math.cos(angle) * 35;
      const y1 = 60 + Math.sin(angle) * 35;
      const x2 = canvas.width - 80 + Math.cos(angle) * 50;
      const y2 = 60 + Math.sin(angle) * 50;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // Draw clouds
    this.clouds.forEach(cloud => {
      this.drawCloud(ctx, cloud.x, cloud.y, cloud.width, cloud.height);
    });
    
    // Draw ground
    ctx.fillStyle = this.colors.ground;
    ctx.fillRect(0, this.ground.y, canvas.width, this.ground.height);
    
    // Draw ground texture lines
    ctx.strokeStyle = this.colors.groundLine;
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, this.ground.y);
      ctx.lineTo(i + 15, this.ground.y + 10);
      ctx.stroke();
    }
    
    // Draw ground grass
    ctx.fillStyle = '#90EE90';
    for (let i = 0; i < canvas.width; i += 10) {
      ctx.fillRect(i, this.ground.y - 2, 3, 8);
    }
    
    // Draw player (Dragon)
    this.drawDragon(ctx, this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Draw obstacles
    this.obstacles.forEach(obstacle => {
      this.drawObstacle(ctx, obstacle);
    });
  }

  drawDragon(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    // Body
    ctx.fillStyle = this.colors.player;
    ctx.beginPath();
    ctx.ellipse(x + width/2, y + height/2, width/2, height/2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.ellipse(x + width - 10, y + height/3, width/3, height/3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x + width - 5, y + height/3 - 3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x + width - 3, y + height/3 - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Wings
    ctx.fillStyle = '#ff8787';
    ctx.beginPath();
    ctx.ellipse(x + width/3, y + height/4, width/3, height/3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail
    ctx.strokeStyle = this.colors.player;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x, y + height/2);
    ctx.quadraticCurveTo(x - 15, y + height/2 - 10, x - 20, y + height/2);
    ctx.stroke();
    
    // Spikes on back
    ctx.fillStyle = '#ff4757';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 10 + i * 12, y + 5);
      ctx.lineTo(x + 15 + i * 12, y - 5);
      ctx.lineTo(x + 20 + i * 12, y + 5);
      ctx.fill();
    }
  }

  drawObstacle(ctx: CanvasRenderingContext2D, obstacle: any) {
    // Cactus-style obstacle
    ctx.fillStyle = this.colors.obstacle;
    
    // Main body
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    
    // Arms
    ctx.fillRect(obstacle.x - 8, obstacle.y + 10, 8, 20);
    ctx.fillRect(obstacle.x + obstacle.width, obstacle.y + 15, 8, 15);
    
    // Spikes
    ctx.fillStyle = '#1e272e';
    for (let i = 0; i < obstacle.height; i += 8) {
      ctx.fillRect(obstacle.x + 2, obstacle.y + i, 3, 3);
      ctx.fillRect(obstacle.x + obstacle.width - 5, obstacle.y + i, 3, 3);
    }
  }

  drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    ctx.fillStyle = this.colors.cloud;
    ctx.beginPath();
    ctx.arc(x, y, height/2, 0, Math.PI * 2);
    ctx.arc(x + width/3, y - height/4, height/1.5, 0, Math.PI * 2);
    ctx.arc(x + width/1.5, y, height/2, 0, Math.PI * 2);
    ctx.fill();
  }

  spawnObstacle() {
    const canvas = this.canvasRef.nativeElement;
    const height = 40 + Math.random() * 30;
    
    this.obstacles.push({
      x: canvas.width,
      y: this.ground.y - height,
      width: 20,
      height: height
    });
  }

  checkCollision(player: any, obstacle: any): boolean {
    return player.x < obstacle.x + obstacle.width &&
           player.x + player.width > obstacle.x &&
           player.y < obstacle.y + obstacle.height &&
           player.y + player.height > obstacle.y;
  }

  endGame() {
    this.gameOver = true;
    this.gameStarted = false;
    
    // Check high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.isNewHighScore = true;
      this.saveHighScore();
    } else {
      this.isNewHighScore = false;
    }
  }

  restartGame() {
    console.log('Restarting game...');
    
    // Reset game state
    this.gameOver = false;
    this.gameStarted = false;
    this.score = 0;
    this.isNewHighScore = false;
    
    // Reset player
    const canvas = this.canvasRef.nativeElement;
    this.player.y = this.ground.y - this.player.height;
    this.player.velocityY = 0;
    this.player.jumping = false;
    
    // Reset obstacles
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.gameSpeed = 5;
    this.obstacleInterval = 100;
    
    // Reset clouds
    this.clouds = [];
    this.initClouds();
    
    console.log('Game restarted successfully');
  }

  goHome() {
    console.log('Going home...');
    // Cancel animation before navigating
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.router.navigate(['/home']);
  }

  loadHighScore() {
    const saved = localStorage.getItem('dragonRunnerHighScore');
    if (saved) {
      this.highScore = parseInt(saved);
    }
  }

  saveHighScore() {
    localStorage.setItem('dragonRunnerHighScore', this.highScore.toString());
  }
}