/* eslint-disable @typescript-eslint/no-empty-function */
import { Address, addressParser } from '@dvsa/egress-filtering';
import config from '../config';

export const ALLOWED_ADDRESSES: Array<Address> = [
  addressParser.parseUri(config.crm.azureAdUri || ''),
  ...addressParser.parseConnectionString(config.azureBlob.storageConnectionString),
];
