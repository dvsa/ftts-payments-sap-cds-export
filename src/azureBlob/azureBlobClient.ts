import {
  BlobServiceClient,
  BlockBlobUploadResponse,
  ContainerClient,
  Metadata,
} from '@azure/storage-blob';
import { AzureBlobError } from './azureBlobError';
import { newAzureBlobServiceClient } from './azureBlobServiceClient';

export class AzureBlobClient {
  constructor(
    private blobServiceClient: BlobServiceClient,
  ) { }

  public async fileExists(
    containerName: string,
    fileName: string,
  ): Promise<boolean> {
    const containerClient: ContainerClient = this.blobServiceClient.getContainerClient(
      containerName,
    );
    if (!await containerClient.exists()) {
      return false;
    }
    return containerClient
      .getBlockBlobClient(fileName)
      .exists();
  }

  public async uploadFile(
    containerName: string,
    fileName: string,
    fileContents: string,
    metadata?: Metadata,
  ): Promise<void> {
    const containerClient: ContainerClient = this.blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
    const blobBlockClient = containerClient.getBlockBlobClient(fileName);
    if (await blobBlockClient.exists()) {
      throw new AzureBlobError(
        'The file already exists',
        undefined,
        {
          containerName,
          fileName,
          fileSize: Buffer.byteLength(fileContents),
        },
      );
    }
    const uploadResponse: BlockBlobUploadResponse = await blobBlockClient
      .upload(
        fileContents,
        Buffer.byteLength(fileContents),
        { metadata },
      );
    if (uploadResponse.errorCode) {
      throw new AzureBlobError(
        'Failed to upload a file',
        undefined,
        {
          errorCode: uploadResponse.errorCode,
          containerName,
          fileName,
          fileSize: Buffer.byteLength(fileContents),
        },
      );
    }
  }
}

export const newAzureBlobClient = (): AzureBlobClient => new AzureBlobClient(
  newAzureBlobServiceClient(),
);
