/**
 * Advanced Password Validation Service
 *
 * Provides comprehensive password validation including:
 * - Minimum complexity rules
 * - Compromised password detection (Have I Been Pwned API)
 * - Dictionary word detection
 * - Keyboard pattern detection
 * - Repetitive character detection
 * - Context-specific checks
 */

import crypto from "crypto";

// Common dictionary words to check against - exported for testing
export const COMMON_DICTIONARY_WORDS = [
  "password",
  "qwerty",
  "admin",
  "login",
  "welcome",
  "letmein",
  "monkey",
  "dragon",
  "master",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "soccer",
  "hockey",
  "batman",
  "trustno1",
  "iloveyou",
  "superman",
  "access",
  "shadow",
  "michael",
  "ashley",
  "jessica",
  "computer",
  "internet",
  "secret",
  "passw0rd",
  "security",
  "komra",
  "audit",
  "dashboard",
  "vulnerability",
  "endpoint",
  "server",
  "network",
];

// Common keyboard patterns
const KEYBOARD_PATTERNS = [
  // Horizontal rows
  "qwerty",
  "qwertyuiop",
  "asdfgh",
  "asdfghjkl",
  "zxcvbn",
  "zxcvbnm",
  "qwert",
  "asdf",
  "zxcv",
  "1234567890",
  "123456",
  "12345",
  "1234",
  "0987654321",
  "987654",
  "54321",
  "4321",
  // Diagonal patterns
  "qazwsx",
  "wsxedc",
  "edcrfv",
  "rfvtgb",
  "tgbyhn",
  "yhnujm",
  "1qaz",
  "2wsx",
  "3edc",
  "4rfv",
  "5tgb",
  "6yhn",
  "7ujm",
  "8ik",
  "9ol",
  "0p",
  "zaq1",
  "xsw2",
  "cde3",
  "vfr4",
  "bgt5",
  "nhy6",
  "mju7",
  // Reversed horizontal
  "poiuytrewq",
  "lkjhgfdsa",
  "mnbvcxz",
  // Number sequences
  "01234",
  "56789",
  "98765",
  "43210",
  "0123456789",
  "9876543210",
  // ABC sequences
  "abcd",
  "abcdef",
  "abcdefgh",
  "abcdefghij",
  "dcba",
  "fedcba",
  "hgfedcba",
];

// Character types for complexity checking
const CHARACTER_CLASSES = {
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  digit: /[0-9]/,
  special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,
};

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  strength: "very_weak" | "weak" | "fair" | "strong" | "very_strong";
  errors: PasswordValidationError[];
  warnings: string[];
  suggestions: string[];
}

export interface PasswordValidationError {
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface PasswordValidationContext {
  username?: string;
  email?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  previousPasswords?: string[];
}

export interface PasswordValidationConfig {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
  minCharacterClasses: number;
  checkCompromised: boolean;
  checkDictionary: boolean;
  checkKeyboardPatterns: boolean;
  checkRepetitive: boolean;
  checkContext: boolean;
  maxRepetitiveChars: number;
  allowLongPassphrases: boolean;
  passphraseMinLength: number;
}

// Default configuration
const DEFAULT_CONFIG: PasswordValidationConfig = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
  minCharacterClasses: 3,
  checkCompromised: true,
  checkDictionary: true,
  checkKeyboardPatterns: true,
  checkRepetitive: true,
  checkContext: true,
  maxRepetitiveChars: 3,
  allowLongPassphrases: true,
  passphraseMinLength: 15,
};

/**
 * Main Password Validation Service
 */
export class PasswordValidationService {
  private config: PasswordValidationConfig;

  constructor(config: Partial<PasswordValidationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate password with all checks
   */
  async validatePassword(
    password: string,
    context: PasswordValidationContext = {},
  ): Promise<PasswordValidationResult> {
    const errors: PasswordValidationError[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check if password is empty
    if (!password) {
      return {
        isValid: false,
        score: 0,
        strength: "very_weak",
        errors: [
          {
            code: "EMPTY_PASSWORD",
            message: "Password is required",
            severity: "error",
          },
        ],
        warnings: [],
        suggestions: ["Enter a password to continue"],
      };
    }

    // Check length requirements
    const lengthResult = this.checkLength(password);
    errors.push(...lengthResult.errors);
    score -= lengthResult.penalty;

    // Check if it's a valid long passphrase (15+ chars bypasses other requirements)
    const isLongPassphrase =
      this.config.allowLongPassphrases &&
      password.length >= this.config.passphraseMinLength;

    // Character complexity checks (skip if long passphrase)
    if (!isLongPassphrase) {
      const complexityResult = this.checkComplexity(password);
      errors.push(...complexityResult.errors);
      warnings.push(...complexityResult.warnings);
      score -= complexityResult.penalty;
    }

    // Check for keyboard patterns
    if (this.config.checkKeyboardPatterns) {
      const patternResult = this.checkKeyboardPatterns(password);
      errors.push(...patternResult.errors);
      warnings.push(...patternResult.warnings);
      score -= patternResult.penalty;
    }

    // Check for repetitive characters
    if (this.config.checkRepetitive) {
      const repetitiveResult = this.checkRepetitiveCharacters(password);
      errors.push(...repetitiveResult.errors);
      warnings.push(...repetitiveResult.warnings);
      score -= repetitiveResult.penalty;
    }

    // Check for dictionary words
    if (this.config.checkDictionary) {
      const dictionaryResult = this.checkDictionaryWords(password);
      errors.push(...dictionaryResult.errors);
      warnings.push(...dictionaryResult.warnings);
      score -= dictionaryResult.penalty;
    }

    // Check for context-specific information
    if (this.config.checkContext && Object.keys(context).length > 0) {
      const contextResult = this.checkContextInformation(password, context);
      errors.push(...contextResult.errors);
      warnings.push(...contextResult.warnings);
      score -= contextResult.penalty;
    }

    // Check against compromised passwords (Have I Been Pwned)
    if (this.config.checkCompromised) {
      const compromisedResult = await this.checkCompromisedPassword(password);
      errors.push(...compromisedResult.errors);
      warnings.push(...compromisedResult.warnings);
      score -= compromisedResult.penalty;
    }

    // Generate suggestions
    suggestions.push(
      ...this.generateSuggestions(password, errors, isLongPassphrase),
    );

    // Calculate final score
    score = Math.max(0, Math.min(100, score));
    const strength = this.calculateStrength(score);
    const hasErrors = errors.some((e) => e.severity === "error");

    return {
      isValid: !hasErrors,
      score,
      strength,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Quick validation without async checks (no HIBP)
   */
  validatePasswordSync(
    password: string,
    context: PasswordValidationContext = {},
  ): Omit<PasswordValidationResult, "compromised"> {
    const errors: PasswordValidationError[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    if (!password) {
      return {
        isValid: false,
        score: 0,
        strength: "very_weak",
        errors: [
          {
            code: "EMPTY_PASSWORD",
            message: "Password is required",
            severity: "error",
          },
        ],
        warnings: [],
        suggestions: ["Enter a password to continue"],
      };
    }

    // Length check
    const lengthResult = this.checkLength(password);
    errors.push(...lengthResult.errors);
    score -= lengthResult.penalty;

    const isLongPassphrase =
      this.config.allowLongPassphrases &&
      password.length >= this.config.passphraseMinLength;

    if (!isLongPassphrase) {
      const complexityResult = this.checkComplexity(password);
      errors.push(...complexityResult.errors);
      warnings.push(...complexityResult.warnings);
      score -= complexityResult.penalty;
    }

    if (this.config.checkKeyboardPatterns) {
      const patternResult = this.checkKeyboardPatterns(password);
      errors.push(...patternResult.errors);
      warnings.push(...patternResult.warnings);
      score -= patternResult.penalty;
    }

    if (this.config.checkRepetitive) {
      const repetitiveResult = this.checkRepetitiveCharacters(password);
      errors.push(...repetitiveResult.errors);
      warnings.push(...repetitiveResult.warnings);
      score -= repetitiveResult.penalty;
    }

    if (this.config.checkDictionary) {
      const dictionaryResult = this.checkDictionaryWords(password);
      errors.push(...dictionaryResult.errors);
      warnings.push(...dictionaryResult.warnings);
      score -= dictionaryResult.penalty;
    }

    if (this.config.checkContext && Object.keys(context).length > 0) {
      const contextResult = this.checkContextInformation(password, context);
      errors.push(...contextResult.errors);
      warnings.push(...contextResult.warnings);
      score -= contextResult.penalty;
    }

    suggestions.push(
      ...this.generateSuggestions(password, errors, isLongPassphrase),
    );

    score = Math.max(0, Math.min(100, score));
    const strength = this.calculateStrength(score);
    const hasErrors = errors.some((e) => e.severity === "error");

    return {
      isValid: !hasErrors,
      score,
      strength,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Check password length requirements
   */
  private checkLength(password: string): {
    errors: PasswordValidationError[];
    penalty: number;
  } {
    const errors: PasswordValidationError[] = [];
    let penalty = 0;

    if (password.length < this.config.minLength) {
      errors.push({
        code: "TOO_SHORT",
        message: `Password must be at least ${this.config.minLength} characters long`,
        severity: "error",
      });
      penalty = 50;
    }

    if (password.length > this.config.maxLength) {
      errors.push({
        code: "TOO_LONG",
        message: `Password must not exceed ${this.config.maxLength} characters`,
        severity: "error",
      });
      penalty = 20;
    }

    // Bonus for length
    if (password.length >= 12) penalty -= 5;
    if (password.length >= 16) penalty -= 5;
    if (password.length >= 20) penalty -= 5;

    return { errors, penalty: Math.max(0, penalty) };
  }

  /**
   * Check character complexity
   */
  private checkComplexity(password: string): {
    errors: PasswordValidationError[];
    warnings: string[];
    penalty: number;
  } {
    const errors: PasswordValidationError[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    const hasLowercase = CHARACTER_CLASSES.lowercase.test(password);
    const hasUppercase = CHARACTER_CLASSES.uppercase.test(password);
    const hasDigit = CHARACTER_CLASSES.digit.test(password);
    const hasSpecial = CHARACTER_CLASSES.special.test(password);

    const classCount = [
      hasLowercase,
      hasUppercase,
      hasDigit,
      hasSpecial,
    ].filter(Boolean).length;

    if (this.config.requireLowercase && !hasLowercase) {
      errors.push({
        code: "MISSING_LOWERCASE",
        message: "Password must contain at least one lowercase letter",
        severity: "error",
      });
      penalty += 15;
    }

    if (this.config.requireUppercase && !hasUppercase) {
      errors.push({
        code: "MISSING_UPPERCASE",
        message: "Password must contain at least one uppercase letter",
        severity: "error",
      });
      penalty += 15;
    }

    if (this.config.requireDigit && !hasDigit) {
      errors.push({
        code: "MISSING_DIGIT",
        message: "Password must contain at least one number",
        severity: "error",
      });
      penalty += 15;
    }

    if (this.config.requireSpecial && !hasSpecial) {
      errors.push({
        code: "MISSING_SPECIAL",
        message:
          "Password must contain at least one special character (!@#$%^&*...)",
        severity: "error",
      });
      penalty += 15;
    }

    if (classCount < this.config.minCharacterClasses) {
      warnings.push(
        `Consider using more character types (currently ${classCount} of 4)`,
      );
      penalty += (this.config.minCharacterClasses - classCount) * 5;
    }

    return { errors, warnings, penalty };
  }

  /**
   * Check for keyboard patterns
   */
  private checkKeyboardPatterns(password: string): {
    errors: PasswordValidationError[];
    warnings: string[];
    penalty: number;
  } {
    const errors: PasswordValidationError[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    const lowerPassword = password.toLowerCase();

    for (const pattern of KEYBOARD_PATTERNS) {
      if (pattern.length >= 4 && lowerPassword.includes(pattern)) {
        errors.push({
          code: "KEYBOARD_PATTERN",
          message: "Password contains a keyboard pattern (e.g., qwerty, 12345)",
          severity: "error",
        });
        penalty += 30;
        break;
      }

      // Check reversed pattern
      const reversedPattern = pattern.split("").reverse().join("");
      if (
        reversedPattern.length >= 4 &&
        lowerPassword.includes(reversedPattern)
      ) {
        errors.push({
          code: "KEYBOARD_PATTERN_REVERSED",
          message: "Password contains a reversed keyboard pattern",
          severity: "error",
        });
        penalty += 25;
        break;
      }
    }

    // Check for sequential characters
    const sequentialResult = this.hasSequentialCharacters(password, 4);
    if (sequentialResult) {
      warnings.push("Password contains sequential characters");
      penalty += 10;
    }

    return { errors, warnings, penalty };
  }

  /**
   * Check for repetitive characters (aaaa, 1111, etc.)
   */
  private checkRepetitiveCharacters(password: string): {
    errors: PasswordValidationError[];
    warnings: string[];
    penalty: number;
  } {
    const errors: PasswordValidationError[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    // Check for repeating characters
    const repeatRegex = new RegExp(
      `(.)\\1{${this.config.maxRepetitiveChars},}`,
      "g",
    );
    if (repeatRegex.test(password)) {
      errors.push({
        code: "REPETITIVE_CHARS",
        message: `Password cannot have more than ${this.config.maxRepetitiveChars} repeating characters`,
        severity: "error",
      });
      penalty += 25;
    }

    // Check for repeating patterns (e.g., abcabc)
    const patternLength = Math.min(4, Math.floor(password.length / 2));
    for (let len = 2; len <= patternLength; len++) {
      for (let i = 0; i <= password.length - len * 2; i++) {
        const pattern = password.substring(i, i + len);
        const rest = password.substring(i + len);
        if (
          rest.startsWith(pattern) &&
          rest.substring(len).startsWith(pattern)
        ) {
          warnings.push("Password contains a repeating pattern");
          penalty += 10;
          break;
        }
      }
    }

    return { errors, warnings, penalty };
  }

  /**
   * Check against dictionary words
   */
  private checkDictionaryWords(password: string): {
    errors: PasswordValidationError[];
    warnings: string[];
    penalty: number;
  } {
    const errors: PasswordValidationError[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    const lowerPassword = password.toLowerCase();

    // Check for exact matches
    if (COMMON_DICTIONARY_WORDS.includes(lowerPassword)) {
      errors.push({
        code: "DICTIONARY_WORD",
        message: "Password is a common word and easily guessable",
        severity: "error",
      });
      penalty += 40;
      return { errors, warnings, penalty };
    }

    // Check if password contains dictionary words
    for (const word of COMMON_DICTIONARY_WORDS) {
      if (word.length >= 4 && lowerPassword.includes(word)) {
        warnings.push(`Password contains the common word "${word}"`);
        penalty += 15;
        break;
      }
    }

    // Check for leet speak variations
    const leetMap: { [key: string]: string } = {
      "4": "a",
      "@": "a",
      "3": "e",
      "1": "i",
      "!": "i",
      "0": "o",
      $: "s",
      "5": "s",
      "7": "t",
      "+": "t",
      "2": "z",
    };

    const deleetedPassword = lowerPassword.replace(
      /[4@3!10$57+2]/g,
      (char) => leetMap[char] || char,
    );

    if (deleetedPassword !== lowerPassword) {
      for (const word of COMMON_DICTIONARY_WORDS) {
        if (word.length >= 4 && deleetedPassword.includes(word)) {
          warnings.push(
            "Password contains a common word with character substitutions",
          );
          penalty += 10;
          break;
        }
      }
    }

    return { errors, warnings, penalty };
  }

  /**
   * Check for context-specific information (username, email, company name, etc.)
   */
  private checkContextInformation(
    password: string,
    context: PasswordValidationContext,
  ): {
    errors: PasswordValidationError[];
    warnings: string[];
    penalty: number;
  } {
    const errors: PasswordValidationError[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    const lowerPassword = password.toLowerCase();

    // Check username
    if (context.username && context.username.length >= 3) {
      const lowerUsername = context.username.toLowerCase();
      if (
        lowerPassword.includes(lowerUsername) ||
        lowerUsername.includes(lowerPassword)
      ) {
        errors.push({
          code: "CONTAINS_USERNAME",
          message: "Password cannot contain your username",
          severity: "error",
        });
        penalty += 30;
      }
    }

    // Check email local part
    if (context.email) {
      const emailLocal = context.email.split("@")[0].toLowerCase();
      if (emailLocal.length >= 3 && lowerPassword.includes(emailLocal)) {
        errors.push({
          code: "CONTAINS_EMAIL",
          message: "Password cannot contain your email address",
          severity: "error",
        });
        penalty += 30;
      }
    }

    // Check company name
    if (context.companyName && context.companyName.length >= 3) {
      const lowerCompany = context.companyName
        .toLowerCase()
        .replace(/\s+/g, "");
      if (lowerPassword.includes(lowerCompany)) {
        errors.push({
          code: "CONTAINS_COMPANY",
          message: "Password cannot contain the company name",
          severity: "error",
        });
        penalty += 25;
      }
    }

    // Check first name
    if (context.firstName && context.firstName.length >= 3) {
      const lowerFirstName = context.firstName.toLowerCase();
      if (lowerPassword.includes(lowerFirstName)) {
        warnings.push("Password contains your first name");
        penalty += 15;
      }
    }

    // Check last name
    if (context.lastName && context.lastName.length >= 3) {
      const lowerLastName = context.lastName.toLowerCase();
      if (lowerPassword.includes(lowerLastName)) {
        warnings.push("Password contains your last name");
        penalty += 15;
      }
    }

    return { errors, warnings, penalty };
  }

  /**
   * Check if password has been compromised (Have I Been Pwned API)
   * Uses k-Anonymity to protect the password being checked
   */
  async checkCompromisedPassword(
    password: string,
  ): Promise<{
    errors: PasswordValidationError[];
    warnings: string[];
    penalty: number;
  }> {
    const errors: PasswordValidationError[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    try {
      // Create SHA-1 hash of password
      const hash = crypto
        .createHash("sha1")
        .update(password)
        .digest("hex")
        .toUpperCase();
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      // Query Have I Been Pwned API using k-Anonymity
      const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`,
        {
          headers: {
            "Add-Padding": "true", // Adds padding to prevent response length analysis
            "User-Agent": "Komra-Password-Checker",
          },
        },
      );

      if (!response.ok) {
        // API error - don't block, just warn
        warnings.push("Unable to check password against known breaches");
        return { errors, warnings, penalty };
      }

      const text = await response.text();
      const hashes = text.split("\r\n");

      for (const line of hashes) {
        const [hashSuffix, count] = line.split(":");
        if (hashSuffix === suffix) {
          const breachCount = parseInt(count, 10);
          errors.push({
            code: "COMPROMISED_PASSWORD",
            message: `This password has been found in ${breachCount.toLocaleString()} data breaches. Please choose a different password.`,
            severity: "error",
          });
          penalty += 50;
          break;
        }
      }
    } catch (error) {
      // Network error - don't block user, just log warning
      console.warn("Failed to check password against HIBP:", error);
      warnings.push("Unable to verify password against known breaches");
    }

    return { errors, warnings, penalty };
  }

  /**
   * Check for sequential characters
   */
  private hasSequentialCharacters(
    password: string,
    minLength: number,
  ): boolean {
    const lowerPassword = password.toLowerCase();

    for (let i = 0; i <= lowerPassword.length - minLength; i++) {
      let isAscending = true;
      let isDescending = true;

      for (let j = 0; j < minLength - 1; j++) {
        const current = lowerPassword.charCodeAt(i + j);
        const next = lowerPassword.charCodeAt(i + j + 1);

        if (next !== current + 1) isAscending = false;
        if (next !== current - 1) isDescending = false;
      }

      if (isAscending || isDescending) return true;
    }

    return false;
  }

  /**
   * Generate helpful suggestions based on errors
   */
  private generateSuggestions(
    password: string,
    errors: PasswordValidationError[],
    isLongPassphrase: boolean,
  ): string[] {
    const suggestions: string[] = [];
    const errorCodes = errors.map((e) => e.code);

    if (errorCodes.includes("TOO_SHORT")) {
      suggestions.push(
        `Add ${this.config.minLength - password.length} more characters`,
      );
      if (this.config.allowLongPassphrases) {
        suggestions.push(
          `Or use a passphrase with ${this.config.passphraseMinLength}+ characters`,
        );
      }
    }

    if (errorCodes.includes("MISSING_UPPERCASE")) {
      suggestions.push("Add at least one uppercase letter (A-Z)");
    }

    if (errorCodes.includes("MISSING_LOWERCASE")) {
      suggestions.push("Add at least one lowercase letter (a-z)");
    }

    if (errorCodes.includes("MISSING_DIGIT")) {
      suggestions.push("Add at least one number (0-9)");
    }

    if (errorCodes.includes("MISSING_SPECIAL")) {
      suggestions.push("Add a special character like !@#$%^&*");
    }

    if (
      errorCodes.includes("KEYBOARD_PATTERN") ||
      errorCodes.includes("KEYBOARD_PATTERN_REVERSED")
    ) {
      suggestions.push('Avoid keyboard patterns like "qwerty" or "12345"');
    }

    if (errorCodes.includes("REPETITIVE_CHARS")) {
      suggestions.push("Avoid repeating the same character multiple times");
    }

    if (errorCodes.includes("DICTIONARY_WORD")) {
      suggestions.push(
        "Use a combination of unrelated words or add random characters",
      );
    }

    if (errorCodes.includes("COMPROMISED_PASSWORD")) {
      suggestions.push("Choose a unique password that hasn't been used before");
      suggestions.push(
        "Consider using a password manager to generate strong passwords",
      );
    }

    if (
      errorCodes.includes("CONTAINS_USERNAME") ||
      errorCodes.includes("CONTAINS_EMAIL")
    ) {
      suggestions.push("Don't include personal information in your password");
    }

    if (!isLongPassphrase && suggestions.length === 0 && password.length < 12) {
      suggestions.push("Consider using a longer password for better security");
    }

    return suggestions;
  }

  /**
   * Calculate password strength from score
   */
  private calculateStrength(
    score: number,
  ): PasswordValidationResult["strength"] {
    if (score >= 90) return "very_strong";
    if (score >= 70) return "strong";
    if (score >= 50) return "fair";
    if (score >= 30) return "weak";
    return "very_weak";
  }

  /**
   * Get password requirements description
   */
  getRequirements(): string[] {
    const requirements: string[] = [];

    requirements.push(`Minimum ${this.config.minLength} characters`);

    if (this.config.allowLongPassphrases) {
      requirements.push(
        `Or ${this.config.passphraseMinLength}+ characters (passphrase - no other requirements)`,
      );
    }

    if (this.config.requireUppercase) {
      requirements.push("At least one uppercase letter");
    }

    if (this.config.requireLowercase) {
      requirements.push("At least one lowercase letter");
    }

    if (this.config.requireDigit) {
      requirements.push("At least one number");
    }

    if (this.config.requireSpecial) {
      requirements.push("At least one special character");
    }

    if (this.config.checkCompromised) {
      requirements.push("Not found in known data breaches");
    }

    if (this.config.checkDictionary) {
      requirements.push("Not a common dictionary word");
    }

    if (this.config.checkKeyboardPatterns) {
      requirements.push("No keyboard patterns (qwerty, 12345, etc.)");
    }

    if (this.config.checkRepetitive) {
      requirements.push(
        `No more than ${this.config.maxRepetitiveChars} repeating characters`,
      );
    }

    if (this.config.checkContext) {
      requirements.push("Cannot contain username, email, or company name");
    }

    return requirements;
  }
}

// Export singleton instance with default config
export const passwordValidator = new PasswordValidationService();

// Export default validation function
export async function validatePassword(
  password: string,
  context?: PasswordValidationContext,
): Promise<PasswordValidationResult> {
  return passwordValidator.validatePassword(password, context);
}

// Export sync validation function
export function validatePasswordSync(
  password: string,
  context?: PasswordValidationContext,
): Omit<PasswordValidationResult, "compromised"> {
  return passwordValidator.validatePasswordSync(password, context);
}
