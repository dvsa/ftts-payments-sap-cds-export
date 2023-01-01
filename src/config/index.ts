export interface Config {
  appName: string,
  azureTenantId: string,

  crm: {
    tokenUrl: string,
    azureAdUri: string,
    azureClientId: string,
    azureClientSecret: string,
    userAssignedEntityClientId: string,
    scope: string,
  },

  azureBlob: {
    storageConnectionString: string,
    containerName: string,
  },

  security: {
    rolesValidation: string,
  },

  originalBookings: {
    maxExpandNesting: string | number,
    maxIterationsNumber: string | number,
  },
}

const config: Config = {
  appName: process.env.APP_NAME || '',
  azureTenantId: process.env.AZURE_TENANT_ID || '',

  crm: {
    tokenUrl: process.env.SAPEXP_CDS_TOKEN_URL || '',
    azureAdUri: process.env.SAPEXP_CDS_RESOURCE_URL || '',
    azureClientId: process.env.SAP_CDS_CLIENT_ID || '',
    azureClientSecret: process.env.SAP_CDS_CLIENT_SECRET || '',
    userAssignedEntityClientId: process.env.USER_ASSIGNED_ENTITY_CLIENT_ID || '',
    scope: process.env.CRM_SCOPE || '',
  },

  azureBlob: {
    storageConnectionString: process.env.SAP_INTEGRATION_FILE_STORAGE || '',
    containerName: process.env.AZURE_BLOB_CONTAINER_NAME || '',
  },

  security: {
    rolesValidation: process.env.ROLES_VALIDATION || 'true',
  },

  originalBookings: {
    maxExpandNesting: process.env.SAPEXP_ORIG_BOOKING_MAX_NESTING || 5,
    maxIterationsNumber: process.env.SAPEXP_ORIG_BOOKING_MAX_ITERATIONS_NUMBER || 5,
  },
};

export default config;
