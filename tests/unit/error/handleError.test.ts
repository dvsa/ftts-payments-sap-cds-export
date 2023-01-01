import { InternalAccessDeniedError } from '@dvsa/egress-filtering';
import handleError from '../../../src/error/handleError';
import { mockedLogger } from '../../mocks/logger.mock';
import { CrmError } from '../../../src/crm/crmError';
import { BusinessTelemetryEvent } from '../../../src/observability/logger';
import { AzureBlobError } from '../../../src/azureBlob/azureBlobError';
import { FileAlreadyExists } from '../../../src/azureBlob/fileAlreadyExistsError';

jest.mock('../../../src/observability/logger');

describe('handleError', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    [
      new Error('exporterTimerTrigger failed'),
      (error: any) => {
        expect(mockedLogger.error).toHaveBeenCalledTimes(1);
        expect(mockedLogger.error).toHaveBeenCalledWith(
          error,
        );
      },
    ],
    [
      new CrmError('error msg', undefined, { key: 'value' }),
      (error: CrmError) => {
        expect(mockedLogger.logEvent).toHaveBeenCalledTimes(1);
        expect(mockedLogger.logEvent).toHaveBeenCalledWith(
          BusinessTelemetryEvent.SAP_CDS_READ_FAILED,
          error.message,
          error.properties,
        );
      },
    ],
    [
      new AzureBlobError('error msg', undefined, { key: 'value' }),
      (error: AzureBlobError) => {
        expect(mockedLogger.logEvent).toHaveBeenCalledTimes(1);
        expect(mockedLogger.logEvent).toHaveBeenCalledWith(
          BusinessTelemetryEvent.SAP_FILE_STORE_FAILED,
          error.message,
          error.properties,
        );
      },
    ],
    [
      new FileAlreadyExists('error msg', undefined, { key: 'value' }),
      (error: FileAlreadyExists) => {
        expect(mockedLogger.logEvent).toHaveBeenCalledTimes(1);
        expect(mockedLogger.logEvent).toHaveBeenCalledWith(
          BusinessTelemetryEvent.SAP_FILE_STORE_FILE_EXISTS,
          error.message,
          error.properties,
        );
      },
    ],
    [
      new InternalAccessDeniedError('host', '80', 'error msg'),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (error: any) => {
        expect(mockedLogger.logEvent).toHaveBeenCalledTimes(1);
        expect(mockedLogger.logEvent).toHaveBeenCalledWith(
          BusinessTelemetryEvent.NOT_WHITELISTED_URL_CALL,
          'error msg',
          { host: 'host', port: '80' },
        );
      },
    ],
  ])('GIVEN an error WHEN called THEN expect the error to have been logged and rethrow', (
    error: any,
    expectErrorToHaveBeenLogged: any,
  ) => {
    expect(() => handleError(error)).toThrow(error as Error);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expectErrorToHaveBeenLogged(error);
  });
});
