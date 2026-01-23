import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';

type Appt = {
  id: number;
  appointmentTime?: string | Date;
  appointmentDate?: string | Date;
  status?: string; // kept for compatibility but not shown
  patient?: { name?: string; username?: string; email?: string };
};

@Component({
  selector: 'app-doctor-appointment',
  templateUrl: './doctor-appointment.component.html',
  styleUrls: ['./doctor-appointment.component.scss']
})
export class DoctorAppointmentComponent implements OnInit {
  appointmentList: Appt[] = [];
  filteredList: Appt[] = [];

  // Grouped views
  todayList: Appt[] = [];
  upcomingList: Appt[] = [];

  // UI state
  searchText = '';
  loading = false;

  constructor(public httpService: HttpService) {}

  ngOnInit(): void {
    this.getAppointments();
  }

  getAppointments(): void {
    const userIdString = localStorage.getItem('userId');
    if (!userIdString) return;

    const userId = parseInt(userIdString, 10);
    this.loading = true;

    this.httpService.getAppointmentByDoctor(userId).subscribe(
      (data: any) => {
        this.loading = false;
        this.appointmentList = Array.isArray(data) ? data : [];
        this.applyFilters(); // also groups into today/upcoming
      },
      _err => {
        this.loading = false;
        this.appointmentList = [];
        this.filteredList = [];
        this.todayList = [];
        this.upcomingList = [];
      }
    );
  }

  refresh(): void {
    this.getAppointments();
  }

  onSearch(text: string): void {
    this.searchText = text || '';
    this.applyFilters();
  }

  /** Central filtering + grouping (search + today/upcoming, ignoring past) */
  private applyFilters(): void {
    const q = (this.searchText || '').toLowerCase().trim();

    // 1) Text search on id, name, email
    this.filteredList = (this.appointmentList || []).filter(appt => {
      if (!q) return true;
      const idStr = String(appt.id ?? '');
      const name = (appt.patient?.name || appt.patient?.username || '').toLowerCase();
      const email = (appt.patient?.email || '').toLowerCase();
      return idStr.includes(q) || name.includes(q) || email.includes(q);
    });

    // 2) Group by time: only Today + Upcoming, drop past
    const now = new Date();
    const todayStart = this.atStartOfDay(now);
    const todayEnd = this.atEndOfDay(now);
    const tomorrowStart = this.addDays(todayStart, 1);

    const getTime = (a: Appt) =>
      new Date(a.appointmentTime || a.appointmentDate || 0).getTime();

    const notPast = (a: Appt) => getTime(a) >= todayStart.getTime();
    const isToday = (a: Appt) => {
      const ts = getTime(a);
      return ts >= todayStart.getTime() && ts <= todayEnd.getTime();
    };
    const isUpcoming = (a: Appt) => getTime(a) >= tomorrowStart.getTime();

    const timeFiltered = this.filteredList.filter(notPast);
    const sortAsc = (arr: Appt[]) => [...arr].sort((a, b) => getTime(a) - getTime(b));

    this.todayList = sortAsc(timeFiltered.filter(isToday));
    this.upcomingList = sortAsc(timeFiltered.filter(isUpcoming));
  }

  // Helpers
  private atStartOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private atEndOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  private addDays(d: Date, days: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }

  // trackBy for performance and to avoid template errors
  trackById(index: number, appt: Appt): number {
    return appt?.id ?? index;
  }
}


























