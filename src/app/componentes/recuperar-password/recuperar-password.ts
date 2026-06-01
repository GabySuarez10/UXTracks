import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './recuperar-password.html',
  styleUrls: ['./recuperar-password.css']
})
export class RecuperarPassword {
  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;

  // Estado del flujo (1: email, 2: código, 3: nueva contraseña, 4: éxito)
  currentStep = 1;

  // Formularios
  emailForm: FormGroup;
  codeForm: FormGroup;
  passwordForm: FormGroup;

  // Estado
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  email = '';
  verifiedCode = '';

  // Temporizador para reenvío
  resendCooldown = 0;
  private resendInterval: any;

  private ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.emailForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.codeForm = this.formBuilder.group({
      digit0: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit5: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    });

    this.passwordForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  // === PASO 1: Enviar email ===
  onSubmitEmail(): void {
    if (this.emailForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.email = this.emailForm.get('email')?.value;

      this.authService.requestPasswordRecovery(this.email)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = response.message;
            this.currentStep = 2;
            this.startResendCooldown();
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.error || 'Error al enviar el código';
          }
        });
    } else {
      this.emailForm.get('email')?.markAsTouched();
    }
  }

  // === PASO 2: Verificar código ===
  onCodeInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Solo permitir dígitos
    if (value && !/^\d$/.test(value)) {
      input.value = '';
      this.codeForm.get(`digit${index}`)?.setValue('');
      return;
    }

    // Auto-avanzar al siguiente input
    if (value && index < 5) {
      const inputs = this.codeInputs.toArray();
      inputs[index + 1].nativeElement.focus();
    }

    // Si todos los dígitos están llenos, verificar automáticamente
    if (this.codeForm.valid) {
      this.onVerifyCode();
    }
  }

  onCodeKeydown(event: KeyboardEvent, index: number): void {
    // Retroceder al input anterior con Backspace
    if (event.key === 'Backspace' && index > 0) {
      const currentValue = this.codeForm.get(`digit${index}`)?.value;
      if (!currentValue) {
        const inputs = this.codeInputs.toArray();
        inputs[index - 1].nativeElement.focus();
        this.codeForm.get(`digit${index - 1}`)?.setValue('');
      }
    }
  }

  onCodePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const digits = pastedText.replace(/\D/g, '').slice(0, 6);

    if (digits.length === 6) {
      for (let i = 0; i < 6; i++) {
        this.codeForm.get(`digit${i}`)?.setValue(digits[i]);
      }
      if (this.codeForm.valid) {
        this.onVerifyCode();
      }
    }
  }

  getFullCode(): string {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += this.codeForm.get(`digit${i}`)?.value || '';
    }
    return code;
  }

  onVerifyCode(): void {
    if (this.codeForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const code = this.getFullCode();

      this.authService.verifyRecoveryCode(this.email, code)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.verifiedCode = code;
            this.currentStep = 3;
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.error || 'Código inválido o expirado';
            // Limpiar inputs
            for (let i = 0; i < 6; i++) {
              this.codeForm.get(`digit${i}`)?.setValue('');
            }
            const inputs = this.codeInputs.toArray();
            if (inputs.length > 0) {
              inputs[0].nativeElement.focus();
            }
          }
        });
    }
  }

  resendCode(): void {
    if (this.resendCooldown > 0) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.requestPasswordRecovery(this.email)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Código reenviado exitosamente';
          this.startResendCooldown();
          // Limpiar inputs de código
          for (let i = 0; i < 6; i++) {
            this.codeForm.get(`digit${i}`)?.setValue('');
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'Error al reenviar el código';
        }
      });
  }

  private startResendCooldown(): void {
    this.resendCooldown = 60;
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
    this.resendInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  // === PASO 3: Nueva contraseña ===
  onResetPassword(): void {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const newPassword = this.passwordForm.get('password')?.value;

      this.authService.resetPassword(this.email, this.verifiedCode, newPassword)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.currentStep = 4;
            // Redirigir al login después de 3 segundos
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.error || 'Error al restablecer la contraseña';
          }
        });
    } else {
      this.markFormGroupTouched(this.passwordForm);
    }
  }

  // === Validaciones ===
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  hasFormError(errorType: string): boolean {
    return this.passwordForm.hasError(errorType) &&
           (this.passwordForm.get('confirmPassword')?.touched || false);
  }

  hasError(form: FormGroup, controlName: string, errorType: string): boolean {
    const control = form.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  getErrorMessage(form: FormGroup, controlName: string): string {
    const control = form.get(controlName);

    if (control?.hasError('required')) {
      switch (controlName) {
        case 'email': return 'El correo electrónico es requerido';
        case 'password': return 'La contraseña es requerida';
        case 'confirmPassword': return 'Confirma tu contraseña';
        default: return 'Este campo es requerido';
      }
    }

    if (control?.hasError('email')) {
      return 'Por favor ingresa un correo electrónico válido';
    }

    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `La contraseña debe tener al menos ${minLength} caracteres`;
    }

    return '';
  }

  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordStrength(): string {
    const password = this.passwordForm.get('password')?.value || '';
    const length = password.length;

    if (length === 0) return '';
    if (length < 6) return 'débil';
    if (length < 10) return 'media';

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

  // === Navegación ===
  onBackToLogin(): void {
    this.router.navigate(['/login']);
  }

  onBackToHome(): void {
    this.router.navigate(['/homepage']);
  }

  onRegister(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/registro']);
  }

  goBackStep(): void {
    if (this.currentStep > 1) {
      this.errorMessage = '';
      this.successMessage = '';
      this.currentStep--;
    }
  }
}
