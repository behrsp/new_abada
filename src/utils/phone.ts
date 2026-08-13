export function cleanPhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits
  return phone.replace(/\D/g, '');
}

export function formatPhoneDisplay(phone: string): string {
  const digits = cleanPhone(phone);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
