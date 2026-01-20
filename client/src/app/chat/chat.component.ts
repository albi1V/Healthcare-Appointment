import { Component } from '@angular/core';
import { HttpService } from '../../services/http.service';
 
 
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent {
 
  userMessage = '';
  messages: { sender: string, text: string }[] = [];
 
  constructor(private http: HttpService) {}
 
  send() {
    if (!this.userMessage.trim()) return;
 
    this.messages.push({ sender: 'user', text: this.userMessage });
 
    this.http.sendMessage(this.userMessage).subscribe(res => {
      this.messages.push({ sender: 'bot', text: res.reply });
    });
 
    this.userMessage = '';
  }
}