import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  @Output() backToChat = new EventEmitter<void>();

  readonly stack = [
    { label: 'Model Engine', value: 'Ollama (Llama 3.2 3B)', icon: 'memory' },
    { label: 'Backend API', value: 'Django & DRF', icon: 'dns' },
    { label: 'Database', value: 'Local SQLite', icon: 'database' },
    { label: 'Frontend', value: 'Angular Standalone', icon: 'web' }
  ];
}