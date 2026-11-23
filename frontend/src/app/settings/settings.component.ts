import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface UserMemoryItem {
  id: number;
  fact: string;
  created_at: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  @Output() backToChat = new EventEmitter<void>();
  @Output() restoreChats = new EventEmitter<void>();

  memories: UserMemoryItem[] = [];
  newMemoryFact = '';
  isSavingMemory = false;

  workspaceName = 'Aether Local Nexus';
  autoSaveState = true;
  compactDensity = false;

  ngOnInit(): void {
    this.loadMemories();
  }

  async loadMemories(): Promise<void> {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/memories/');
      if (response.ok) {
        this.memories = await response.json();
      }
    } catch (error) {
      console.error('Could not load memories:', error);
    }
  }

  async addMemory(): Promise<void> {
    const fact = this.newMemoryFact.trim();
    if (!fact || this.isSavingMemory) return;

    this.isSavingMemory = true;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/memories/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fact })
      });

      if (response.ok) {
        const created: UserMemoryItem = await response.json();
        this.memories.unshift(created);
        this.newMemoryFact = '';
      }
    } catch (error) {
      console.error('Could not save memory:', error);
    } finally {
      this.isSavingMemory = false;
    }
  }

  async deleteMemory(memoryId: number): Promise<void> {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/memories/${memoryId}/`, {
        method: 'DELETE'
      });

      if (response.ok) {
        this.memories = this.memories.filter((m) => m.id !== memoryId);
      }
    } catch (error) {
      console.error('Could not delete memory:', error);
    }
  }
}