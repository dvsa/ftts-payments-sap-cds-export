import { OriginalBookingProductsClient } from '../../../../src/crm/bookings/originalBookingProductsClient';
import { mockedDynamicsWebApi } from '../../../mocks/dynamicsWebApi.mock';
import * as FttsPayment from '../../../../src/crm/payments/fttsPaymentInformation';
import { mockedConfig } from '../../../mocks/config.mock';
import { mockedLogger } from '../../../mocks/logger.mock';
import { BusinessTelemetryEvent } from '../../../../src/observability/logger';

jest.mock('../../../../src/config');
jest.mock('../../../../src/observability/logger');

const DATE = new Date('2020-01-01');

describe('OriginalBookingProductsClient', () => {
  const originalBookingProductsClient = new OriginalBookingProductsClient(mockedDynamicsWebApi);

  describe('addOriginalBookingRefsForCompensationBookings', () => {
    beforeEach(() => {
      mockedConfig.originalBookings.maxExpandNesting = 5;
      mockedConfig.originalBookings.maxIterationsNumber = 5;
    });

    test('GIVEN payment records without original bookings WHEN addOriginalBookingRefsForCompensationBookings THEN returns the same list', async () => {
      const records: FttsPayment.FttsPaymentInformation[] = [
        { ...exampleFttsPaymentInformation, 'payment.ftts_reference': 'ref-1' },
        { ...exampleFttsPaymentInformation, 'payment.ftts_reference': 'ref-2' },
      ];

      expect(await originalBookingProductsClient.addOriginalBookingRefsForCompensationBookings(records)).toStrictEqual(records);
    });

    test('GIVEN payment records with original bookings WHEN addOriginalBookingRefsForCompensationBookings THEN returns list with correct data', async () => {
      const records = [
        { ...exampleFttsPaymentInformation, 'bookingproduct.ftts_owedcompensationoriginalbookingproduct': '002-ORIG' },
      ];
      mockedDynamicsWebApi.executeBatch.mockResolvedValueOnce(
        [
          {
            ftts_bookingproductid: '002-ORIG',
            ftts_owedCompensationOriginalBookingProduct: {
              ftts_reference: 'B-002-SECOND-ORIG-REF',
              ftts_owedCompensationOriginalBookingProduct: {
                ftts_reference: 'B-002-FIRST-ORIG-REF',
                ftts_owedCompensationOriginalBookingProduct: {
                  ftts_reference: 'DEEPEST-REF',
                  ftts_owedCompensationOriginalBookingProduct: null,
                },
              },
            },
          },
        ],
      );
      const expectedResult = [
        { ...records[0], 'owedCompensationOriginalBookingProduct.ftts_reference': 'DEEPEST-REF' },
      ];

      const result = await originalBookingProductsClient.addOriginalBookingRefsForCompensationBookings(records);

      expect(result).toStrictEqual(expectedResult);
    });

    test('GIVEN not enough iterations WHEN addOriginalBookingRefsForCompensationBookings THEN event is logged', async () => {
      mockedConfig.originalBookings.maxExpandNesting = 0;
      mockedConfig.originalBookings.maxIterationsNumber = 1;

      const records = [
        { ...exampleFttsPaymentInformation, 'bookingproduct.ftts_owedcompensationoriginalbookingproduct': '002-ORIG' },
      ];
      mockedDynamicsWebApi.executeBatch.mockResolvedValueOnce(
        [
          {
            ftts_bookingproductid: '002-ORIG',
            ftts_owedCompensationOriginalBookingProduct: {
              ftts_bookingproductid: '002-SECOND-ORIG',
              ftts_reference: 'B-002-SECOND-ORIG-REF',
              ftts_owedCompensationOriginalBookingProduct: {
                ftts_bookingproductid: '002-FIRST-ORIG',
                ftts_reference: 'B-002-FIRST-ORIG-REF',
              },
            },
          },
        ],
      );

      const expectedResult = [
        { ...records[0], 'owedCompensationOriginalBookingProduct.ftts_reference': undefined },
      ];

      const result = await originalBookingProductsClient.addOriginalBookingRefsForCompensationBookings(records);

      expect(result).toStrictEqual(expectedResult);
      expect(mockedLogger.event).toHaveBeenCalledWith(
        BusinessTelemetryEvent.SAP_CDS_ORIG_BOOKING_MAX_ITERATION_EXCEED,
        'OriginalBookingProductsClient::addOriginalBookingRefsForCompensationBookings: Cannot retrieve original booking products',
        expect.objectContaining({}),
      );
    });
  });
});

const exampleFttsPaymentInformation: FttsPayment.FttsPaymentInformation = {
  ftts_financetransactionid: '10',
  ftts_posteddate: DATE,
  ftts_recogniseddate: DATE,
  ftts_type: FttsPayment.FinanceTransactionType.PFA_BOOKING,
  ftts_status: FttsPayment.FinanceTransactionStatus.RECOGNISED,
  ftts_invoiceid: 'FTT-F9587E4A82C55-201012101109',
  createdon: DATE,
  'payment.ftts_reference': 'FTTS-01-20200629-092614-330C3B39',
  'payment.ftts_scheme': FttsPayment.PaymentScheme.FTTS,
  'payment.ftts_origin': FttsPayment.PaymentOrigin.IHTTC_PORTAL,
  'payment.person.ftts_personreference': '01-20200629-092614-330C3B39',
  'payment.person.address1_line1': '1 City Rd',
  'payment.person.address1_city': 'Birmingham',
  'payment.person.address1_postalcode': 'NE70 6YQ',
  'bookingproduct.ftts_reference': '11-20200629-092614-330C3B67',
  'bookingproduct.ftts_testdate': DATE,
  'bookingproduct.ftts_price': 23,
  'bookingproduct.product.name': 'LGV - CPC',
  'account.name': 'Account Name',
  'account.ftts_siteid': 'site-id',
  'account.address1_line1': '1 City Rd',
  'account.address1_city': 'London',
  'account.address1_postalcode': 'NE70 6YQ',
};
