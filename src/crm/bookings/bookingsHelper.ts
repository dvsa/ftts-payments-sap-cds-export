import { Expand } from 'dynamics-web-api';
import { FttsPaymentInformation } from '../payments/fttsPaymentInformation';

export type OwedCompensationOriginalBookingProduct = {
  ftts_bookingproductid: string;
  ftts_reference: string | null;
  ftts_owedCompensationOriginalBookingProduct: OwedCompensationOriginalBookingProduct | null;
};

export const buildOwedCompensationOriginalBookingProductExpandQuery = (numberOfLevels: number): Expand[] => {
  const base: Expand = {
    property: 'ftts_owedCompensationOriginalBookingProduct',
    select: ['ftts_bookingproductid', 'ftts_reference'],
  };
  const levels: Expand[] = [{ ...base }];
  let pointer = levels;
  for (let i = 0; i < numberOfLevels; i++) {
    pointer[0].expand = [{ ...base }];
    pointer = pointer[0].expand;
  }
  return levels;
};

export const filterCompensationBookingProducts = (paymentRecords: FttsPaymentInformation[]): string[] => paymentRecords
  .filter((record) => record['bookingproduct.ftts_owedcompensationoriginalbookingproduct'])
  .map((record) => record['bookingproduct.ftts_owedcompensationoriginalbookingproduct']) as string[];
