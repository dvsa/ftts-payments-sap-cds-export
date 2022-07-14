import DynamicsWebApi from 'dynamics-web-api';
import { clientSecretAuthClient } from '@dvsa/ftts-auth-client';
import {
  TokenCredential,
  ClientSecretCredential,
} from '@azure/identity';
import config from '../../config';
import { logger } from '../../observability/logger';

// For CRM healthcheck
export const tokenCredential: TokenCredential = new ClientSecretCredential(
  config.azureTenantId,
  config.crm.azureClientId,
  config.crm.azureClientSecret,
);

export async function onTokenRefresh(
  dynamicsWebApiCallback: (token: string) => void,
): Promise<void> {
  try {
    const accessToken = await clientSecretAuthClient.getToken({
      url: config.crm.tokenUrl,
      clientId: config.crm.azureClientId,
      clientSecret: config.crm.azureClientSecret,
      resource: config.crm.azureAdUri,
    });
    dynamicsWebApiCallback(accessToken.value);
  } catch (error) {
    logger.error(error as Error, `Failed to authenticate with CRM - ${(error as Error).message}`);
    // Callback needs to be called - to prevent function from hanging
    dynamicsWebApiCallback('');
  }
}

export function webApiUrl(): string {
  return `${config.crm.azureAdUri}/api/data/v9.1/`;
}

export function newDynamicsWebApi(): DynamicsWebApi {
  return new DynamicsWebApi({
    webApiUrl: webApiUrl(),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    onTokenRefresh,
  });
}
