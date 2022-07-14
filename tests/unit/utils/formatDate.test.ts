import { formatDate, DateFormat } from '../../../src/utils/formatDate';

describe('formatDate', () => {
  test.each([
    [new Date('2020-05-01'), '2020-05-01'],
    [new Date('2020-12-11'), '2020-12-11'],
  ])('GIVEN date WHEN formatDate with yyyy-mm-dd format THEN returns formated date', (givenDate: Date, expectedDate: string) => {
    const actualDate = formatDate(givenDate, DateFormat['yyyy-mm-dd']);

    expect(actualDate).toEqual(expectedDate);
  });

  test.each([
    [new Date('2020-05-01'), '01-05-2020'],
    [new Date('2020-12-11'), '11-12-2020'],
  ])('GIVEN date WHEN formatDate with dd-mm-yyyy format THEN returns formated date', (givenDate: Date, expectedDate: string) => {
    const actualDate = formatDate(givenDate, DateFormat['dd-mm-yyyy']);

    expect(actualDate).toEqual(expectedDate);
  });

  test.each([
    [new Date('2020-01-01'), '01-Jan-20'],
    [new Date('2009-02-01'), '01-Feb-09'],
    [new Date('2000-03-11'), '11-Mar-00'],
    [new Date('2010-04-01'), '01-Apr-10'],
    [new Date('2020-05-01'), '01-May-20'],
    [new Date('2020-06-01'), '01-Jun-20'],
    [new Date('2020-07-01'), '01-Jul-20'],
    [new Date('2020-08-01'), '01-Aug-20'],
    [new Date('2020-09-01'), '01-Sep-20'],
    [new Date('2020-10-01'), '01-Oct-20'],
    [new Date('2020-11-01'), '01-Nov-20'],
    [new Date('2020-12-01'), '01-Dec-20'],
  ])('GIVEN date WHEN formatDate with dd-mmm-yy format THEN returns formated date', (givenDate: Date, expectedDate: string) => {
    const actualDate = formatDate(givenDate, DateFormat['dd-mmm-yy']);

    expect(actualDate).toEqual(expectedDate);
  });
});
