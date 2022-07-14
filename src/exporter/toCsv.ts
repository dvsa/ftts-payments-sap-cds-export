import stringify from 'csv-stringify';
import { PaymentInformation } from '../crm/payments/paymentInformation';
import { DateFormat, formatDate } from '../utils/formatDate';

export const toCsv = async (paymentInformationList: PaymentInformation[], exportDate: Date, fileName: string): Promise<string> => {
  // remove duplicates
  const contents = Array.from(new Map(
    paymentInformationList.map((paymentInformation) => [JSON.stringify(paymentInformation), paymentInformation]),
  ).values());
  const csvContents = await createCsvContents(contents);
  const csvFooter = createCsvFooter(contents, exportDate, fileName);
  return `${csvContents + csvFooter}\n`;
};

const createCsvContents = async (paymentInformationList: PaymentInformation[]): Promise<string> => new Promise(
  (resolve, reject) => {
    stringify(
      paymentInformationList,
      {
        delimiter: '~',
        header: false,
        quoted: false,
        quoted_empty: false,
        columns: [
          { key: 'Scheme' },
          { key: 'Country' },
          { key: 'Activity' },
          { key: 'Invoice Number' },
          { key: 'Invoice Date' },
          { key: 'Invoice Posting Date' },
          { key: 'Customer Number' },
          { key: 'Payment Reference' },
          { key: 'line identifier' },
          { key: 'Product' },
          { key: 'Test Reference' },
          { key: 'Test cost without VAT' },
          { key: 'OAB Transfer value (gross)' },
          { key: 'Test Date' },
          { key: 'Sales Person' },
          { key: 'Inv - Customer Name' },
          { key: 'Inv - Address Line 1' },
          { key: 'Inv - Address Line 2' },
          { key: 'Inv - Address Line 3' },
          { key: 'Inv - Address Line 4' },
          { key: 'Inv - City' },
          { key: 'Inv - Postal Code' },
          { key: 'Long Text' },
        ],
      }, (err?: Error | null, records?: string) => {
        if (err) reject(err);
        resolve(records);
      },
    );
  },
);

const createCsvFooter = (paymentInformations: PaymentInformation[], exportDate: Date, fileName: string): string => {
  const sumAmount = paymentInformations.reduce((sum, current) => sum + parseFloat(current['Test cost without VAT'] || '0'), 0);
  const formattedSumAmount = Number.isInteger(sumAmount) ? sumAmount.toFixed(0) : sumAmount.toFixed(2);
  const formattedDate = formatDate(exportDate, DateFormat['dd-mm-yyyy']);
  const sequenceNumber = fileName.substr(5, 14);
  return `FOOTER~${sequenceNumber}~${formattedDate}~${paymentInformations.length}~${formattedSumAmount}`;
};
