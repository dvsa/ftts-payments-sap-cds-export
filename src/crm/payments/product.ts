/* eslint-disable no-redeclare */
/* eslint-disable import/export */
/* eslint-disable @typescript-eslint/no-namespace */

import * as FttsPayment from './fttsPaymentInformation';

export enum Product {
  CAR = 'Car',
  MOTORCYCLE = 'Motorcycle',
  LGV_MULTIPLE_CHOICE = 'LGV multiple choice',
  LGV_HAZARD_PERCEPTION = 'LGV hazard perception',
  PCV_MULTIPLE_CHOICE = 'PCV multiple choice',
  PCV_HAZARD_PERCEPTION = 'PCV hazard perception',
  LGV_CPC = 'LGV CPC',
  PCV_CPC = 'PCV CPC',
  LGV_CPC_CONVERSION = 'LGV CPC conversion',
  PCV_CPC_CONVERSION = 'PCV CPC conversion',
  ADI_PART_1 = 'ADI Part 1',
  APPROVED_DRIVING_INSTRUCTOR_HAZARD_PERCEPTION = 'Approved Driving Instructor hazard perception (EU conversion)',
  THEORY_TEST_NI = 'Theory Test NI',
  ERS = 'Enhanced Rider Scheme',
}

export namespace Product {
  // eslint-disable-next-line no-inner-declarations
  export function fromFttsPaymentInformation(
    fttsPaymentInformation: FttsPayment.FttsPaymentInformation,
  ): Product | undefined {
    const productName = fttsPaymentInformation['bookingproduct.product.name'];
    const bookingProductAccountRemit = fttsPaymentInformation['bookingproduct.account.ftts_remit'];
    if (bookingProductAccountRemit === FttsPayment.AccountRemit.DVA) return Product.THEORY_TEST_NI;
    if (!productName) return undefined;
    const name = productName.trim().toLowerCase();
    const lgv = 'lgv';
    const pcv = 'pcv';
    const cpc = 'cpc';
    const adi = 'adi';
    const multipleChoice = 'multiple choice';
    const hazardPerception = 'hazard perception';
    const conversion = 'conversion';
    const ers = 'ers';
    if (name.startsWith('car')) return Product.CAR;
    if (name.startsWith('motorcycle')) return Product.MOTORCYCLE;
    if (name.includes(lgv) && name.includes(multipleChoice)) return Product.LGV_MULTIPLE_CHOICE;
    if (name.includes(lgv) && name.includes(hazardPerception)) return Product.LGV_HAZARD_PERCEPTION;
    if (name.includes(pcv) && name.includes(multipleChoice)) return Product.PCV_MULTIPLE_CHOICE;
    if (name.includes(pcv) && name.includes(hazardPerception)) return Product.PCV_HAZARD_PERCEPTION;
    if (name.includes(lgv) && name.includes(cpc) && !name.includes(conversion)) return Product.LGV_CPC;
    if (name.includes(pcv) && name.includes(cpc) && !name.includes(conversion)) return Product.PCV_CPC;
    if (name.includes(lgv) && name.includes(cpc) && name.includes(conversion)) return Product.LGV_CPC_CONVERSION;
    if (name.includes(pcv) && name.includes(cpc) && name.includes(conversion)) return Product.PCV_CPC_CONVERSION;
    if (name.startsWith(adi) && !name.includes(hazardPerception)) return Product.ADI_PART_1;
    if (name.includes(adi) && name.includes(hazardPerception)) return Product.APPROVED_DRIVING_INSTRUCTOR_HAZARD_PERCEPTION;
    if (name.startsWith(ers)) return Product.ERS;
    return undefined;
  }
}
