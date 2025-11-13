// registro/registro.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './registrarse.html',
  styleUrls: ['./registrarse.css']
})
export class Registro {
onRegister() {
throw new Error('Method not implemented.');
}
  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  registerError = '';
  registerSuccess = false;

  constructor(private formBuilder: FormBuilder) {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Getter para facilitar el acceso a los controles del formulario
  get username() { return this.registerForm.get('username'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get acceptTerms() { return this.registerForm.get('acceptTerms'); }

  // Validador personalizado para confirmar contraseña
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // Métodos para manejo del formulario
  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.registerError = '';
      this.registerSuccess = false;

      // Simular llamada a API
      setTimeout(() => {
        console.log('Register data:', this.registerForm.value);
        this.isLoading = false;
        this.registerSuccess = true;
        
        // Después de 2 segundos, redirigir al login
        setTimeout(() => {
          this.onLogin();
        }, 2000);
      }, 2000);
    } else {
      this.markFormGroupTouched();
    }
  }

  onGoogleRegister(): void {
    console.log('Register with Google');
    // Implementar registro con Google
  }

  onFacebookRegister(): void {
    console.log('Register with Facebook');
    // Implementar registro con Facebook
  }

  onLogin(): void {
    console.log('Login clicked');
    // Navegar a página de login
    // this.router.navigate(['/inicio-sesion']);
  }

  onBackToHome(): void {
    console.log('Back to home clicked');
    // Navegar a página principal
    // this.router.navigate(['/']);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Marcar todos los campos como touched para mostrar errores
  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Validaciones para mostrar errores
  hasError(controlName: string, errorType: string): boolean {
    const control = this.registerForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  hasFormError(errorType: string): boolean {
    return this.registerForm.hasError(errorType) && 
           (this.confirmPassword?.touched || false);
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    
    if (control?.hasError('required')) {
      switch (controlName) {
        case 'username':
          return 'El nombre de usuario es requerido';
        case 'email':
          return 'El email es requerido';
        case 'password':
          return 'La contraseña es requerida';
        case 'confirmPassword':
          return 'Confirma tu contraseña';
        default:
          return 'Este campo es requerido';
      }
    }
    
    if (control?.hasError('email')) {
      return 'Por favor ingresa un email válido';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      if (controlName === 'username') {
        return `El nombre de usuario debe tener al menos ${minLength} caracteres`;
      }
      if (controlName === 'password') {
        return `La contraseña debe tener al menos ${minLength} caracteres`;
      }
    }
    
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `El nombre de usuario no puede tener más de ${maxLength} caracteres`;
    }
    
    return '';
  }

  getPasswordStrength(): string {
    const password = this.password?.value || '';
    const length = password.length;
    
    if (length === 0) return '';
    if (length < 6) return 'débil';
    if (length < 10) return 'media';
    
    // Verificar complejidad
    const hasNumbers = /\d/.test(password);
    const hasLowers = /[a-z]/.test(password);
    const hasUppers = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const complexity = [hasNumbers, hasLowers, hasUppers, hasSpecial].filter(Boolean).length;
    
    if (complexity >= 3 && length >= 10) return 'fuerte';
    if (complexity >= 2 && length >= 8) return 'media';
    return 'débil';
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'fuerte': return 'strength-strong';
      case 'media': return 'strength-medium';
      case 'débil': return 'strength-weak';
      default: return '';
    }
  }
}