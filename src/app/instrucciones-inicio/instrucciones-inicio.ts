// primera-vez/primera-vez.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: string;
  code?: string;
  detail?: string;
}

@Component({
  selector: 'app-instrucciones-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instrucciones-inicio.html',
  styleUrls: ['./instrucciones-inicio.css']
})
export class instruccionesInicio {
  currentStep = 0;
  scriptCopied = false;
  scriptExample = '<script src="https://cdn.uxtracks.com/uxtracks.js" data-site-id="TU_ID"></script>';
  userId = 'USR_123456'; // Este vendría del usuario autenticado

  steps: Step[] = [
    {
      number: 1,
      title: 'Copia tu script personalizado desde el panel',
      description: 'Este script único identifica tu sitio web en UXTracks',
      icon: '📋',
      code: '<script src="https://cdn.uxtracks.com/uxtracks.js" data-site-id="TU_ID"></script>',
      detail: 'Asegúrate de copiar el script completo tal como aparece'
    },
    {
      number: 2,
      title: 'Pégalo al final del <body> de cada página',
      description: 'Coloca el script justo antes de la etiqueta de cierre </body>',
      icon: '📝',
      detail: 'Esto permite que UXTracks rastree toda la actividad del usuario en la página'
    },
    {
      number: 3,
      title: '¡Listo! Empieza a ver métricas en tiempo real',
      description: 'Tu dashboard comenzará a recibir datos inmediatamente',
      icon: '📊',
      detail: 'Las métricas aparecerán en tu panel de control en segundos'
    }
  ];

  // Método para copiar el script al portapapeles
  copyScript(): void {
    const script = this.scriptExample.replace('TU_ID', this.userId);
    
    navigator.clipboard.writeText(script).then(() => {
      this.scriptCopied = true;
      console.log('Script copiado al portapapeles');
      
      // Resetear el estado después de 3 segundos
      setTimeout(() => {
        this.scriptCopied = false;
      }, 3000);
    }).catch(err => {
      console.error('Error al copiar:', err);
      // Fallback para navegadores antiguos
      this.fallbackCopyScript(script);
    });
  }

  // Método fallback para copiar en navegadores antiguos
  private fallbackCopyScript(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
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
    }
    
    document.body.removeChild(textArea);
  }

  // Navegación entre pasos
  goToStep(stepIndex: number): void {
    this.currentStep = stepIndex;
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  // Navegación
  onAddWebsite(): void {
    console.log('Añadir sitio web clicked');
    // Navegar a la página de configuración o dashboard
    // this.router.navigate(['/dashboard/add-website']);
  }

  onViewDashboard(): void {
    console.log('Ver dashboard clicked');
    // Navegar al dashboard principal
    // this.router.navigate(['/dashboard']);
  }

  onLogout(): void {
    console.log('Cerrar sesión clicked');
    // Lógica para cerrar sesión
    // this.authService.logout();
    // this.router.navigate(['/']);
  }

  onSkipTutorial(): void {
    console.log('Omitir tutorial clicked');
    // Navegar directamente al dashboard
    // this.router.navigate(['/dashboard']);
  }

  // Helpers
  getStepClass(index: number): string {
    if (index === this.currentStep) return 'active';
    if (index < this.currentStep) return 'completed';
    return 'pending';
  }

  isLastStep(): boolean {
    return this.currentStep === this.steps.length - 1;
  }

  isFirstStep(): boolean {
    return this.currentStep === 0;
  }

  trackByStep(index: number, step: Step): number {
    return step.number;
  }
}