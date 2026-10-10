export enum GraphqlScalar {
  Json = 'JSON',
}

export const JSON_SCALAR_DESCRIPTION = 'Any JSON value.';
export const JSON_SCALAR_TYPE_DEFS = `scalar ${GraphqlScalar.Json}`;
