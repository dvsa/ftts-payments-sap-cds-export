import { mock } from 'jest-mock-extended';
import * as AZURE_BLOB from '@azure/storage-blob';
import { newAzureBlobServiceClient } from '../../../src/azureBlob/azureBlobServiceClient';
import { AzureBlobClient, newAzureBlobClient } from '../../../src/azureBlob/azureBlobClient';
import { AzureBlobError } from '../../../src/azureBlob/azureBlobError';

const FILE_NAME = 'test.json';
const FILE_CONTENTS = 'content';
const CONTAINER_NAME = 'test';

jest.mock('@azure/storage-blob');
jest.mock('../../../src/azureBlob/azureBlobServiceClient');
const mockedNewAzureBlobServiceClient = jest.mocked(newAzureBlobServiceClient);
const mockedBlobServiceClient = mock<AZURE_BLOB.BlobServiceClient>();
const mockedContainerClient = mock<AZURE_BLOB.ContainerClient>();
const mockedBlockBlobClient = mock<AZURE_BLOB.BlockBlobClient>();

let blobClient: AzureBlobClient;

describe('AzureBlobClient', () => {
  beforeEach(() => {
    mockedNewAzureBlobServiceClient.mockReturnValue(mockedBlobServiceClient);
    blobClient = newAzureBlobClient();
    mockedBlobServiceClient.getContainerClient.mockReturnValue(mockedContainerClient);
    mockedContainerClient.getBlockBlobClient.mockReturnValue(mockedBlockBlobClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fileExists', () => {
    test.each([
      [
        true,
        true,
        true,
      ],
      [
        false,
        true,
        false,
      ],
      [
        true,
        false,
        false,
      ],
    ])('GIVEN no errors WHEN called THEN a boolean value is returned', async (
      containerExists: boolean,
      fileExists: boolean,
      expectedResult: boolean,
    ) => {
      mockedContainerClient.exists.mockResolvedValue(containerExists);
      mockedBlockBlobClient.exists.mockResolvedValue(fileExists);

      await expect(
        blobClient.fileExists(CONTAINER_NAME, FILE_NAME),
      ).resolves.toEqual(expectedResult);
    });
  });

  describe('uploadFile', () => {
    beforeEach(() => {
      mockedBlockBlobClient.exists.mockResolvedValue(false);
    });

    test('GIVEN file already exists WHEN called THEN an AzureBlobError is thrown', async () => {
      mockedBlockBlobClient.exists.mockResolvedValue(true);
      mockedBlockBlobClient.upload.mockResolvedValue({} as AZURE_BLOB.BlockBlobUploadResponse);

      await expect(
        blobClient.uploadFile(CONTAINER_NAME, FILE_NAME, FILE_CONTENTS),
      ).rejects.toEqual(new AzureBlobError('The file already exists'));
    });

    test('GIVEN no errors WHEN called without metadata THEN the container is created if not existed', async () => {
      mockedBlockBlobClient.upload.mockResolvedValue({} as AZURE_BLOB.BlockBlobUploadResponse);

      await blobClient.uploadFile(CONTAINER_NAME, FILE_NAME, FILE_CONTENTS);

      expect(mockedContainerClient.createIfNotExists).toHaveBeenCalledTimes(1);
      expect(mockedBlockBlobClient.upload).toHaveBeenCalledWith(
        FILE_CONTENTS,
        Buffer.byteLength(FILE_CONTENTS),
        { metadata: undefined },
      );
    });

    test('GIVEN no errors WHEN called with metadata THEN the container is created if not existed', async () => {
      mockedBlockBlobClient.upload.mockResolvedValue({} as AZURE_BLOB.BlockBlobUploadResponse);
      const metadata = { key: 'value' } as AZURE_BLOB.Metadata;

      await blobClient.uploadFile(CONTAINER_NAME, FILE_NAME, FILE_CONTENTS, metadata);

      expect(mockedContainerClient.createIfNotExists).toHaveBeenCalledTimes(1);
      expect(mockedBlockBlobClient.upload).toHaveBeenCalledWith(
        FILE_CONTENTS,
        Buffer.byteLength(FILE_CONTENTS),
        { metadata },
      );
    });

    test('GIVEN upload fails WHEN called THEN the AzureBlobError is thrown', async () => {
      const EXPECTED_ERROR_CODE = '400';
      mockedBlockBlobClient.upload.mockResolvedValue({
        errorCode: EXPECTED_ERROR_CODE,
      } as AZURE_BLOB.BlockBlobUploadResponse);
      const error = new AzureBlobError('Failed to upload a file', undefined, {
        errorCode: EXPECTED_ERROR_CODE,
        containerName: CONTAINER_NAME,
        fileName: FILE_NAME,
        fileSize: FILE_CONTENTS.length,
      });

      await expect(() => blobClient.uploadFile(CONTAINER_NAME, FILE_NAME, FILE_CONTENTS)).rejects.toThrow(error);
    });
  });
});
