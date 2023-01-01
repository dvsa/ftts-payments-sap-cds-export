import DynamicsWebApi from 'dynamics-web-api';
import { ChainedTokenCredential, ClientSecretCredential, ManagedIdentityCredential, TokenCredential } from '@dvsa/ftts-auth-client';

import config from '../../config';
import { logger } from '../../observability/logger';

const sources: TokenCredential[] = [new ManagedIdentityCredential(config.crm.userAssignedEntityClientId)];
if (config.azureTenantId && config.crm.azureClientId && config.crm.azureClientSecret) {
  sources.push(new ClientSecretCredential(config.azureTenantId, config.crm.azureClientId, config.crm.azureClientSecret));
}
// For CRM healthcheck
export const chainedTokenCredential = new ChainedTokenCredential(...sources);

export const onTokenRefresh = async (dynamicsWebApiCallback: (token: string) => void): Promise<void> => {
  try {
    const accessToken = await chainedTokenCredential.getToken(config.crm.scope);
    dynamicsWebApiCallback(accessToken?.token);
  } catch (error) {
    logger.error(error as Error, `newDynamicsWebApi::onTokenRefresh: Failed to authenticate with CRM - ${(error as Error)?.message}`);
    // Callback needs to be called - to prevent function from hanging
    dynamicsWebApiCallback('');
  }
};

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
