import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit {

  itemForm: FormGroup;
  formModel: any = { role: null, email: '', password: '', username: '' };
  showMessage: boolean = false;
  responseMessage: any;

  constructor(
    public router: Router,
    private bookService: HttpService,
    private formBuilder: FormBuilder
  ) {
    this.itemForm = this.formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['', Validators.required],
      specialty: [''],
      availability: ['']
    });
  }

  ngOnInit(): void {
    this.itemForm.get('role')?.valueChanges.subscribe(role => {
      this.applyRoleValidators(role);
    });
  }

  private applyRoleValidators(role: string): void {
    if (role === 'DOCTOR') {
      this.itemForm.get('specialty')?.setValidators([Validators.required]);
      this.itemForm.get('availability')?.setValidators([Validators.required]);
    } else {
      this.itemForm.get('specialty')?.clearValidators();
      this.itemForm.get('availability')?.clearValidators();
    }

    this.itemForm.get('specialty')?.updateValueAndValidity();
    this.itemForm.get('availability')?.updateValueAndValidity();
  }

  onRegister(): void {
    if (this.itemForm.invalid) {
      return;
    }

    let registerCall;

    switch (this.itemForm.value.role) {
      case 'PATIENT':
        registerCall = this.bookService.registerPatient(this.itemForm.value);
        break;
      case 'DOCTOR':
        registerCall = this.bookService.registerDoctors(this.itemForm.value);
        break;
      case 'RECEPTIONIST':
        registerCall = this.bookService.registerReceptionist(this.itemForm.value);
        break;
      default:
        return;
    }

    registerCall.subscribe(() => {
      this.showMessage = true;
      this.responseMessage = 'You are successfully Registered';
      this.itemForm.reset();
    });
  }
}
