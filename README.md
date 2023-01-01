# FTTS-PAYMENTS-SAP-CDS-EXPORT

CDS Export application

CDS Export application with Exporter function, which starts the process of getting the payments from CRM and uploading them to Azure Blob storage for further processing in the specified interval (by default once a day at 1:00 AM).
This interval can be configured in the local.settings.json file with EXPORTER_CRON_TIMER parameter. For testing purposes you can change it with a CRON expression, e.g. every minute - "0 */1 * * * *".

## Getting Started

Project is based on Node.js and Azure Functions.

### Dependencies

- Node.js installed on local machine (v16.18.1) https://nodejs.org/en/
- The following packages may need to be installed globally (`npm install -g`) to avoid errors:
- azure-functions-core-tools@3.0.2245
- azurite https://github.com/Azure/Azurite

### Local Settings

Create a local.settings.json file by running `npm run copy-config`

By default Azure Functions are using UTC time zone. In FTTS envioronments we are setting WEBSITE_TIME_ZONE variable to change it to GMT. Reference: https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer?tabs=csharp#ncrontab-expressions 

### Azure Blob Storage

### for local development with Azurite:
### DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1
### for connection with the cloud storage:
### DefaultEndpointsProtocol=https;AccountName=<account_name>;AccountKey=<account_key>;EndpointSuffix=core.windows.net

```typescript
SAP_INTEGRATION_FILE_STORAGE=
AZURE_BLOB_CONTAINER_NAME=
```

Run `npm install && npm run start`
The CDS Export application will listen on port 7075.

## Local storage
To run CDS Export app on local machine you need storage emulator.

On Windows it can be Azure Storage Emulator https://docs.microsoft.com/en-us/azure/storage/common/storage-use-emulator

On Mac OS or Linux you need Azurite https://github.com/Azure/Azurite. Preferred way to launch it is Docker:
```bash
docker pull mcr.microsoft.com/azure-storage/azurite
```
and then
```bash
docker run -p 10000:10000 -p 10001:10001 mcr.microsoft.com/azure-storage/azurite
```

## Time triggered functions
Time triggered functions don't expose REST endpoint, but can be launched manually by HTTP request. Please follow Microsoft tutorial https://docs.microsoft.com/en-us/azure/azure-functions/functions-manually-run-non-http.

URL <application_url>/admin/functions/V1_Exporter

By default, function will process the financial transactions for yesterday's date. To run Exporter function for specific date you can invoke time trigger function manually with example body:
```json
{
    "input": "2020-01-23"
}
```

## Roles validation

Roles validation is enabled by default on all environmemnts. It can be disabled by setting ROLES_VALIDATION environment variable (boolean).

## Healthcheck HTTP endpoint

Payments SAP SFTP Push healthcheck function is a troubleshooting/support function to check connectivity with specific components used by application

GET <payments-sap-sftp-push-url>/api/<version>/healthcheck - e.g. /api/v1/healthcheck

Responses:

- HTTP 200 (connections OK)

- HTTP 503 with response body containing specific errors details:

```json
{
  "status": "Service unavailable",
  "errors": [
    {
      "component": "<COMPONENT_NAME>",
      "message": "<ERROR_MESSAGE>",
    }
  ]
}
```

## Retrieving original bookings configuration

Retrieving original bookings is a recursive process, which is configured by environment variables:
- ``SAPEXP_ORIG_BOOKING_MAX_NESTING``: numeric variable, controls how many nested "Expand" queries are used. Due to Dataverse limits, this value cannot be larger than 10. Recommended value: __5__
- ``SAPEXP_ORIG_BOOKING_MAX_ITERATIONS_NUMBER``: numeric variable, controls how many times (at max) application will repeat query for retrieving original bookings, in case if nested query will be not enough