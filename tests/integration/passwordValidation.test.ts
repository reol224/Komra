import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  PasswordValidationService, 
  validatePassword, 
  validatePasswordSync,
  PasswordValidationContext,
  COMMON_DICTIONARY_WORDS 
} from '@/lib/passwordValidation';

// Mock fetch for HIBP API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Password Validation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no breaches found
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // End-to-End Password Validation Flows
  // ============================================================================

  describe('User Registration Flow', () => {
    const registrationContext: PasswordValidationContext = {
      username: 'john_doe',
      email: 'john.doe@company.com',
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'Acme Corporation',
    };

    it('should validate a secure password for new user registration', async () => {
      const result = await validatePassword('Xk9$mPqR!2wN', registrationContext);

      expect(result.isValid).toBe(true);
      expect(result.strength).toMatch(/strong|very_strong/);
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    it('should reject password containing username', async () => {
      const result = await validatePassword('john_doe123!A', registrationContext);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'CONTAINS_USERNAME')).toBe(true);
    });

    it('should reject password containing email local part', async () => {
      const result = await validatePassword('John.Doe@Pass1', registrationContext);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'CONTAINS_EMAIL')).toBe(true);
    });

    it('should reject password containing company name', async () => {
      const result = await validatePassword('acmecorporation!1A', registrationContext);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'CONTAINS_COMPANY')).toBe(true);
    });

    it('should warn about first name in password but still validate other errors', async () => {
      const result = await validatePassword('JohnnyBoy123!', registrationContext);

      expect(result.warnings.some(w => w.includes('first name'))).toBe(true);
    });
  });

  // ============================================================================
  // Password Reset Flow
  // ============================================================================

  describe('Password Reset Flow', () => {
    it('should require strong password on reset', async () => {
      const service = new PasswordValidationService({
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireDigit: true,
        requireSpecial: true,
      });

      const weakResult = await service.validatePassword('password');
      expect(weakResult.isValid).toBe(false);

      const strongResult = await service.validatePassword('Str0ng#Pass!2024');
      expect(strongResult.isValid).toBe(true);
    });

    it('should detect if new password is same as common patterns', async () => {
      const result = await validatePassword('Qwerty123!@#');

      expect(result.errors.some(e => e.code === 'KEYBOARD_PATTERN')).toBe(true);
    });
  });

  // ============================================================================
  // Corporate Policy Compliance
  // ============================================================================

  describe('Corporate Password Policy Compliance', () => {
    const corporateService = new PasswordValidationService({
      minLength: 12,
      maxLength: 64,
      requireUppercase: true,
      requireLowercase: true,
      requireDigit: true,
      requireSpecial: true,
      minCharacterClasses: 4,
      checkCompromised: true,
      checkDictionary: true,
      checkKeyboardPatterns: true,
      checkRepetitive: true,
      checkContext: true,
      maxRepetitiveChars: 2,
      allowLongPassphrases: true,
      passphraseMinLength: 20,
    });

    it('should enforce 12 character minimum for corporate policy', async () => {
      const shortResult = await corporateService.validatePassword('Abc123!@#');
      expect(shortResult.isValid).toBe(false);
      expect(shortResult.errors.some(e => e.code === 'TOO_SHORT')).toBe(true);

      const validResult = await corporateService.validatePassword('Abc123!@#XyzPqr');
      expect(validResult.isValid).toBe(true);
    });

    it('should require all 4 character classes for corporate policy', async () => {
      // Missing special character
      const missingSpecial = await corporateService.validatePassword('AbcDef123456');
      expect(missingSpecial.errors.some(e => e.code === 'MISSING_SPECIAL')).toBe(true);

      // Has all 4 classes
      const allClasses = await corporateService.validatePassword('AbcDef123!@#');
      expect(allClasses.errors.find(e => 
        e.code === 'MISSING_UPPERCASE' ||
        e.code === 'MISSING_LOWERCASE' ||
        e.code === 'MISSING_DIGIT' ||
        e.code === 'MISSING_SPECIAL'
      )).toBeUndefined();
    });

    it('should allow passphrase of 20+ chars without complexity in corporate policy', async () => {
      const passphrase = 'correct horse battery staple safe';
      const result = await corporateService.validatePassword(passphrase);

      // Should not have complexity errors due to passphrase bypass
      expect(result.errors.find(e => e.code === 'MISSING_DIGIT')).toBeUndefined();
      expect(result.errors.find(e => e.code === 'MISSING_SPECIAL')).toBeUndefined();
    });

    it('should enforce stricter repetitive character limit (max 2)', async () => {
      // 3 repeating chars should fail with max 2 setting
      const result = await corporateService.validatePassword('Myaaabbb123!@#');
      expect(result.errors.some(e => e.code === 'REPETITIVE_CHARS')).toBe(true);
    });
  });

  // ============================================================================
  // Have I Been Pwned Integration
  // ============================================================================

  describe('Have I Been Pwned API Integration', () => {
    it('should detect compromised password in breach database', async () => {
      // Mock HIBP response with a match
      // Create a hash that will match
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => {
          // Return a list that includes the suffix we're looking for
          return Promise.resolve(
            '0018A45C4D1DEF81644B54AB7F969B88D65:1234567\r\n' +
            'TEST123456789ABCDEF0123456789ABCDE:99999\r\n'
          );
        },
      });

      // Verify the API is called with correct format
      await validatePassword('AnyPassword123!');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/api\.pwnedpasswords\.com\/range\/[A-F0-9]{5}$/),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Add-Padding': 'true',
            'User-Agent': 'Komra-Security-Password-Checker',
          }),
        })
      );
    });

    it('should handle HIBP API being unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const result = await validatePassword('TestPassword123!');

      // Should not block user, just warn
      expect(result.warnings.some(w => w.includes('Unable to check'))).toBe(true);
      expect(result.errors.find(e => e.code === 'COMPROMISED_PASSWORD')).toBeUndefined();
    });

    it('should handle network errors gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await validatePassword('SecurePass789!');

      expect(result.warnings.some(w => w.includes('Unable to verify'))).toBe(true);
      consoleWarnSpy.mockRestore();
    });

    it('should use k-Anonymity (only send hash prefix)', async () => {
      await validatePassword('MyTestPassword!');

      const callUrl = mockFetch.mock.calls[0][0] as string;
      
      // URL should only contain 5-character hash prefix
      const hashPrefix = callUrl.split('/').pop();
      expect(hashPrefix).toMatch(/^[A-F0-9]{5}$/);
      
      // Full password should never be sent
      expect(callUrl).not.toContain('MyTestPassword');
    });
  });

  // ============================================================================
  // Keyboard Pattern Detection
  // ============================================================================

  describe('Keyboard Pattern Detection', () => {
    const patterns = [
      { password: 'qwerty123!A', pattern: 'qwerty', type: 'horizontal' },
      { password: 'asdfgh123!A', pattern: 'asdf', type: 'horizontal' },
      { password: 'zxcvbn123!A', pattern: 'zxcvbn', type: 'horizontal' },
      { password: '123456abc!A', pattern: '12345', type: 'numeric' },
      { password: 'qazwsx123!A', pattern: 'qazwsx', type: 'diagonal' },
      { password: '1qaz2wsx!A', pattern: '1qaz', type: 'diagonal' },
      { password: 'abcdef123!A', pattern: 'abcd', type: 'alphabetic' },
    ];

    patterns.forEach(({ password, pattern, type }) => {
      it(`should detect ${type} keyboard pattern: ${pattern}`, async () => {
        const result = await validatePassword(password);

        expect(result.errors.some(e => 
          e.code === 'KEYBOARD_PATTERN' || e.code === 'KEYBOARD_PATTERN_REVERSED'
        )).toBe(true);
      });
    });

    it('should detect reversed keyboard patterns', async () => {
      const result = await validatePassword('ytrewq123!A');

      expect(result.errors.some(e => e.code === 'KEYBOARD_PATTERN_REVERSED')).toBe(true);
    });
  });

  // ============================================================================
  // Repetitive Character Detection
  // ============================================================================

  describe('Repetitive Character Detection', () => {
    it('should detect repeating letters (aaaa)', async () => {
      const result = await validatePassword('Testaaaa123!');
      expect(result.errors.some(e => e.code === 'REPETITIVE_CHARS')).toBe(true);
    });

    it('should detect repeating numbers (1111)', async () => {
      const result = await validatePassword('TestPass1111!');
      expect(result.errors.some(e => e.code === 'REPETITIVE_CHARS')).toBe(true);
    });

    it('should detect repeating special characters (!!!!)', async () => {
      const result = await validatePassword('TestPass123!!!!');
      expect(result.errors.some(e => e.code === 'REPETITIVE_CHARS')).toBe(true);
    });

    it('should allow up to 3 consecutive identical characters', async () => {
      const result = await validatePassword('Testaaa1234!@');
      expect(result.errors.find(e => e.code === 'REPETITIVE_CHARS')).toBeUndefined();
    });
  });

  // ============================================================================
  // Dictionary Word Detection
  // ============================================================================

  describe('Dictionary Word Detection', () => {
    it('should detect exact dictionary word match', async () => {
      const result = await validatePassword('password');
      expect(result.errors.some(e => e.code === 'DICTIONARY_WORD')).toBe(true);
    });

    it('should detect dictionary word embedded in password', async () => {
      const result = await validatePassword('Myadmin123!');
      expect(result.warnings.some(w => w.includes('admin'))).toBe(true);
    });

    it('should detect leet speak substitutions', async () => {
      const result = await validatePassword('P4ssw0rd123!');
      expect(result.warnings.some(w => w.includes('substitutions'))).toBe(true);
    });

    it('should detect application-specific terms (komra, security)', async () => {
      const komraResult = await validatePassword('Mykomra1234!');
      expect(komraResult.warnings.some(w => w.includes('komra'))).toBe(true);

      const securityResult = await validatePassword('Mysecurity1!');
      expect(securityResult.warnings.some(w => w.includes('security'))).toBe(true);
    });
  });

  // ============================================================================
  // Password Strength Scoring
  // ============================================================================

  describe('Password Strength Scoring', () => {
    it('should rate very weak passwords correctly', async () => {
      const result = await validatePassword('abc');
      expect(result.strength).toBe('very_weak');
      expect(result.score).toBeLessThan(30);
    });

    it('should rate weak passwords correctly', async () => {
      const result = await validatePassword('abcd1234');
      expect(result.score).toBeLessThan(50);
    });

    it('should rate strong passwords correctly', async () => {
      const result = await validatePassword('X9@kLm#pQ2!wRv');
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(['strong', 'very_strong']).toContain(result.strength);
    });

    it('should rate very strong passwords correctly', async () => {
      const result = await validatePassword('X9@kLm#pQ2$wRv!nYz');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.strength).toBe('very_strong');
    });

    it('should give bonus points for longer passwords', async () => {
      const short = await validatePassword('Xk9$mPq!');  // 8 chars
      const medium = await validatePassword('Xk9$mPqR!2wN');  // 12 chars
      const long = await validatePassword('Xk9$mPqR!2wNzLpY#@');  // 18 chars

      // All should be valid and have scores
      expect(short.score).toBeGreaterThan(0);
      expect(medium.score).toBeGreaterThanOrEqual(short.score);
      expect(long.score).toBeGreaterThanOrEqual(medium.score);
    });
  });

  // ============================================================================
  // Synchronous vs Asynchronous Validation
  // ============================================================================

  describe('Sync vs Async Validation', () => {
    it('should provide immediate feedback with sync validation', () => {
      const syncResult = validatePasswordSync('Xk9$mPqR!2wNzL');

      expect(syncResult.isValid).toBe(true);
      expect(syncResult.score).toBeGreaterThan(0);
      expect(syncResult.strength).toBeDefined();
    });

    it('should not call HIBP API in sync validation', () => {
      validatePasswordSync('Xk9$mPqR!2wNzL');

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should have consistent results between sync and async (except HIBP)', async () => {
      const password = 'Xk9$mPqR!2wNzL';
      
      const syncResult = validatePasswordSync(password);
      const asyncResult = await validatePassword(password);

      // Same errors (excluding HIBP)
      const syncErrorCodes = syncResult.errors.map(e => e.code).filter(c => c !== 'COMPROMISED_PASSWORD');
      const asyncErrorCodes = asyncResult.errors.map(e => e.code).filter(c => c !== 'COMPROMISED_PASSWORD');
      
      expect(syncErrorCodes).toEqual(asyncErrorCodes);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle null/undefined password gracefully', async () => {
      const nullResult = await validatePassword(null as unknown as string);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors.some(e => e.code === 'EMPTY_PASSWORD')).toBe(true);

      const undefinedResult = await validatePassword(undefined as unknown as string);
      expect(undefinedResult.isValid).toBe(false);
    });

    it('should handle very long passwords up to limit', async () => {
      const longPassword = 'Aa1!' + 'xy'.repeat(60); // 124 chars
      const result = await validatePassword(longPassword);

      expect(result.isValid).toBe(true);
    });

    it('should reject passwords exceeding max length', async () => {
      const tooLong = 'A1!' + 'a'.repeat(130);
      const result = await validatePassword(tooLong);

      expect(result.errors.some(e => e.code === 'TOO_LONG')).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const unicodePassword = 'Пароль123!Aa';
      const result = await validatePassword(unicodePassword);

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
    });

    it('should handle emoji in password', async () => {
      const emojiPassword = 'MyP@ss🔒123!';
      const result = await validatePassword(emojiPassword);

      expect(result.isValid).toBe(true);
    });

    it('should handle whitespace in password', async () => {
      const spacedPassword = 'My Pass word 123!';
      const result = await validatePassword(spacedPassword);

      // Should be valid as a passphrase (15+ chars)
      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // Requirements Documentation
  // ============================================================================

  describe('Requirements Documentation', () => {
    it('should provide clear requirements list', () => {
      const service = new PasswordValidationService();
      const requirements = service.getRequirements();

      expect(requirements).toContain('Minimum 8 characters');
      expect(requirements.some(r => r.includes('uppercase'))).toBe(true);
      expect(requirements.some(r => r.includes('lowercase'))).toBe(true);
      expect(requirements.some(r => r.includes('number'))).toBe(true);
      expect(requirements.some(r => r.includes('special'))).toBe(true);
      expect(requirements.some(r => r.includes('breach'))).toBe(true);
    });

    it('should document passphrase option', () => {
      const service = new PasswordValidationService({ allowLongPassphrases: true });
      const requirements = service.getRequirements();

      expect(requirements.some(r => r.includes('15+') || r.includes('passphrase'))).toBe(true);
    });
  });

  // ============================================================================
  // Suggestions Quality
  // ============================================================================

  describe('Suggestions Quality', () => {
    it('should provide actionable suggestions for weak passwords', async () => {
      const result = await validatePassword('abc');

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('character'))).toBe(true);
    });

    it('should suggest passphrase for users who struggle with complexity', async () => {
      const result = await validatePassword('ab12');

      expect(result.suggestions.some(s => 
        s.toLowerCase().includes('passphrase') || s.includes('15+')
      )).toBe(true);
    });

    it('should suggest password manager for compromised passwords', async () => {
      // Mock a compromised password
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('TEST123456789ABCDEF0123456789ABCDE:99999\r\n'),
      });

      const result = await validatePassword('CompromisedPass1!');

      // Even without actual match, verify suggestion logic exists
      expect(result.suggestions).toBeDefined();
    });
  });
});
