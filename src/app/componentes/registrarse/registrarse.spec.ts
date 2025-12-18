// registro/registro.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Registro } from './registrarse';

describe('Registro', () => {
  let component: Registro;
  let fixture: ComponentFixture<Registro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registro, ReactiveFormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Registro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.registerForm.get('username')?.value).toBe('');
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
    expect(component.registerForm.get('acceptTerms')?.value).toBe(false);
  });

  it('should validate required fields', () => {
    const usernameControl = component.registerForm.get('username');
    const emailControl = component.registerForm.get('email');
    const passwordControl = component.registerForm.get('password');
    const confirmPasswordControl = component.registerForm.get('confirmPassword');
    const acceptTermsControl = component.registerForm.get('acceptTerms');

    usernameControl?.markAsTouched();
    emailControl?.markAsTouched();
    passwordControl?.markAsTouched();
    confirmPasswordControl?.markAsTouched();
    acceptTermsControl?.markAsTouched();

    expect(usernameControl?.hasError('required')).toBeTruthy();
    expect(emailControl?.hasError('required')).toBeTruthy();
    expect(passwordControl?.hasError('required')).toBeTruthy();
    expect(confirmPasswordControl?.hasError('required')).toBeTruthy();
    expect(acceptTermsControl?.hasError('required')).toBeTruthy();
  });

  it('should validate username length', () => {
    const usernameControl = component.registerForm.get('username');
    
    // Muy corto
    usernameControl?.setValue('ab');
    usernameControl?.markAsTouched();
    expect(usernameControl?.hasError('minlength')).toBeTruthy();
    
    // Muy largo
    usernameControl?.setValue('a'.repeat(25));
    expect(usernameControl?.hasError('maxlength')).toBeTruthy();
    
    // Válido
    usernameControl?.setValue('usuario123');
    expect(usernameControl?.hasError('minlength')).toBeFalsy();
    expect(usernameControl?.hasError('maxlength')).toBeFalsy();
  });

  it('should validate email format', () => {
    const emailControl = component.registerForm.get('email');
    
    emailControl?.setValue('invalid-email');
    emailControl?.markAsTouched();
    expect(emailControl?.hasError('email')).toBeTruthy();
    
    emailControl?.setValue('test@example.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.registerForm.get('password');
    
    passwordControl?.setValue('123');
    passwordControl?.markAsTouched();
    expect(passwordControl?.hasError('minlength')).toBeTruthy();
    
    passwordControl?.setValue('12345678');
    expect(passwordControl?.hasError('minlength')).toBeFalsy();
  });

  it('should validate password confirmation match', () => {
    const passwordControl = component.registerForm.get('password');
    const confirmPasswordControl = component.registerForm.get('confirmPassword');
    
    passwordControl?.setValue('password123');
    confirmPasswordControl?.setValue('different123');
    confirmPasswordControl?.markAsTouched();
    
    expect(component.registerForm.hasError('passwordMismatch')).toBeTruthy();
    
    confirmPasswordControl?.setValue('password123');
    expect(component.registerForm.hasError('passwordMismatch')).toBeFalsy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalsy();
    
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTruthy();
    
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeFalsy();
  });

  it('should toggle confirm password visibility', () => {
    expect(component.showConfirmPassword).toBeFalsy();
    
    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword).toBeTruthy();
    
    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword).toBeFalsy();
  });

  it('should calculate password strength correctly', () => {
    const passwordControl = component.registerForm.get('password');
    
    // Contraseña débil
    passwordControl?.setValue('123');
    expect(component.getPasswordStrength()).toBe('débil');
    
    // Contraseña media
    passwordControl?.setValue('password123');
    expect(component.getPasswordStrength()).toBe('media');
    
    // Contraseña fuerte
    passwordControl?.setValue('Password123!');
    expect(component.getPasswordStrength()).toBe('fuerte');
  });

  it('should return correct password strength class', () => {
    const passwordControl = component.registerForm.get('password');
    
    passwordControl?.setValue('123');
    expect(component.getPasswordStrengthClass()).toBe('strength-weak');
    
    passwordControl?.setValue('password123');
    expect(component.getPasswordStrengthClass()).toBe('strength-medium');
    
    passwordControl?.setValue('Password123!');
    expect(component.getPasswordStrengthClass()).toBe('strength-strong');
  });

  it('should show password strength indicator when password has value', () => {
    const passwordControl = component.registerForm.get('password');
    passwordControl?.setValue('test123');
    fixture.detectChanges();
    
    const strengthIndicator = fixture.debugElement.query(By.css('.password-strength'));
    expect(strengthIndicator).toBeTruthy();
  });

  it('should call onLogin when login link is clicked', () => {
    spyOn(component, 'onLogin');
    const loginLink = fixture.debugElement.query(By.css('.login-link'));
    loginLink?.nativeElement.click();
    expect(component.onLogin).toHaveBeenCalled();
  });

  it('should call onBackToHome when back button is clicked', () => {
    spyOn(component, 'onBackToHome');
    const backBtn = fixture.debugElement.query(By.css('.back-btn'));
    backBtn?.nativeElement.click();
    expect(component.onBackToHome).toHaveBeenCalled();
  });

  it('should disable submit button when form is invalid', () => {
    const submitBtn = fixture.debugElement.query(By.css('.btn-register'));
    expect(submitBtn.nativeElement.disabled).toBeTruthy();
  });

  it('should enable submit button when form is valid', () => {
    // Llenar formulario con datos válidos
    component.registerForm.patchValue({
      username: 'usuario123',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      acceptTerms: true
    });
    
    fixture.detectChanges();
    
    const submitBtn = fixture.debugElement.query(By.css('.btn-register'));
    expect(submitBtn.nativeElement.disabled).toBeFalsy();
  });

  it('should show loading state when submitting', () => {
    // Llenar formulario con datos válidos
    component.registerForm.patchValue({
      username: 'usuario123',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      acceptTerms: true
    });
    
    component.onSubmit();
    expect(component.isLoading).toBeTruthy();
  });

  it('should show success message after successful registration', (done) => {
    // Llenar formulario con datos válidos
    component.registerForm.patchValue({
      username: 'usuario123',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      acceptTerms: true
    });
    
    component.onSubmit();
    
    // Esperar a que termine la simulación
    setTimeout(() => {
      expect(component.registerSuccess).toBeTruthy();
      expect(component.isLoading).toBeFalsy();
      fixture.detectChanges();
      
      const successMessage = fixture.debugElement.query(By.css('.success-message'));
      expect(successMessage).toBeTruthy();
      done();
    }, 2100);
  });

  it('should render all form fields', () => {
    const usernameField = fixture.debugElement.query(By.css('#username'));
    const emailField = fixture.debugElement.query(By.css('#email'));
    const passwordField = fixture.debugElement.query(By.css('#password'));
    const confirmPasswordField = fixture.debugElement.query(By.css('#confirmPassword'));
    const termsCheckbox = fixture.debugElement.query(By.css('input[type="checkbox"]'));
    
    expect(usernameField).toBeTruthy();
    expect(emailField).toBeTruthy();
    expect(passwordField).toBeTruthy();
    expect(confirmPasswordField).toBeTruthy();
    expect(termsCheckbox).toBeTruthy();
  });

  it('should have proper CSS classes and styling', () => {
    const registerPage = fixture.debugElement.query(By.css('.register-page'));
    const registerCard = fixture.debugElement.query(By.css('.register-card'));
    const backgroundBlur = fixture.debugElement.query(By.css('.background-blur'));
    
    expect(registerPage).toBeTruthy();
    expect(registerCard).toBeTruthy();
    expect(backgroundBlur).toBeTruthy();
  });

  it('should show error messages for invalid fields', () => {
    // Marcar todos los campos como touched
    Object.keys(component.registerForm.controls).forEach(key => {
      component.registerForm.get(key)?.markAsTouched();
    });
    
    fixture.detectChanges();
    
    const errorMessages = fixture.debugElement.queryAll(By.css('.error-message'));
    expect(errorMessages.length).toBeGreaterThan(0);
  });
});