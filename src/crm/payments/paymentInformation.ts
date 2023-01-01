/* eslint-disable no-underscore-dangle */
import * as FttsPayment from './fttsPaymentInformation';
import { DateFormat, formatDate } from '../../utils/formatDate';
import { Scheme } from './scheme';
import { Product } from './product';

export class PaymentInformation {
  private static readonly ERS_TEST_COST_WITHOUT_VAT: string = '52.80';

  public static readonly ENTITY_COLLECTION_NAME = 'ftts_financetransactions';

  public Scheme?: Scheme;

  public Country?: Country;

  public Activity?: Activity;

  public 'Invoice Number'?: string;

  public 'Invoice Date'?: string;

  public 'Invoice Posting Date'?: string;

  public 'Customer Number'?: string;

  public 'Payment Reference'?: string;

  public readonly 'line identifier': string = '10';

  public Product?: Product;

  public 'Test Reference'?: string;

  public 'Test cost without VAT'?: string;

  public 'OAB Transfer value (gross)'?: string;

  public 'Test Date'?: string;

  public 'Sales Person'?: SalesPerson;

  public 'Inv - Customer Name'?: string;

  public 'Inv - Address Line 1'?: string;

  public 'Inv - Address Line 2'?: string;

  public 'Inv - Address Line 3'?: string;

  // No address line 4 in the Account & Person entieties - the field should be empty
  public 'Inv - Address Line 4'?: string;

  public 'Inv - City'?: string;

  public 'Inv - Postal Code'?: string;

  public 'Long Text'?: string;

  /**
   *
   * @param fttsPaymentInformation - CRM model representation
   * @param isRecognisedTransaction - 'true' for data from CRM Finance Transaction entity filtered by 'status=RECOGNISED'
   */
  static fromFttsPaymentInformation(
    fttsPaymentInformation: FttsPayment.FttsPaymentInformation,
    isRecognisedTransaction: boolean,
  ): PaymentInformation {
    const paymentInformation = new PaymentInformation();
    const bookingProductTestDate = fttsPaymentInformation['bookingproduct.ftts_testdate'] || fttsPaymentInformation['bookingproduct.testhistory.ftts_testdate'];
    const bookingProductPrice = fttsPaymentInformation['bookingproduct.ftts_price']
      ? fttsPaymentInformation['bookingproduct.ftts_price'].toFixed(2)
      : undefined;
    paymentInformation.Scheme = Scheme.fromFttsPaymentInformation(fttsPaymentInformation);
    paymentInformation.Country = paymentInformation.schemeToCountry(paymentInformation.Scheme);
    paymentInformation.Activity = paymentInformation.resolveActivity(
      isRecognisedTransaction,
      fttsPaymentInformation.ftts_type,
      fttsPaymentInformation.ftts_owedcompensationbookingdate,
    );
    paymentInformation['Payment Reference'] = fttsPaymentInformation['payment.ftts_reference']?.replace(/-/g, '');
    paymentInformation.Product = Product.fromFttsPaymentInformation(fttsPaymentInformation);
    paymentInformation['Test Reference'] = fttsPaymentInformation['bookingproduct.ftts_owedcompensationoriginalbookingproduct']
      ? fttsPaymentInformation['owedCompensationOriginalBookingProduct.ftts_reference']
      : fttsPaymentInformation['bookingproduct.ftts_reference'];
    paymentInformation['Test cost without VAT'] = paymentInformation.Product === Product.ERS
      ? PaymentInformation.ERS_TEST_COST_WITHOUT_VAT
      : bookingProductPrice;
    paymentInformation['OAB Transfer value (gross)'] = paymentInformation.resolveOABTransferValueGross(
      fttsPaymentInformation,
      bookingProductPrice,
    );
    paymentInformation['Test Date'] = isRecognisedTransaction && bookingProductTestDate
      ? formatDate(bookingProductTestDate, DateFormat['dd-mmm-yy'])
      : undefined;
    paymentInformation['Sales Person'] = paymentInformation.resolveSalesPerson(fttsPaymentInformation);
    paymentInformation.setInvoiceData(fttsPaymentInformation);
    paymentInformation.setDataBasedOnBusinessUser(fttsPaymentInformation);
    return paymentInformation;
  }

  private schemeToCountry(scheme?: Scheme): Country | undefined {
    if (!scheme) {
      return undefined;
    }
    if (scheme === Scheme.FTTS) {
      return Country.GB;
    }
    return Country.NI;
  }

  private resolveActivity(
    isRecognisedTransaction: boolean,
    type: FttsPayment.FinanceTransactionType,
    owedCompensationBookingDate: Date | undefined,
  ): Activity {
    if (isRecognisedTransaction) {
      return owedCompensationBookingDate === undefined ? Activity.TESTMATCH : Activity.REVTESTM;
    }
    if (type === FttsPayment.FinanceTransactionType.PFA_BOOKING) {
      return Activity.INVOICEPFA;
    }
    if (type === FttsPayment.FinanceTransactionType.BOOKING) {
      return Activity.INVOICE;
    }
    return Activity.REFUNDOAB;
  }

  private resolveSalesPerson(fttsPaymentInformation: FttsPayment.FttsPaymentInformation): SalesPerson | undefined {
    if (FttsPayment.isIhttc(
      fttsPaymentInformation.ftts_type,
      fttsPaymentInformation['payment.ftts_origin'],
    )) return SalesPerson.TT_IHTTC;
    if (fttsPaymentInformation['bookingproduct.account.parentaccount.ftts_regiona']) return SalesPerson.TT_REGION_A;
    if (fttsPaymentInformation['bookingproduct.account.parentaccount.ftts_regionb']) return SalesPerson.TT_REGION_B;
    if (fttsPaymentInformation['bookingproduct.account.parentaccount.ftts_regionc']) return SalesPerson.TT_REGION_C;
    return undefined;
  }

  private resolveOABTransferValueGross(fttsPaymentInformation: FttsPayment.FttsPaymentInformation, bookingProductPrice: string | undefined): string | undefined {
    return [FttsPayment.FinanceTransactionType.PFA_BOOKING, FttsPayment.FinanceTransactionType.PFA_BOOKING_REFUND].includes(fttsPaymentInformation.ftts_type)
      ? bookingProductPrice
      : undefined;
  }

  private setInvoiceData(fttsPaymentInformation: FttsPayment.FttsPaymentInformation): void {
    if (fttsPaymentInformation.ftts_type === FttsPayment.FinanceTransactionType.PFA_BOOKING_REFUND) {
      this['Invoice Number'] = fttsPaymentInformation['bookingproduct.financetransaction.ftts_invoiceid'];
      if (fttsPaymentInformation['bookingproduct.financetransaction.createdon']) {
        const createdOn = formatDate(fttsPaymentInformation['bookingproduct.financetransaction.createdon'], DateFormat['dd-mmm-yy']);
        this['Invoice Date'] = createdOn;
        this['Invoice Posting Date'] = createdOn;
      }
    } else {
      const createdOn = formatDate(fttsPaymentInformation.createdon, DateFormat['dd-mmm-yy']);
      this['Invoice Number'] = fttsPaymentInformation.ftts_invoiceid;
      this['Invoice Date'] = createdOn;
      this['Invoice Posting Date'] = createdOn;
    }
  }

  private setDataBasedOnBusinessUser(fttsPaymentInformation: FttsPayment.FttsPaymentInformation): void {
    let additionalLongText = '';
    if (fttsPaymentInformation['bookingproduct.ftts_owedcompensationoriginalbookingproduct'] && fttsPaymentInformation['bookingproduct.ftts_reference']) {
      additionalLongText += ` ${fttsPaymentInformation['bookingproduct.ftts_reference']}`;
    }
    if (FttsPayment.isIhttc(fttsPaymentInformation.ftts_type, fttsPaymentInformation['payment.ftts_origin'])) {
      const customerNumber = fttsPaymentInformation['account.ftts_siteid'];
      this['Customer Number'] = customerNumber;
      this['Long Text'] = customerNumber ? customerNumber + additionalLongText : undefined;
      this['Inv - Customer Name'] = fttsPaymentInformation['account.name'];
      this['Inv - Address Line 1'] = fttsPaymentInformation['account.address1_line1'];
      this['Inv - Address Line 2'] = fttsPaymentInformation['account.address1_line2'];
      this['Inv - Address Line 3'] = fttsPaymentInformation['account.address1_line3'];
      this['Inv - City'] = fttsPaymentInformation['account.address1_city'];
      this['Inv - Postal Code'] = fttsPaymentInformation['account.address1_postalcode'];
    } else if (FttsPayment.isTrainerBooker(fttsPaymentInformation['payment.ftts_origin'])) {
      const customerNumber = fttsPaymentInformation['booking.account.ftts_tarsbusinessid'];
      this['Customer Number'] = customerNumber;
      this['Long Text'] = customerNumber ? customerNumber + additionalLongText : undefined;
      this['Inv - Customer Name'] = fttsPaymentInformation['booking.account.name'];
      this['Inv - Address Line 1'] = fttsPaymentInformation['booking.account.address1_line1'];
      this['Inv - Address Line 2'] = fttsPaymentInformation['booking.account.address1_line2'];
      this['Inv - Address Line 3'] = fttsPaymentInformation['booking.account.address1_line3'];
      this['Inv - City'] = fttsPaymentInformation['booking.account.address1_city'];
      this['Inv - Postal Code'] = fttsPaymentInformation['booking.account.address1_postalcode'];
    } else {
      const personreference = fttsPaymentInformation['payment.person.ftts_personreference'];
      this['Customer Number'] = personreference;
      this['Long Text'] = personreference ? personreference + additionalLongText : undefined;
      this['Inv - Customer Name'] = fttsPaymentInformation['payment.person.ftts_name'];
      this['Inv - Address Line 1'] = fttsPaymentInformation['payment.person.address1_line1'];
      this['Inv - Address Line 2'] = fttsPaymentInformation['payment.person.address1_line2'];
      this['Inv - Address Line 3'] = fttsPaymentInformation['payment.person.address1_line3'];
      this['Inv - City'] = fttsPaymentInformation['payment.person.address1_city'];
      this['Inv - Postal Code'] = fttsPaymentInformation['payment.person.address1_postalcode'];
    }
  }
}

export enum Country {
  GB = 'GB',
  NI = 'NI',
}

export enum Activity {
  INVOICEPFA = 'INVOICEPFA',
  INVOICE = 'INVOICE',
  REFUNDOAB = 'REFUNDOAB',
  TESTMATCH = 'TESTMATCH',
  REVTESTM = 'REVTESTM',
}

export enum SalesPerson {
  TT_IHTTC = 'Theory Test IHTTC',
  TT_REGION_A = 'Theory Test Region A',
  TT_REGION_B = 'Theory Test Region B',
  TT_REGION_C = 'Theory Test Region C',
}
