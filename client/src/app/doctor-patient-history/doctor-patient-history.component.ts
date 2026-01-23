import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-doctor-patient-history',
  templateUrl: './doctor-patient-history.component.html',
  styleUrls: ['./doctor-patient-history.component.scss']
})
export class DoctorPatientHistoryComponent implements OnInit, OnDestroy {
  patientId!: number;
  patientUsername: string | null = null;

  medicalRecords: any[] = [];
  isLoading = false;

  // For pretty skeleton rows while loading
  skeletonRows = Array.from({ length: 6 });

  private routeSubscription?: Subscription;
  private querySubscription?: Subscription;

  constructor(
    private httpService: HttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.params.subscribe(params => {
      const rawId = params['patientId'] ?? params['id'];
      this.patientId = Number(rawId);
      if (!Number.isFinite(this.patientId) || this.patientId <= 0) {
        this.backToSearch();
        return;
      }
      this.loadPatientHeader();
      this.loadPatientHistory();
    });

    this.querySubscription = this.route.queryParams.subscribe(q => {
      if (q['refresh']) {
        this.loadPatientHeader();
        this.loadPatientHistory();
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.querySubscription?.unsubscribe();
  }

  private loadPatientHeader(): void {
    this.httpService.getPatientBrief(this.patientId).subscribe({
      next: brief => this.patientUsername = brief?.username ?? null,
      error: _ => this.patientUsername = null
    });
  }

  loadPatientHistory(): void {
    this.isLoading = true;
    this.medicalRecords = [];
    this.httpService.getPatientRecords(this.patientId).subscribe({
      next: (data: any) => {
        this.medicalRecords = Array.isArray(data) ? data : (data ? [data] : []);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading patient records:', err);
        this.medicalRecords = [];
        this.isLoading = false;
      }
    });
  }

  addNewRecord(): void {
    this.router.navigate(['/doctor/add-medical-record', this.patientId]);
  }

  backToSearch(): void {
    this.router.navigate(['/doctor/patient-search']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleString();
  }

  trackById(index: number, rec: any) {
    return rec?.id ?? index;
  }
}




