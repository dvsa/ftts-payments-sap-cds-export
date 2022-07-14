import dateformat from 'dateformat';

export enum DateFormat {
  'yyyy-mm-dd',
  'dd-mm-yyyy',
  'dd-mmm-yy',
}

export function formatDate(date: Date, format: DateFormat): string {
  if (format === DateFormat['yyyy-mm-dd']) {
    return dateformat(date, 'yyyy-mm-dd');
  }
  if (format === DateFormat['dd-mm-yyyy']) {
    return dateformat(date, 'dd-mm-yyyy');
  }
  return dateformat(date, 'dd-mmm-yy');
}
