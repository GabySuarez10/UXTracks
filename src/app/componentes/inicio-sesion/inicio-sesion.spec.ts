import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { InicioSesion } from './inicio-sesion';

describe('InicioSesion', () => {
  let component: InicioSesion;
  let fixture: ComponentFixture<InicioSesion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioSesion, ReactiveFormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InicioSesion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginForm.get('rememberMe')?.value).toBe(false);
  });

  it('should validate required fields', () => {
    const emailControl = component.loginForm.get('email');
    const passwordControl = component.loginForm.get('password');

    emailControl?.markAsTouched();
    passwordControl?.markAsTouched();

    expect(emailControl?.hasError('required')).toBeTruthy();
    expect(passwordControl?.hasError('required')).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');
    
    emailControl?.setValue('invalid-email');
    emailControl?.markAsTouched();
    
    expect(emailControl?.hasError('email')).toBeTruthy();
    
    emailControl?.setValue('test@example.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.loginForm.get('password');
    
    passwordControl?.setValue('123');
    passwordControl?.markAsTouched();
    
    expect(passwordControl?.hasError('minlength')).toBeTruthy();
    
    passwordControl?.setValue('123456');
    expect(passwordControl?.hasError('minlength')).toBeFalsy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalsy();
    
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTruthy();
    
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeFalsy();
  });

  it('should call onForgotPassword when link is clicked', () => {
    spyOn(component, 'onForgotPassword');
    
    const forgotLink = fixture.debugElement.query(By.css('.forgot-password-link'));
    forgotLink.nativeElement.click();
    
    expect(component.onForgotPassword).toHaveBeenCalled();
  });
});