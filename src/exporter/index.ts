import { AzureFunction, Context } from '@azure/functions';
import { nonHttpTriggerContextWrapper, getOperationId } from '@dvsa/azure-logger';
import { withEgressFiltering } from '@dvsa/egress-filtering';

import { logger } from '../observability/logger';
import exporter from './exporter';
import { ManualTriggerError } from './manualTriggerError';
import handleError from '../error/handleError';
import config from '../config';
import { ALLOWED_ADDRESSES } from '../security/EgressFilterSetup';

export const timerTrigger: AzureFunction = async function exporterTimerTrigger(context: Context): Promise<void> {
  try {
    const operationId = getOperationId(context);
    const exportDate = getExportDate(context);
    logger.info(
      'Trying to run exporter',
      {
        operationId,
        exportDate,
      },
    );
    await exporter(
      operationId,
      config.azureBlob.containerName,
      exportDate,
    );
  } catch (error) {
    handleError(error);
  }
};

export const index = (context: Context): Promise<void> => nonHttpTriggerContextWrapper(
  withEgressFiltering(timerTrigger, ALLOWED_ADDRESSES, handleError, logger),
  context,
);

function getExportDate(context: Context): Date {
  if (context.bindingData.exporterTimerTrigger) {
    return getExportDateFromManualTrigger(context.bindingData.exporterTimerTrigger);
  }
  return getDefaultExportDate();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getExportDateFromManualTrigger(inputDate: any): Date {
  // eslint-disable-next-line no-restricted-globals
  const isValidDate = !isNaN(Date.parse(inputDate as string));
  if (!isValidDate) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    throw new ManualTriggerError('Failed to manually trigger a function. Invalid input date', { inputDate });
  }
  return new Date(inputDate as string);
}

function getDefaultExportDate(): Date {
  const defaultDate = new Date();
  defaultDate.setDate(new Date().getDate() - 1);
  return defaultDate;
}
