import { Metadata } from '@azure/storage-blob';
import dateformat from 'dateformat';
import { newAzureBlobClient } from '../azureBlob/azureBlobClient';
import { FileAlreadyExists } from '../azureBlob/fileAlreadyExistsError';
import { newCrmClient } from '../crm/crmClient';
import { PaymentInformation } from '../crm/payments/paymentInformation';
import { BusinessTelemetryEvent, logger } from '../observability/logger';
import { toCsv } from './toCsv';

export const toCsvFilename = (exportDate: Date): string => `FTTS_${dateformat(exportDate, 'yyyymmdd', true)}000000.dat`;

export default async function exporter(
  operationid: string,
  containerName: string,
  exportDate: Date,
): Promise<void> {
  const csvFilename = toCsvFilename(exportDate);
  logger.logEvent(
    BusinessTelemetryEvent.SAP_CDS_EXPORT_STARTED,
    undefined,
    {
      containerName,
      fileName: csvFilename,
      exportDate,
    },
  );
  const azureBlobClient = newAzureBlobClient();
  if (await azureBlobClient.fileExists(containerName, csvFilename)) {
    throw new FileAlreadyExists(
      'The file already exists',
      undefined,
      {
        containerName,
        fileName: csvFilename,
      },
    );
  }
  const paymentInformations: PaymentInformation[] = await newCrmClient().getPaymentInformations(
    exportDate,
  );
  const csvFileContents = await toCsv(paymentInformations, exportDate, csvFilename);
  await azureBlobClient.uploadFile(
    containerName,
    csvFilename,
    csvFileContents,
    {
      operationid,
    } as Metadata,
  );
  logger.logEvent(
    BusinessTelemetryEvent.SAP_FILE_STORE_SUCCESSFUL,
    undefined,
    {
      containerName,
      fileName: csvFilename,
      fileSize: Buffer.byteLength(csvFileContents),
    },
  );
}
