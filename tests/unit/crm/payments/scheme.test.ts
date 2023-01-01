import { Scheme } from '../../../../src/crm/payments/scheme';
import {
  FttsPaymentInformation, PaymentOrigin, FinanceTransactionType, PaymentScheme, AccountRemit,
} from '../../../../src/crm/payments/fttsPaymentInformation';

describe('Scheme', () => {
  describe('fromFttsPaymentInformation', () => {
    test.each([
      [
        {
          'payment.ftts_origin': PaymentOrigin.IHTTC_PORTAL,
        },
        Scheme.FTTS,
      ],
      [
        {
          ftts_type: FinanceTransactionType.PFA_BOOKING,
        },
        Scheme.FTTS,
      ],
      [
        {
          ftts_type: FinanceTransactionType.PFA_BOOKING_REFUND,
        },
        Scheme.FTTS,
      ],
      [
        {
          'payment.ftts_scheme': PaymentScheme.FTTS,
        },
        Scheme.FTTS,
      ],
      [
        {
          'payment.ftts_scheme': PaymentScheme.FTNI,
        },
        Scheme.FTNI,
      ],
      [
        {
          'bookingproduct.account.ftts_remit': AccountRemit.DVA,
        },
        Scheme.FTNI,
      ],
      [
        {
          'bookingproduct.account.ftts_remit': AccountRemit.DVSA_ENGLAND,
        },
        Scheme.FTTS,
      ],
      [
        {
        },
        undefined,
      ],
    ])('GIVEN fttsPaymentInformation WHEN called THEN a proper scheme is returned', (
      fttsPaymentInformation: Partial<FttsPaymentInformation>,
      scheme: any,
    ) => {
      expect(Scheme.fromFttsPaymentInformation(fttsPaymentInformation as FttsPaymentInformation)).toEqual(scheme);
    });
  });
});
