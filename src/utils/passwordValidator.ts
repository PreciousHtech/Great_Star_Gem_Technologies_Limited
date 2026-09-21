export interface PasswordRequirements {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  notCommon: boolean;
  notContainsUsername: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  strengthLabel: 'Too Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  requirements: PasswordRequirements;
  errorMessage?: string;
}

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  '12345678',
  '123456789',
  'admin123',
  'administrator',
  'qwerty',
  'pass1234',
  'greatstar',
  'greatstargem',
  'welcome123',
]);

export function checkPasswordStrength(password: string, username: string = 'admin'): PasswordValidationResult {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);
  
  const lowerTrimmed = password.toLowerCase().trim();
  const notCommon = !COMMON_WEAK_PASSWORDS.has(lowerTrimmed);
  
  const userTrimmed = username.toLowerCase().trim();
  const notContainsUsername = userTrimmed.length > 2 ? !lowerTrimmed.includes(userTrimmed) : true;

  const requirements: PasswordRequirements = {
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    notCommon,
    notContainsUsername,
  };

  // Calculate score (0 to 4)
  let criteriaMet = 0;
  if (minLength) criteriaMet++;
  if (hasUpper && hasLower) criteriaMet++;
  if (hasNumber) criteriaMet++;
  if (hasSpecial) criteriaMet++;

  let score = 0;
  if (password.length === 0) {
    score = 0;
  } else if (!minLength || criteriaMet <= 1) {
    score = 1;
  } else if (criteriaMet === 2) {
    score = 2;
  } else if (criteriaMet === 3) {
    score = 3;
  } else if (criteriaMet >= 4 && notCommon && notContainsUsername) {
    score = 4;
  } else {
    score = 3;
  }

  const strengthMap: Record<number, PasswordValidationResult['strengthLabel']> = {
    0: 'Too Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Strong',
    4: 'Very Strong',
  };

  const isValid = minLength && hasUpper && hasLower && hasNumber && hasSpecial && notCommon && notContainsUsername;

  let errorMessage: string | undefined;
  if (!minLength) {
    errorMessage = 'Password must be at least 8 characters long.';
  } else if (!hasUpper) {
    errorMessage = 'Password must contain at least one uppercase letter (A-Z).';
  } else if (!hasLower) {
    errorMessage = 'Password must contain at least one lowercase letter (a-z).';
  } else if (!hasNumber) {
    errorMessage = 'Password must contain at least one digit (0-9).';
  } else if (!hasSpecial) {
    errorMessage = 'Password must include at least one special character (!@#$%...).';
  } else if (!notCommon) {
    errorMessage = 'This password is too common and easily guessed. Please choose a more unique phrase.';
  } else if (!notContainsUsername) {
    errorMessage = 'Password cannot contain your admin username.';
  }

  return {
    isValid,
    score,
    strengthLabel: strengthMap[score] || 'Weak',
    requirements,
    errorMessage,
  };
}
