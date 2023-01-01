import * as FttsPayment from '../../../../src/crm/payments/fttsPaymentInformation';

describe('FttsPaymentInformation', () => {
  describe('isIhttc', () => {
    test('pfa booking without an origin is equal to true', () => {
      const actualResult = FttsPayment.isIhttc(FttsPayment.FinanceTransactionType.PFA_BOOKING, undefined);

      expect(actualResult).toBe(true);
    });

    test('pfa booking refund without an origin is equal to true', () => {
      const actualResult = FttsPayment.isIhttc(FttsPayment.FinanceTransactionType.PFA_BOOKING_REFUND, undefined);

      expect(actualResult).toBe(true);
    });

    test('booking without an origin is equal to false', () => {
      const actualResult = FttsPayment.isIhttc(FttsPayment.FinanceTransactionType.BOOKING, undefined);

      expect(actualResult).toBe(false);
    });

    test('booking with an origin of ihttc portal is equal to true', () => {
      const actualResult = FttsPayment.isIhttc(FttsPayment.FinanceTransactionType.BOOKING, FttsPayment.PaymentOrigin.IHTTC_PORTAL);

      expect(actualResult).toBe(true);
    });

    test('booking with an origin of trainer booker portal is equal to false', () => {
      const actualResult = FttsPayment.isIhttc(FttsPayment.FinanceTransactionType.BOOKING, FttsPayment.PaymentOrigin.TRAINER_BOOKER_PORTAL);

      expect(actualResult).toBe(false);
    });
  });

  describe('isTrainerBooker', () => {
    test('trainer booker origin is equal to true', () => {
      const actualResult = FttsPayment.isTrainerBooker(FttsPayment.PaymentOrigin.TRAINER_BOOKER_PORTAL);

      expect(actualResult).toBe(true);
    });

    test('ihttc origin is equal to true', () => {
      const actualResult = FttsPayment.isTrainerBooker(FttsPayment.PaymentOrigin.IHTTC_PORTAL);

      expect(actualResult).toBe(false);
    });

    test('undefined origin is equal to false', () => {
      const actualResult = FttsPayment.isTrainerBooker(undefined);

      expect(actualResult).toBe(false);
    });
  });
});
