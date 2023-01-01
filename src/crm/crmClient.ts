/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-template-curly-in-string */
import { proxifyWithRetryPolicy } from '@dvsa/cds-retry';
import { MultipleResponse } from 'dynamics-web-api';
import fs from 'fs';
import { BusinessTelemetryEvent, logger } from '../observability/logger';
import { DateFormat, formatDate } from '../utils/formatDate';
import { OriginalBookingProductsClient } from './bookings/originalBookingProductsClient';
import { CrmError } from './crmError';
import { newDynamicsWebApi } from './dynamics/dynamicsWebApi';
import {
  FinanceTransactionStatus,
  FinanceTransactionType, FttsPaymentInformation,
} from './payments/fttsPaymentInformation';
import { Activity, Country, PaymentInformation } from './payments/paymentInformation';

export class CrmClient {
  private FETCH_XML = {
    bookingAndPfaBookingPayments: 'bookingAndPfaBookingPaymentInformations.xml',
    pfaBookingRefundPayments: 'pfaBookingRefundPaymentInformations.xml',
    recognisedPayments: 'recognisedPaymentInformations.xml',
  };

  constructor(
    private dynamicsWebApi: DynamicsWebApi,
    private originalBookingProductsClient: OriginalBookingProductsClient,
  ) { }

  /**
   * Method makes 3 calls to CRM.
   * The order of the calls is extremely important to provide first information about regular transactions and then recognised transactions!!!
   */
  public async getPaymentInformations(date: Date): Promise<PaymentInformation[]> {
    try {
      const paymentInformationsDate = formatDate(date, DateFormat['yyyy-mm-dd']);
      logger.info('CrmClient::getPaymentInformations: Trying to get payment informations', { date: paymentInformationsDate });
      const bookingAndPfaBookingPayments = await this.fetchPaymentInformations(
        this.FETCH_XML.bookingAndPfaBookingPayments,
        paymentInformationsDate,
        false,
      );
      const recognisedPayments = await this.fetchPaymentInformations(
        this.FETCH_XML.recognisedPayments,
        paymentInformationsDate,
        true,
      );
      const pfaBookingRefundPayments = await this.fetchPaymentInformations(
        this.FETCH_XML.pfaBookingRefundPayments,
        paymentInformationsDate,
        false,
      );
      const allPaymentInformations = bookingAndPfaBookingPayments
        .concat(recognisedPayments, pfaBookingRefundPayments);
      logger.info(
        `CrmClient::getPaymentInformations: Successfully fetched ${allPaymentInformations.length} payment informations`,
        { date: paymentInformationsDate },
      );
      return allPaymentInformations;
    } catch (error) {
      logger.error(error as Error, 'CrmClient::getPaymentInformations: Failed to get payment informations');
      throw new CrmError('Failed to get payment informations', error);
    }
  }

  private async fetchPaymentInformations(
    fetchXmlFileName: string,
    date: string,
    isRecognisedTransaction: boolean,
  ): Promise<PaymentInformation[]> {
    const fetchXml = await this.preparePaymentInformationsQuery(fetchXmlFileName, date);
    logger.info(`CrmClient::fetchPaymentInformations: Trying to fetch data for ${fetchXmlFileName} fetchXml file`);
    const fetchXmlResponse: MultipleResponse<FttsPaymentInformation> = await this.dynamicsWebApi.fetchAll(
      PaymentInformation.ENTITY_COLLECTION_NAME,
      fetchXml,
    );
    if (!fetchXmlResponse.value?.length) {
      logger.info(`CrmClient::fetchPaymentInformations: Empty response for ${fetchXmlFileName} fetchXml file`);
      return [];
    }
    let records = fetchXmlResponse.value;
    logger.info(`CrmClient::fetchPaymentInformations: Successfully fetched data for ${fetchXmlFileName} fetchXml file`);
    if (isRecognisedTransaction) {
      records = await this.originalBookingProductsClient.addOriginalBookingRefsForCompensationBookings(records);
    }
    return this.mapToPaymentInformations(records, isRecognisedTransaction);
  }

  private async preparePaymentInformationsQuery(fetchXmlFileName: string, date: string): Promise<string> {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const fetchXml = await fs.promises.readFile(`./src/crm/payments/${fetchXmlFileName}`, 'utf-8');
    return fetchXml
      .replace('${STATUS_RECOGNISED}', String(FinanceTransactionStatus.RECOGNISED))
      .replace('${STATUS_DUPLICATE}', String(FinanceTransactionStatus.DUPLICATE))
      .replace('${TYPE_BOOKING}', String(FinanceTransactionType.BOOKING))
      .replace('${TYPE_PFA_BOOKING}', String(FinanceTransactionType.PFA_BOOKING))
      .replace('${TYPE_PFA_BOOKING_REFUND}', String(FinanceTransactionType.PFA_BOOKING_REFUND))
      .replace('${DATE}', date);
  }

  private mapToPaymentInformations(
    records: FttsPaymentInformation[],
    isRecognisedTransaction: boolean,
  ): PaymentInformation[] {
    let paymentInformations: PaymentInformation[] = [];
    paymentInformations = this.filterDuplicateTestHistoryRecords(records)
      .map((fttsPaymentInformation: FttsPaymentInformation) => PaymentInformation
        .fromFttsPaymentInformation(fttsPaymentInformation, isRecognisedTransaction))
      .filter((paymentInformation: PaymentInformation) => {
        if (isRecognisedTransaction && !paymentInformation['Test Date']) {
          logger.event(BusinessTelemetryEvent.SAP_CDS_MISSING_TEST_DATE, 'CrmClient::mapToPaymentInformations: Found record with missing test date', {
            testReference: paymentInformation['Test Reference'],
          });
          return false; // Skip record
        }
        return !(paymentInformation.Country === Country.NI
          && paymentInformation.Activity === Activity.TESTMATCH) && paymentInformation.Product;
      });
    return paymentInformations;
  }

  // As we are joining with test history and there could be more than one test history record per booking product we need to remove 'duplicates'
  // If more than one test history record we take the one with the earliest test date
  private filterDuplicateTestHistoryRecords(records: FttsPaymentInformation[]): FttsPaymentInformation[] {
    if (!records.some((record) => record['bookingproduct.testhistory.ftts_testdate'])) {
      return records; // No test history records to filter
    }
    // Value being undefined doesn't affect the comparison here
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const recordsSortedByTestHistoryTestDate = records.sort((a, b) => (a['bookingproduct.testhistory.ftts_testdate']! > b['bookingproduct.testhistory.ftts_testdate']! ? 1 : -1));
    const seenTestHistoryRecords = new Set();
    const filteredRecords = recordsSortedByTestHistoryTestDate.filter((record) => {
      const bookingProductId = record['bookingproduct.ftts_bookingproductid'];
      const hasTestHistoryRecord = record['bookingproduct.testhistory.ftts_testdate'];
      const duplicate = hasTestHistoryRecord && seenTestHistoryRecords.has(bookingProductId);
      if (hasTestHistoryRecord) {
        seenTestHistoryRecords.add(bookingProductId);
      }
      return !duplicate;
    });
    return filteredRecords;
  }
}

export const newCrmClient = (retryPolicy?: object): CrmClient => {
  const dynamicsWebApi = newDynamicsWebApi();
  proxifyWithRetryPolicy(dynamicsWebApi, (message, properties) => logger.warn(message, properties), retryPolicy);
  return new CrmClient(
    dynamicsWebApi,
    new OriginalBookingProductsClient(dynamicsWebApi),
  );
};
