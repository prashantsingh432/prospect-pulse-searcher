
/**
 * Utility functions for handling LinkedIn URLs
 */

/**
 * Normalizes LinkedIn URLs for more reliable searching
 * 
 * @param url The LinkedIn URL to normalize
 * @returns A normalized version of the URL for consistent searching
 */
export const normalizeLinkedInUrl = (url: string): string => {
  if (!url) return '';
  
  let normalizedUrl = url.trim().toLowerCase();
  
  // Remove protocol if present
  normalizedUrl = normalizedUrl
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '');
    
  // Remove trailing slash if present
  normalizedUrl = normalizedUrl.replace(/\/+$/, '');
  
  console.log(`Normalized LinkedIn URL: "${url}" → "${normalizedUrl}"`);
  return normalizedUrl;
};

/**
 * Extracts the username portion from a LinkedIn URL
 * e.g., "linkedin.com/in/johndoe" returns "johndoe"
 */
export const extractLinkedInUsername = (url: string): string | null => {
  const normalizedUrl = normalizeLinkedInUrl(url);
  const usernameMatch = normalizedUrl.match(/linkedin\.com\/in\/([^\/]+)/i);
  
  if (usernameMatch && usernameMatch[1]) {
    const username = usernameMatch[1];
    console.log(`Extracted LinkedIn username: ${username}`);
    return username;
  }
  
  return null;
};

/**
 * Formats a LinkedIn URL to ensure proper format
 */
export const formatLinkedInUrl = (url: string): string => {
  let cleaned = url.trim();
  
  // If it doesn't contain linkedin.com, don't process further
  if (!cleaned.includes('linkedin.com')) {
    return cleaned;
  }
  
  // If it doesn't start with http/https, add it
  if (!cleaned.startsWith('http')) {
    cleaned = 'https://' + cleaned;
  }
  
  return cleaned;
};

/**
 * Basic validation for LinkedIn URLs
 */
export const validateLinkedInUrl = (url: string): boolean => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return false;
  }
  
  return /linkedin\.com/i.test(trimmedUrl);
};
