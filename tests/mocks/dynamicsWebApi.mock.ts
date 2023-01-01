import DynamicsWebApi from 'dynamics-web-api';
import { mock } from 'jest-mock-extended';
import { newDynamicsWebApi } from '../../src/crm/dynamics/dynamicsWebApi';

jest.mock('../../src/crm/dynamics/dynamicsWebApi');

const mockedNewDynamicsWebApi = jest.mocked(newDynamicsWebApi);

mockedNewDynamicsWebApi.mockImplementation(
  (): DynamicsWebApi => mockedDynamicsWebApi,
);

export const mockedDynamicsWebApi = mock<DynamicsWebApi>();
