/* eslint-disable @typescript-eslint/no-explicit-any */
import { InternalAccessDeniedError } from '@dvsa/egress-filtering';
import { logger, BusinessTelemetryEvent } from '../observability/logger';
import { CrmError } from '../crm/crmError';
import { AzureBlobError } from '../azureBlob/azureBlobError';
import { FileAlreadyExists } from '../azureBlob/fileAlreadyExistsError';

export default function handleError(error: any): void {
  if (error instanceof InternalAccessDeniedError) {
    logger.logEvent(
      BusinessTelemetryEvent.NOT_WHITELISTED_URL_CALL,
      error.message,
      {
        host: error.host,
        port: error.port,
      },
    );
  } else if (error instanceof CrmError) {
    logger.logEvent(
      BusinessTelemetryEvent.SAP_CDS_READ_FAILED,
      error.message,
      error.properties,
    );
  } else if (error instanceof AzureBlobError) {
    logger.logEvent(
      BusinessTelemetryEvent.SAP_FILE_STORE_FAILED,
      error.message,
      error.properties,
    );
  } else if (error instanceof FileAlreadyExists) {
    logger.logEvent(
      BusinessTelemetryEvent.SAP_FILE_STORE_FILE_EXISTS,
      error.message,
      error.properties,
    );
  } else {
    logger.error(error as Error);
  }
  throw error;
}
