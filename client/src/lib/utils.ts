import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets the initials from a company name
 * @param name The company name
 * @returns Initials (2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return "??";
  
  const words = name.split(" ");
  
  if (words.length === 1) {
    return name.substring(0, 2).toUpperCase();
  }
  
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Format date for display
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDate(date?: Date | string | null): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format time for display
 * @param date The date to format
 * @returns Formatted time string
 */
export function formatTime(date?: Date | string | null): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format datetime for display
 * @param date The date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date?: Date | string | null): string {
  if (!date) return "";
  
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Get company size label from employee count
 * @param count Employee count
 * @returns Size category label
 */
export function getCompanySizeLabel(count?: number): string {
  if (!count) return "Unknown";
  
  if (count <= 10) return "1-10 employees";
  if (count <= 50) return "11-50 employees";
  if (count <= 200) return "51-200 employees";
  if (count <= 500) return "201-500 employees";
  return "501+ employees";
}

/**
 * Calculate the difference in days between dates
 * @param date The date to compare
 * @returns Number of days
 */
export function daysFromNow(date?: Date | string | null): number {
  if (!date) return 0;
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  
  const diffTime = Math.abs(now.getTime() - dateObj.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
