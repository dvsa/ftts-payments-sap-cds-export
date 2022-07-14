import {
  buildOwedCompensationOriginalBookingProductExpandQuery, filterCompensationBookingProducts,
} from '../../../../src/crm/bookings/bookingsHelper';
import * as FttsPayment from '../../../../src/crm/payments/fttsPaymentInformation';

const DATE = new Date('2020-01-01');

describe('bookingsHelper', () => {
  describe('buildOwedCompensationOriginalBookingProductExpandQuery', () => {
    test('for 0 levels return correct Expand array', () => {
      expect(buildOwedCompensationOriginalBookingProductExpandQuery(0)).toStrictEqual(
        [{
          property: 'ftts_owedCompensationOriginalBookingProduct',
          select: ['ftts_bookingproductid', 'ftts_reference'],
        }],
      );
    });

    test('for 1 level return correct Expand array', () => {
      expect(buildOwedCompensationOriginalBookingProductExpandQuery(1)).toStrictEqual(
        [{
          property: 'ftts_owedCompensationOriginalBookingProduct',
          select: ['ftts_bookingproductid', 'ftts_reference'],
          expand: [{
            property: 'ftts_owedCompensationOriginalBookingProduct',
            select: [
              'ftts_bookingproductid',
              'ftts_reference',
            ],
          }],
        }],
      );
    });

    test('for 2 levels return correct Expand array', () => {
      expect(buildOwedCompensationOriginalBookingProductExpandQuery(2)).toStrictEqual(
        [{
          property: 'ftts_owedCompensationOriginalBookingProduct',
          select: ['ftts_bookingproductid', 'ftts_reference'],
          expand: [{
            property: 'ftts_owedCompensationOriginalBookingProduct',
            select: [
              'ftts_bookingproductid',
              'ftts_reference',
            ],
            expand: [{
              property: 'ftts_owedCompensationOriginalBookingProduct',
              select: [
                'ftts_bookingproductid',
                'ftts_reference',
              ],
            }],
          }],
        }],
      );
    });

    test('for 5 levels return correct Expand array', () => {
      expect(buildOwedCompensationOriginalBookingProductExpandQuery(5)).toStrictEqual(
        [{
          property: 'ftts_owedCompensationOriginalBookingProduct',
          select: ['ftts_bookingproductid', 'ftts_reference'],
          expand: [{
            property: 'ftts_owedCompensationOriginalBookingProduct',
            select: [
              'ftts_bookingproductid',
              'ftts_reference',
            ],
            expand: [{
              property: 'ftts_owedCompensationOriginalBookingProduct',
              select: [
                'ftts_bookingproductid',
                'ftts_reference',
              ],
              expand: [{
                property: 'ftts_owedCompensationOriginalBookingProduct',
                select: [
                  'ftts_bookingproductid',
                  'ftts_reference',
                ],
                expand: [{
                  property: 'ftts_owedCompensationOriginalBookingProduct',
                  select: [
                    'ftts_bookingproductid',
                    'ftts_reference',
                  ],
                  expand: [{
                    property: 'ftts_owedCompensationOriginalBookingProduct',
                    select: [
                      'ftts_bookingproductid',
                      'ftts_reference',
                    ],
                  }],
                }],
              }],
            }],
          }],
        }],
      );
    });
  });

  describe('filterCompensationBookingProducts', () => {
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

    test.each([
      [
        [], [],
        [exampleFttsPaymentInformation], [],
        [{ ...exampleFttsPaymentInformation, 'bookingproduct.ftts_owedcompensationoriginalbookingproduct': undefined }], [],
        [{ ...exampleFttsPaymentInformation, 'bookingproduct.ftts_owedcompensationoriginalbookingproduct': '' }], [],
        [{ ...exampleFttsPaymentInformation, 'bookingproduct.ftts_owedcompensationoriginalbookingproduct': 'id-1' }], ['id-1'],
        [
          { ...exampleFttsPaymentInformation, 'bookingproduct.ftts_owedcompensationoriginalbookingproduct': 'id-1' },
          exampleFttsPaymentInformation,
        ], ['id-1'],
        [
          { ...exampleFttsPaymentInformation, 'bookingproduct.ftts_owedcompensationoriginalbookingproduct': 'id-1' },
          exampleFttsPaymentInformation,
          { ...exampleFttsPaymentInformation, 'bookingproduct.ftts_owedcompensationoriginalbookingproduct': 'id-2' },
        ], ['id-1', 'id-2'],
      ],
    ])('for given input records return correct ids', (paymentRecords: FttsPayment.FttsPaymentInformation[], expectedResult: string[]) => {
      expect(filterCompensationBookingProducts(paymentRecords)).toStrictEqual(expectedResult);
    });
  });
});
