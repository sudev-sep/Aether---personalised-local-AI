import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsComponent } from '../settings/settings.component';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SidebarChat {
  id: number;
  title: string;
  icon: string;
  group: 'Today' | 'Previous 7 Days' | 'Constellations';
}

interface BackendConversation {
  id: number;
  title: string;
  created_at: string;
}

interface SuggestionCard {
  title: string;
  desc: string;
  icon: string;
  accent: 'primary' | 'secondary' | 'tertiary';
  prompt: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, SettingsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @ViewChild('promptBox') promptBox?: ElementRef<HTMLTextAreaElement>;

  private readonly HIDDEN_CHATS_KEY = 'hidden_chat_ids';
  private hiddenChatIds = new Set<number>();

  isSidebarCollapsed = false;
  searchQuery = '';
  activeChatId: number | null = null;
  activeFooterTab: 'settings' | 'about' | null = null;

  promptText = '';
  isSearchEnabled = false;
  isLoading = false;
  messages: ChatMessage[] = [];
  chats: SidebarChat[] = [];

  readonly groups: Array<'Today' | 'Previous 7 Days' | 'Constellations'> = [
    'Today',
    'Previous 7 Days',
    'Constellations'
  ];

  readonly suggestions: SuggestionCard[] = [
    {
      title: 'Orbital Mechanics & Physics',
      desc: 'Analyze three-body stability equations and celestial orbital resonance for binary pulsars.',
      icon: 'satellite',
      accent: 'secondary',
      prompt: 'Analyze orbital mechanics & three-body stability simulation for binary pulsar PSR B1913+16'
    },
    {
      title: 'Neural Node Architectures',
      desc: 'Draft fault-tolerant specifications for distributed tensor networks and quantum repeaters.',
      icon: 'grid_goldenratio',
      accent: 'primary',
      prompt: 'Draft architectural specification for an asynchronous distributed neural node fabric'
    },
    {
      title: 'Gravitational Wave Poetry',
      desc: 'Synthesize evocative lyrical verse rooted in LIGO chirp metrics and black hole coalescence.',
      icon: 'auto_stories',
      accent: 'tertiary',
      prompt: 'Synthesize mathematical poetry from gravitational wave interferometer frequency signatures'
    },
    {
      title: 'Quantum Telemetry Survey',
      desc: 'Summarize spectroscopic telemetry and anomaly candidates discovered across deep field surveys.',
      icon: 'qr_code_2',
      accent: 'secondary',
      prompt: 'Summarize latest quantum telemetry observations and dark matter decay signals'
    }
  ];

  ngOnInit(): void {
    this.loadHiddenChatIds();
    this.loadConversations();
  }

  private loadHiddenChatIds(): void {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(this.HIDDEN_CHATS_KEY);
    if (saved) {
      this.hiddenChatIds = new Set<number>(JSON.parse(saved));
    }
  }

  private saveHiddenChatIds(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.HIDDEN_CHATS_KEY, JSON.stringify([...this.hiddenChatIds]));
  }

  async loadConversations(): Promise<void> {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/conversations/');
      if (!response.ok) return;

      const data: BackendConversation[] = await response.json();

      this.chats = data
        .filter((conv) => !this.hiddenChatIds.has(conv.id))
        .map((conv) => ({
          id: conv.id,
          title: conv.title,
          icon: 'chat_bubble',
          group: this.getGroupFromDate(conv.created_at)
        }));
    } catch (error) {
      console.error('Could not load conversations:', error);
    }
  }

  private getGroupFromDate(dateString: string): SidebarChat['group'] {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 1) return 'Today';
    if (diffDays <= 7) return 'Previous 7 Days';
    return 'Constellations';
  }
async selectChat(chat: SidebarChat): Promise<void> {
    this.activeChatId = chat.id;
    this.activeFooterTab = null;
    this.isLoading = true;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/conversations/${chat.id}/`);
      if (response.ok) {
        const rawMessages = await response.json();
        console.log('Loaded messages from Django:', rawMessages);

        this.messages = rawMessages.map((msg: any) => ({
          role: String(msg.role || '').trim().toLowerCase() === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
      }
    } catch (error) {
      console.error('Could not load messages:', error);
    } finally {
      this.isLoading = false;
    }
  }

  hideChat(event: Event, chatId: number): void {
    event.stopPropagation();

    this.hiddenChatIds.add(chatId);
    this.saveHiddenChatIds();

    this.chats = this.chats.filter((c) => c.id !== chatId);

    if (this.activeChatId === chatId) {
      this.startNewChat();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleShortcuts(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.startNewChat();
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  getChatsByGroup(group: SidebarChat['group']): SidebarChat[] {
    const query = this.searchQuery.trim().toLowerCase();
    return this.chats.filter(
      (chat) => chat.group === group && (!query || chat.title.toLowerCase().includes(query))
    );
  }

  startNewChat(): void {
    this.activeChatId = null;
    this.activeFooterTab = null;
    this.messages = [];
    this.promptText = '';
    setTimeout(() => this.promptBox?.nativeElement.focus(), 0);
  }

  selectFooterTab(tab: 'settings' | 'about'): void {
    this.activeFooterTab = this.activeFooterTab === tab ? null : tab;
  }

  fillPrompt(text: string): void {
    this.promptText = text;
    setTimeout(() => this.promptBox?.nativeElement.focus(), 0);
  }

  toggleSearch(): void {
    this.isSearchEnabled = !this.isSearchEnabled;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendPrompt();
    }
  }

  async sendPrompt(): Promise<void> {
    const trimmed = this.promptText.trim();
    if (!trimmed || this.isLoading) return;

    this.messages.push({ role: 'user', content: trimmed });
    this.promptText = '';
    this.isLoading = true;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          conversation_id: this.activeChatId
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (!this.activeChatId && data.conversation_id) {
          this.activeChatId = data.conversation_id;
          this.chats.unshift({
            id: data.conversation_id,
            title: trimmed.length > 32 ? `${trimmed.slice(0, 32)}...` : trimmed,
            icon: 'chat_bubble',
            group: 'Today'
          });
        }
        this.messages.push({ role: 'assistant', content: data.response });
      } else {
        this.messages.push({
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to get response from backend.'}`
        });
      }
    } catch {
      this.messages.push({
        role: 'assistant',
        content: 'Network Error: Could not reach Django at http://127.0.0.1:8000/api/chat/.'
      });
    } finally {
      this.isLoading = false;
    }
  }

  restoreHiddenChats(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.HIDDEN_CHATS_KEY);
    this.hiddenChatIds.clear();
    this.loadConversations();
  }
}