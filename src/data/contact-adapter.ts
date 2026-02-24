import type { UnknownRecord } from '../core/types';
import { emptyToUndefined, nullToUndefined, safeParse } from '../core/utils';
import { CurrencySchema } from './currency';
import type { ApiClientResponse } from './api';
import type { Contact, ContactInput, ContactUpdateInput } from './contact';

export function contactFromApi(raw: ApiClientResponse): Contact {
  const currencyRaw = emptyToUndefined(raw.currency);
  const defaultCurrency =
    currencyRaw !== undefined ? safeParse(CurrencySchema, currencyRaw, 'contact currency') : undefined;

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
    defaultCurrency,
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

function contactFieldsToApi(input: ContactUpdateInput): UnknownRecord {
  const client: UnknownRecord = {};

  if (input.name !== undefined) client.name = input.name;
  if (input.ico !== undefined) client.ico = input.ico;
  if (input.dic !== undefined) client.dic = input.dic;
  if (input.icDph !== undefined) client.ic_dph = input.icDph;
  if (input.address !== undefined) client.address = input.address;
  if (input.city !== undefined) client.city = input.city;
  if (input.zip !== undefined) client.zip = input.zip;
  if (input.state !== undefined) client.state = input.state;
  if (input.country !== undefined) client.country = input.country;
  if (input.countryId !== undefined) client.country_id = parseInt(input.countryId, 10);
  if (input.deliveryName !== undefined) client.delivery_name = input.deliveryName;
  if (input.deliveryAddress !== undefined) client.delivery_address = input.deliveryAddress;
  if (input.deliveryCity !== undefined) client.delivery_city = input.deliveryCity;
  if (input.deliveryZip !== undefined) client.delivery_zip = input.deliveryZip;
  if (input.deliveryState !== undefined) client.delivery_state = input.deliveryState;
  if (input.deliveryCountry !== undefined) client.delivery_country = input.deliveryCountry;
  if (input.deliveryCountryId !== undefined) client.delivery_country_id = parseInt(input.deliveryCountryId, 10);
  if (input.deliveryPhone !== undefined) client.delivery_phone = input.deliveryPhone;
  if (input.phone !== undefined) client.phone = input.phone;
  if (input.email !== undefined) client.email = input.email;
  if (input.defaultCurrency !== undefined) client.currency = input.defaultCurrency;
  if (input.defaultVariableSymbol !== undefined) client.default_variable = input.defaultVariableSymbol;
  if (input.defaultDiscount !== undefined) client.discount = input.defaultDiscount;
  if (input.defaultDueDays !== undefined) client.due_date = input.defaultDueDays;
  if (input.iban !== undefined) client.iban = input.iban;
  if (input.comment !== undefined) client.comment = input.comment;
  if (input.uuid !== undefined) client.uuid = input.uuid;

  return client;
}

export function contactInputToApi(input: ContactInput): { Client: UnknownRecord } {
  const client = contactFieldsToApi(input);
  client.name = input.name;
  return { Client: client };
}

export function contactUpdateInputToApi(input: ContactUpdateInput): { Client: UnknownRecord } {
  return { Client: contactFieldsToApi(input) };
}
