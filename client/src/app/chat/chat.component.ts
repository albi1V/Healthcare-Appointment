import { Component, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';

type Sender = 'user' | 'bot' | 'system';

interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  time: number;   // epoch ms
  status?: 'sending' | 'sent' | 'error';
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewInit {
  // UI state
  isOpen: boolean = false;      // ⬅️ closed by default
  isBotTyping: boolean = false;
  isSending: boolean = false;

  userMessage: string = '';
  quickReplies: string[] = [
    'Schedule an appointment',
    'My upcoming appointments',
    'Cancel an appointment',
    'Doctor availability',
    'Clinic contact details'
  ];

  // Messages
  messages: ChatMessage[] = [];

  @ViewChild('messagesPane') private messagesPane!: ElementRef<HTMLDivElement>;

  // Storage keys
  private storageKey = 'careAssistant_chatHistory_v1';
  private uiKey = 'careAssistant_ui_v1';            // ⬅️ remember open/close state
  private greetedKey = 'careAssistant_greeted_v1';  // ⬅️ show welcome only once

  constructor(private http: HttpService) {}

  ngOnInit(): void {
    // Restore messages
    this.restoreHistory();

    // Restore open/close UI state (default false)
    try {
      const ui = JSON.parse(localStorage.getItem(this.uiKey) || '{}');
      this.isOpen = !!ui.isOpen;
    } catch {
      this.isOpen = false;
    }

    // IMPORTANT: Do NOT push welcome message here (we will do it on first open)
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  // Getter (replacement for computed)
  get messageCount(): number {
    return this.messages.length;
  }

  // Handle Enter = send; Shift+Enter = newline
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;

    // persist UI state
    try {
      localStorage.setItem(this.uiKey, JSON.stringify({ isOpen: this.isOpen }));
    } catch { /* ignore */ }

    // On first open, show a friendly welcome once
    if (this.isOpen) {
      const alreadyGreeted = localStorage.getItem(this.greetedKey) === '1';
      if (!alreadyGreeted) {
        this.pushSystem(`Hi ${this.getUserFirstName() ?? 'there'} 👋 
I’m your Healthcare Assistant. I can help you schedule, view, or cancel appointments.
Note: I don’t provide medical advice.`);
        localStorage.setItem(this.greetedKey, '1');
      }
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  chooseQuickReply(text: string) {
    this.userMessage = text;
    this.send();
  }

  send() {
    const text = (this.userMessage || '').trim();
    if (!text || this.isSending) return;

    // Push user message
    const userMsg: ChatMessage = {
      id: this.uuid(),
      sender: 'user',
      text,
      time: Date.now(),
      status: 'sent'
    };
    this.pushMessage(userMsg);

    // Prepare UI flags
    this.isSending = true;
    this.isBotTyping = true;

    // Call backend (expects Observable<{ reply: string }>)
    this.http.sendMessage(text).subscribe({
      next: (res: any) => {
        if (res && typeof res.reply === 'string' && res.reply.trim().length > 0) {
          this.pushMessage({
            id: this.uuid(),
            sender: 'bot',
            text: res.reply,
            time: Date.now(),
            status: 'sent'
          });
        } else {
          this.pushMessage({
            id: this.uuid(),
            sender: 'system',
            text: 'Sorry, I could not process that right now. Please try again.',
            time: Date.now(),
            status: 'error'
          });
        }
      },
      error: () => {
        this.pushMessage({
          id: this.uuid(),
          sender: 'system',
          text: 'Sorry, I could not process that right now. Please try again.',
          time: Date.now(),
          status: 'error'
        });
      },
      complete: () => {
        this.isSending = false;
        this.isBotTyping = false;
        this.persistHistory();
        this.scrollToBottom();
      }
    });

    this.userMessage = '';
    this.persistHistory();
    this.scrollToBottom();
  }

  retryLast() {
    const last = [...this.messages].reverse().find(m => m.sender === 'user');
    if (last) {
      this.userMessage = last.text;
      this.send();
    }
  }

  clearChat() {
    if (!confirm('Clear this chat? This only clears local history on this browser.')) return;
    this.messages = [];
    this.persistHistory();
  }

  // ---- Helpers ----
  private pushMessage(m: ChatMessage) {
    this.messages = [...this.messages, m];
    this.persistHistory();
  }

  private pushSystem(text: string) {
    this.pushMessage({
      id: this.uuid(),
      sender: 'system',
      text,
      time: Date.now(),
      status: 'sent'
    });
  }

  private scrollToBottom() {
    if (!this.messagesPane) return;
    setTimeout(() => {
      const el = this.messagesPane.nativeElement;
      el.scrollTop = el.scrollHeight;
    }, 0);
  }

  private persistHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
    } catch { /* ignore */ }
  }

  private restoreHistory() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        const cleaned: ChatMessage[] = parsed.map((p) => ({
          id: p.id || this.uuid(),
          sender: (['user', 'bot', 'system'] as Sender[]).includes(p.sender as Sender)
            ? (p.sender as Sender)
            : 'system',
          text: String(p.text ?? ''),
          time: typeof p.time === 'number' ? p.time : Date.now(),
          // Force literal types so status isn't widened to string
          status: p.status === 'error' ? ('error' as const) :
                  p.status === 'sending' ? ('sending' as const) :
                  ('sent' as const),
        }));
        this.messages = cleaned;
      }
    } catch {
      /* ignore */
    }
  }

  private getUserFirstName(): string | null {
    // integrate with your auth/user store if available
    return null;
  }

  // For avatars
  initials(sender: Sender): string {
    if (sender === 'user') return 'You';
    if (sender === 'bot') return 'Bot';
    return 'Sys';
  }

  formattedTime(ts: number): string {
    const d = new Date(ts);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  trackById(index: number, msg: ChatMessage) {
    return msg.id;
  }

  private uuid(): string {
    try {
      // @ts-ignore
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    } catch {}
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}











