import { ChainedTokenCredential } from '@dvsa/ftts-auth-client';
import { mockedConfig } from '../../../mocks/config.mock';
import { mockedLogger } from '../../../mocks/logger.mock';
import { onTokenRefresh, webApiUrl } from '../../../../src/crm/dynamics/dynamicsWebApi';

jest.mock('../../../../src/config');
jest.mock('../../../../src/observability/logger');

jest.mock('@dvsa/ftts-auth-client');
const mockedChainedTokenCredential = jest.mocked(ChainedTokenCredential, true);

describe('DynamicsWebApi', () => {
  describe('webApiUrl', () => {
    test('GIVEN config.crm.azureAdUri WHEN called THEN returns a proper url', () => {
      mockedConfig.crm.azureAdUri = 'CRM_AZURE_AD_URI';

      const url = webApiUrl();

      expect(url).toBe(`${mockedConfig.crm.azureAdUri}/api/data/v9.1/`);
    });
  });

  describe('onTokenRefresh', () => {
    beforeEach(() => {
      mockedConfig.azureTenantId = 'TENANT_ID';
      mockedConfig.crm.azureAdUri = 'CRM_AZURE_AD_URI';
      mockedConfig.crm.azureClientId = 'CRM_AZURE_CLIENT_ID';
      mockedConfig.crm.azureClientSecret = 'CRM_AZURE_SECRET';
      mockedConfig.crm.tokenUrl = 'CRM_TOKEN_URL';
      mockedConfig.crm.scope = 'CRM_SCOPE_URL';
      jest.clearAllMocks();
    });

    test('GIVEN valid credentials WHEN called THEN returns a new token', async () => {
      const expectedAccessToken = {
        token: 'thisIsAFakeTokenForTestingPurposes',
        expiresOnTimestamp: 213,
      };

      mockedChainedTokenCredential.prototype.getToken.mockResolvedValue(expectedAccessToken);

      let actualToken = 'TEST';
      const callback: (token: string) => void = (token) => {
        actualToken = token;
      };
      await onTokenRefresh(callback);

      
      expect(mockedChainedTokenCredential.prototype.getToken).toHaveBeenCalledWith('CRM_SCOPE_URL');
      expect(actualToken).toEqual(expectedAccessToken.token);
      expect(mockedLogger.error).toHaveBeenCalledTimes(0);
    });

    test('GIVEN getToken fails WHEN called THEN returns empty string', async () => {
      const crmError = new Error('fail');
      mockedChainedTokenCredential.prototype.getToken.mockRejectedValue(crmError);

      let actualToken = 'TEST';
      const callback: (token: string) => void = (token) => {
        actualToken = token;
      };
      await onTokenRefresh(callback);

      expect(mockedChainedTokenCredential.prototype.getToken).toHaveBeenCalledWith('CRM_SCOPE_URL');
      expect(actualToken).toBe('');
      expect(mockedLogger.error).toHaveBeenCalledTimes(1);
      expect(mockedLogger.error).toHaveBeenCalledWith(
        crmError,
        'newDynamicsWebApi::onTokenRefresh: Failed to authenticate with CRM - fail',
      );
    });
  });
});
