import { Product } from '../../../../src/crm/payments/product';
import {
  FttsPaymentInformation, AccountRemit,
} from '../../../../src/crm/payments/fttsPaymentInformation';

describe('Product', () => {
  describe('fromFttsPaymentInformation', () => {
    test.each([
      [
        {
          'bookingproduct.account.ftts_remit': AccountRemit.DVA,
        },
        Product.THEORY_TEST_NI,
      ],
      [
        {
          'bookingproduct.product.name': 'Car...',
        },
        Product.CAR,
      ],
      [
        {
          'bookingproduct.product.name': 'Motorcycle',
        },
        Product.MOTORCYCLE,
      ],
      [
        {
          'bookingproduct.product.name': 'LGV - multiple choice questions',
        },
        Product.LGV_MULTIPLE_CHOICE,
      ],
      [
        {
          'bookingproduct.product.name': 'LGV - hazard perception test',
        },
        Product.LGV_HAZARD_PERCEPTION,
      ],
      [
        {
          'bookingproduct.product.name': 'PCV - multiple choice questions',
        },
        Product.PCV_MULTIPLE_CHOICE,
      ],
      [
        {
          'bookingproduct.product.name': 'PCV - hazard perception test',
        },
        Product.PCV_HAZARD_PERCEPTION,
      ],
      [
        {
          'bookingproduct.product.name': 'LGV-CPC',
        },
        Product.LGV_CPC,
      ],
      [
        {
          'bookingproduct.product.name': 'PCV - CPC',
        },
        Product.PCV_CPC,
      ],
      [
        {
          'bookingproduct.product.name': 'LGV - CPC conversion',
        },
        Product.LGV_CPC_CONVERSION,
      ],
      [
        {
          'bookingproduct.product.name': 'LGV - CPC conversion',
        },
        Product.LGV_CPC_CONVERSION,
      ],
      [
        {
          'bookingproduct.product.name': 'PCV - CPC conversion',
        },
        Product.PCV_CPC_CONVERSION,
      ],
      [
        {
          'bookingproduct.product.name': 'ADI hazard perception',
        },
        Product.APPROVED_DRIVING_INSTRUCTOR_HAZARD_PERCEPTION,
      ],
      [
        {
          'bookingproduct.product.name': 'ERS',
        },
        Product.ERS,
      ],
    ])('GIVEN fttsPaymentInformation WHEN called THEN a proper product is returned', (
      fttsPaymentInformation: Partial<FttsPaymentInformation>,
      product: Product,
    ) => {
      expect(Product.fromFttsPaymentInformation(fttsPaymentInformation as FttsPaymentInformation)).toEqual(product);
    });
  });
});
