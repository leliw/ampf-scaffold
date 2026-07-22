import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordStrengthValidator(minLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value: string = control.value;
        if (!value) {
            return null;
        }
        if (value.length < minLength)
            return { minlength: true }
        const hasUpperCase = /[A-Z]+/.test(value);
        const hasLowerCase = /[a-z]+/.test(value);
        const hasNumeric = /[0-9]+/.test(value);
        const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;
        return !passwordValid ? { passwordStrength: true } : null;
    }
}

export function newPasswordEqualsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value2: string = control.value;
        const value1 = control.parent?.get('new_password')?.value;
        return value1 != value2 ? { equals: true } : null;
    }
}
