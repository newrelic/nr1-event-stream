import { NerdGraphQuery } from 'nr1';
import gql from 'graphql-tag';

export const nrdbQuery = async (accountId, query, timeout) => {
  let q = gqlNrqlQuery(accountId, query, timeout)
  let result = await NerdGraphQuery.query({query: q})
  let nrqlResult = (((((result || {}).data || {}).actor || {}).account || {}).nrql || {}).results || []
  return nrqlResult
}

export const gqlNrqlQuery = (accountId, query, timeout) => {
  return gql`{
    actor {
      account(id: ${accountId}) {
        nrql(query: "${query}", timeout: ${timeout || 30000}) {
          results
        }
      }
    }
  }`
}

export const nerdGraphQuery = async (query) => {
  return (await NerdGraphQuery.query({query: gql`${query}`})).data
}