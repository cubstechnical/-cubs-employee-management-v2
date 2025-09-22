import { format, formatDistanceToNow, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';

export const formatDate = (date: string | Date, formatStr = 'MMM dd, yyyy'): string => {
  return format(new Date(date), formatStr);
};

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const timeAgo = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isExpired = (date: string | Date): boolean => {
  return isBefore(new Date(date), new Date());
};

export const isExpiringSoon = (date: string | Date, days = 30): boolean => {
  const expiryDate = new Date(date);
  const warningDate = addDays(new Date(), days);
  return isAfter(expiryDate, new Date()) && isBefore(expiryDate, warningDate);
};

export const daysUntilExpiry = (date: string | Date): number => {
  return differenceInDays(new Date(date), new Date());
};

export const getVisaStatus = (expiryDate: string | Date): 'valid' | 'expiring_soon' | 'expired' => {
  if (isExpired(expiryDate)) {
    return 'expired';
  }
  if (isExpiringSoon(expiryDate)) {
    return 'expiring_soon';
  }
  return 'valid';
}; 