/**
 * Format any date string or Date object into DD/MM/YYYY format
 * Example: "2006-06-05" or "2006-06-05T00:00:00.000Z" -> "05/06/2006"
 */
export const formatDate = (dateInput?: string | Date | null): string => {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateDDMMYYYY = formatDate;
