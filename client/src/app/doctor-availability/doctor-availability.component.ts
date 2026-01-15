
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { HttpService } from '../../services/http.service';

type Day =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

@Component({
  selector: 'app-doctor-availability',
  templateUrl: './doctor-availability.component.html',
  styleUrls: ['./doctor-availability.component.scss'],
})
export class DoctorAvailabilityComponent implements OnInit {
  /** Reactive form containing a locked doctorId and a dynamic FormArray of slots */
  form!: FormGroup;

  /** UI feedback */
  responseMessage = '';
  isAdded = false;

  /** Predefined days list for the dropdown */
  readonly days: Day[] = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ];

  /** Doctor id derived from localStorage; shown read-only */
  doctorId: number | null = null;

  constructor(private fb: FormBuilder, private httpService: HttpService) {}

  ngOnInit(): void {
    // Derive doctorId from localStorage (or from AuthService if you have one)
    const userIdString = localStorage.getItem('userId');
    this.doctorId = userIdString ? parseInt(userIdString, 10) : null;

    // Build the form: doctorId is disabled (read-only), slots is a FormArray with overlap validator
    this.form = this.fb.group({
      doctorId: [{ value: this.doctorId, disabled: true }, Validators.required],
      slots: this.fb.array([], [this.noOverlapValidator]),
    });

    // Start with one empty slot row
    this.addSlot();
  }

  /** Convenience getters */
  get doctorIdCtrl(): FormControl {
    return this.form.get('doctorId') as FormControl;
  }
  get slots(): FormArray {
    return this.form.get('slots') as FormArray;
  }

  /** Helper: safely read the FormArray overlap error message for the template */
  get slotsOverlapError(): string | null {
    const errors = this.slots.errors as { overlap?: string } | null;
    return errors?.overlap ?? null;
  }

  /** Add a new time slot row with group-level validator (start < end) */
  addSlot(): void {
    const slotGroup = this.fb.group(
      {
        dayOfWeek: ['', Validators.required],
        startTime: ['', Validators.required], // expected format: "HH:mm"
        endTime: ['', Validators.required],   // expected format: "HH:mm"
      },
      { validators: [this.timeRangeValidator] }
    );
    this.slots.push(slotGroup);
  }

  /** Remove a slot row by index */
  removeSlot(index: number): void {
    this.slots.removeAt(index);
    this.slots.updateValueAndValidity();
  }

  /** Group validator: enforce startTime < endTime */
  private timeRangeValidator = (ctrl: AbstractControl) => {
    const start = ctrl.get('startTime')?.value as string | null;
    const end = ctrl.get('endTime')?.value as string | null;
    if (!start || !end) return null;
    return start < end ? null : { timeRange: 'Start time must be before end time' };
  };

  /**
   * Array validator: no overlapping slots for the same day.
   * For each day, sort by start and ensure each start >= previous end.
   */
  private noOverlapValidator = (arrayCtrl: AbstractControl) => {
    const groups = (arrayCtrl as FormArray).controls as FormGroup[];
    const byDay: Record<string, { start: string; end: string }[]> = {};

    for (const g of groups) {
      const day = (g.get('dayOfWeek')?.value || '') as string;
      const start = (g.get('startTime')?.value || '') as string;
      const end = (g.get('endTime')?.value || '') as string;
      if (!day || !start || !end) continue;
      (byDay[day] ||= []).push({ start, end });
    }

    for (const day of Object.keys(byDay)) {
      const slots = byDay[day].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 1; i < slots.length; i++) {
        const prev = slots[i - 1];
        const curr = slots[i];
        if (curr.start < prev.end) {
          return { overlap: `Overlapping slots on ${day}` };
        }
      }
    }
    return null;
  };

  /**
   * Build a backend-friendly text representation from structured slots
   * Example: "MONDAY 10:00-13:00; MONDAY 15:00-18:00; FRIDAY 09:00-12:00"
   * This ensures your current endpoint (query param 'availability') receives a clean string.
   */
  private buildAvailabilityText(): string {
    const items = this.slots.value as {
      dayOfWeek: Day;
      startTime: string;
      endTime: string;
    }[];

    // Filter out incomplete rows (shouldn’t happen due to validators, but safe)
    const validItems = items.filter(
      (s) => !!s.dayOfWeek && !!s.startTime && !!s.endTime && s.startTime < s.endTime
    );

    // Normalize to a deterministic order: by day then by startTime
    validItems.sort((a, b) => {
      const dayCmp = a.dayOfWeek.localeCompare(b.dayOfWeek);
      return dayCmp !== 0 ? dayCmp : a.startTime.localeCompare(b.startTime);
    });

    // Join as "DAY HH:mm-HH:mm; ..."
    return validItems
      .map((s) => `${s.dayOfWeek} ${s.startTime}-${s.endTime}`)
      .join('; ');
  }

  /** Submit handler: validates, builds payload, and calls the service */
  onSubmit(): void {
    this.responseMessage = '';
    this.isAdded = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Read doctorId safely (disabled control requires getRawValue)
    const doctorId = this.form.getRawValue().doctorId as number | null;
    if (!doctorId) {
      this.responseMessage = 'Doctor ID not found. Please login again.';
      return;
    }

    // Convert structured slots to the existing API format (text in query param)
    const availabilityText = this.buildAvailabilityText();
    if (!availabilityText) {
      this.responseMessage = 'Please add at least one valid time slot.';
      return;
    }

    // Call your existing service method (quickest integration)
    // Note: ensure your HttpService method URL uses '&' and encodes the availability string.
    this.httpService.updateDoctorAvailability(doctorId, availabilityText).subscribe({
      next: () => {
        this.responseMessage = 'Availability updated successfully';
        this.isAdded = true;

        // Reset slots to a single empty row; keep doctorId as-is
        this.slots.clear();
        this.addSlot();
      },
      error: (err: unknown) => {
        console.error('[Availability update error]', err);
        this.responseMessage = 'Failed to update availability';
        this.isAdded = false;
      },
    });

    /**
     * If you add a structured endpoint later, replace the call above with:
     *
     * const payload = {
     *   doctorId,
     *   availability: this.slots.value as { dayOfWeek: string; startTime: string; endTime: string }[],
     * };
     * this.httpService.updateDoctorAvailabilityStructured(payload).subscribe({ ... });
     */
  }
}
