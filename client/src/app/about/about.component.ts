import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  // Active tab for navigation pills
  activeTab: string = 'mission';
  
  // Back to top button visibility
  showBackToTop: boolean = false;

  constructor() { }

  ngOnInit(): void {
    // Scroll to top when component loads
    window.scrollTo(0, 0);
  }

  /**
   * Set active tab for navigation pills
   * @param tab - The tab to activate (mission, vision, facilities)
   */
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    
    // Update active class on buttons
    const buttons = document.querySelectorAll('.nav-pill');
    buttons.forEach(button => {
      button.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`.nav-pill[data-tab="${tab}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }

    // Optional: You can add logic here to show different content based on tab
    console.log('Active tab:', tab);
  }

  /**
   * Scroll to top of page with smooth animation
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Listen to window scroll event to show/hide back to top button
   */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    // Show button when user scrolls down 300px from top
    this.showBackToTop = window.pageYOffset > 300;
  }

  /**
   * Smooth scroll to a specific section
   * @param sectionId - The ID of the section to scroll to
   */
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}