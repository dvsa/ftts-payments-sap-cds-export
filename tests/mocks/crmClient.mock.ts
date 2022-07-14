// To use this mock add  - jest.mock('..path/src/crm/crmClient') in your test file
import { mock } from 'jest-mock-extended';
import * as CRM from '../../src/crm/crmClient';

const mockedNewCrmClient = jest.mocked(CRM.newCrmClient);

mockedNewCrmClient.mockImplementation(
  (): CRM.CrmClient => mockedCrmClient,
);

export * from '../../src/crm/crmClient';

export const mockedCrmClient = mock<CRM.CrmClient>();
