import * as JEST_DATE_MOCK from 'jest-date-mock';
import { nonHttpTriggerContextWrapper, getOperationId } from '@dvsa/azure-logger';
import { mockedContext } from '../../mocks/context.mock';
import { mockedLogger } from '../../mocks/logger.mock';
import { mockedConfig } from '../../mocks/config.mock';
import { timerTrigger, index as wrappedTimerTrigger } from '../../../src/exporter/index';
import exporter from '../../../src/exporter/exporter';
import { ManualTriggerError } from '../../../src/exporter/manualTriggerError';
import handleError from '../../../src/error/handleError';

jest.mock('@dvsa/azure-logger');
jest.mock('../../../src/config');
jest.mock('../../../src/observability/logger');
jest.mock('../../../src/exporter/exporter');
const mockedExporter = jest.mocked(exporter, true);

jest.mock('../../../src/error/handleError');
const mockedHandleError = jest.mocked(handleError, true);

const DEFAULT_EXPORT_DATE = new Date('2019-12-31');
const MANUAL_TRIGGER_EXPORT_DATE = new Date('2020-05-05');
const CONTAINER_NAME = 'containerName';

const mockedGetOperationId = jest.mocked(getOperationId, true);

describe('exporterTimerTrigger', () => {
  const operationId = '9df62cb5-be0f-4f6d-916d-8e238fd70ad7';

  beforeEach(() => {
    JEST_DATE_MOCK.advanceTo(new Date('2020-01-01'));
    mockedConfig.azureBlob.containerName = CONTAINER_NAME;
    mockedGetOperationId.mockReturnValue(operationId);
  });


  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('default invoking', () => {
    test('GIVEN time trigger context WHEN invoke exporterTimerTrigger THEN exporter function is called with default export date', async () => {
      await timerTrigger(mockedContext);

      expect(mockedExporter).toHaveBeenCalledWith(operationId, CONTAINER_NAME, DEFAULT_EXPORT_DATE);
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Trying to run exporter',
        {
          operationId,
          exportDate: DEFAULT_EXPORT_DATE,
        },
      );
    });

    test('GIVEN time trigger context WHEN invoke exporterTimerTrigger THEN throw an error', async () => {
      const error = new Error('exporterTimerTrigger failed');
      mockedExporter.mockRejectedValue(error);

      await timerTrigger(mockedContext);

      expect(mockedExporter).toHaveBeenCalledWith(operationId, CONTAINER_NAME, DEFAULT_EXPORT_DATE);
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Trying to run exporter',
        {
          operationId,
          exportDate: DEFAULT_EXPORT_DATE,
        },
      );
      expect(mockedHandleError).toHaveBeenCalledWith(error);
    });
  });

  describe('manual invoking', () => {
    test('GIVEN time trigger context WHEN invoke exporterTimerTrigger manually THEN exporter function is called with input date', async () => {
      const manualTriggerContext = mockedContext;
      manualTriggerContext.bindingData.exporterTimerTrigger = '2020-05-05';

      await timerTrigger(manualTriggerContext);

      expect(mockedExporter).toHaveBeenCalledWith(operationId, CONTAINER_NAME, MANUAL_TRIGGER_EXPORT_DATE);
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Trying to run exporter',
        {
          operationId,
          exportDate: MANUAL_TRIGGER_EXPORT_DATE,
        },
      );
    });

    test('GIVEN time trigger context with wrong date WHEN invoke exporterTimerTrigger manually THEN ManualTriggerError is thrown', async () => {
      const manualTriggerContext = mockedContext;
      manualTriggerContext.bindingData.exporterTimerTrigger = '2020-15-05';

      await timerTrigger(manualTriggerContext);

      expect(mockedExporter).toHaveBeenCalledTimes(0);
      expect(mockedLogger.info).toHaveBeenCalledTimes(0);
      expect(mockedHandleError).toHaveBeenCalledWith(
        new ManualTriggerError('Failed to manually trigger a function. Invalid input date'),
      );
    });
  });

  describe('wrapped timerTrigger', () => {
    test('GIVEN azure function WHEN invoke wrapper THEN wrapped function is invoked', async () => {
      await wrappedTimerTrigger(mockedContext);

      expect(nonHttpTriggerContextWrapper).toHaveBeenCalledWith(expect.any(Function), mockedContext);
    });
  });
});
