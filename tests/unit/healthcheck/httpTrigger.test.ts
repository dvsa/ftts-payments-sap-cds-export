import { mock } from 'jest-mock-extended';
import { HttpRequest } from '@azure/functions';
import * as Healthcheck from '@dvsa/healthcheck';
import * as Dynamics from '../../../src/crm/dynamics/dynamicsWebApi';
import { httpTrigger } from '../../../src/healthcheck/httpTrigger';
import { mockedContext } from '../../mocks/context.mock';
import { mockedConfig } from '../../mocks/config.mock';
import { mockedLogger } from '../../mocks/logger.mock';
import { BusinessTelemetryEvent } from '../../../src/observability/logger';

jest.mock('../../../src/observability/logger');
jest.mock('../../../src/config');

jest.mock('../../../src/crm/dynamics/dynamicsWebApi');
const mockedNewDynamicsWebApi = jest.mocked(Dynamics.newDynamicsWebApi);
const mockedTokenCredential = jest.mocked(Dynamics.chainedTokenCredential);

jest.mock('@dvsa/healthcheck');
const mockedAzureBlobHealthcheck = jest.mocked(Healthcheck.azureBlobHealthcheck, true);
const mockedCdsHealthcheck = jest.mocked(Healthcheck.cdsHealthcheck, true);

describe('healthcheck', () => {
  const httpRequest = mock<HttpRequest>();
  const azureBlobConnectionString = 'connection';
  const azureBlobContainerName = 'container';
  const azureBlobError = new Error('azure blob failed');
  const crmUri = 'https://crm.com';
  const cdsError = new Error('cds failed');
  const azureBlobServiceUnavailableError: Healthcheck.ServiceUnavailableError = {
    component: Healthcheck.Component.AZURE_BLOB_STORAGE,
    message: 'azure blob failed',
  };
  const cdsServiceUnavailableError: Healthcheck.ServiceUnavailableError = {
    component: Healthcheck.Component.CDS,
    message: 'cds failed',
  };

  beforeEach(() => {
    mockedConfig.azureBlob.storageConnectionString = azureBlobConnectionString;
    mockedConfig.azureBlob.containerName = azureBlobContainerName;
    mockedConfig.crm.azureAdUri = crmUri;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('GIVEN request WHEN no errors THEN return http status 200', async () => {
    mockedAzureBlobHealthcheck.mockResolvedValue(undefined);
    mockedCdsHealthcheck.mockResolvedValue(undefined);

    await httpTrigger(mockedContext, httpRequest);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect((mockedContext.res)!.status).toBe(200);
    expect(mockedAzureBlobHealthcheck).toHaveBeenCalledTimes(1);
    expect(mockedAzureBlobHealthcheck).toHaveBeenCalledWith(
      azureBlobConnectionString,
      azureBlobContainerName,
    );
    expect(mockedCdsHealthcheck).toHaveBeenCalledTimes(1);
    expect(mockedCdsHealthcheck).toHaveBeenCalledWith(
      mockedTokenCredential,
      crmUri,
      mockedNewDynamicsWebApi(),
    );
    expect(mockedLogger.info).toHaveBeenCalledTimes(1);
    expect(mockedLogger.info).toHaveBeenCalledWith('Trying to invoke healthcheck function');
    expect(mockedLogger.logEvent).toHaveBeenCalledTimes(1);
    expect(mockedLogger.logEvent).toHaveBeenCalledWith(
      BusinessTelemetryEvent.HEALTH_CHECK_SUCCESS,
      'Components are healthy',
      {
        components: [
          Healthcheck.Component.AZURE_BLOB_STORAGE,
          Healthcheck.Component.CDS,
        ],
      },
    );
  });

  test('GIVEN request WHEN azure blob error THEN return http status 503 with proper body', async () => {
    mockedAzureBlobHealthcheck.mockResolvedValue(azureBlobError);
    mockedCdsHealthcheck.mockResolvedValue(undefined);

    await httpTrigger(mockedContext, httpRequest);

    expect(mockedContext.res).toEqual({
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
      body: new Healthcheck.ServiceUnavailableResponse([azureBlobServiceUnavailableError]),
    });
    expect(mockedAzureBlobHealthcheck).toHaveBeenCalledWith(
      azureBlobConnectionString,
      azureBlobContainerName,
    );
    expect(mockedCdsHealthcheck).toHaveBeenCalledWith(
      mockedTokenCredential,
      crmUri,
      mockedNewDynamicsWebApi(),
    );
    expect(mockedLogger.info).toHaveBeenCalledWith('Trying to invoke healthcheck function');
    expect(mockedLogger.logEvent).toHaveBeenCalledWith(
      BusinessTelemetryEvent.HEALTH_CHECK_FAILED,
      'At least one component is unhealthy',
      {
        errors: [azureBlobServiceUnavailableError],
      },
    );
  });

  test('GIVEN request WHEN cds error THEN return http status 503 with proper body', async () => {
    mockedAzureBlobHealthcheck.mockResolvedValue(undefined);
    mockedCdsHealthcheck.mockResolvedValue(cdsError);

    await httpTrigger(mockedContext, httpRequest);

    expect(mockedContext.res).toEqual({
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
      body: new Healthcheck.ServiceUnavailableResponse([cdsServiceUnavailableError]),
    });
    expect(mockedAzureBlobHealthcheck).toHaveBeenCalledWith(
      azureBlobConnectionString,
      azureBlobContainerName,
    );
    expect(mockedCdsHealthcheck).toHaveBeenCalledWith(
      mockedTokenCredential,
      crmUri,
      mockedNewDynamicsWebApi(),
    );
    expect(mockedLogger.info).toHaveBeenCalledWith('Trying to invoke healthcheck function');
    expect(mockedLogger.logEvent).toHaveBeenCalledWith(
      BusinessTelemetryEvent.HEALTH_CHECK_FAILED,
      'At least one component is unhealthy',
      {
        errors: [cdsServiceUnavailableError],
      },
    );
  });

  test('GIVEN request WHEN all errors THEN return http status 503 with proper body', async () => {
    mockedAzureBlobHealthcheck.mockResolvedValue(azureBlobError);
    mockedCdsHealthcheck.mockResolvedValue(cdsError);

    await httpTrigger(mockedContext, httpRequest);

    expect(mockedContext.res).toEqual({
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
      body: new Healthcheck.ServiceUnavailableResponse([azureBlobServiceUnavailableError, cdsServiceUnavailableError]),
    });
    expect(mockedAzureBlobHealthcheck).toHaveBeenCalledWith(
      azureBlobConnectionString,
      azureBlobContainerName,
    );
    expect(mockedCdsHealthcheck).toHaveBeenCalledWith(
      mockedTokenCredential,
      crmUri,
      mockedNewDynamicsWebApi(),
    );
    expect(mockedLogger.info).toHaveBeenCalledWith('Trying to invoke healthcheck function');
    expect(mockedLogger.logEvent).toHaveBeenCalledWith(
      BusinessTelemetryEvent.HEALTH_CHECK_FAILED,
      'At least one component is unhealthy',
      {
        errors: [azureBlobServiceUnavailableError, cdsServiceUnavailableError],
      },
    );
  });

  test('GIVEN request WHEN error not from tested components THEN returns http status 500 and log proper event', async () => {
    const otherError = new Error();
    mockedAzureBlobHealthcheck.mockRejectedValue(otherError);

    await httpTrigger(mockedContext, httpRequest);

    expect(mockedContext.res).toEqual({
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        code: 500,
        message: 'No additional error details',
      },
    });
    expect(mockedLogger.info).toHaveBeenCalledTimes(1);
    expect(mockedLogger.info).toHaveBeenCalledWith('Trying to invoke healthcheck function');
    expect(mockedLogger.error).toHaveBeenCalledTimes(1);
    expect(mockedLogger.logEvent).toHaveBeenCalledTimes(1);
    expect(mockedLogger.logEvent).toHaveBeenCalledWith(
      BusinessTelemetryEvent.HEALTH_CHECK_FAILED,
      'No additional error details',
    );
  });
});
