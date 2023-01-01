import * as Payment from '../../../../src/crm/payments/paymentInformation';
import { Scheme } from '../../../../src/crm/payments/scheme';
import * as FttsPayment from '../../../../src/crm/payments/fttsPaymentInformation';
import { Product } from '../../../../src/crm/payments/product';

describe('PaymentInformation', () => {
  describe('Scheme and Country', () => {
    test('GIVEN payment scheme FTTS and undefined remit WHEN called fromFttsPaymentInformation THEN create proper Scheme and Country values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_scheme': FttsPayment.PaymentScheme.FTTS,
          'bookingproduct.account.ftts_remit': undefined,
        },
        true,
      );

      expect(paymentInformation.Scheme).toEqual(Scheme.FTTS);
      expect(paymentInformation.Country).toEqual(Payment.Country.GB);
    });

    test('GIVEN payment scheme FTNI and undefined remit WHEN called fromFttsPaymentInformation THEN create proper Scheme and Country values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_scheme': FttsPayment.PaymentScheme.FTNI,
          'bookingproduct.account.ftts_remit': undefined,
        },
        true,
      );

      expect(paymentInformation.Scheme).toEqual(Scheme.FTNI);
      expect(paymentInformation.Country).toEqual(Payment.Country.NI);
    });

    test('GIVEN undefined payment scheme and England remit WHEN called fromFttsPaymentInformation THEN create proper Scheme and Country values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_scheme': undefined,
          'bookingproduct.account.ftts_remit': FttsPayment.AccountRemit.DVSA_ENGLAND,
        },
        true,
      );

      expect(paymentInformation.Scheme).toEqual(Scheme.FTTS);
      expect(paymentInformation.Country).toEqual(Payment.Country.GB);
    });

    test('GIVEN undefined payment scheme and Scotland remit WHEN called fromFttsPaymentInformation THEN create proper Scheme and Country values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_scheme': undefined,
          'bookingproduct.account.ftts_remit': FttsPayment.AccountRemit.DVSA_SCOTLAND,
        },
        true,
      );

      expect(paymentInformation.Scheme).toEqual(Scheme.FTTS);
      expect(paymentInformation.Country).toEqual(Payment.Country.GB);
    });

    test('GIVEN undefined payment scheme and Wales remit WHEN called fromFttsPaymentInformation THEN create proper Scheme and Country values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_scheme': undefined,
          'bookingproduct.account.ftts_remit': FttsPayment.AccountRemit.DVSA_WALES,
        },
        true,
      );

      expect(paymentInformation.Scheme).toEqual(Scheme.FTTS);
      expect(paymentInformation.Country).toEqual(Payment.Country.GB);
    });

    test('GIVEN undefined payment scheme and DVA remit WHEN called fromFttsPaymentInformation THEN create proper Scheme and Country values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_scheme': undefined,
          'bookingproduct.account.ftts_remit': FttsPayment.AccountRemit.DVA,
        },
        true,
      );

      expect(paymentInformation.Scheme).toEqual(Scheme.FTNI);
      expect(paymentInformation.Country).toEqual(Payment.Country.NI);
    });

    test('GIVEN undefined payment scheme and undefined remit WHEN called fromFttsPaymentInformation THEN return undefined', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_scheme': undefined,
          'bookingproduct.account.ftts_remit': undefined,
        },
        true,
      );

      expect(paymentInformation.Scheme).toBeUndefined();
      expect(paymentInformation.Country).toBeUndefined();
    });
  });

  describe('Activity', () => {
    test('GIVEN fttsPaymentInformation with status recognised WHEN isRecognisedTransaction is "true" THEN creating Activity TESTMATCH', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(defaultFttsPaymentInformation, true);

      expect(paymentInformation.Activity).toEqual(Payment.Activity.TESTMATCH);
    });

    test('GIVEN fttsPaymentInformation with status recognised and ftts_owedcompensationbookingdate set WHEN isRecognisedTransaction is "true" THEN creating Activity REVTESTM', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation({
        ...defaultFttsPaymentInformation,
        ftts_owedcompensationbookingdate: new Date(),
      }, true);

      expect(paymentInformation.Activity).toEqual(Payment.Activity.REVTESTM);
    });

    test('GIVEN fttsPaymentInformation with type booking and status recognised WHEN isRecognisedTransaction is "false" THEN creating Activity INVOICE', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
        },
        false,
      );

      expect(paymentInformation.Activity).toEqual(Payment.Activity.INVOICE);
    });

    test('GIVEN fttsPaymentInformation with type pfa_booking and status recognised WHEN isRecognisedTransaction is "false" THEN creating Activity INVOICEPFA', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          ftts_type: FttsPayment.FinanceTransactionType.PFA_BOOKING,
        },
        false,
      );

      expect(paymentInformation.Activity).toEqual(Payment.Activity.INVOICEPFA);
    });

    test('GIVEN fttsPaymentInformation with type pfa_booking_refund and status recognised WHEN isRecognisedTransaction is "false" THEN creating Activity REFUNDOAB', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          ftts_type: FttsPayment.FinanceTransactionType.PFA_BOOKING_REFUND,
        },
        false,
      );

      expect(paymentInformation.Activity).toEqual(Payment.Activity.REFUNDOAB);
    });
  });

  describe('Product', () => {
    test('GIVEN fttsPaymentInformation with bookingproduct.product.name WHEN bookingproduct.acount.ftts_remit is dva THEN creating proper Product value', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'bookingproduct.product.name': 'LGV - CPC',
          'bookingproduct.account.ftts_remit': FttsPayment.AccountRemit.DVA,
        },
        true,
      );

      expect(paymentInformation.Product).toEqual(Product.THEORY_TEST_NI);
    });

    test('GIVEN fttsPaymentInformation without bookingproduct.product.name WHEN no bookingproduct.acount.ftts_remit THEN creating proper Product value', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
        },
        true,
      );

      expect(paymentInformation.Product).toBeUndefined();
    });
  });

  describe('Test cost without VAT', () => {
    test('GIVEN fttsPaymentInformation WHEN bookingproduct.product.name is ERS THEN Test cost without VAT is overriden to 52.80', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'bookingproduct.product.name': 'ERS',
          'bookingproduct.ftts_price': 60.00,
        },
        true,
      );

      expect(paymentInformation['Test cost without VAT']).toBe('52.80');
    });
  });

  describe('Test Date', () => {
    test('GIVEN fttsPaymentInformation with bookingproduct.ftts_testdate WHEN activity is testmatch THEN creating proper Test Date value', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'bookingproduct.ftts_testdate': date1,
        },
        true,
      );

      expect(paymentInformation['Test Date']).toBe('10-Oct-00');
    });

    test('GIVEN fttsPaymentInformation with missing bookingproduct.ftts_testdate WHEN activity is testmatch THEN creating proper Test Date value using testhistory.ftts_testdate as a fallback', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'bookingproduct.ftts_testdate': undefined,
          'bookingproduct.testhistory.ftts_testdate': date2,
        },
        true,
      );

      expect(paymentInformation['Test Date']).toBe('01-Jan-20');
    });

    test('GIVEN fttsPaymentInformation with bookingproduct.ftts_testdate WHEN activity is not testmatch THEN creating proper Test Date value', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          ftts_status: FttsPayment.FinanceTransactionStatus.DEFERRED,
          ftts_type: FttsPayment.FinanceTransactionType.PFA_BOOKING_REFUND,
          'bookingproduct.ftts_testdate': date1,
        },
        false,
      );

      expect(paymentInformation['Test Date']).toBeUndefined();
    });
  });

  describe('Invoice Number, Invoice Date and Invoice Posting Date', () => {
    test('GIVEN fttsPaymentInformation WHEN type pfa_booking_refund THEN creating proper values from bookingproduct.financetransaction', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          ftts_type: FttsPayment.FinanceTransactionType.PFA_BOOKING_REFUND,
          'bookingproduct.financetransaction.ftts_invoiceid': invoiceId2,
          'bookingproduct.financetransaction.createdon': date2,
        },
        false,
      );

      expect(paymentInformation['Invoice Number']).toEqual(invoiceId2);
      expect(paymentInformation['Invoice Date']).toBe('01-Jan-20');
      expect(paymentInformation['Invoice Posting Date']).toBe('01-Jan-20');
    });

    test('GIVEN fttsPaymentInformation WHEN type not pfa_booking_refund THEN creating proper values from main entity', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          ftts_invoiceid: invoiceId1,
        },
        false,
      );

      expect(paymentInformation['Invoice Number']).toEqual(invoiceId1);
      expect(paymentInformation['Invoice Date']).toBe('10-Oct-00');
      expect(paymentInformation['Invoice Posting Date']).toBe('10-Oct-00');
    });
  });

  describe('Customer Number, Long Text, Inv - Customer Name, Inv - Address Line 1 - 4, Inv - City, Inv - Postal Code', () => {
    test('GIVEN fttsPaymentInformation with account values WHEN payment.ftts_origin ihttc THEN creating proper values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(fttsPaymentInformation, true);

      expect(paymentInformation['Customer Number']).toBe('site-id');
      expect(paymentInformation['Inv - Customer Name']).toBe('Account Name');
      expect(paymentInformation['Inv - Address Line 1']).toBe('line 1 from account');
      expect(paymentInformation['Inv - Address Line 2']).toBe('line 2 from account');
      expect(paymentInformation['Inv - Address Line 3']).toBe('line 3 from account');
      expect(paymentInformation['Inv - Address Line 4']).toBeUndefined();
      expect(paymentInformation['Inv - City']).toBe('London');
      expect(paymentInformation['Inv - Postal Code']).toBe('NE70 5TV');
      expect(paymentInformation['Long Text']).toBe('site-id');
    });

    test('GIVEN fttsPaymentInformation with account values WHEN type pfa_booking and no payment.ftts_origin THEN creating proper values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...fttsPaymentInformation,
          ftts_type: FttsPayment.FinanceTransactionType.PFA_BOOKING,
          'payment.ftts_origin': undefined,
        },
        true,
      );

      expect(paymentInformation['Customer Number']).toBe('site-id');
      expect(paymentInformation['Inv - Customer Name']).toBe('Account Name');
      expect(paymentInformation['Inv - Address Line 1']).toBe('line 1 from account');
      expect(paymentInformation['Inv - Address Line 2']).toBe('line 2 from account');
      expect(paymentInformation['Inv - Address Line 3']).toBe('line 3 from account');
      expect(paymentInformation['Inv - Address Line 4']).toBeUndefined();
      expect(paymentInformation['Inv - City']).toBe('London');
      expect(paymentInformation['Inv - Postal Code']).toBe('NE70 5TV');
      expect(paymentInformation['Long Text']).toBe('site-id');
    });

    test('GIVEN fttsPaymentInformation with account values WHEN type pfa_booking_refund and no payment.ftts_origin THEN creating proper values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...fttsPaymentInformation,
          ftts_type: FttsPayment.FinanceTransactionType.PFA_BOOKING_REFUND,
          'payment.ftts_origin': undefined,
        },
        true,
      );

      expect(paymentInformation['Customer Number']).toBe('site-id');
      expect(paymentInformation['Inv - Customer Name']).toBe('Account Name');
      expect(paymentInformation['Inv - Address Line 1']).toBe('line 1 from account');
      expect(paymentInformation['Inv - Address Line 2']).toBe('line 2 from account');
      expect(paymentInformation['Inv - Address Line 3']).toBe('line 3 from account');
      expect(paymentInformation['Inv - Address Line 4']).toBeUndefined();
      expect(paymentInformation['Inv - City']).toBe('London');
      expect(paymentInformation['Inv - Postal Code']).toBe('NE70 5TV');
      expect(paymentInformation['Long Text']).toBe('site-id');
    });

    test('GIVEN fttsPaymentInformation with account values WHEN payment.ftts_origin trainer booker THEN creating proper values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...fttsPaymentInformation,
          'payment.ftts_origin': FttsPayment.PaymentOrigin.TRAINER_BOOKER_PORTAL,
        },
        true,
      );

      expect(paymentInformation['Customer Number']).toBe('booking-tars-business-id');
      expect(paymentInformation['Inv - Customer Name']).toBe('Booking Account Name');
      expect(paymentInformation['Inv - Address Line 1']).toBe('line 1 from booking account');
      expect(paymentInformation['Inv - Address Line 2']).toBe('line 2 from booking account');
      expect(paymentInformation['Inv - Address Line 3']).toBe('line 3 from booking account');
      expect(paymentInformation['Inv - Address Line 4']).toBeUndefined();
      expect(paymentInformation['Inv - City']).toBe('Booking London');
      expect(paymentInformation['Inv - Postal Code']).toBe('BOOK ING');
      expect(paymentInformation['Long Text']).toBe('booking-tars-business-id');
    });

    test('GIVEN fttsPaymentInformation without account values WHEN payment.ftts_origin ihttc THEN creating proper values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(defaultFttsPaymentInformation, true);

      expect(paymentInformation['Customer Number']).toBeUndefined();
      expect(paymentInformation['Inv - Customer Name']).toBeUndefined();
      expect(paymentInformation['Inv - Address Line 1']).toBeUndefined();
      expect(paymentInformation['Inv - Address Line 2']).toBeUndefined();
      expect(paymentInformation['Inv - Address Line 3']).toBeUndefined();
      expect(paymentInformation['Inv - Address Line 4']).toBeUndefined();
      expect(paymentInformation['Inv - City']).toBeUndefined();
      expect(paymentInformation['Inv - Postal Code']).toBeUndefined();
      expect(paymentInformation['Long Text']).toBeUndefined();
    });

    test('GIVEN fttsPaymentInformation with person values WHEN payment.ftts_origin is not ihttc or trainer booker THEN creating proper values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...fttsPaymentInformation,
          'payment.ftts_origin': FttsPayment.PaymentOrigin.CITIZEN_PORTAL,
        },
        true,
      );

      expect(paymentInformation['Customer Number']).toBe('01-20200629-092614-330C3B39');
      expect(paymentInformation['Inv - Customer Name']).toBe('John Rambo');
      expect(paymentInformation['Inv - Address Line 1']).toBe('line 1 from person');
      expect(paymentInformation['Inv - Address Line 2']).toBe('line 2 from person');
      expect(paymentInformation['Inv - Address Line 3']).toBe('line 3 from person');
      expect(paymentInformation['Inv - Address Line 4']).toBeUndefined();
      expect(paymentInformation['Inv - City']).toBe('Birmingham');
      expect(paymentInformation['Inv - Postal Code']).toBe('NE70 6YQ');
      expect(paymentInformation['Long Text']).toBe('01-20200629-092614-330C3B39');
    });

    test('GIVEN fttsPaymentInformation with person values WHEN no payment.ftts_origin and type booking THEN creating proper values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...fttsPaymentInformation,
          'payment.ftts_origin': undefined,
        },
        true,
      );

      expect(paymentInformation['Customer Number']).toBe('01-20200629-092614-330C3B39');
      expect(paymentInformation['Inv - Customer Name']).toBe('John Rambo');
      expect(paymentInformation['Inv - Address Line 1']).toBe('line 1 from person');
      expect(paymentInformation['Inv - Address Line 2']).toBe('line 2 from person');
      expect(paymentInformation['Inv - Address Line 3']).toBe('line 3 from person');
      expect(paymentInformation['Inv - Address Line 4']).toBeUndefined();
      expect(paymentInformation['Inv - City']).toBe('Birmingham');
      expect(paymentInformation['Inv - Postal Code']).toBe('NE70 6YQ');
      expect(paymentInformation['Long Text']).toBe('01-20200629-092614-330C3B39');
    });

    test('GIVEN fttsPaymentInformation without person values WHEN no payment.ftts_origin and type booking THEN creating proper values', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(defaultFttsPaymentInformation, true);

      expect(paymentInformation['Customer Number']).toBeUndefined();
      expect(paymentInformation['Inv - Customer Name']).toBeUndefined();
      expect(paymentInformation['Inv - Address Line 1']).toBeUndefined();
      expect(paymentInformation['Inv - Address Line 2']).toBeUndefined();
      expect(paymentInformation['Inv - Address Line 3']).toBeUndefined();
      expect(paymentInformation['Inv - Address Line 4']).toBeUndefined();
      expect(paymentInformation['Inv - City']).toBeUndefined();
      expect(paymentInformation['Inv - Postal Code']).toBeUndefined();
      expect(paymentInformation['Long Text']).toBeUndefined();
    });
  });

  describe('OAB Transfer value (gross)', () => {
    test('GIVEN fttsPaymentInformation with bookingproduct.ftts_price WHEN type is pfa_booking THEN value is set', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          ftts_type: FttsPayment.FinanceTransactionType.PFA_BOOKING,
          'bookingproduct.ftts_price': 23,
        },
        true,
      );

      expect(paymentInformation['OAB Transfer value (gross)']).toBe('23.00');
    });

    test('GIVEN fttsPaymentInformation with bookingproduct.ftts_price WHEN type is pfa_booking_refund THEN value is set', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          ftts_type: FttsPayment.FinanceTransactionType.PFA_BOOKING_REFUND,
          'bookingproduct.ftts_price': 23,
        },
        true,
      );

      expect(paymentInformation['OAB Transfer value (gross)']).toBe('23.00');
    });

    test('GIVEN fttsPaymentInformation with bookingproduct.ftts_price WHEN type is not pfa_booking or pfa_booking_refund THEN value is undefined', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'bookingproduct.ftts_price': 23,
        },
        true,
      );

      expect(paymentInformation['OAB Transfer value (gross)']).toBeUndefined();
    });
  });

  describe('Sales Person', () => {
    test('GIVEN ihttc portal with no regions fttsPaymentInformation called fromFttsPaymentInformation THEN sales person ihttc is returned', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_origin': FttsPayment.PaymentOrigin.IHTTC_PORTAL,
          'bookingproduct.account.parentaccount.ftts_regiona': false,
          'bookingproduct.account.parentaccount.ftts_regionb': false,
          'bookingproduct.account.parentaccount.ftts_regionc': false,
        },
        true,
      );

      expect(paymentInformation['Sales Person']).toEqual(Payment.SalesPerson.TT_IHTTC);
    });

    test('GIVEN trainer booker with region a fttsPaymentInformation called fromFttsPaymentInformation THEN sales person region a is returned', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_origin': FttsPayment.PaymentOrigin.TRAINER_BOOKER_PORTAL,
          'bookingproduct.account.parentaccount.ftts_regiona': true,
          'bookingproduct.account.parentaccount.ftts_regionb': false,
          'bookingproduct.account.parentaccount.ftts_regionc': false,
        },
        true,
      );

      expect(paymentInformation['Sales Person']).toEqual(Payment.SalesPerson.TT_REGION_A);
    });

    test('GIVEN trainer booker with region b fttsPaymentInformation called fromFttsPaymentInformation THEN sales person region b is returned', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_origin': FttsPayment.PaymentOrigin.TRAINER_BOOKER_PORTAL,
          'bookingproduct.account.parentaccount.ftts_regiona': false,
          'bookingproduct.account.parentaccount.ftts_regionb': true,
          'bookingproduct.account.parentaccount.ftts_regionc': false,
        },
        true,
      );

      expect(paymentInformation['Sales Person']).toEqual(Payment.SalesPerson.TT_REGION_B);
    });

    test('GIVEN trainer booker with region c fttsPaymentInformation called fromFttsPaymentInformation THEN sales person region c is returned', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_origin': FttsPayment.PaymentOrigin.TRAINER_BOOKER_PORTAL,
          'bookingproduct.account.parentaccount.ftts_regiona': false,
          'bookingproduct.account.parentaccount.ftts_regionb': false,
          'bookingproduct.account.parentaccount.ftts_regionc': true,
        },
        true,
      );

      expect(paymentInformation['Sales Person']).toEqual(Payment.SalesPerson.TT_REGION_C);
    });

    test('GIVEN trainer booker with all regions fttsPaymentInformation called fromFttsPaymentInformation THEN sales person region a is returned', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_origin': FttsPayment.PaymentOrigin.TRAINER_BOOKER_PORTAL,
          'bookingproduct.account.parentaccount.ftts_regiona': true,
          'bookingproduct.account.parentaccount.ftts_regionb': true,
          'bookingproduct.account.parentaccount.ftts_regionc': true,
        },
        true,
      );

      expect(paymentInformation['Sales Person']).toEqual(Payment.SalesPerson.TT_REGION_A);
    });

    test('GIVEN trainer booker without region a fttsPaymentInformation called fromFttsPaymentInformation THEN sales person region a is returned', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_origin': FttsPayment.PaymentOrigin.TRAINER_BOOKER_PORTAL,
          'bookingproduct.account.parentaccount.ftts_regiona': false,
          'bookingproduct.account.parentaccount.ftts_regionb': true,
          'bookingproduct.account.parentaccount.ftts_regionc': true,
        },
        true,
      );

      expect(paymentInformation['Sales Person']).toEqual(Payment.SalesPerson.TT_REGION_B);
    });

    test('GIVEN trainer booker without regions fttsPaymentInformation called fromFttsPaymentInformation THEN sales person undefined is returned', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.ftts_origin': FttsPayment.PaymentOrigin.TRAINER_BOOKER_PORTAL,
          'bookingproduct.account.parentaccount.ftts_regiona': undefined,
          'bookingproduct.account.parentaccount.ftts_regionb': undefined,
          'bookingproduct.account.parentaccount.ftts_regionc': undefined,
        },
        true,
      );

      expect(paymentInformation['Sales Person']).toBeUndefined();
    });
  });

  describe('Test Reference', () => {
    test('GIVEN fttsPaymentInformation with booking._ftts_owedcompensationoriginalbookingproduct_value WHEN booking is a compensation booking THEN test reference is set to the value of the original booking', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'bookingproduct.ftts_reference': 'mock-ref',
          'bookingproduct.ftts_owedcompensationoriginalbookingproduct': 'id',
          'owedCompensationOriginalBookingProduct.ftts_reference': 'mock-original-ref',
        },
        true,
      );

      expect(paymentInformation['Test Reference']).toBe('mock-original-ref');
    });

    test('GIVEN fttsPaymentInformation with booking._ftts_owedcompensationoriginalbookingproduct_value WHEN booking is not a compensation booking THEN test reference is set to the value of the booking as normal', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'bookingproduct.ftts_reference': 'mock-ref',
          'bookingproduct.ftts_owedcompensationoriginalbookingproduct': undefined,
          'owedCompensationOriginalBookingProduct.ftts_reference': undefined,
        },
        true,
      );

      expect(paymentInformation['Test Reference']).toBe('mock-ref');
    });
  });

  describe('Long Text', () => {
    test('GIVEN fttsPaymentInformation with booking._ftts_owedcompensationoriginalbookingproduct_value WHEN booking is a compensation booking THEN test reference of the compensation booking is appended to the long text field', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.person.ftts_personreference': 'mock-person-ref',
          'bookingproduct.ftts_reference': 'mock-compensation-booking-ref',
          'bookingproduct.ftts_owedcompensationoriginalbookingproduct': 'id',
          'owedCompensationOriginalBookingProduct.ftts_reference': 'mock-original-booking-ref',
        },
        true,
      );

      expect(paymentInformation['Long Text']).toBe('mock-person-ref mock-compensation-booking-ref');
    });

    test('GIVEN fttsPaymentInformation with booking._ftts_owedcompensationoriginalbookingproduct_value WHEN booking is not a compensation booking THEN no test reference is appended to the long text field', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(
        {
          ...defaultFttsPaymentInformation,
          'payment.person.ftts_personreference': 'mock-person-ref',
          'bookingproduct.ftts_reference': 'mock-booking-ref',
          'bookingproduct.ftts_owedcompensationoriginalbookingproduct': undefined,
          'owedCompensationOriginalBookingProduct.ftts_reference': undefined,
        },
        true,
      );

      expect(paymentInformation['Long Text']).toBe('mock-person-ref');
    });
  });

  describe('All fields', () => {
    test('GIVEN fttsPaymentInformation with all fields WHEN called fromFttsPaymentInformation THEN creating proper PaymentInformation instance', () => {
      const paymentInformation = Payment.PaymentInformation.fromFttsPaymentInformation(fttsPaymentInformation, true);

      expect(paymentInformation['line identifier']).toBe('10');
      expect(paymentInformation.Scheme).toBe('FTTS');
      expect(paymentInformation.Country).toBe('GB');
      expect(paymentInformation.Activity).toBe('TESTMATCH');
      expect(paymentInformation['Invoice Number']).toEqual(invoiceId1);
      expect(paymentInformation['Invoice Date']).toBe('10-Oct-00');
      expect(paymentInformation['Invoice Posting Date']).toBe('10-Oct-00');
      expect(paymentInformation['Customer Number']).toBe('site-id');
      expect(paymentInformation['Payment Reference']).toBe('FTTS0120200629092614330C3B39');
      expect(paymentInformation.Product).toEqual(Product.LGV_CPC);
      expect(paymentInformation['Test Reference']).toBe('11-20200629-092614-330C3B67');
      expect(paymentInformation['Test cost without VAT']).toBe('23.00');
      expect(paymentInformation['Test Date']).toBe('10-Oct-00');
      expect(paymentInformation['Inv - Customer Name']).toBe('Account Name');
      expect(paymentInformation['Inv - Address Line 1']).toBe('line 1 from account');
      expect(paymentInformation['Inv - Address Line 2']).toBe('line 2 from account');
      expect(paymentInformation['Inv - Address Line 3']).toBe('line 3 from account');
      expect(paymentInformation['Inv - Address Line 4']).toBeUndefined();
      expect(paymentInformation['Inv - City']).toBe('London');
      expect(paymentInformation['Inv - Postal Code']).toBe('NE70 5TV');
      expect(paymentInformation['Long Text']).toBe('site-id');
    });
  });
});

const date1 = new Date('2000-10-10');
const date2 = new Date('2020-01-01');
const invoiceId1 = 'FTT-F9587E4A82C55-201012101109';
const invoiceId2 = 'FTT-F9587E4A82C55-201012101109';
const defaultFttsPaymentInformation: FttsPayment.FttsPaymentInformation = {
  ftts_financetransactionid: '1',
  ftts_posteddate: date1,
  ftts_type: FttsPayment.FinanceTransactionType.BOOKING,
  ftts_status: FttsPayment.FinanceTransactionStatus.RECOGNISED,
  createdon: date1,
};
const fttsPaymentInformation: FttsPayment.FttsPaymentInformation = {
  ftts_financetransactionid: '1',
  ftts_posteddate: date1,
  ftts_recogniseddate: date2,
  ftts_type: FttsPayment.FinanceTransactionType.BOOKING,
  ftts_status: FttsPayment.FinanceTransactionStatus.RECOGNISED,
  ftts_invoiceid: invoiceId1,
  createdon: date1,
  'payment.ftts_reference': 'FTTS-01-20200629-092614-330C3B39',
  'payment.ftts_scheme': FttsPayment.PaymentScheme.FTTS,
  'payment.ftts_origin': FttsPayment.PaymentOrigin.IHTTC_PORTAL,
  'payment.person.ftts_personreference': '01-20200629-092614-330C3B39',
  'payment.person.ftts_name': 'John Rambo',
  'payment.person.address1_line1': 'line 1 from person',
  'payment.person.address1_line2': 'line 2 from person',
  'payment.person.address1_line3': 'line 3 from person',
  'payment.person.address1_city': 'Birmingham',
  'payment.person.address1_postalcode': 'NE70 6YQ',
  'bookingproduct.ftts_reference': '11-20200629-092614-330C3B67',
  'bookingproduct.ftts_testdate': date1,
  'bookingproduct.ftts_price': 23,
  'bookingproduct.product.name': 'LGV - CPC',
  'account.ftts_siteid': 'site-id',
  'account.name': 'Account Name',
  'account.address1_line1': 'line 1 from account',
  'account.address1_line2': 'line 2 from account',
  'account.address1_line3': 'line 3 from account',
  'account.address1_city': 'London',
  'account.address1_postalcode': 'NE70 5TV',
  'account.ftts_tarsbusinessid': 'tars-business-id',
  'booking.account.name': 'Booking Account Name',
  'booking.account.address1_line1': 'line 1 from booking account',
  'booking.account.address1_line2': 'line 2 from booking account',
  'booking.account.address1_line3': 'line 3 from booking account',
  'booking.account.address1_city': 'Booking London',
  'booking.account.address1_postalcode': 'BOOK ING',
  'booking.account.ftts_tarsbusinessid': 'booking-tars-business-id',
  'bookingproduct.ftts_owedcompensationoriginalbookingproduct': undefined,
};
