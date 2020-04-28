import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder, AbstractControl, ValidatorFn, FormArray } from '@angular/forms';
import { Customer } from './customer';
import { debounceTime } from 'rxjs/operators';
import { from } from 'rxjs';

function ratingRange(min: number, max: number): ValidatorFn {
  return (c:AbstractControl): {[key: string]: boolean} | null  => {
    if (c.value != null && (isNaN(c.value) || c.value < min || c.value > max)) {
      return {'range': true};
    }
    return null;
  }
}

function emailMatcher(c: AbstractControl): {[key: string]: boolean} | null {
  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');
  if (emailControl.pristine || confirmControl.pristine) { 
    return null;
  }

  if (emailControl.value === confirmControl.value) {
    return null;
  }
  return { match: true };

} 

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})

export class CustomerComponent implements OnInit {
  customer = new Customer();
  customerForm : FormGroup;
  emailMessage: string;

  get addresses(): FormArray{
    return <FormArray>this.customerForm.get('addresses');
  }

  private validationMessages = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.'
  }

  constructor(private fb: FormBuilder) { 
}
  
  ngOnInit() {
    this.customerForm = this.fb.group({
      firstName: ['', 
          [Validators.required, Validators.minLength(3)]],
      lastName: ['',
          [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group({
        email: ['',
          [Validators.email, Validators.required]],
        confirmEmail: ['',
          [Validators.required]],
        },{validators: emailMatcher}),
      sendCatalog: true,
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1,5)],
      addresses: this.fb.array([ this.buildAddress() ])
    });

    this.customerForm.get('notification').valueChanges.subscribe(
      value => this.setNotification(value)
    );

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.setMessage(emailControl)
    )
  }

  save() {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia==='text') {
      phoneControl.setValidators(Validators.required);
    }
    else {
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity();
  }

  setMessage(c:AbstractControl): void {
    this.emailMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors).map(
        key => this.validationMessages[key]).join('');
    }
  }

  populateTestData(): void {
    this.customerForm.patchValue( {
      firstName: 'Vikas',
      lastName: 'srivastava',
      email: 'vikassrinitb@gmail.com',
      sendCatalog: false,
      phone: null, 
    }
    );
  }

  addAddress(): void {
    this.addresses.push(this.buildAddress());
  }

  buildAddress(): FormGroup{
    return this.fb.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: ''
    })
  }
}
