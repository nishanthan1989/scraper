import { parse } from 'json2csv';
import type { Lead } from '@shared/schema';

/**
 * Validates an email address format
 * @param email The email address to validate
 * @returns Boolean indicating if the email format is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Convert leads data to CSV format
 * @param leads Array of lead objects
 * @returns CSV formatted string
 */
export function convertLeadsToCSV(leads: Lead[]): string {
  // Define fields to include in CSV export
  const fields = [
    { label: 'Company Name', value: 'companyName' },
    { label: 'Industry', value: 'industry' },
    { label: 'Address', value: 'address' },
    { label: 'City', value: 'city' },
    { label: 'State', value: 'state' },
    { label: 'Zip Code', value: 'zipCode' },
    { label: 'Contact Name', value: 'contactName' },
    { label: 'Contact Title', value: 'contactTitle' },
    { label: 'Contact Email', value: 'contactEmail' },
    { label: 'Contact Phone', value: 'contactPhone' },
    { label: 'Website', value: 'website' },
    { label: 'Move Date', value: (row: Lead) => row.moveDate ? new Date(row.moveDate).toLocaleDateString() : '' },
    { label: 'Employee Count', value: 'employeeCount' },
    { label: 'Office Size', value: 'officeSize' },
    { label: 'Email Status', value: 'emailStatus' },
    { label: 'Notes', value: 'notes' },
    { label: 'Created Date', value: (row: Lead) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '' }
  ];
  
  try {
    return parse(leads, { fields });
  } catch (err) {
    console.error('Error converting to CSV:', err);
    throw new Error('Failed to generate CSV file');
  }
}

/**
 * Format date for display
 * @param date Date object or string
 * @returns Formatted date string
 */
export function formatDate(date?: Date | string | null): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Generate initials from a company name
 * @param name Company name
 * @returns Initials (up to 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '??';
  
  const words = name.split(' ');
  
  if (words.length === 1) {
    return name.substring(0, 2).toUpperCase();
  }
  
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Format the company size from employee count
 * @param count Employee count
 * @returns Formatted size category
 */
export function formatCompanySize(count?: number): string {
  if (!count) return 'Unknown';
  
  if (count <= 10) return '1-10 employees';
  if (count <= 50) return '11-50 employees';
  if (count <= 200) return '51-200 employees';
  if (count <= 500) return '201-500 employees';
  return '501+ employees';
}

/**
 * Rate limiting utility to prevent overwhelming target servers
 * @param ms Milliseconds to wait
 * @returns Promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
