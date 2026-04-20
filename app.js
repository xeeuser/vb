/**
 * Xuneel Services - Core Application Logic
 * Architecture: ES6 Class-based modular pattern
 * Features: Custom Cursor, Intersection Observers, Stat Counters, A11y Menu Navigation
 */

class XuneelApp {
  constructor() {
    // Cache DOM Elements
    this.DOM = {
      cursor: document.getElementById('cursor'),
      cursorFollower: document.getElementById('cursorFollower'),
      navbar: document.getElementById('navbar'),
      hamburger: document.getElementById('hamburger'),
      mobileMenu: document.getElementById('mobileMenu'),
      reveals: document.querySelectorAll('.reveal'),
      stats: document.querySelectorAll('.stat-number'),
      progressBars: document.querySelectorAll('.metric-bar-fill'),
      interactables: document.querySelectorAll('a, button, input, textarea, select, [tabindex="0"]')
    };

    // System Preferences
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    this.init();
  }

  init() {
    this.initNavbar();
    this.initMobileMenu();
    this.initScrollObserver();
    
    // Only initialize custom cursor on devices with a precise pointer (e.g., mouse)
    if (!this.isTouchDevice) {
      this.initCursor();
    } else if (this.DOM.cursor && this.DOM.cursorFollower) {
      // Hide cursor elements on mobile/touch to prevent ghosting
      this.DOM.cursor.style.display = 'none';
      this.DOM.cursorFollower.style.display = 'none';
    }
  }

  /**
   * Fluid Custom Cursor implementation using requestAnimationFrame 
   * for zero-jank follower physics.
   */
  initCursor() {
    if (!this.DOM.cursor || !this.DOM.cursorFollower) return;

    let mouseX = -100;
    let mouseY = -100;
    let followerX = -100;
    let followerY = -100;

    // Track mouse movement
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Main cursor snaps instantly
      this.DOM.cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    }, { passive: true });

    // Smooth follower physics loop
    const renderFollower = () => {
      followerX += (mouseX - followerX) * 0.15;
      followerY += (mouseY - followerY) * 0.15;
      this.DOM.cursorFollower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(renderFollower);
    };
    requestAnimationFrame(renderFollower);

    // Bind Hover States
    this.DOM.interactables.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  /**
   * Navbar scroll state management (Glassmorphism trigger)
   */
  initNavbar() {
    if (!this.DOM.navbar) return;

    const handleScroll = () => {
      if (window.scrollY > 50) {
        this.DOM.navbar.classList.add('scrolled');
      } else {
        this.DOM.navbar.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Trigger on load
  }

  /**
   * Accessible Mobile Menu configuration
   */
  initMobileMenu() {
    if (!this.DOM.hamburger || !this.DOM.mobileMenu) return;

    const toggleMenu = () => {
      const isOpen = this.DOM.hamburger.classList.contains('open');
      
      this.DOM.hamburger.classList.toggle('open');
      this.DOM.mobileMenu.classList.toggle('open');
      
      // A11y attributes update
      this.DOM.hamburger.setAttribute('aria-expanded', !isOpen);
      this.DOM.mobileMenu.setAttribute('aria-hidden', isOpen);
    };

    this.DOM.hamburger.addEventListener('click', toggleMenu);

    // Auto-close menu when a link is clicked
    const mobileLinks = this.DOM.mobileMenu.querySelectorAll('.mobile-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (this.DOM.hamburger.classList.contains('open')) toggleMenu();
      });
    });
  }

  /**
   * Unified Intersection Observer for scroll reveals, 
   * stat counters, and progress bar animations.
   */
  initScrollObserver() {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observerInstance) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;

          // 1. General scroll reveal
          if (el.classList.contains('reveal')) {
            el.classList.add('visible');
          }

          // 2. Stat Counter Animation
          if (el.classList.contains('stat-number') && !el.dataset.animated) {
            el.dataset.animated = "true";
            const targetVal = parseInt(el.dataset.target, 10);
            
            if (!this.prefersReducedMotion) {
              this.animateValue(el, 0, targetVal, 2000);
            } else {
              el.textContent = targetVal; // Fallback for reduced motion
            }
          }

          // 3. Progress Bar Fill Animation
          if (el.classList.contains('metric-bar-fill') && !el.dataset.animated) {
            el.dataset.animated = "true";
            // Slight delay allows the parent container's reveal animation to settle first
            setTimeout(() => {
              el.style.width = `${el.dataset.width}%`;
            }, 300);
          }

          // Stop observing once fully animated to save resources
          if (!el.classList.contains('reveal') || el.classList.contains('visible')) {
            observerInstance.unobserve(el);
          }
        }
      });
    }, observerOptions);

    // Register elements to observer
    this.DOM.reveals.forEach(el => observer.observe(el));
    this.DOM.stats.forEach(el => observer.observe(el));
    this.DOM.progressBars.forEach(el => observer.observe(el));
  }

  /**
   * Hardware-accelerated easing counter
   * @param {HTMLElement} obj - Target DOM element
   * @param {number} start - Starting value
   * @param {number} end - Ending value
   * @param {number} duration - Animation duration in ms
   */
  animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out quad algorithm for natural deceleration
      const easeOut = progress * (2 - progress); 
      
      obj.textContent = Math.floor(easeOut * (end - start) + start);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.textContent = end; // Ensure exact final value
      }
    };
    
    window.requestAnimationFrame(step);
  }
}

// Initialize Application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  new XuneelApp();
});
