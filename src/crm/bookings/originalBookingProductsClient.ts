/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import chunk from 'lodash.chunk';
import config from '../../config';
import { BusinessTelemetryEvent, logger } from '../../observability/logger';
import { FttsPaymentInformation } from '../payments/fttsPaymentInformation';
import {
  buildOwedCompensationOriginalBookingProductExpandQuery, filterCompensationBookingProducts, OwedCompensationOriginalBookingProduct,
} from './bookingsHelper';

export class OriginalBookingProductsClient {
  constructor(private dynamicsWebApi: DynamicsWebApi) { }

  public async addOriginalBookingRefsForCompensationBookings(paymentRecords: FttsPaymentInformation[]): Promise<FttsPaymentInformation[]> {
    let originalBookingProductIds = filterCompensationBookingProducts(paymentRecords);
    if (originalBookingProductIds.length === 0) {
      return paymentRecords;
    }
    const originalBookingProducts = await this.getOwedCompensationOriginalBookingProducts(originalBookingProductIds);
    for (const record of originalBookingProducts) {
      const firstOriginalBookingReference = await this.findFirstOriginalBookingRef(record, this);
      if (!firstOriginalBookingReference) {
        logger.event(
          BusinessTelemetryEvent.SAP_CDS_ORIG_BOOKING_MAX_ITERATION_EXCEED,
          'OriginalBookingProductsClient::addOriginalBookingRefsForCompensationBookings: Cannot retrieve original booking products',
          {
            bookingProductId: record.ftts_bookingproductid,
            reference: record.ftts_reference,
          },
        );
      }
      const paymentRecord = paymentRecords
        .find((rec) => rec['bookingproduct.ftts_owedcompensationoriginalbookingproduct'] === record?.ftts_bookingproductid) as FttsPaymentInformation;
      paymentRecord['owedCompensationOriginalBookingProduct.ftts_reference'] = firstOriginalBookingReference;
    }
    originalBookingProductIds = filterCompensationBookingProducts(paymentRecords);

    if (originalBookingProductIds.length === 0) {
      return paymentRecords;
    }
    return paymentRecords;
  }

  private async getOwedCompensationOriginalBookingProducts(bookingProductIds: string[]): Promise<OwedCompensationOriginalBookingProduct[]> {
    logger.info('CrmClient::getOwedCompensationOriginalBookingProducts: Trying to fetch owed compensation original bookings', { bookingProductIds });
    const chunkedBookingProductIds = chunk(bookingProductIds, 1000); // CRM has limit of 1000 requests per batch
    let records: OwedCompensationOriginalBookingProduct[] = [];
    for (const chunkOfBookingProductIds of chunkedBookingProductIds) {
      this.dynamicsWebApi.startBatch();
      chunkOfBookingProductIds.forEach((id) => {
        void this.retrieveOwedCompensationBookingProduct(id);
      });
      const batchResponse = await this.dynamicsWebApi.executeBatch() as OwedCompensationOriginalBookingProduct[];
      records = records.concat(batchResponse);
    }
    if (!records.length) {
      logger.info('CrmClient::getOwedCompensationOriginalBookingProducts: Empty response trying to fetch owed compensation original bookings', { bookingProductIds });
      return [];
    }
    logger.info('CrmClient::getOwedCompensationOriginalBookingProducts: Successfully fetched owed compensation original bookings', { bookingProductIds });
    return records;
  }

  private async retrieveOwedCompensationBookingProduct(id: string): Promise<OwedCompensationOriginalBookingProduct> {
    // We use an Expand query nested to X number of levels so we can find the 'first' original booking product
    // for bookings that have been BCP'd multiple times. Note CRM has nested Expand limit of 10 in one query
    return this.dynamicsWebApi.retrieveRequest<OwedCompensationOriginalBookingProduct>({
      id,
      collection: 'ftts_bookingproducts',
      select: ['ftts_bookingproductid', 'ftts_reference'],
      expand: buildOwedCompensationOriginalBookingProductExpandQuery(config.originalBookings.maxExpandNesting as number),
    });
  }

  private async findFirstOriginalBookingRef(record: OwedCompensationOriginalBookingProduct, originalBookingProductsClient: OriginalBookingProductsClient, iteration = 0): Promise<string | undefined> {
    let deepestBookingRef;
    let innerRecord: OwedCompensationOriginalBookingProduct | null = record;
    let prevInnerRecord: OwedCompensationOriginalBookingProduct = record;
    while (innerRecord) {
      deepestBookingRef = innerRecord.ftts_reference;
      prevInnerRecord = innerRecord;
      innerRecord = innerRecord.ftts_owedCompensationOriginalBookingProduct;
    }
    // Inner record should be null on the last link, if it is undefined/missing then this is not
    // the first original booking product and we need to search deeper recursively until we find it
    if (innerRecord !== null) {
      if (iteration >= Number(config.originalBookings.maxIterationsNumber)) {
        return undefined;
      }
      const deeperRecord = await originalBookingProductsClient.retrieveOwedCompensationBookingProduct(prevInnerRecord.ftts_bookingproductid);
      return this.findFirstOriginalBookingRef(deeperRecord, originalBookingProductsClient, iteration + 1);
    }
    return deepestBookingRef as string;
  }
}
