/* eslint-disable jest/unbound-method */
/* eslint-disable no-template-curly-in-string */
import { when } from 'jest-when';
import * as JEST_DATE_MOCK from 'jest-date-mock';
import mockFs from 'mock-fs';
import { MultipleResponse } from 'dynamics-web-api';
import { mockedContext } from '../../mocks/context.mock';
import { mockedDynamicsWebApi } from '../../mocks/dynamicsWebApi.mock';
import { mockedLogger } from '../../mocks/logger.mock';
import * as CRM from '../../../src/crm/crmClient';
import * as Payment from '../../../src/crm/payments/paymentInformation';
import * as FttsPayment from '../../../src/crm/payments/fttsPaymentInformation';
import { CrmError } from '../../../src/crm/crmError';
import { Product } from '../../../src/crm/payments/product';
import { BusinessTelemetryEvent } from '../../../src/observability/logger';
import { OwedCompensationOriginalBookingProduct } from '../../../src/crm/bookings/bookingsHelper';

describe('CrmClient', () => {
  const DATE = new Date('2020-01-01');
  const PFA_BOOKIG_RECOGNISED_SAME_DAY: FttsPayment.FttsPaymentInformation = {
    ftts_financetransactionid: '10',
    ftts_posteddate: DATE,
    ftts_recogniseddate: DATE,
    ftts_type: FttsPayment.FinanceTransactionType.PFA_BOOKING,
    ftts_status: FttsPayment.FinanceTransactionStatus.RECOGNISED,
    ftts_invoiceid: 'FTT-F9587E4A82C55-201012101109',
    createdon: DATE,
    'payment.ftts_reference': 'FTTS-01-20200629-092614-330C3B39',
    'payment.ftts_scheme': FttsPayment.PaymentScheme.FTTS,
    'payment.ftts_origin': FttsPayment.PaymentOrigin.IHTTC_PORTAL,
    'payment.person.ftts_personreference': '01-20200629-092614-330C3B39',
    'payment.person.address1_line1': '1 City Rd',
    'payment.person.address1_city': 'Birmingham',
    'payment.person.address1_postalcode': 'NE70 6YQ',
    'bookingproduct.ftts_reference': '11-20200629-092614-330C3B67',
    'bookingproduct.ftts_testdate': DATE,
    'bookingproduct.ftts_price': 23,
    'bookingproduct.product.name': 'LGV - CPC',
    'account.name': 'Account Name',
    'account.ftts_siteid': 'site-id',
    'account.address1_line1': '1 City Rd',
    'account.address1_city': 'London',
    'account.address1_postalcode': 'NE70 6YQ',
  };
  const FETCH_XML_EMPTY_RESPONSE: MultipleResponse<FttsPayment.FttsPaymentInformation> = {};
  const BOOKING_AND_PFA_BOOKING_FETCH_XML_FILE_NAME = 'bookingAndPfaBookingPaymentInformations.xml';
  const BOOKING_AND_PFA_BOOKING_FETCH_XML_TEMPLATE = '<fetch>...${TYPE_BOOKING}...${TYPE_PFA_BOOKING}...${DATE}...${STATUS_DUPLICATE}...</fetch>';
  const BOOKING_AND_PFA_BOOKING_FETCH_XML_WITH_GIVEN_DATE = '<fetch>...675030004...675030001...2020-01-01...675030002...</fetch>';
  const BOOKING_AND_PFA_BOOKING_FETCH_XML_RESPONSE: MultipleResponse<FttsPayment.FttsPaymentInformation> = {
    value: [
      PFA_BOOKIG_RECOGNISED_SAME_DAY,
    ],
  };
  const RECOGNISED_FETCH_XML_FILE_NAME = 'recognisedPaymentInformations.xml';
  const RECOGNISED_FETCH_XML_TEMPLATE = '<fetch>...${STATUS_RECOGNISED}...${DATE}...</fetch>';
  const RECOGNISED_FETCH_XML_WITH_GIVEN_DATE = '<fetch>...675030001...2020-01-01...</fetch>';
  const RECOGNISED_FETCH_XML_RESPONSE: MultipleResponse<FttsPayment.FttsPaymentInformation> = {
    value: [
      PFA_BOOKIG_RECOGNISED_SAME_DAY,
      { ...PFA_BOOKIG_RECOGNISED_SAME_DAY, ftts_owedcompensationbookingdate: DATE },
    ],
  };
  const PFA_BOOKING_REFUND_FETCH_XML_FILE_NAME = 'pfaBookingRefundPaymentInformations.xml';
  const PFA_BOOKING_REFUND_FETCH_XML_TEMPLATE = '<fetch>...${TYPE_PFA_BOOKING_REFUND}...${DATE}...${TYPE_PFA_BOOKING}...${STATUS_DUPLICATE}...</fetch>';
  const PFA_BOOKING_REFUND_FETCH_XML_WITH_GIVEN_DATE = '<fetch>...675030003...2020-01-01...675030001...675030002...</fetch>';
  const PFA_BOOKING_REFUND_FETCH_XML_RESPONSE: MultipleResponse<FttsPayment.FttsPaymentInformation> = {
    value: [
      {
        ftts_financetransactionid: '11',
        ftts_posteddate: DATE,
        ftts_type: FttsPayment.FinanceTransactionType.PFA_BOOKING_REFUND,
        ftts_status: FttsPayment.FinanceTransactionStatus.DEFERRED,
        'payment.ftts_reference': 'FTTS-01-20200629-092614-330C3B39',
        'payment.ftts_scheme': FttsPayment.PaymentScheme.FTTS,
        'payment.ftts_origin': FttsPayment.PaymentOrigin.IHTTC_PORTAL,
        'bookingproduct.ftts_reference': '11-20200629-092614-330C3B67',
        'bookingproduct.ftts_testdate': DATE,
        'bookingproduct.ftts_price': 23,
        'bookingproduct.product.name': 'LGV - CPC',
        'bookingproduct.financetransaction.ftts_invoiceid': 'FTT-F9587E4A82C55-201012101107',
        'bookingproduct.financetransaction.createdon': DATE,
        'account.name': 'Account Name',
        'account.ftts_siteid': 'site-id',
        'account.address1_line1': '1 City Rd',
        'account.address1_city': 'London',
        'account.address1_postalcode': 'NE70 6YQ',
      } as FttsPayment.FttsPaymentInformation,
    ],
  };
  const EXPECTED_PAYMENT_INFORMATIONS = [
    {
      'line identifier': '10',
      Scheme: 'FTTS',
      Country: 'GB',
      Activity: Payment.Activity.INVOICEPFA,
      'Invoice Number': 'FTT-F9587E4A82C55-201012101109',
      'Invoice Date': '01-Jan-20',
      'Invoice Posting Date': '01-Jan-20',
      'Payment Reference': 'FTTS0120200629092614330C3B39',
      Product: Product.LGV_CPC,
      'Test Reference': '11-20200629-092614-330C3B67',
      'Test cost without VAT': '23.00',
      'OAB Transfer value (gross)': '23.00',
      'Test Date': undefined,
      'Sales Person': 'Theory Test IHTTC',
      'Customer Number': 'site-id',
      'Long Text': 'site-id',
      'Inv - Customer Name': 'Account Name',
      'Inv - Address Line 1': '1 City Rd',
      'Inv - Address Line 2': undefined,
      'Inv - Address Line 3': undefined,
      'Inv - City': 'London',
      'Inv - Postal Code': 'NE70 6YQ',
    },
    {
      'line identifier': '10',
      Scheme: 'FTTS',
      Country: 'GB',
      Activity: Payment.Activity.TESTMATCH,
      'Invoice Number': 'FTT-F9587E4A82C55-201012101109',
      'Invoice Date': '01-Jan-20',
      'Invoice Posting Date': '01-Jan-20',
      'Payment Reference': 'FTTS0120200629092614330C3B39',
      Product: Product.LGV_CPC,
      'Test Reference': '11-20200629-092614-330C3B67',
      'Test cost without VAT': '23.00',
      'OAB Transfer value (gross)': '23.00',
      'Test Date': '01-Jan-20',
      'Sales Person': 'Theory Test IHTTC',
      'Customer Number': 'site-id',
      'Long Text': 'site-id',
      'Inv - Customer Name': 'Account Name',
      'Inv - Address Line 1': '1 City Rd',
      'Inv - Address Line 2': undefined,
      'Inv - Address Line 3': undefined,
      'Inv - City': 'London',
      'Inv - Postal Code': 'NE70 6YQ',
    },
    {
      'line identifier': '10',
      Scheme: 'FTTS',
      Country: 'GB',
      Activity: Payment.Activity.REVTESTM,
      'Invoice Number': 'FTT-F9587E4A82C55-201012101109',
      'Invoice Date': '01-Jan-20',
      'Invoice Posting Date': '01-Jan-20',
      'Payment Reference': 'FTTS0120200629092614330C3B39',
      Product: Product.LGV_CPC,
      'Test Reference': '11-20200629-092614-330C3B67',
      'Test cost without VAT': '23.00',
      'OAB Transfer value (gross)': '23.00',
      'Test Date': '01-Jan-20',
      'Sales Person': 'Theory Test IHTTC',
      'Customer Number': 'site-id',
      'Long Text': 'site-id',
      'Inv - Customer Name': 'Account Name',
      'Inv - Address Line 1': '1 City Rd',
      'Inv - Address Line 2': undefined,
      'Inv - Address Line 3': undefined,
      'Inv - City': 'London',
      'Inv - Postal Code': 'NE70 6YQ',
    },
    {
      'line identifier': '10',
      Scheme: 'FTTS',
      Country: 'GB',
      Activity: Payment.Activity.REFUNDOAB,
      'Invoice Number': 'FTT-F9587E4A82C55-201012101107',
      'Invoice Date': '01-Jan-20',
      'Invoice Posting Date': '01-Jan-20',
      'Payment Reference': 'FTTS0120200629092614330C3B39',
      Product: Product.LGV_CPC,
      'Test Reference': '11-20200629-092614-330C3B67',
      'Test cost without VAT': '23.00',
      'OAB Transfer value (gross)': '23.00',
      'Sales Person': 'Theory Test IHTTC',
      'Customer Number': 'site-id',
      'Long Text': 'site-id',
      'Inv - Customer Name': 'Account Name',
      'Inv - Address Line 1': '1 City Rd',
      'Inv - Address Line 2': undefined,
      'Inv - Address Line 3': undefined,
      'Inv - City': 'London',
      'Inv - Postal Code': 'NE70 6YQ',
    },
  ];
  const ERROR_MESSAGE = 'some error message';
  const BAD_REQUEST_ERROR = { message: ERROR_MESSAGE, status: 400 };
  const crmClient = CRM.newCrmClient(mockedContext);

  afterEach(() => {
    mockFs.restore();
    jest.clearAllMocks();
  });

  beforeEach(() => {
    JEST_DATE_MOCK.advanceTo(DATE);
    mockFs({
      './src/crm/payments': {
        'bookingAndPfaBookingPaymentInformations.xml':
          BOOKING_AND_PFA_BOOKING_FETCH_XML_TEMPLATE,
        'pfaBookingRefundPaymentInformations.xml':
          PFA_BOOKING_REFUND_FETCH_XML_TEMPLATE,
        'recognisedPaymentInformations.xml':
          RECOGNISED_FETCH_XML_TEMPLATE,
      },
    });
  });

  test('GIVEN date WHEN getPaymentInformations THEN returns an array of payment informations based on a given date', async () => {
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        BOOKING_AND_PFA_BOOKING_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(BOOKING_AND_PFA_BOOKING_FETCH_XML_RESPONSE);
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        RECOGNISED_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(RECOGNISED_FETCH_XML_RESPONSE);
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        PFA_BOOKING_REFUND_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(PFA_BOOKING_REFUND_FETCH_XML_RESPONSE);

    const paymentInformations = await crmClient.getPaymentInformations(DATE);

    expect(mockedDynamicsWebApi.fetchAll).toHaveBeenCalledTimes(3);
    expect(mockedLogger.info).toHaveBeenCalledTimes(8);
    expect(mockedLogger.info).toHaveBeenNthCalledWith(
      1,
      'CrmClient::getPaymentInformations: Trying to get payment informations',
      { date: '2020-01-01' },
    );
    expect(mockedLogger.info).toHaveBeenNthCalledWith(
      2,
      `CrmClient::fetchPaymentInformations: Trying to fetch data for ${BOOKING_AND_PFA_BOOKING_FETCH_XML_FILE_NAME} fetchXml file`,
    );
    expect(mockedLogger.info).toHaveBeenNthCalledWith(
      3,
      `CrmClient::fetchPaymentInformations: Successfully fetched data for ${BOOKING_AND_PFA_BOOKING_FETCH_XML_FILE_NAME} fetchXml file`,
    );
    expect(mockedLogger.info).toHaveBeenNthCalledWith(
      4,
      `CrmClient::fetchPaymentInformations: Trying to fetch data for ${RECOGNISED_FETCH_XML_FILE_NAME} fetchXml file`,
    );
    expect(mockedLogger.info).toHaveBeenNthCalledWith(
      5,
      `CrmClient::fetchPaymentInformations: Successfully fetched data for ${RECOGNISED_FETCH_XML_FILE_NAME} fetchXml file`,
    );
    expect(mockedLogger.info).toHaveBeenNthCalledWith(
      6,
      `CrmClient::fetchPaymentInformations: Trying to fetch data for ${PFA_BOOKING_REFUND_FETCH_XML_FILE_NAME} fetchXml file`,
    );
    expect(mockedLogger.info).toHaveBeenNthCalledWith(
      7,
      `CrmClient::fetchPaymentInformations: Successfully fetched data for ${PFA_BOOKING_REFUND_FETCH_XML_FILE_NAME} fetchXml file`,
    );
    expect(mockedLogger.info).toHaveBeenNthCalledWith(
      8,
      'CrmClient::getPaymentInformations: Successfully fetched 4 payment informations',
      { date: '2020-01-01' },
    );
    expect(paymentInformations).toHaveLength(4);
    expect(paymentInformations).toEqual(EXPECTED_PAYMENT_INFORMATIONS);
  });

  test('GIVEN date WHEN getPaymentInformations and two empty responses from CRM THEN returns an empty array of payment informations', async () => {
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        BOOKING_AND_PFA_BOOKING_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(FETCH_XML_EMPTY_RESPONSE);
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        RECOGNISED_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(FETCH_XML_EMPTY_RESPONSE);
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        PFA_BOOKING_REFUND_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(FETCH_XML_EMPTY_RESPONSE);

    const paymentInformations = await crmClient.getPaymentInformations(DATE);

    expect(mockedLogger.info).toHaveBeenCalledTimes(8);
    expect(mockedLogger.info).toHaveBeenNthCalledWith(
      8,
      'CrmClient::getPaymentInformations: Successfully fetched 0 payment informations',
      { date: '2020-01-01' },
    );
    expect(paymentInformations).toHaveLength(0);
    expect(paymentInformations).toEqual([]);
  });

  test('GIVEN date WHEN getPaymentInformations THEN returns an array of payment informations with Product and without TESTMATCH NI combination', async () => {
    const BOOKING_AND_PFA_BOOKING_WITH_UNSUPPORTED_PRODUCT_RESPONSE: MultipleResponse<FttsPayment.FttsPaymentInformation> = {
      value: [
        PFA_BOOKIG_RECOGNISED_SAME_DAY,
        {
          ...PFA_BOOKIG_RECOGNISED_SAME_DAY,
          'bookingproduct.product.name': 'Internal',
        },
      ],
    };
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        BOOKING_AND_PFA_BOOKING_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(BOOKING_AND_PFA_BOOKING_WITH_UNSUPPORTED_PRODUCT_RESPONSE);
    const RECOGNISED_WITH_NI_RESPONSE: MultipleResponse<FttsPayment.FttsPaymentInformation> = {
      value: [
        PFA_BOOKIG_RECOGNISED_SAME_DAY,
        { ...PFA_BOOKIG_RECOGNISED_SAME_DAY, ftts_owedcompensationbookingdate: DATE },
        {
          ...PFA_BOOKIG_RECOGNISED_SAME_DAY,
          'payment.ftts_origin': undefined,
          ftts_type: FttsPayment.FinanceTransactionType.BOOKING,
          'payment.ftts_scheme': FttsPayment.PaymentScheme.FTNI,
        },
      ],
    };
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        RECOGNISED_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(RECOGNISED_WITH_NI_RESPONSE);
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        PFA_BOOKING_REFUND_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(PFA_BOOKING_REFUND_FETCH_XML_RESPONSE);

    const paymentInformations = await crmClient.getPaymentInformations(DATE);

    expect(mockedDynamicsWebApi.fetchAll).toHaveBeenCalledTimes(3);

    expect(paymentInformations).toHaveLength(4);
    expect(paymentInformations).toEqual(EXPECTED_PAYMENT_INFORMATIONS);
    expect(paymentInformations
      .filter((pi: Payment.PaymentInformation) => pi.Country === Payment.Country.NI && pi.Activity === Payment.Activity.TESTMATCH))
      .toEqual([]);
    expect(paymentInformations
      .filter((pi: Payment.PaymentInformation) => !pi.Product))
      .toEqual([]);
  });

  test('GIVEN a record with missing test date WHEN getPaymentInformations THEN event is logged and record is filtered out', async () => {
    const RECOGNISED_MISSING_TEST_DATE_FETCH_XML_RESPONSE: MultipleResponse<FttsPayment.FttsPaymentInformation> = {
      value: [
        PFA_BOOKIG_RECOGNISED_SAME_DAY,
        {
          ...PFA_BOOKIG_RECOGNISED_SAME_DAY,
          'bookingproduct.ftts_testdate': undefined,
          'bookingproduct.testhistory.ftts_testdate': undefined,
        },
      ],
    };
    const expectedTestReference = RECOGNISED_MISSING_TEST_DATE_FETCH_XML_RESPONSE.value?.[0]?.['bookingproduct.ftts_reference'];
    const missingTestDateTestReference = RECOGNISED_MISSING_TEST_DATE_FETCH_XML_RESPONSE.value?.[1]?.['bookingproduct.ftts_reference'];
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        BOOKING_AND_PFA_BOOKING_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue({ value: [] });
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        PFA_BOOKING_REFUND_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue({ value: [] });
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        RECOGNISED_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(RECOGNISED_MISSING_TEST_DATE_FETCH_XML_RESPONSE);

    const paymentInformations = await crmClient.getPaymentInformations(DATE);

    expect(mockedDynamicsWebApi.fetchAll).toHaveBeenCalledTimes(3);
    expect(mockedLogger.event).toHaveBeenCalledWith(BusinessTelemetryEvent.SAP_CDS_MISSING_TEST_DATE, 'CrmClient::mapToPaymentInformations: Found record with missing test date', {
      testReference: missingTestDateTestReference,
    });
    expect(paymentInformations).toHaveLength(1);
    expect(paymentInformations[0]['Test Reference']).toBe(expectedTestReference);
  });

  test('GIVEN a booking product with multiple test history records WHEN getPaymentInformations THEN only the record with the earliest test date is kept', async () => {
    const RECOGNISED_MISSING_TEST_DATE_FETCH_XML_RESPONSE: MultipleResponse<FttsPayment.FttsPaymentInformation> = {
      value: [
        {
          ...PFA_BOOKIG_RECOGNISED_SAME_DAY,
          'bookingproduct.ftts_bookingproductid': '001',
          'bookingproduct.ftts_testdate': undefined,
          'bookingproduct.testhistory.ftts_testdate': new Date('2021-11-02'),
        },
        {
          ...PFA_BOOKIG_RECOGNISED_SAME_DAY,
          'bookingproduct.ftts_bookingproductid': '001',
          'bookingproduct.ftts_reference': 'expectedTestReference',
          'bookingproduct.ftts_testdate': undefined,
          'bookingproduct.testhistory.ftts_testdate': new Date('2021-11-01'),
        },
        {
          ...PFA_BOOKIG_RECOGNISED_SAME_DAY,
          'bookingproduct.ftts_bookingproductid': '001',
          // Another record for this booking product but with no test history record (should be kept)
        },
      ],
    };
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        BOOKING_AND_PFA_BOOKING_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue({ value: [] });
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        PFA_BOOKING_REFUND_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue({ value: [] });
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        RECOGNISED_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(RECOGNISED_MISSING_TEST_DATE_FETCH_XML_RESPONSE);

    const paymentInformations = await crmClient.getPaymentInformations(DATE);

    expect(mockedDynamicsWebApi.fetchAll).toHaveBeenCalledTimes(3);
    expect(paymentInformations).toHaveLength(2);
    expect(paymentInformations[1]['Test Reference']).toBe('expectedTestReference');
    expect(paymentInformations[1]['Test Date']).toBe('01-Nov-21');
  });

  test('GIVEN recognised compensation bookings WHEN getPaymentInformations THEN the owed compensation first original booking product reference is fetched and set as the Test Reference and the compensation booking reference appended to the Long Text field', async () => {
    const RECOGNISED_COMPENSATION_BOOKINGS_FETCH_XML_RESPONSE: MultipleResponse<FttsPayment.FttsPaymentInformation> = {
      value: [
        {
          ...PFA_BOOKIG_RECOGNISED_SAME_DAY,
          'bookingproduct.ftts_bookingproductid': '001',
          'bookingproduct.ftts_reference': 'B-001',
          'bookingproduct.ftts_owedcompensationoriginalbookingproduct': undefined,
          'account.ftts_siteid': 'S-001',
        },
        {
          ...PFA_BOOKIG_RECOGNISED_SAME_DAY,
          'bookingproduct.ftts_bookingproductid': '002',
          'bookingproduct.ftts_reference': 'B-002',
          'bookingproduct.ftts_owedcompensationoriginalbookingproduct': '002-ORIG',
          'account.ftts_siteid': 'S-002',
        },
      ],
    };
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        BOOKING_AND_PFA_BOOKING_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue({ value: [] });
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        PFA_BOOKING_REFUND_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue({ value: [] });
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        RECOGNISED_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(RECOGNISED_COMPENSATION_BOOKINGS_FETCH_XML_RESPONSE);
    mockedDynamicsWebApi.startBatch.mockImplementationOnce(() => { });
    mockedDynamicsWebApi.retrieveRequest.mockResolvedValueOnce(undefined);
    mockedDynamicsWebApi.executeBatch.mockResolvedValueOnce(
      [
        {
          ftts_bookingproductid: '002-ORIG',
          ftts_owedCompensationOriginalBookingProduct: {
            ftts_reference: 'B-002-SECOND-ORIG-REF',
            ftts_owedCompensationOriginalBookingProduct: {
              ftts_reference: 'B-002-FIRST-ORIG-REF',
              ftts_owedCompensationOriginalBookingProduct: null,
            },
          },
        },
      ],
    );

    const paymentInformations = await crmClient.getPaymentInformations(DATE);

    expect(mockedDynamicsWebApi.fetchAll).toHaveBeenCalledTimes(3);
    expect(mockedDynamicsWebApi.startBatch).toHaveBeenCalledTimes(1);
    expect(mockedDynamicsWebApi.retrieveRequest).toHaveBeenCalledTimes(1);
    expect(mockedDynamicsWebApi.retrieveRequest).toHaveBeenCalledWith({
      id: '002-ORIG',
      collection: 'ftts_bookingproducts',
      select: ['ftts_bookingproductid', 'ftts_reference'],
      expand: [{
        property: 'ftts_owedCompensationOriginalBookingProduct',
        select: ['ftts_bookingproductid', 'ftts_reference'],
        expand: [{
          property: 'ftts_owedCompensationOriginalBookingProduct',
          select: ['ftts_bookingproductid', 'ftts_reference'],
          expand: [{
            property: 'ftts_owedCompensationOriginalBookingProduct',
            select: ['ftts_bookingproductid', 'ftts_reference'],
            expand: [{
              property: 'ftts_owedCompensationOriginalBookingProduct',
              select: ['ftts_bookingproductid', 'ftts_reference'],
              expand: [{
                property: 'ftts_owedCompensationOriginalBookingProduct',
                select: ['ftts_bookingproductid', 'ftts_reference'],
                expand: [{
                  property: 'ftts_owedCompensationOriginalBookingProduct',
                  select: ['ftts_bookingproductid', 'ftts_reference'],
                }],
              }],
            }],
          }],
        }],
      }],
    });
    expect(mockedDynamicsWebApi.executeBatch).toHaveBeenCalledTimes(1);
    expect(paymentInformations).toHaveLength(2);
    expect(paymentInformations[0]['Test Reference']).toBe('B-001');
    expect(paymentInformations[0]['Long Text']).toBe('S-001');
    expect(paymentInformations[1]['Test Reference']).toBe('B-002-FIRST-ORIG-REF');
    expect(paymentInformations[1]['Long Text']).toBe('S-002 B-002');
  });

  test('GIVEN bulk (over 1k) recognised compensation bookings WHEN getPaymentInformations THEN the owed compensation original bookings are retrieved request by request in batches of 1000 (the CRM batch limit)', async () => {
    const compensationBookings = [];
    for (let i = 0; i < 2500; i++) {
      const booking = {
        ...PFA_BOOKIG_RECOGNISED_SAME_DAY,
        'bookingproduct.ftts_bookingproductid': 'TEST',
        'bookingproduct.ftts_reference': 'TEST',
        'bookingproduct.ftts_owedcompensationoriginalbookingproduct': `ORIG-${i + 1}`,
        'account.ftts_siteid': 'TEST',
      };
      compensationBookings.push(booking);
    }
    const RECOGNISED_COMPENSATION_BOOKINGS_FETCH_XML_RESPONSE: MultipleResponse<FttsPayment.FttsPaymentInformation> = {
      value: [
        {
          ...PFA_BOOKIG_RECOGNISED_SAME_DAY,
          'bookingproduct.ftts_bookingproductid': '001',
          'bookingproduct.ftts_reference': 'B-001',
          'bookingproduct.ftts_owedcompensationoriginalbookingproduct': undefined,
          'account.ftts_siteid': 'S-001',
        },
        ...compensationBookings,
      ],
    };
    const OWED_COMPENSATION_ORIGINAL_BOOKING_PRODUCTS: OwedCompensationOriginalBookingProduct[] = [];
    for (let i = 0; i < 2500; i++) {
      const booking = {
        ftts_bookingproductid: `ORIG-${i + 1}`,
        ftts_reference: 'ref-1',
        ftts_owedCompensationOriginalBookingProduct: null,
      };
      OWED_COMPENSATION_ORIGINAL_BOOKING_PRODUCTS.push(booking);
    }
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        BOOKING_AND_PFA_BOOKING_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue({ value: [] });
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        PFA_BOOKING_REFUND_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue({ value: [] });
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        RECOGNISED_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(RECOGNISED_COMPENSATION_BOOKINGS_FETCH_XML_RESPONSE);
    mockedDynamicsWebApi.startBatch.mockImplementation(() => { });
    mockedDynamicsWebApi.retrieveRequest.mockResolvedValue(undefined);
    mockedDynamicsWebApi.executeBatch.mockResolvedValue(OWED_COMPENSATION_ORIGINAL_BOOKING_PRODUCTS);

    await crmClient.getPaymentInformations(DATE);

    expect(mockedDynamicsWebApi.startBatch).toHaveBeenCalledTimes(3);
    expect(mockedDynamicsWebApi.executeBatch).toHaveBeenCalledTimes(3);
    expect(mockedDynamicsWebApi.retrieveRequest).toHaveBeenCalledTimes(2500);
    expect(mockedDynamicsWebApi.retrieveRequest).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'ORIG-1' }));
    expect(mockedDynamicsWebApi.retrieveRequest).toHaveBeenNthCalledWith(1000, expect.objectContaining({ id: 'ORIG-1000' }));
    expect(mockedDynamicsWebApi.retrieveRequest).toHaveBeenNthCalledWith(2000, expect.objectContaining({ id: 'ORIG-2000' }));
    expect(mockedDynamicsWebApi.retrieveRequest).toHaveBeenNthCalledWith(2500, expect.objectContaining({ id: 'ORIG-2500' }));
  });

  test('GIVEN an error with status 400 while first fetchAll WHEN getPaymentInformations THEN retries are handled internally by cds-retry then the error is thrown', async () => {
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        BOOKING_AND_PFA_BOOKING_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockRejectedValue(BAD_REQUEST_ERROR);
    const error = new CrmError('Failed to get payment informations', BAD_REQUEST_ERROR);

    await expect(() => crmClient.getPaymentInformations(DATE)).rejects.toThrow(error);

    expect(mockedLogger.warn).toHaveBeenCalledTimes(0);
    expect(mockedLogger.info).toHaveBeenCalledWith(
      'CrmClient::getPaymentInformations: Trying to get payment informations',
      { date: '2020-01-01' },
    );
    expect(mockedLogger.info).not.toHaveBeenCalledWith(
      'CrmClient::getPaymentInformations: Successfully fetched 0 payment informations',
      { date: '2020-01-01' },
    );
  });

  test('GIVEN an error with status 400 while second fetchAll WHEN getPaymentInformations THEN retries are handled internally by cds-retry then the error is thrown', async () => {
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        BOOKING_AND_PFA_BOOKING_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(BOOKING_AND_PFA_BOOKING_FETCH_XML_RESPONSE);
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        RECOGNISED_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockRejectedValue(BAD_REQUEST_ERROR);
    const error = new CrmError('Failed to get payment informations', BAD_REQUEST_ERROR);

    await expect(() => crmClient.getPaymentInformations(DATE)).rejects.toThrow(error);

    expect(mockedLogger.warn).toHaveBeenCalledTimes(0);
    expect(mockedLogger.info).toHaveBeenCalledWith(
      'CrmClient::getPaymentInformations: Trying to get payment informations',
      { date: '2020-01-01' },
    );
    expect(mockedLogger.info).not.toHaveBeenCalledWith(
      'CrmClient::getPaymentInformations: Successfully fetched 0 payment informations',
      { date: '2020-01-01' },
    );
  });

  test('GIVEN an error with status 400 while third fetchAll WHEN getPaymentInformations THEN retries are handled internally by cds-retry then the error is thrown', async () => {
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        BOOKING_AND_PFA_BOOKING_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(BOOKING_AND_PFA_BOOKING_FETCH_XML_RESPONSE);
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        RECOGNISED_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockResolvedValue(RECOGNISED_FETCH_XML_RESPONSE);
    when(mockedDynamicsWebApi.fetchAll)
      .calledWith(
        Payment.PaymentInformation.ENTITY_COLLECTION_NAME,
        PFA_BOOKING_REFUND_FETCH_XML_WITH_GIVEN_DATE,
      )
      .mockRejectedValue(BAD_REQUEST_ERROR);
    const error = new CrmError('Failed to get payment informations', BAD_REQUEST_ERROR);

    await expect(() => crmClient.getPaymentInformations(DATE)).rejects.toThrow(error);

    expect(mockedLogger.warn).toHaveBeenCalledTimes(0);
    expect(mockedLogger.info).toHaveBeenCalledWith(
      'CrmClient::getPaymentInformations: Trying to get payment informations',
      { date: '2020-01-01' },
    );
    expect(mockedLogger.info).not.toHaveBeenCalledWith(
      'CrmClient::getPaymentInformations: Successfully fetched 0 payment informations',
      { date: '2020-01-01' },
    );
  });
});
