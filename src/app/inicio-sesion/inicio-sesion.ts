import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './inicio-sesion.html',
  styleUrls: ['./inicio-sesion.css']
})
export class InicioSesion {
onLogin() {
throw new Error('Method not implemented.');
}
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  loginError = '';

  constructor(private formBuilder: FormBuilder,
     private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  // Getter para facilitar el acceso a los controles del formulario
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }


  // Métodos para manejo del formulario
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = '';

      // Simular llamada a API
      setTimeout(() => {
        console.log('Login data:', this.loginForm.value);
        this.isLoading = false;
        
        // Aquí irías a la página principal o dashboard
        // this.router.navigate(['/dashboard']);
      }, 2000);
    } else {
      this.markFormGroupTouched();
    }
  }

  onForgotPassword(): void {
    console.log('Forgot password clicked');
    // Navegar a página de recuperación de contraseña
    // this.router.navigate(['/forgot-password']);
  }

  onRegister(event: Event): void {
    console.log('Register clicked');
      event.preventDefault()
    // Navegar a página de registro
     this.router.navigate(['/registro']);
  }

  onBackToHome(): void {
    console.log('Back to home clicked');
    this.router.navigate(['/homepage']);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Marcar todos los campos como touched para mostrar errores
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Validaciones para mostrar errores
  hasError(controlName: string, errorType: string): boolean {
    const control = this.loginForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    
    if (control?.hasError('required')) {
      return `${controlName === 'email' ? 'El email es requerido' : 'La contraseña es requerida'} `;
    }
    
    if (control?.hasError('email')) {
      return 'Por favor ingresa un email válido';
    }
    
    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    
    return '';
  }
}