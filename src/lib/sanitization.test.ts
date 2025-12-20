import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeInput,
  sanitizeEmail,
  sanitizeText,
  sanitizeTextarea,
  sanitizeSelectValue,
  sanitizeWaitlistForm,
  WaitlistFormData,
} from '@/lib/sanitization';

describe('sanitization', () => {
  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape less than symbol', () => {
      expect(escapeHtml('1 < 2')).toBe('1 &lt; 2');
    });

    it('should escape greater than symbol', () => {
      expect(escapeHtml('2 > 1')).toBe('2 &gt; 1');
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("It's fine")).toBe('It&#x27;s fine');
    });

    it('should escape forward slashes', () => {
      expect(escapeHtml('path/to/file')).toBe('path&#x2F;to&#x2F;file');
    });

    it('should escape multiple entities in the same string', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should return empty string unchanged', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should return safe text unchanged', () => {
      expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
    });
  });

  describe('sanitizeInput', () => {
    it('should return empty string for non-string input', () => {
      expect(sanitizeInput(null as unknown as string)).toBe('');
      expect(sanitizeInput(undefined as unknown as string)).toBe('');
      expect(sanitizeInput(123 as unknown as string)).toBe('');
    });

    it('should remove null bytes', () => {
      expect(sanitizeInput('hello\0world')).toBe('helloworld');
    });

    it('should remove control characters except newlines and tabs', () => {
      expect(sanitizeInput('hello\x00\x01\x02world')).toBe('helloworld');
      expect(sanitizeInput('hello\x7Fworld')).toBe('helloworld');
    });

    it('should preserve newlines and tabs', () => {
      expect(sanitizeInput('hello\n\tworld')).toBe('hello\n\tworld');
    });

    it('should remove script tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('');
      expect(sanitizeInput('Hello<script>alert(1)</script>World')).toBe('HelloWorld');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizeInput('JAVASCRIPT:void(0)')).toBe('void(0)');
    });

    it('should remove data: protocol except for safe image types', () => {
      // The data: prefix is removed, and script tags are also removed by sanitizeInput
      const result = sanitizeInput('data:text/html,<script>alert(1)</script>');
      expect(result).not.toContain('data:');
      expect(result).not.toContain('<script>');
      expect(result).toContain('text/html');
    });

    it('should preserve safe image data URLs', () => {
      const safeDataUrl = 'data:image/png;base64,iVBOR...';
      expect(sanitizeInput(safeDataUrl)).toBe(safeDataUrl);
    });

    it('should remove vbscript: protocol', () => {
      expect(sanitizeInput('vbscript:msgbox("hi")')).toBe('msgbox("hi")');
      expect(sanitizeInput('VBSCRIPT:test')).toBe('test');
    });

    it('should remove on* event handlers', () => {
      expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
      expect(sanitizeInput('onmouseover=test()')).toBe('test()');
      expect(sanitizeInput(' onerror = bad()')).toBe('bad()');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
    });

    it('should handle complex malicious input', () => {
      const malicious = '<script>alert("xss")</script>javascript:evil()onclick=bad()';
      const result = sanitizeInput(malicious);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onclick=');
    });
  });

  describe('sanitizeEmail', () => {
    it('should return empty string for non-string input', () => {
      expect(sanitizeEmail(null as unknown as string)).toBe('');
      expect(sanitizeEmail(undefined as unknown as string)).toBe('');
    });

    it('should convert email to lowercase', () => {
      expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });

    it('should accept valid email addresses', () => {
      expect(sanitizeEmail('user@domain.com')).toBe('user@domain.com');
      expect(sanitizeEmail('user.name@domain.co.uk')).toBe('user.name@domain.co.uk');
      expect(sanitizeEmail('user+tag@domain.org')).toBe('user+tag@domain.org');
    });

    it('should throw error for invalid email format', () => {
      expect(() => sanitizeEmail('notanemail')).toThrow('Invalid email format');
      expect(() => sanitizeEmail('missing@domain')).toThrow('Invalid email format');
      expect(() => sanitizeEmail('@nodomain.com')).toThrow('Invalid email format');
      expect(() => sanitizeEmail('user@.com')).toThrow('Invalid email format');
    });

    it('should throw error for empty email', () => {
      expect(() => sanitizeEmail('')).toThrow('Invalid email format');
    });

    it('should sanitize malicious input before validation', () => {
      expect(() => sanitizeEmail('<script>test@example.com</script>')).toThrow(
        'Invalid email format'
      );
    });
  });

  describe('sanitizeText', () => {
    it('should return empty string for non-string input', () => {
      expect(sanitizeText(null as unknown as string)).toBe('');
      expect(sanitizeText(undefined as unknown as string)).toBe('');
    });

    it('should apply sanitizeInput transformations', () => {
      expect(sanitizeText('<script>test</script>')).toBe('');
      expect(sanitizeText('  hello  ')).toBe('hello');
    });

    it('should truncate to default max length of 255', () => {
      const longText = 'a'.repeat(300);
      expect(sanitizeText(longText).length).toBe(255);
    });

    it('should truncate to custom max length', () => {
      const longText = 'a'.repeat(100);
      expect(sanitizeText(longText, 50).length).toBe(50);
    });

    it('should not truncate text shorter than max length', () => {
      expect(sanitizeText('short text', 255)).toBe('short text');
    });
  });

  describe('sanitizeTextarea', () => {
    it('should return empty string for non-string input', () => {
      expect(sanitizeTextarea(null as unknown as string)).toBe('');
      expect(sanitizeTextarea(undefined as unknown as string)).toBe('');
    });

    it('should apply sanitizeInput transformations', () => {
      expect(sanitizeTextarea('<script>test</script>')).toBe('');
    });

    it('should truncate to default max length of 1000', () => {
      const longText = 'a'.repeat(1500);
      expect(sanitizeTextarea(longText).length).toBe(1000);
    });

    it('should truncate to custom max length', () => {
      const longText = 'a'.repeat(600);
      expect(sanitizeTextarea(longText, 500).length).toBe(500);
    });

    it('should preserve newlines', () => {
      const multiline = 'line1\nline2\nline3';
      expect(sanitizeTextarea(multiline)).toBe(multiline);
    });
  });

  describe('sanitizeSelectValue', () => {
    const allowedValues = ['option1', 'option2', 'option3'];

    it('should return empty string for non-string input', () => {
      expect(sanitizeSelectValue(null as unknown as string, allowedValues)).toBe('');
      expect(sanitizeSelectValue(undefined as unknown as string, allowedValues)).toBe('');
    });

    it('should return value if in allowed list', () => {
      expect(sanitizeSelectValue('option1', allowedValues)).toBe('option1');
      expect(sanitizeSelectValue('option2', allowedValues)).toBe('option2');
    });

    it('should return empty string if value not in allowed list', () => {
      expect(sanitizeSelectValue('invalid', allowedValues)).toBe('');
      expect(sanitizeSelectValue('option4', allowedValues)).toBe('');
    });

    it('should sanitize value before checking against allowed list', () => {
      expect(sanitizeSelectValue('  option1  ', ['option1'])).toBe('option1');
    });

    it('should reject malicious values not in allowed list', () => {
      expect(sanitizeSelectValue('<script>option1</script>', allowedValues)).toBe('');
    });
  });

  describe('sanitizeWaitlistForm', () => {
    const validFormData: WaitlistFormData = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      company: 'Acme Inc',
      jobTitle: 'Engineer',
      companySize: '11-50',
      useCase: 'Security auditing for our infrastructure',
      referralSource: 'search',
    };

    it('should sanitize valid form data', () => {
      const result = sanitizeWaitlistForm(validFormData);
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.company).toBe('Acme Inc');
      expect(result.jobTitle).toBe('Engineer');
      expect(result.companySize).toBe('11-50');
      expect(result.useCase).toBe('Security auditing for our infrastructure');
      expect(result.referralSource).toBe('search');
    });

    it('should lowercase and trim email', () => {
      const result = sanitizeWaitlistForm({
        ...validFormData,
        email: '  TEST@EXAMPLE.COM  ',
      });
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error for invalid email', () => {
      expect(() =>
        sanitizeWaitlistForm({
          ...validFormData,
          email: 'invalid-email',
        })
      ).toThrow('Invalid email format');
    });

    it('should truncate firstName to 50 characters', () => {
      const result = sanitizeWaitlistForm({
        ...validFormData,
        firstName: 'a'.repeat(100),
      });
      expect(result.firstName.length).toBe(50);
    });

    it('should truncate lastName to 50 characters', () => {
      const result = sanitizeWaitlistForm({
        ...validFormData,
        lastName: 'a'.repeat(100),
      });
      expect(result.lastName.length).toBe(50);
    });

    it('should truncate company to 100 characters', () => {
      const result = sanitizeWaitlistForm({
        ...validFormData,
        company: 'a'.repeat(150),
      });
      expect(result.company.length).toBe(100);
    });

    it('should truncate jobTitle to 100 characters', () => {
      const result = sanitizeWaitlistForm({
        ...validFormData,
        jobTitle: 'a'.repeat(150),
      });
      expect(result.jobTitle.length).toBe(100);
    });

    it('should truncate useCase to 500 characters', () => {
      const result = sanitizeWaitlistForm({
        ...validFormData,
        useCase: 'a'.repeat(600),
      });
      expect(result.useCase.length).toBe(500);
    });

    it('should validate companySize against allowed values', () => {
      expect(sanitizeWaitlistForm({ ...validFormData, companySize: '1-10' }).companySize).toBe(
        '1-10'
      );
      expect(sanitizeWaitlistForm({ ...validFormData, companySize: '11-50' }).companySize).toBe(
        '11-50'
      );
      expect(sanitizeWaitlistForm({ ...validFormData, companySize: '51-200' }).companySize).toBe(
        '51-200'
      );
      expect(sanitizeWaitlistForm({ ...validFormData, companySize: '201-1000' }).companySize).toBe(
        '201-1000'
      );
      expect(sanitizeWaitlistForm({ ...validFormData, companySize: '1000+' }).companySize).toBe(
        '1000+'
      );
    });

    it('should return empty string for invalid companySize', () => {
      const result = sanitizeWaitlistForm({
        ...validFormData,
        companySize: 'invalid-size',
      });
      expect(result.companySize).toBe('');
    });

    it('should validate referralSource against allowed values', () => {
      expect(
        sanitizeWaitlistForm({ ...validFormData, referralSource: 'search' }).referralSource
      ).toBe('search');
      expect(
        sanitizeWaitlistForm({ ...validFormData, referralSource: 'social' }).referralSource
      ).toBe('social');
      expect(
        sanitizeWaitlistForm({ ...validFormData, referralSource: 'referral' }).referralSource
      ).toBe('referral');
      expect(
        sanitizeWaitlistForm({ ...validFormData, referralSource: 'conference' }).referralSource
      ).toBe('conference');
      expect(sanitizeWaitlistForm({ ...validFormData, referralSource: 'blog' }).referralSource).toBe(
        'blog'
      );
      expect(
        sanitizeWaitlistForm({ ...validFormData, referralSource: 'other' }).referralSource
      ).toBe('other');
    });

    it('should return empty string for invalid referralSource', () => {
      const result = sanitizeWaitlistForm({
        ...validFormData,
        referralSource: 'invalid-source',
      });
      expect(result.referralSource).toBe('');
    });

    it('should remove malicious script tags from text fields', () => {
      const result = sanitizeWaitlistForm({
        ...validFormData,
        firstName: '<script>alert("xss")</script>John',
        company: 'Acme<script>bad()</script>Inc',
      });
      expect(result.firstName).toBe('John');
      expect(result.company).toBe('AcmeInc');
    });

    it('should remove javascript: protocol from text fields', () => {
      const result = sanitizeWaitlistForm({
        ...validFormData,
        useCase: 'javascript:alert(1) Normal use case',
      });
      expect(result.useCase).not.toContain('javascript:');
    });
  });
});
