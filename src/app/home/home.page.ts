import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonIcon, IonButton, IonHeader, IonToolbar, IonTitle, IonContent],
})

export class HomePage implements OnInit {
  highScore: number = 0;

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadHighScore();
  }

  startGame() {
    this.router.navigate(['/game']);
  }

  openGuide() {
    this.router.navigate(['/guide']);
  }

  loadHighScore() {
    const saved = localStorage.getItem('dragonRunnerHighScore');
    if (saved) {
      this.highScore = parseInt(saved);
    }
  }
}