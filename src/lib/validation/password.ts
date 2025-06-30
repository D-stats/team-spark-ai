export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('passwordMinLength');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('passwordUppercase');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('passwordLowercase');
  }

  if (!/\d/.test(password)) {
    errors.push('passwordNumber');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('passwordSpecialChar');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validatePasswordMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}
