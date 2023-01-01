export interface FttsPaymentInformation {
  ftts_financetransactionid: string;
  ftts_posteddate: Date;
  ftts_recogniseddate?: Date;
  ftts_type: number;
  ftts_status: number;
  ftts_invoiceid?: string;
  createdon: Date;
  ftts_owedcompensationbookingdate?: Date;
  'payment.ftts_reference'?: string;
  'payment.ftts_scheme'?: number;
  'payment.ftts_origin'?: number;
  'payment.person.ftts_name'?: string;
  'payment.person.ftts_personreference'?: string;
  'payment.person.address1_line1'?: string;
  'payment.person.address1_line2'?: string;
  'payment.person.address1_line3'?: string;
  'payment.person.address1_city'?: string;
  'payment.person.address1_postalcode'?: string;
  'bookingproduct.ftts_bookingproductid'?: string;
  'bookingproduct.ftts_reference'?: string;
  'bookingproduct.ftts_testdate'?: Date;
  'bookingproduct.testhistory.ftts_testdate'?: Date;
  'bookingproduct.ftts_price'?: number;
  'bookingproduct.product.name'?: string;
  'bookingproduct.account.ftts_remit'?: number;
  'bookingproduct.account.parentaccount.ftts_regiona'?: boolean;
  'bookingproduct.account.parentaccount.ftts_regionb'?: boolean;
  'bookingproduct.account.parentaccount.ftts_regionc'?: boolean;
  'bookingproduct.financetransaction.ftts_invoiceid'?: string;
  'bookingproduct.financetransaction.createdon'?: Date;
  'account.name'?: string;
  'account.ftts_siteid'?: string;
  'account.address1_line1'?: string;
  'account.address1_line2'?: string;
  'account.address1_line3'?: string;
  'account.address1_city'?: string;
  'account.address1_postalcode'?: string;
  'account.ftts_tarsbusinessid'?: string;
  'booking.account.name'?: string;
  'booking.account.address1_line1'?: string;
  'booking.account.address1_line2'?: string;
  'booking.account.address1_line3'?: string;
  'booking.account.address1_city'?: string;
  'booking.account.address1_postalcode'?: string;
  'booking.account.ftts_tarsbusinessid'?: string;
  'bookingproduct.ftts_owedcompensationoriginalbookingproduct'?: string;
  'owedCompensationOriginalBookingProduct.ftts_reference'?: string;
}

export enum PaymentScheme {
  FTTS = 1,
  FTNI = 2,
}

export enum PaymentOrigin {
  CITIZEN_PORTAL = 1,
  CUSTOMER_SERVICE_CENTRE = 2,
  IHTTC_PORTAL = 3,
  TRAINER_BOOKER_PORTAL = 4,
}

export enum FinanceTransactionStatus {
  RECOGNISED = 675030001,
  DEFERRED = 675030000,
  DUPLICATE = 675030002,
}

export enum FinanceTransactionType {
  PFA_BOOKING = 675030001,
  PFA_BOOKING_REFUND = 675030003,
  BOOKING = 675030004,
}

export enum AccountRemit {
  DVA = 675030001, // Northern Ireland
  DVSA_ENGLAND = 675030000,
  DVSA_SCOTLAND = 675030003,
  DVSA_WALES = 675030002,
}

// Types PFA_BOOKING & PFA_BOOKING_REFUND are only present in context of IHTTC
export function isIhttc(type: number, origin?: number): boolean {
  return PaymentOrigin.IHTTC_PORTAL === origin
    || [FinanceTransactionType.PFA_BOOKING, FinanceTransactionType.PFA_BOOKING_REFUND].includes(type);
}

// Trainer Booker has always reference to Payment entity
export function isTrainerBooker(origin?: number): boolean {
  return PaymentOrigin.TRAINER_BOOKER_PORTAL === origin;
}
