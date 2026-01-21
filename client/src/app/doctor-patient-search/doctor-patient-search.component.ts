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
  // Holds the list of patients displayed in the UI.
  patientList: any[] = [];
  // Two-way bound string for the search input field.
  searchQuery: string = '';
  // Controls the loading indicator during search or data fetch operations.
  isSearching: boolean = false;
 
  // Subject that emits search terms for real-time (debounced) search requests.
  private searchSubject = new Subject<string>();
  // Subscription reference for router event listener (to clean up on destroy).
  private routerSubscription?: Subscription;
 
  // Inject the HTTP service for API calls and Router for navigation.
  constructor(
    public httpService: HttpService,
    private router: Router
  ) {}
 
  // Lifecycle hook: runs on component initialization.
  ngOnInit(): void {
    console.log('=== PATIENT SEARCH COMPONENT INIT ===');
 
    // Load the full patient list initially when the component loads.
    this.loadAllPatients();
    // Set up real-time (typeahead) search pipeline.
    this.searchSubject.pipe(
      // Wait for 400ms of no typing before triggering the search.
      debounceTime(400),
      // Only proceed if the search term actually changed.
      distinctUntilChanged(),
      // For each new term, cancel previous HTTP call and switch to the latest one.
      switchMap(searchTerm => {
        this.isSearching = true;
        console.log('=== REAL-TIME SEARCH ===');
        console.log('Search term:', searchTerm);
        // Delegate the term to backend search API.
        return this.httpService.searchPatients(searchTerm);
      })
    ).subscribe(
      // Success: update the patient list and stop loading state.
      (data: any) => {
        this.patientList = data || [];
        this.isSearching = false;
        console.log('Search results:', this.patientList.length, 'patients');
      },
      // Error: log error, clear list, and stop loading state.
      (error) => {
        console.error('=== SEARCH ERROR ===');
        console.error('Error:', error);
        this.patientList = [];
        this.isSearching = false;
      }
    );
 
    // Listen for navigation events to detect when user returns to this page
    // and refresh the list automatically.
    this.routerSubscription = this.router.events
      .pipe(
        // Only act on the final navigation completion events.
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: any) => {
        // If the current URL is this component, reload the patient list.
        if (event.url.includes('/doctor/patient-search')) {
          console.log('=== NAVIGATED BACK TO SEARCH ===');
          console.log('Reloading patient list');
          this.loadAllPatients();
        }
      });
  }
 
  // Lifecycle hook: clean up subscriptions and subjects to prevent memory leaks.
  ngOnDestroy(): void {
    // Complete the Subject to stop emitting further values.
    this.searchSubject.complete();
    // Unsubscribe from router events if subscribed.
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
 
  // Fetch the full list of patients (used on init and when returning to the page).
  loadAllPatients() {
    // Start loading state and clear any old results from UI.
    this.isSearching = true;
    this.patientList = [];
    console.log('=== LOADING ALL PATIENTS ===');
    // Convention: an empty string queries "all" patients on the backend.
    this.httpService.searchPatients('').subscribe(
      (data: any) => {
        this.patientList = data || [];
        this.isSearching = false;
        console.log('=== PATIENTS LOADED ===');
        console.log('Total patients:', this.patientList.length);
      },
      (error) => {
        console.error('=== ERROR LOADING PATIENTS ===');
        console.error('Error:', error);
        this.patientList = [];
        this.isSearching = false;
      }
    );
  }
 
  // Handler for (input) event from the search field: emits terms for debounced search.
  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
  }
 
  // Handler for explicit search actions (e.g., Enter key or Search button).
  onSearch() {
    this.performSearch(this.searchQuery);
  }
 
  // Executes a non-debounced, immediate search (used by onSearch()).
  private performSearch(query: string) {
    // Start loading and clear previous results.
    this.isSearching = true;
    this.patientList = [];
    console.log('=== MANUAL SEARCH ===');
    console.log('Search query:', query);
    // Call backend search API directly with the provided query.
    this.httpService.searchPatients(query).subscribe(
      (data: any) => {
        this.patientList = data || [];
        this.isSearching = false;
        console.log('=== SEARCH COMPLETE ===');
        console.log('Results:', this.patientList.length, 'patients');
      },
      (error) => {
        console.error('=== SEARCH ERROR ===');
        console.error('Error:', error);
        this.patientList = [];
        this.isSearching = false;
      }
    );
  }
 
  // Navigate to the patient's history page for the selected patient ID.
  viewPatientHistory(patientId: number) {
    console.log('Navigating to patient history:', patientId);
    this.router.navigate(['/doctor/patient-history', patientId]);
  }
 
  // Navigate to the "Add Medical Record" page for a selected patient ID.
  addRecord(patientId: number) {
    console.log('Navigating to add record for patient:', patientId);
    this.router.navigate(['/doctor/add-medical-record', patientId]);
  }
}