import type { UnknownRecord } from '../types';
import { emptyToUndefined, nullToUndefined } from '../utils';
import type { ApiClientResponse } from './api';
import type { Contact, ContactInput } from './contact';

export function contactFromApi(raw: ApiClientResponse): Contact {
  return {
    id: raw.id,
    name: raw.name,
    ico: emptyToUndefined(raw.ico),
    dic: emptyToUndefined(raw.dic),
    icDph: emptyToUndefined(raw.ic_dph),
    address: emptyToUndefined(raw.address),
    city: emptyToUndefined(raw.city),
    zip: emptyToUndefined(raw.zip),
    state: emptyToUndefined(raw.state),
    country: emptyToUndefined(raw.country),
    countryId: nullToUndefined(raw.country_id),
    deliveryName: emptyToUndefined(raw.delivery_name),
    deliveryAddress: emptyToUndefined(raw.delivery_address),
    deliveryCity: emptyToUndefined(raw.delivery_city),
    deliveryZip: emptyToUndefined(raw.delivery_zip),
    deliveryState: emptyToUndefined(raw.delivery_state),
    deliveryCountry: emptyToUndefined(raw.delivery_country),
    deliveryCountryId: nullToUndefined(raw.delivery_country_id),
    deliveryPhone: emptyToUndefined(raw.delivery_phone),
    phone: emptyToUndefined(raw.phone),
    email: emptyToUndefined(raw.email),
    defaultCurrency: emptyToUndefined(raw.currency) as Contact['defaultCurrency'],
    defaultVariableSymbol: emptyToUndefined(raw.default_variable),
    defaultDiscount: raw.discount !== null ? parseFloat(raw.discount) : undefined,
    defaultDueDays: raw.due_date !== null ? parseInt(raw.due_date, 10) : undefined,
    bankAccount: emptyToUndefined(raw.bank_account),
    bankAccountPrefix: emptyToUndefined(raw.bank_account_prefix),
    bankCode: emptyToUndefined(raw.bank_code),
    iban: emptyToUndefined(raw.iban),
    swift: emptyToUndefined(raw.swift),
    comment: emptyToUndefined(raw.comment),
    uuid: emptyToUndefined(raw.uuid),
    created: new Date(raw.created),
    modified: new Date(raw.modified),
  };
}

export function contactInputToApi(input: ContactInput): { Client: UnknownRecord } {
  const client: UnknownRecord = { name: input.name };

  if (input.ico) client.ico = input.ico;
  if (input.dic) client.dic = input.dic;
  if (input.icDph) client.ic_dph = input.icDph;
  if (input.address) client.address = input.address;
  if (input.city) client.city = input.city;
  if (input.zip) client.zip = input.zip;
  if (input.state) client.state = input.state;
  if (input.country) client.country = input.country;
  if (input.countryId) client.country_id = parseInt(input.countryId, 10);
  if (input.deliveryName) client.delivery_name = input.deliveryName;
  if (input.deliveryAddress) client.delivery_address = input.deliveryAddress;
  if (input.deliveryCity) client.delivery_city = input.deliveryCity;
  if (input.deliveryZip) client.delivery_zip = input.deliveryZip;
  if (input.deliveryState) client.delivery_state = input.deliveryState;
  if (input.deliveryCountry) client.delivery_country = input.deliveryCountry;
  if (input.deliveryCountryId) client.delivery_country_id = parseInt(input.deliveryCountryId, 10);
  if (input.deliveryPhone) client.delivery_phone = input.deliveryPhone;
  if (input.phone) client.phone = input.phone;
  if (input.email) client.email = input.email;
  if (input.defaultCurrency) client.currency = input.defaultCurrency;
  if (input.defaultVariableSymbol) client.default_variable = input.defaultVariableSymbol;
  if (input.defaultDiscount) client.discount = input.defaultDiscount;
  if (input.defaultDueDays) client.due_date = input.defaultDueDays;
  if (input.iban) client.iban = input.iban;
  if (input.comment) client.comment = input.comment;
  if (input.uuid) client.uuid = input.uuid;

  return { Client: client };
}
