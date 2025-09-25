/**
 * Input sanitization utilities to prevent security attacks
 */

// HTML entities to escape
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escapes HTML entities to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"'/]/g, (match) => HTML_ENTITIES[match] || match);
}

/**
 * Removes potentially dangerous characters and patterns
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove potential script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (except safe image types)
    .replace(/data:(?!image\/(png|jpg|jpeg|gif|webp|svg\+xml))/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript:/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=/gi, '')
    // Trim whitespace
    .trim();
}

/**
 * Validates and sanitizes email addresses
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  
  const sanitized = sanitizeInput(email.toLowerCase().trim());
  
  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Sanitizes text input with length limits
 */
export function sanitizeText(text: string, maxLength: number = 255): string {
  if (typeof text !== 'string') return '';
  
  return sanitizeInput(text).slice(0, maxLength);
}

/**
 * Sanitizes textarea input with length limits
 */
export function sanitizeTextarea(text: string, maxLength: number = 1000): string {
  if (typeof text !== 'string') return '';
  
  return sanitizeInput(text).slice(0, maxLength);
}

/**
 * Validates select field values against allowed options
 */
export function sanitizeSelectValue(value: string, allowedValues: string[]): string {
  if (typeof value !== 'string') return '';
  
  const sanitized = sanitizeInput(value);
  
  if (!allowedValues.includes(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Comprehensive form data sanitization
 */
export interface WaitlistFormData {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  companySize: string;
  useCase: string;
  referralSource: string;
}

export function sanitizeWaitlistForm(formData: WaitlistFormData): WaitlistFormData {
  const allowedCompanySizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
  const allowedReferralSources = ['search', 'social', 'referral', 'conference', 'blog', 'other'];
  
  return {
    email: sanitizeEmail(formData.email),
    firstName: sanitizeText(formData.firstName, 50),
    lastName: sanitizeText(formData.lastName, 50),
    company: sanitizeText(formData.company, 100),
    jobTitle: sanitizeText(formData.jobTitle, 100),
    companySize: sanitizeSelectValue(formData.companySize, allowedCompanySizes),
    useCase: sanitizeTextarea(formData.useCase, 500),
    referralSource: sanitizeSelectValue(formData.referralSource, allowedReferralSources),
  };
}