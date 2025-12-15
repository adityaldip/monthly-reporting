/**
 * Format number to currency string with thousand separators
 * @param value - The number or string to format
 * @param locale - The locale to use ('id-ID' or 'en-US')
 * @returns Formatted string with thousand separators
 */
export function formatCurrencyInput(value: string | number, locale: 'id-ID' | 'en-US' = 'id-ID'): string {
  if (!value && value !== 0) return '';
  
  // Convert to string and remove all non-digit characters except decimal point
  let cleanValue = String(value).replace(/[^\d.]/g, '');
  
  // Handle multiple decimal points - keep only the first one
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = cleanValue.split('.');
  
  // Format integer part with thousand separators
  // For id-ID: use dot (.) as thousand separator
  // For en-US: use comma (,) as thousand separator
  const thousandSeparator = locale === 'id-ID' ? '.' : ',';
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  
  // Combine integer and decimal parts
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  }
  
  return formattedInteger;
}

/**
 * Parse formatted currency string back to number
 * @param value - The formatted currency string
 * @param locale - The locale used for formatting ('id-ID' or 'en-US')
 * @returns The numeric value
 */
export function parseCurrencyInput(value: string, locale: 'id-ID' | 'en-US' = 'id-ID'): number {
  if (!value) return 0;
  
  // Remove thousand separators based on locale
  // For id-ID: remove dots (thousand separator), keep comma for decimal
  // For en-US: remove commas (thousand separator), keep dot for decimal
  let cleanValue = value;
  if (locale === 'id-ID') {
    // Remove dots (thousand separators), but keep the last dot if it's a decimal point
    cleanValue = value.replace(/\./g, '');
  } else {
    // Remove commas (thousand separators), but keep the dot for decimal
    cleanValue = value.replace(/,/g, '');
  }
  
  // Parse to number
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

