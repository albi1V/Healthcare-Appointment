import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';

@Component({
  selector: 'app-doctor-patient-search',
  templateUrl: './doctor-patient-search.component.html',
  styleUrls: ['./doctor-patient-search.component.scss']
})
export class DoctorPatientSearchComponent implements OnInit, OnDestroy {
  // Data
  patientList: any[] = [];
  searchQuery: string = '';

  // UI state
  isSearching: boolean = false;
  showInitialHint: boolean = true;

  // For skeleton loaders
  skeletonRows = Array.from({ length: 6 });

  // Streams / subscriptions
  private searchSubject = new Subject<string>();
  private routerSubscription?: Subscription;
  private searchSubscription?: Subscription;

  constructor(
    public httpService: HttpService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('=== PATIENT SEARCH COMPONENT INIT ===');

    // Initial load
    this.loadAllPatients();

    // Typeahead pipeline
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap((term: string) => {
        this.isSearching = true;
        this.showInitialHint = false;
        return this.httpService.searchPatients(term || '');
      })
    ).subscribe(
      (data: any) => {
        this.patientList = data || [];
        this.isSearching = false;
      },
      (error) => {
        console.error('=== SEARCH ERROR ===', error);
        this.patientList = [];
        this.isSearching = false;
      }
    );

    // Refresh when navigating back to this route
    this.routerSubscription = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url.includes('/doctor/patient-search')) {
          this.loadAllPatients();
        }
      });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
    this.routerSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  // Initial (or refresh) load of all patients
  loadAllPatients() {
    this.isSearching = true;
    this.showInitialHint = true;
    this.patientList = [];
    this.httpService.searchPatients('').subscribe(
      (data: any) => {
        this.patientList = data || [];
        this.isSearching = false;
      },
      (error) => {
        console.error('=== ERROR LOADING PATIENTS ===', error);
        this.patientList = [];
        this.isSearching = false;
      }
    );
  }

  // Typeahead input
  onSearchInput() {
    this.searchSubject.next(this.searchQuery.trim());
  }

  // Enter key / button search (immediate)
  onSearch() {
    this.performSearch(this.searchQuery.trim());
  }

  private performSearch(query: string) {
    this.isSearching = true;
    this.showInitialHint = false;
    this.patientList = [];
    this.httpService.searchPatients(query).subscribe(
      (data: any) => {
        this.patientList = data || [];
        this.isSearching = false;
      },
      (error) => {
        console.error('=== SEARCH ERROR ===', error);
        this.patientList = [];
        this.isSearching = false;
      }
    );
  }

  // Tracking for *ngFor
  trackById = (_: number, item: any) => item?.id ?? _;

  // Navigation
  viewPatientHistory(patientId: number) {
    this.router.navigate(['/doctor/patient-history', patientId]);
  }

  addRecord(patientId: number) {
    this.router.navigate(['/doctor/add-medical-record', patientId]);
  }
}


