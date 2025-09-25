// homepage/homepage.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Homepage } from './homepage';

describe('Homepage', () => {
  let component: Homepage;
  let fixture: ComponentFixture<Homepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Homepage] // Para componente standalone
    })
    .compileComponents();

    fixture = TestBed.createComponent(Homepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct title', () => {
    expect(component.title).toBe('UXTracks');
  });

  it('should initialize features array with 4 items', () => {
    expect(component.features).toBeDefined();
    expect(component.features.length).toBe(4);
    expect(component.features[0].title).toBe('Análisis de Clicks');
  });

  it('should initialize navItems array with 3 items', () => {
    expect(component.navItems).toBeDefined();
    expect(component.navItems.length).toBe(3);
    expect(component.navItems[0].label).toBe('Manual de usuario');
  });

  it('should render hero section with title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heroTitle = compiled.querySelector('.hero h1');
    expect(heroTitle?.textContent).toContain('Bienvenido a UXTracks');
  });

  it('should render all navigation items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('.nav-links a');
    expect(navLinks.length).toBeGreaterThanOrEqual(3);
  });

  it('should render all feature cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const featureCards = compiled.querySelectorAll('.feature-card');
    expect(featureCards.length).toBe(4);
  });

  it('should call onGetStarted when hero button is clicked', () => {
    spyOn(component, 'onGetStarted');
    const heroButton = fixture.debugElement.query(By.css('.hero .btn-primary'));
    heroButton.nativeElement.click();
    expect(component.onGetStarted).toHaveBeenCalled();
  });

  it('should call onLogin when login button is clicked', () => {
    spyOn(component, 'onLogin');
    const loginButton = fixture.debugElement.query(By.css('.navbar .btn-primary'));
    loginButton.nativeElement.click();
    expect(component.onLogin).toHaveBeenCalled();
  });

  it('should call onFeatureClick when feature card is clicked', () => {
    spyOn(component, 'onFeatureClick');
    const firstFeatureCard = fixture.debugElement.query(By.css('.feature-card'));
    firstFeatureCard.nativeElement.click();
    expect(component.onFeatureClick).toHaveBeenCalledWith(component.features[0]);
  });

  it('should display correct feature information', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const firstFeatureTitle = compiled.querySelector('.feature-card h3');
    expect(firstFeatureTitle?.textContent).toBe('Análisis de Clicks');
  });

  it('should have proper CSS classes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.homepage')).toBeTruthy();
    expect(compiled.querySelector('.header')).toBeTruthy();
    expect(compiled.querySelector('.hero')).toBeTruthy();
    expect(compiled.querySelector('.footer')).toBeTruthy();
  });

  it('should handle navigation item clicks', () => {
    spyOn(component, 'onNavItemClick');
    component.onNavItemClick(component.navItems[0]);
    expect(component.onNavItemClick).toHaveBeenCalledWith(component.navItems[0]);
  });
  it('should initialize carousel with first slide', () => {
    expect(component['currentSlide']).toBe(0);
    expect(component['carouselImages'].length).toBe(4);
  });

  it('should move to next slide', () => {
    component.nextSlide();
    expect(component['currentSlide']).toBe(1);
  });

  it('should move to previous slide', () => {
    component['currentSlide'] = 2;
    component.prevSlide();
    expect(component['currentSlide']).toBe(1);
  });

  it('should loop to last slide when going previous from first', () => {
    component['currentSlide'] = 0;
    component.prevSlide();
    expect(component['currentSlide']).toBe(3);
  });

  it('should loop to first slide when going next from last', () => {
    component['currentSlide'] = 3;
    component.nextSlide();
    expect(component['currentSlide']).toBe(0);
  });

  it('should go to specific slide', () => {
    component.goToSlide(2);
    expect(component['currentSlide']).toBe(2);
  });

  it('should render carousel indicators', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const indicators = compiled.querySelectorAll('.carousel-indicator');
    expect(indicators.length).toBe(4);
  });

  it('should show active slide correctly', () => {
    component['currentSlide'] = 1;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const activeSlide = compiled.querySelector('.carousel-slide.active');
    expect(activeSlide).toBeTruthy();
  });

  it('should call nextSlide when next button is clicked', () => {
    spyOn(component, 'nextSlide');
    const nextBtn = fixture.debugElement.query(By.css('.carousel-next'));
    nextBtn?.nativeElement.click();
    expect(component.nextSlide).toHaveBeenCalled();
  });

  it('should render how it works section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const howItWorksSection = compiled.querySelector('.how-it-works-section');
    expect(howItWorksSection).toBeTruthy();
  });

  // Test de accesibilidad básica
  it('should have proper heading structure', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1');
    const h2Elements = compiled.querySelectorAll('h2');
    
    expect(h1).toBeTruthy();
    expect(h2Elements.length).toBeGreaterThan(0);
  });

  // Test de responsive design
  it('should have responsive classes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.grid')).toBeTruthy();
    expect(compiled.querySelector('.container')).toBeTruthy();
  });
});