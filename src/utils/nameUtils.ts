/**
 * List of recognized honorifics, titles, and professional prefixes
 * that frequently precede a client's actual first name.
 */
const COMMON_TITLES = new Set([
  'mr', 'mrs', 'ms', 'miss', 'dr', 'doc', 'prof', 'professor',
  'engr', 'engineer', 'chief', 'sir', 'madam', 'lady', 'lord',
  'pastor', 'rev', 'reverend', 'apostle', 'bishop', 'evangelist', 'deacon', 'deaconess', 'elder', 'minister',
  'barr', 'barrister', 'hon', 'honorable', 'honourable', 'justice', 'judge', 'magistrate',
  'arc', 'arch', 'architect', 'qs', 'surv', 'surveyor', 'pharm', 'pharmacist',
  'sen', 'senator', 'gov', 'governor', 'rep', 'amb', 'ambassador',
  'gen', 'general', 'col', 'colonel', 'capt', 'captain', 'major', 'lt', 'lieutenant', 'sgt', 'sergeant', 'cdr', 'commander', 'adm', 'admiral',
  'alr', 'alhaji', 'alhaja', 'hajiya', 'mallam', 'sheikh', 'imam',
  'otunba', 'oba', 'obi', 'igwe', 'emir', 'king', 'queen', 'prince', 'princess'
]);

/**
 * Extracts the first letter of a client's actual first name,
 * intelligently skipping titles, honorifics (e.g., Sir, Dr., Engr., Chief, Mr.),
 * leading punctuation, and handling "LastName, FirstName" formats.
 */
export function getFirstNameInitial(fullName?: string | null): string {
  if (!fullName || typeof fullName !== 'string') {
    return 'U';
  }

  const cleaned = fullName.trim();
  if (!cleaned) {
    return 'U';
  }

  // Handle "LastName, FirstName" notation
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    const firstNamePart = parts[1]?.trim();
    if (firstNamePart) {
      const match = firstNamePart.match(/[a-zA-Z]/);
      if (match) {
        return match[0].toUpperCase();
      }
    }
  }

  // Tokenize words by whitespace
  const rawTokens = cleaned.split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) {
    return 'U';
  }

  // Clean tokens (strip brackets, quotes, dots, dashes)
  const cleanTokens: string[] = [];
  for (const token of rawTokens) {
    const stripped = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim();
    if (stripped) {
      cleanTokens.push(stripped);
    }
  }

  if (cleanTokens.length === 0) {
    const fallbackMatch = cleaned.match(/[a-zA-Z]/);
    return fallbackMatch ? fallbackMatch[0].toUpperCase() : 'U';
  }

  // Find the first token that is NOT a title/honorific (unless it's the only word available)
  let firstNameToken = cleanTokens[0];
  for (let i = 0; i < cleanTokens.length; i++) {
    const lower = cleanTokens[i].toLowerCase();
    const isTitle = COMMON_TITLES.has(lower);

    // If it's a title and there are words following it, skip to next word
    if (isTitle && i < cleanTokens.length - 1) {
      continue;
    }

    // This token is the actual first name
    firstNameToken = cleanTokens[i];
    break;
  }

  // Get the first alphabetical character of the first name
  const letterMatch = firstNameToken.match(/[a-zA-Z]/);
  if (letterMatch) {
    return letterMatch[0].toUpperCase();
  }

  // Ultimate fallback to first letter anywhere in the string
  const generalMatch = cleaned.match(/[a-zA-Z]/);
  return generalMatch ? generalMatch[0].toUpperCase() : 'U';
}
