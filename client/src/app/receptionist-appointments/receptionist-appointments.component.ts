import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

declare const Swal: any; // Using SweetAlert2 from CDN in index.html

@Component({
  selector: 'app-receptionist-appointments',
  templateUrl: './receptionist-appointments.component.html',
  styleUrls: ['./receptionist-appointments.component.scss'],
  providers: [DatePipe]
})
export class ReceptionistAppointmentsComponent implements OnInit {
  itemForm: FormGroup;
  responseMessage: string = ''; // non-nullable string → no need for ?. in template
  appointmentList: any[] = [];
  isAdded = false;

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalPages = 0;
  paginatedAppointments: any[] = [];

  // In-memory cache
  appointmentsCache: any[] | null = null;
  cacheTimestamp: number | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  isLoading = false;
  Math = Math; // Expose Math to template

  // Button/row spinners
  isSaving = false; // reschedule save
  isDeletingId: number | null = null; // delete spinner for specific row

  // Toast helper
  private toast = () =>
    Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
      didOpen: (t: any) => {
        t.addEventListener('mouseenter', Swal.stopTimer);
        t.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

  constructor(
    public httpService: HttpService,
    private formBuilder: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.itemForm = this.formBuilder.group({
      id: ['', Validators.required],
      time: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.getAppointments();
  }

  /* ---------------- Cache helpers ---------------- */
  private isCacheValid(): boolean {
    if (!this.appointmentsCache || !this.cacheTimestamp) return false;
    const now = Date.now();
    return (now - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  getAppointments(forceRefresh: boolean = false): void {
    // Use cache if valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid()) {
      this.appointmentList = [...this.appointmentsCache!];
      this.totalPages = Math.ceil(this.appointmentList.length / this.pageSize);
      this.setPage(this.currentPage);
      this.showCacheNotification(); // toast
      return;
    }

    // Fetch from API
    this.isLoading = true;
    this.httpService.getAllAppointments().subscribe(
      (data: any) => {
        this.appointmentList = data as any[];

        // Update cache
        this.appointmentsCache = [...this.appointmentList];
        this.cacheTimestamp = Date.now();

        // Update pagination
        this.totalPages = Math.ceil(this.appointmentList.length / this.pageSize);
        this.setPage(1);
        this.isLoading = false;
      },
      (error: any) => {
        console.error('Error fetching appointments', error);
        this.isLoading = false;
        this.showErrorAlert('Failed to load appointments. Please try again.');
      }
    );
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedAppointments = this.appointmentList.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.setPage(this.currentPage + 1);
  }
  previousPage(): void {
    if (this.currentPage > 1) this.setPage(this.currentPage - 1);
  }

  private refreshAppointments(): void {
    this.appointmentsCache = null;
    this.cacheTimestamp = null;
    this.getAppointments(true);
  }

  /* ---------------- Row actions ---------------- */
  editAppointment(val: any): void {
    this.itemForm.controls['id'].setValue(val.id);

    const appointmentTime = val.appointmentTime || val.appointmentDate;
    if (appointmentTime) {
      const date = new Date(appointmentTime);
      const formattedDateTime = this.datePipe.transform(date, 'yyyy-MM-ddTHH:mm');
      this.itemForm.controls['time'].setValue(formattedDateTime);
    }

    this.isAdded = true;

    setTimeout(() => {
      const formElement = document.querySelector('.card.mt-4');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  async deleteAppointment(appointmentId: number): Promise<void> {
    // Confirm with SweetAlert2
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete this appointment?',
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      customClass: { popup: 'swal2-rounded' }
    });

    if (!result.isConfirmed) return;

    this.isDeletingId = appointmentId;
    this.httpService.deleteAppointment(appointmentId).subscribe(
      () => {
        this.isDeletingId = null;
        this.responseMessage = 'Appointment deleted successfully';
        this.showSuccessAlert('Appointment deleted successfully');

        this.refreshAppointments();

        setTimeout(() => (this.responseMessage = ''), 2500);
      },
      (error: any) => {
        console.error('Error deleting appointment', error);
        this.isDeletingId = null;
        this.responseMessage = 'Failed to delete appointment';
        this.showErrorAlert('Failed to delete appointment');

        setTimeout(() => (this.responseMessage = ''), 2500);
      }
    );
  }

  onSubmit(): void {
    if (this.itemForm.invalid) return;

    const formattedTime = this.datePipe.transform(
      this.itemForm.controls['time'].value,
      'yyyy-MM-dd HH:mm:ss'
    );

    const appointmentId = this.itemForm.controls['id'].value;
    const formValue = { time: formattedTime };

    this.isSaving = true;
    this.httpService.reScheduleAppointment(appointmentId, formValue).subscribe(
      () => {
        this.isSaving = false;
        this.responseMessage = 'Appointment Rescheduled Successfully';
        this.isAdded = false;
        this.itemForm.reset();
        this.refreshAppointments();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        this.showSuccessAlert('Appointment rescheduled successfully');

        setTimeout(() => (this.responseMessage = ''), 2500);
      },
      (error: any) => {
        console.error(error);
        this.isSaving = false;
        this.responseMessage = 'Failed to reschedule appointment';
        this.showErrorAlert('Failed to reschedule appointment');

        setTimeout(() => (this.responseMessage = ''), 2500);
      }
    );
  }

  /* ---------------- Cache UI helpers ---------------- */
  getCacheAge(): string {
    if (!this.cacheTimestamp) return '';
    const ageMs = Date.now() - this.cacheTimestamp;
    const ageMin = Math.floor(ageMs / 60000);
    const ageSec = Math.floor((ageMs % 60000) / 1000);
    return ageMin > 0 ? `${ageMin}m ${ageSec}s ago` : `${ageSec}s ago`;
  }

  isCacheExpiringSoon(): boolean {
    if (!this.cacheTimestamp) return false;
    const ageMs = Date.now() - this.cacheTimestamp;
    return ageMs > this.CACHE_DURATION * 0.8; // 80% of cache duration
  }

  private showCacheNotification(): void {
    this.toast().fire({
      icon: 'info',
      title: `Loaded from cache • ${this.getCacheAge()}`
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        pages.push(this.currentPage - 1);
        pages.push(this.currentPage);
        pages.push(this.currentPage + 1);
        pages.push(-1);
        pages.push(this.totalPages);
      }
    }
    return pages;
  }

  /* ---------------- SweetAlert2 helpers ---------------- */
  private showSuccessAlert(message: string) {
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#0d6efd',
      customClass: { popup: 'swal2-rounded' }
    });
  }

  private showErrorAlert(message: string) {
    Swal.fire({
      icon: 'error',
      title: 'Action Failed',
      text: message || 'Something went wrong. Please try again.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#0d6efd',
      customClass: { popup: 'swal2-rounded' }
    });
  }
}



