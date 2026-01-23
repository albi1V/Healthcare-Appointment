import { ViewportScroller } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, AfterViewInit {
  // Typed text animation state
  typedText = '';
  fullTexts = [
    'Best Healthcare Solution In Your City',
    'Book Your Appointment Online',
    'Trusted Doctors Near You'
  ];
  textIndex = 0;
  charIndex = 0;
  typingSpeed = 80;    // ms per character
  pauseBetween = 1200; // ms pause after a full line

  constructor(
    private viewportScroller: ViewportScroller,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.typeText();
  }

  ngAfterViewInit(): void {
    this.animateCounters();
  }

  /** Programmatic navigation (same pattern as your reference dashboard) */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
  goToRegister(): void {
    this.router.navigate(['/registration']);
  }

  /** Typing animation */
  private typeText(): void {
    const current = this.fullTexts[this.textIndex];
    if (this.charIndex < current.length) {
      this.typedText += current[this.charIndex];
      this.charIndex++;
      setTimeout(() => this.typeText(), this.typingSpeed);
    } else {
      setTimeout(() => this.eraseText(), this.pauseBetween);
    }
  }

  private eraseText(): void {
    if (this.charIndex > 0) {
      this.typedText = this.typedText.slice(0, -1);
      this.charIndex--;
      setTimeout(() => this.eraseText(), this.typingSpeed / 2);
    } else {
      this.textIndex = (this.textIndex + 1) % this.fullTexts.length;
      setTimeout(() => this.typeText(), this.typingSpeed);
    }
  }

  /** Back to top */
  scrollToTop(event: Event): void {
    event.preventDefault();
    this.viewportScroller.scrollToPosition([0, 0]);
  }

  /** Simple counters animation */
  private animateCounters(): void {
    const counters = document.querySelectorAll<HTMLElement>('.counter');
    counters.forEach(counter => {
      const updateCount = () => {
        const targetAttr = counter.getAttribute('data-target') || '0';
        const target = +targetAttr;
        const count = +counter.innerText;
        const increment = Math.max(1, Math.floor(target / 200));

        if (count < target) {
          counter.innerText = `${Math.min(target, count + increment)}`;
          setTimeout(updateCount, 20);
        } else {
          counter.innerText = `${target}`;
        }
      };
      updateCount();
    });
  }
}


