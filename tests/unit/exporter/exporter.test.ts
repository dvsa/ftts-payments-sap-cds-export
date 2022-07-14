import exporter, { toCsvFilename } from '../../../src/exporter/exporter';
import { BusinessTelemetryEvent } from '../../../src/observability/logger';
import { mockedCrmClient } from '../../mocks/crmClient.mock';
import { mockedAzureBlobClient } from '../../mocks/azureBlobService.mock';
import { mockedLogger } from '../../mocks/logger.mock';
import { FileAlreadyExists } from '../../../src/azureBlob/fileAlreadyExistsError';

jest.mock('../../../src/crm/crmClient');
jest.mock('../../../src/azureBlob/azureBlobClient');
jest.mock('../../../src/observability/logger');

describe('exporter', () => {
  const containerName = 'containerName';
  const operationid = '9df62cb5-be0f-4f6d-916d-8e238fd70ad7';
  const exportDate = new Date('2020-02-03T00:00:00.000Z');
  const fileName = 'FTTS_20200203000000.dat';

  beforeEach(() => {
    mockedCrmClient.getPaymentInformations.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toCsvFilename', () => {
    test('GIVEN a date WHEN called THEN a filename is returned', () => {
      expect(toCsvFilename(new Date('1987-03-05T12:13:14.000Z'))).toBe('FTTS_19870305000000.dat');
    });
  });

  test('GIVEN an export date WHEN called THEN payment informations are fetched and uploaded', async () => {
    const expectedFileContents = 'FOOTER~20200203000000~03-02-2020~0~0\n';

    await exporter(operationid, containerName, exportDate);

    expect(mockedLogger.logEvent).toHaveBeenCalledTimes(2);
    expect(mockedLogger.logEvent).toHaveBeenNthCalledWith(
      1,
      BusinessTelemetryEvent.SAP_CDS_EXPORT_STARTED,
      undefined,
      {
        containerName,
        fileName,
        exportDate,
      },
    );
    expect(mockedCrmClient.getPaymentInformations).toHaveBeenCalledTimes(1);
    expect(mockedCrmClient.getPaymentInformations).toHaveBeenCalledWith(exportDate);
    expect(mockedAzureBlobClient.fileExists).toHaveBeenCalledTimes(1);
    expect(mockedAzureBlobClient.fileExists).toHaveBeenCalledWith(
      containerName,
      fileName,
    );
    expect(mockedAzureBlobClient.uploadFile).toHaveBeenCalledWith(
      containerName,
      fileName,
      expectedFileContents,
      {
        operationid,
      },
    );
    expect(mockedLogger.logEvent).toHaveBeenNthCalledWith(
      2,
      BusinessTelemetryEvent.SAP_FILE_STORE_SUCCESSFUL,
      undefined,
      {
        containerName,
        fileName,
        fileSize: Buffer.byteLength(expectedFileContents),
      },
    );
    expect(mockedLogger.logEvent).toHaveBeenCalledTimes(2);
  });

  test('GIVEN a file already exists WHEN called THEN the proper event is logged', async () => {
    mockedAzureBlobClient.fileExists.mockResolvedValue(true);

    await expect(
      exporter(operationid, containerName, exportDate),
    ).rejects.toEqual(new FileAlreadyExists('The file already exists'));

    expect(mockedLogger.logEvent).toHaveBeenCalledTimes(1);
    expect(mockedLogger.logEvent).toHaveBeenNthCalledWith(
      1,
      BusinessTelemetryEvent.SAP_CDS_EXPORT_STARTED,
      undefined,
      {
        containerName,
        fileName,
        exportDate,
      },
    );
    expect(mockedAzureBlobClient.fileExists).toHaveBeenCalledTimes(1);
    expect(mockedAzureBlobClient.fileExists).toHaveBeenCalledWith(
      containerName,
      fileName,
    );
    expect(mockedCrmClient.getPaymentInformations).toHaveBeenCalledTimes(0);
    expect(mockedAzureBlobClient.uploadFile).toHaveBeenCalledTimes(0);
  });
});
