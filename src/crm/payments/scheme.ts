import * as FttsPayment from './fttsPaymentInformation';

/* eslint-disable no-redeclare */
/* eslint-disable import/export */
/* eslint-disable @typescript-eslint/no-namespace */
export enum Scheme {
  FTTS = 'FTTS',
  FTNI = 'FTNI',
}

export namespace Scheme {
  // eslint-disable-next-line no-inner-declarations
  export function fromFttsPaymentInformation(fttsPaymentInformation: FttsPayment.FttsPaymentInformation): Scheme | undefined {
    if (FttsPayment.isIhttc(
      fttsPaymentInformation.ftts_type,
      fttsPaymentInformation['payment.ftts_origin'],
    )) {
      return Scheme.FTTS;
    }
    const scheme: FttsPayment.PaymentScheme | undefined = fttsPaymentInformation['payment.ftts_scheme'];
    if (scheme) {
      return paymentSchemeToScheme(scheme);
    }
    const accountRemit: FttsPayment.AccountRemit | undefined = fttsPaymentInformation['bookingproduct.account.ftts_remit'];
    if (accountRemit) {
      return accountRemitToScheme(accountRemit);
    }
    return undefined;
  }
}

const paymentSchemeToScheme = (scheme: FttsPayment.PaymentScheme): Scheme => {
  if (scheme === FttsPayment.PaymentScheme.FTTS) {
    return Scheme.FTTS;
  }
  return Scheme.FTNI;
};

const accountRemitToScheme = (accountRemit: FttsPayment.AccountRemit): Scheme => {
  if (accountRemit === FttsPayment.AccountRemit.DVA) {
    return Scheme.FTNI;
  }
  return Scheme.FTTS;
};
