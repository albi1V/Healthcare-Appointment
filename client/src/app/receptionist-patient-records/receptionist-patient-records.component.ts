import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, finalize } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
 
@Component({
  selector: 'app-receptionist-patient-records',
  templateUrl: './receptionist-patient-records.component.html',
  styleUrls: ['./receptionist-patient-records.component.scss']
})
export class ReceptionistPatientRecordsComponent implements OnInit, OnDestroy {
 
  patientList: any[] = [];
  selectedPatientId: number | null = null;
  selectedPatientName: string | null = null;
  medicalRecords: any[] = [];
  searchQuery = '';
  isSearching = false;
  isLoadingRecords = false;
 
  downloadingRecordId: number | null = null;
 
  private searchSubject = new Subject<string>();
 
  constructor(public httpService: HttpService) {}
 
  ngOnInit(): void {
    this.loadAllPatients();
 
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        this.isSearching = true;
        return this.httpService.searchPatientsByReceptionist(term)
          .pipe(finalize(() => (this.isSearching = false)));
      })
    ).subscribe(
      data => this.patientList = data || [],
      _ => this.patientList = []
    );
  }
 
  ngOnDestroy(): void {
    this.searchSubject.complete();
  }
 
  loadAllPatients() {
    this.isSearching = true;
    this.patientList = [];
    this.httpService.searchPatientsByReceptionist('')
      .pipe(finalize(() => (this.isSearching = false)))
      .subscribe(
        data => this.patientList = data || [],
        _ => this.patientList = []
      );
  }
 
  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
  }
 
  onSearch() {
    this.isSearching = true;
    this.patientList = [];
    this.httpService.searchPatientsByReceptionist(this.searchQuery)
      .pipe(finalize(() => (this.isSearching = false)))
      .subscribe(
        data => this.patientList = data || [],
        _ => this.patientList = []
      );
  }
 
  viewRecords(patientId: number) {
    this.selectedPatientId = patientId;
    this.selectedPatientName = null;
    this.isLoadingRecords = true;
    this.medicalRecords = [];
 
    this.httpService.getPatientBrief(patientId).subscribe({
      next: brief => this.selectedPatientName = brief?.username ?? null,
      error: _ => this.selectedPatientName = null
    });
 
    this.httpService.getPatientRecordsByReceptionist(patientId)
      .pipe(finalize(() => (this.isLoadingRecords = false)))
      .subscribe(
        data => this.medicalRecords = data || [],
        _ => this.medicalRecords = []
      );
  }
 
  closeRecords() {
    this.selectedPatientId = null;
    this.selectedPatientName = null;
    this.medicalRecords = [];
    this.loadAllPatients();
  }
 
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  }
 
  // Robust PDF download with filename and error handling
  downloadReport(record: any) {
    if (!record?.id) { return; }
    this.downloadingRecordId = record.id;
 
    this.httpService.downloadMedicalRecordReport(record.id).subscribe({
      next: async (res: HttpResponse<Blob>) => {
        this.downloadingRecordId = null;
 
        if (res.status !== 200) {
          // Try to read text for meaningful error
          const reason = await this.tryReadText(res.body);
          alert(reason || 'Failed to download report. Please try again.');
          return;
        }
 
        const contentType = res.headers.get('Content-Type') || '';
        if (!contentType.toLowerCase().includes('application/pdf')) {
          // If server sent text/plain error, show it
          const reason = await this.tryReadText(res.body);
          alert(reason || 'Report is not a PDF. Please contact support.');
          return;
        }
 
        // Filename from Content-Disposition, if present
        const cd = res.headers.get('Content-Disposition') || '';
        const filename = this.extractFilename(cd) || `Record_${record.id}_Patient_${this.selectedPatientId}.pdf`;
 
        // Save
        const blob = res.body as Blob;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      },
      error: async (err) => {
        this.downloadingRecordId = null;
        try {
          const reason = await this.tryReadText(err?.error);
          alert(reason || 'Failed to download report. Please try again.');
        } catch {
          alert('Failed to download report. Please try again.');
        }
      }
    });
  }
 
  private extractFilename(contentDisposition: string): string | null {
    // content-disposition: attachment; filename="Record_1.pdf"
    const match = /filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i.exec(contentDisposition || '');
    if (match) {
      return decodeURIComponent(match[1] || match[2] || '').trim();
    }
    return null;
  }
 
  private async tryReadText(body: any): Promise<string | null> {
    if (!body) return null;
    if (typeof body === 'string') return body;
    if (body instanceof Blob) {
      try { return await body.text(); } catch { return null; }
    }
    return null;
    }
}