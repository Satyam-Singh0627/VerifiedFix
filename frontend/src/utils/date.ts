export function formatIstDateTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
  try {
    let s = String(dateInput);
    if (!s.endsWith('Z') && !s.includes('+')) {
      s += 'Z';
    }
    const d = new Date(s);
    if (isNaN(d.getTime())) return 'N/A';

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return `${formatter.format(d)} IST`;
  } catch {
    return 'N/A';
  }
}
