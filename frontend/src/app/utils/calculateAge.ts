import { differenceInYears } from 'date-fns';

export function calculateAge(responseDate?: Date | string) {
  if (responseDate) {
    const date = new Date(responseDate);
    return differenceInYears(new Date(), date);
  }
  return '';
}
