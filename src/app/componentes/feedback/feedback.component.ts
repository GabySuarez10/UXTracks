import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitasService } from '../../servicios/visitas.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnChanges {

  @Input() siteUrl: string = '';

  feedbacks: any[] = [];
  loading: boolean = false;
  error: string = '';

  satisfechoCount = 0;
  neutralCount = 0;
  insatisfechoCount = 0;

  totalCount = 0;

  satisfechoPercent = 0;
  neutralPercent = 0;
  insatisfechoPercent = 0;

  filteredComments: any[] = [];

  constructor(private visitasService: VisitasService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['siteUrl'] && this.siteUrl) {
      this.loadFeedbacks();
    }
  }

  loadFeedbacks() {
    this.loading = true;
    this.error = '';

    this.visitasService.getFeedbacks(this.siteUrl).subscribe({
      next: (data) => {
        this.feedbacks = data || [];
        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar feedbacks:', err);
        this.error = 'Ocurrió un error al cargar las opiniones de los usuarios.';
        this.loading = false;
      }
    });
  }

  private normalizeResponse(value: string): string {
    return (value || '').toLowerCase().trim();
  }

  calculateStats() {
    this.satisfechoCount = 0;
    this.neutralCount = 0;
    this.insatisfechoCount = 0;
    this.filteredComments = [];

    this.feedbacks.forEach(f => {

      const response = this.normalizeResponse(f.response);

      if (response === 'satisfecho') {
        this.satisfechoCount++;
      }
      else if (response === 'neutral') {
        this.neutralCount++;
      }
      else if (
        response === 'insatisfecho' ||
        response === 'insatisfactorio'
      ) {
        this.insatisfechoCount++;
      }

      if (f.comment && f.comment.trim() !== '') {
        this.filteredComments.push(f);
      }
    });

    this.totalCount = this.feedbacks.length;

    if (this.totalCount > 0) {
      this.satisfechoPercent = Math.round((this.satisfechoCount / this.totalCount) * 100);
      this.neutralPercent = Math.round((this.neutralCount / this.totalCount) * 100);
      this.insatisfechoPercent = Math.round((this.insatisfechoCount / this.totalCount) * 100);
    } else {
      this.satisfechoPercent = 0;
      this.neutralPercent = 0;
      this.insatisfechoPercent = 0;
    }
  }

  getEmoji(response: string): string {
    switch (this.normalizeResponse(response)) {
      case 'satisfecho': return '😊';
      case 'neutral': return '😐';
      case 'insatisfecho':
      case 'insatisfactorio':
        return '😞';
      default: return '💬';
    }
  }

  getResponseLabel(response: string): string {
    switch (this.normalizeResponse(response)) {
      case 'satisfecho': return 'Satisfecho';
      case 'neutral': return 'Neutral';
      case 'insatisfecho':
      case 'insatisfactorio':
        return 'Insatisfecho';
      default: return response;
    }
  }
}