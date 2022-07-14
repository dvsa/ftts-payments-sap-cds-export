import { Logger as AzureLogger } from '@dvsa/azure-logger';
import { Props } from '@dvsa/azure-logger/dist/ILogger';
import config from '../config';

export class Logger extends AzureLogger {
  constructor() {
    super('FTTS', config.appName);
  }

  logEvent(
    telemetryEvent: BusinessTelemetryEvent,
    message?: string,
    properties?: Props,
  ): void {
    super.event(
      telemetryEvent,
      message,
      {
        ...properties,
      },
    );
  }
}

export enum BusinessTelemetryEvent {
  SAP_CDS_EXPORT_STARTED = 'SAP_CDS_EXPORT_STARTED',
  SAP_CDS_READ_FAILED = 'SAP_CDS_READ_FAILED',
  SAP_CDS_MISSING_TEST_DATE = 'SAP_CDS_MISSING_TEST_DATE',
  SAP_CDS_ORIG_BOOKING_MAX_ITERATION_EXCEED = 'SAP_CDS_ORIG_BOOKING_MAX_ITERATION_EXCEED',
  SAP_FILE_STORE_FILE_EXISTS = 'SAP_FILE_STORE_FILE_EXISTS',
  SAP_FILE_STORE_FAILED = 'SAP_FILE_STORE_FAILED',
  SAP_FILE_STORE_SUCCESSFUL = 'SAP_FILE_STORE_SUCCESSFUL',
  NOT_WHITELISTED_URL_CALL = 'NOT_WHITELISTED_URL_CALL',
  HEALTH_CHECK_SUCCESS = 'HEALTH_CHECK_SUCCESS',
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED',
}

export const logger = new Logger();
