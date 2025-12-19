// vincular-sitio/vincular-sitio.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { SiteService } from '../../servicios/site.service';

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

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private siteService: SiteService,
    private route: ActivatedRoute
  ) {
    this.siteForm = this.formBuilder.group({
      siteName: ['', [
        Validators.required, 
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z0-9\s\-_.]+$/)
      ]],
      siteUrl: ['', [
        Validators.required,
        //Validators.pattern(/^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/)
      ]]
    });
  }

  private ngUnsubscribe: Subject<void> = new Subject<void>();
  username = localStorage.getItem('username') || '';
  
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

  // Mostrar script
  private updateScript(): void {
    this.generatedScript = `<script src="https://cdn.jsdelivr.net/gh/GabySuarez10/UXTscript/scriptPrueba.js"></script>`;
  }

  // Getter para el control del nombre
  get siteName() {
    return this.siteForm.get('siteName');
  }

  get siteUrl() {
    return this.siteForm.get('siteUrl');
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
  hasError(controlName: string, errorType: string): boolean {
    const control = this.siteForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  getErrorMessage(controlName: string): string {
    const control = this.siteForm.get(controlName);
    if (this.hasError(controlName, 'required')) {
      if (controlName === 'siteName') {
        return 'El nombre del sitio es requerido';
      } else if (controlName === 'siteUrl') {
        return 'La URL del sitio es requerida';
      }
    }
    if (this.hasError(controlName, 'minlength')) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    if (this.hasError(controlName, 'maxlength')) {
      return 'El nombre no puede tener más de 100 caracteres';
    }
    if (this.hasError(controlName, 'pattern')) {
      return 'Solo se permiten letras, números, espacios y los caracteres: - _ .';
    }
    return '';
  }

  // Finalizar configuración
  onFinish(): void {
    if (this.siteForm.valid) {
      this.isLoading = true;
      this.siteService.addSite({username: this.username, title: this.siteName?.value, url: this.siteUrl?.value})
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
              this.isLoading = false;
              console.log('Sitio vinculado exitosamente');
              this.router.navigate(['/seleccion']);
          },
        error: (err) => {
            this.isLoading = false;
            console.log(err.error?.message || 'Error vinculando sitio');
        }
      });
    } else {
      this.siteName?.markAsTouched();
    }
  }

  // Navegación
  onBack(): void {
    console.log('Volver al dashboard');
    // Navegar de vuelta a la página de primera vez
    this.router.navigate(['/seleccion']);
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
    this.authService.logout();
    this.router.navigate(['/']);
  }

  onViewInstructions(): void {
    console.log('Ver instrucciones');
    this.router.navigate(['/instrucciones']);
  }

  // Copiar al hacer clic en el campo de script
  onScriptClick(): void {
    this.copyScript();
  }
}