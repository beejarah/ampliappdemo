/**
 * Format a number as currency
 * @param value - The number to format
 * @param currency - The currency code (default: 'USD')
 * @param options - Additional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency = 'USD',
  options?: Intl.NumberFormatOptions
): string {
  // Default options for currency formatting
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  // Merge default options with any provided options
  const formatterOptions = { ...defaultOptions, ...options };

  try {
    // Use Intl.NumberFormat for localized currency formatting
    const formatter = new Intl.NumberFormat('en-US', formatterOptions);
    return formatter.format(value);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    console.error('Error formatting currency:', error);
    return `${currency} ${value.toFixed(2)}`;
  }
}

/**
 * Format a large number with abbreviations (K, M, B)
 * @param value - The number to format
 * @returns Formatted number string with abbreviation
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Format a date relative to now (e.g., "2 hours ago")
 * @param date - The date to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  
  // Less than a minute
  if (diffSecs < 60) {
    return `${diffSecs} seconds ago`;
  }
  
  // Less than an hour
  if (diffSecs < 3600) {
    const minutes = Math.floor(diffSecs / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diffSecs < 86400) {
    const hours = Math.floor(diffSecs / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a week
  if (diffSecs < 604800) {
    const days = Math.floor(diffSecs / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  // Format as date
  return date.toLocaleDateString();
}

/**
 * Truncate an Ethereum address for display
 * @param address - The Ethereum address to truncate
 * @param startChars - Number of characters to show at the start
 * @param endChars - Number of characters to show at the end
 * @returns Truncated address string
 */
export function truncateAddress(
  address: string,
  startChars = 6,
  endChars = 4
): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format a large number with abbreviations (K, M, B, T)
 * @param num The number to format
 * @param decimals Number of decimal places to show
 * @returns Formatted number with abbreviation
 */
export function formatCompactNumber(num: number, decimals = 1): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum < 1000) {
    return sign + absNum.toFixed(decimals).replace(/\.0+$/, '');
  }
  
  const abbreviations = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.floor(Math.log10(absNum) / 3);
  
  if (tier >= abbreviations.length) {
    return sign + absNum.toString();
  }
  
  const scale = Math.pow(10, tier * 3);
  const scaled = absNum / scale;
  
  return sign + scaled.toFixed(decimals).replace(/\.0+$/, '') + abbreviations[tier];
}

/**
 * Format a date to a readable string
 * @param date The date to format
 * @param format The format to use ('short', 'medium', 'long', or 'full')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  if (!date) return '';
  
  // Convert to Date object if string or number
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Formats: 'short' (MM/DD/YY), 'medium' (MMM DD, YYYY), 'long' (MMMM DD, YYYY), 'full' (Day, MMMM DD, YYYY)
  try {
    const options: Intl.DateTimeFormatOptions = { 
      year: format === 'short' ? '2-digit' : 'numeric',
      month: format === 'short' ? '2-digit' : format === 'medium' ? 'short' : 'long',
      day: '2-digit'
    };
    
    if (format === 'full') {
      options.weekday = 'long';
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    
    // Fallback formatting
    return dateObj.toLocaleDateString();
  }
}

/**
 * Format an address to a shortened form
 * @param address The address to format
 * @param prefixLength Number of characters to show at the beginning
 * @param suffixLength Number of characters to show at the end
 * @returns Formatted address string
 */
export function formatAddress(
  address: string,
  prefixLength = 6,
  suffixLength = 4
): string {
  if (!address || address.length <= prefixLength + suffixLength) {
    return address || '';
  }
  
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
} 