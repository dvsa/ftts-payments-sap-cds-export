import { toCsv } from '../../../src/exporter/toCsv';
import { PaymentInformation } from '../../../src/crm/payments/paymentInformation';
import * as CRM from '../../../src/crm/payments/fttsPaymentInformation';

const exportDate = new Date('2020-11-19');
const footerForEmptyData = 'FOOTER~20201119000000~19-11-2020~0~0\n';
const fileName = 'FTTS_20201119000000.dat';
const expectedLine = 'FTTS~GB~TESTMATCH~FTT-F9587E4A82C55-201012101109~22-Oct-20~22-Oct-20~site-id~FTTS0120200629092614330C3B39~10~LGV CPC~11-20200629-092614-330C3B67~23.11~23.11~22-Oct-20~Theory Test IHTTC~Account Name~line 1 from account~line 2 from account~line 3 from account~~London~NE70 5TV~site-id\n';

describe('toCsv', () => {
  test('GIVEN an empty array WHEN called THEN a header line is returned', async () => {
    const csv = await toCsv([], exportDate, fileName);
    expect(csv).toEqual(footerForEmptyData);
  });

  test('GIVEN a PaymentInformatinon with required fields only WHEN called THEN a record line is returned', async () => {
    const fttsPaymentInformation: CRM.FttsPaymentInformation = {
      ftts_financetransactionid: '1',
      ftts_posteddate: now,
      ftts_type: CRM.FinanceTransactionType.BOOKING,
      ftts_status: CRM.FinanceTransactionStatus.RECOGNISED,
      createdon: now,
      'payment.ftts_reference': 'FTTS-01-20200629-092614-330C3B39',
    };
    const csv = await toCsv(
      [
        PaymentInformation.fromFttsPaymentInformation(fttsPaymentInformation, true),
      ],
      exportDate,
      fileName,
    );
    expect(csv).toEqual(
      '~~TESTMATCH~~22-Oct-20~22-Oct-20~~FTTS0120200629092614330C3B39~10~~~~~~~~~~~~~~\n'
      + 'FOOTER~20201119000000~19-11-2020~1~0\n',
    );
  });

  test('GIVEN paymentInformation WHEN called THEN a csv record is returned', async () => {
    const csv = await toCsv(
      [
        PaymentInformation.fromFttsPaymentInformation(fttsPaymentInformation, true),
      ],
      exportDate,
      fileName,
    );
    expect(csv).toBe(
      `${expectedLine}FOOTER~20201119000000~19-11-2020~1~23.11\n`,
    );
  });

  test('GIVEN paymentInformation with duplicates WHEN called THEN duplicates are removed', async () => {
    const csv = await toCsv(
      [
        PaymentInformation.fromFttsPaymentInformation(fttsPaymentInformation, true),
        PaymentInformation.fromFttsPaymentInformation(fttsPaymentInformation, true),
        PaymentInformation.fromFttsPaymentInformation(fttsPaymentInformation, true),
      ],
      exportDate,
      fileName,
    );
    expect(csv).toBe(
      `${expectedLine}FOOTER~20201119000000~19-11-2020~1~23.11\n`,
    );
  });

  test('GIVEN paymentInformation with distinct records as well as duplicates WHEN called THEN a csv with correct footer is returned', async () => {
    const csv = await toCsv(
      [
        PaymentInformation.fromFttsPaymentInformation(fttsPaymentInformation, true),
        {
          ...PaymentInformation.fromFttsPaymentInformation(fttsPaymentInformation, true),
          'Invoice Number': 'FTT-F9587E4A82C55-201012101110',
        } as PaymentInformation,
        PaymentInformation.fromFttsPaymentInformation(fttsPaymentInformation, true),
        PaymentInformation.fromFttsPaymentInformation(fttsPaymentInformation, true),
        {
          ...PaymentInformation.fromFttsPaymentInformation(fttsPaymentInformation, true),
          'Invoice Number': 'FTT-F9587E4A82C55-201012101111',
        } as PaymentInformation,
      ],
      exportDate,
      fileName,
    );
    expect(csv).toBe(
      `${expectedLine}${expectedLine.replace('FTT-F9587E4A82C55-201012101109', 'FTT-F9587E4A82C55-201012101110')}${expectedLine.replace('FTT-F9587E4A82C55-201012101109', 'FTT-F9587E4A82C55-201012101111')}FOOTER~20201119000000~19-11-2020~3~69.33\n`,
    );
  });
});

const now: Date = new Date('2020-10-22');

const fttsPaymentInformation: CRM.FttsPaymentInformation = {
  ftts_financetransactionid: '1',
  ftts_posteddate: now,
  ftts_recogniseddate: now,
  ftts_type: CRM.FinanceTransactionType.PFA_BOOKING,
  ftts_status: CRM.FinanceTransactionStatus.RECOGNISED,
  ftts_invoiceid: 'FTT-F9587E4A82C55-201012101109',
  createdon: now,
  'payment.ftts_reference': 'FTTS-01-20200629-092614-330C3B39',
  'payment.ftts_scheme': CRM.PaymentScheme.FTTS,
  'payment.ftts_origin': CRM.PaymentOrigin.IHTTC_PORTAL,
  'payment.person.ftts_personreference': '01-20200629-092614-330C3B39',
  'payment.person.address1_line1': 'line 1 from person',
  'payment.person.address1_line2': 'line 2 from person',
  'payment.person.address1_line3': 'line 3 from person',
  'payment.person.address1_city': 'Birmingham',
  'payment.person.address1_postalcode': 'NE70 6YQ',
  'bookingproduct.ftts_price': 23.11,
  'bookingproduct.ftts_reference': '11-20200629-092614-330C3B67',
  'bookingproduct.ftts_testdate': now,
  'bookingproduct.product.name': 'LGV - CPC',
  'account.name': 'Account Name',
  'account.ftts_siteid': 'site-id',
  'account.address1_line1': 'line 1 from account',
  'account.address1_line2': 'line 2 from account',
  'account.address1_line3': 'line 3 from account',
  'account.address1_city': 'London',
  'account.address1_postalcode': 'NE70 5TV',
};
