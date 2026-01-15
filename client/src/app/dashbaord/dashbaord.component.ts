
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

type Role = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN' | null;

@Component({
  selector: 'app-dashbaord', // keep as-is if your app already uses this spelling
  templateUrl: './dashbaord.component.html',
  styleUrls: ['./dashbaord.component.scss']
})
export class DashbaordComponent implements OnInit {
  roleType: Role = null;
  username: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Prefer getting from your AuthService (JWT decode) if available,
    // fallback to localStorage for now to match your current code.
    const storedRole = localStorage.getItem('role');
    const storedUser = localStorage.getItem('userId') || localStorage.getItem('username');

    this.roleType = storedRole ? storedRole.toUpperCase() as Role : null;
    this.username = storedUser ?? null;

    // Optional sanity logs
    // console.log('[Dashboard] role:', this.roleType, 'username:', this.username);
  }

  isPatient(): boolean { return this.roleType === 'PATIENT'; }
  isDoctor(): boolean { return this.roleType === 'DOCTOR'; }
  isReceptionist(): boolean { return this.roleType === 'RECEPTIONIST'; }
  isAdmin(): boolean { return this.roleType === 'ADMIN'; }
}
