// vincular-sitio/vincular-sitio.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-vincular-sitio',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './vincular-sitio.html',
  styleUrls: ['./vincular-sitio.css']
})
export class VincularSitio implements OnInit {
  siteForm: FormGroup;
  scriptCopied = false;
  isLoading = false;
  showSuccess = false;
  
  // Datos del usuario (vendrían del servicio de autenticación)
  userId = 'USR_' + this.generateRandomId();
  siteId = '';
  generatedScript = '';

  constructor(private formBuilder: FormBuilder) {
    this.siteForm = this.formBuilder.group({
      siteName: ['', [
        Validators.required, 
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z0-9\s\-_.]+$/)
      ]]
    });
  }

  ngOnInit(): void {
    this.generateSiteId();
    this.updateScript();
  }

  // Generar ID único para el sitio
  private generateSiteId(): void {
    this.siteId = 'SITE_' + this.generateRandomId();
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Actualizar script con el ID del sitio
  private updateScript(): void {
    this.generatedScript = `<script src="https://cdn.uxtracks.com/uxtracks.js" data-site-id="${this.siteId}"></script>`;
  }

  // Getter para el control del nombre
  get siteName() {
    return this.siteForm.get('siteName');
  }

  // Copiar script al portapapeles
  copyScript(): void {
    navigator.clipboard.writeText(this.generatedScript).then(() => {
      this.scriptCopied = true;
      console.log('Script copiado al portapapeles');
      
      // Resetear después de 3 segundos
      setTimeout(() => {
        this.scriptCopied = false;
      }, 3000);
    }).catch(err => {
      console.error('Error al copiar:', err);
      this.fallbackCopyScript();
    });
  }

  // Método fallback para copiar
  private fallbackCopyScript(): void {
    const textArea = document.createElement('textarea');
    textArea.value = this.generatedScript;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.scriptCopied = true;
      setTimeout(() => {
        this.scriptCopied = false;
      }, 3000);
    } catch (err) {
      console.error('Fallback: Error al copiar', err);
      alert('No se pudo copiar el script. Por favor, cópialo manualmente.');
    }
    
    document.body.removeChild(textArea);
  }

  // Validación del nombre del sitio
  hasError(errorType: string): boolean {
    const control = this.siteName;
    return control ? control.hasError(errorType) && control.touched : false;
  }

  getErrorMessage(): string {
    if (this.hasError('required')) {
      return 'El nombre del sitio es requerido';
    }
    if (this.hasError('minlength')) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    if (this.hasError('maxlength')) {
      return 'El nombre no puede tener más de 100 caracteres';
    }
    if (this.hasError('pattern')) {
      return 'Solo se permiten letras, números, espacios y los caracteres: - _ .';
    }
    return '';
  }

  // Finalizar configuración
  onFinish(): void {
    if (this.siteForm.valid) {
      this.isLoading = true;

      // Simular llamada a API para guardar el sitio
      setTimeout(() => {
        console.log('Sitio guardado:', {
          name: this.siteName?.value,
          siteId: this.siteId,
          userId: this.userId
        });
        
        this.isLoading = false;
        this.showSuccess = true;

        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          this.onGoToDashboard();
        }, 2000);
      }, 1500);
    } else {
      this.siteName?.markAsTouched();
    }
  }

  // Navegación
  onBack(): void {
    console.log('Volver a instrucciones');
    // Navegar de vuelta a la página de primera vez
    // this.router.navigate(['/primera-vez']);
  }

  onBackToHome(): void {
    console.log('Volver al inicio');
    // this.router.navigate(['/']);
  }

  onGoToDashboard(): void {
    console.log('Ir al dashboard');
    // this.router.navigate(['/dashboard']);
  }

  onLogout(): void {
    console.log('Cerrar sesión');
    // this.authService.logout();
    // this.router.navigate(['/']);
  }

  onViewInstructions(): void {
    console.log('Ver instrucciones');
    // this.router.navigate(['/primera-vez']);
  }

  // Copiar al hacer clic en el campo de script
  onScriptClick(): void {
    this.copyScript();
  }
}