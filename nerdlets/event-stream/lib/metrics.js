export const APM_REQ = [
    {
      label: "TIME",
      key: "timestamp",
      width: 70
    },
    {
      label: "HOST",
      key: "host",
      width: 90
    }
]

export const APM_DEFAULT =  [
    {
      label: "name",
      keys: [ 'request.uri', 'name', 'transactionName' ]
    },
    {
      label: "ms",
      key: 'duration',
      align: "left",
      toFixed: 2,
      width: 100,
      multiply: 1000
    },
    {
      label: "code",
      key: 'httpResponseCode',
      align: "left",
      width: 80
    },
    {
      label: "dbMs",
      key: 'databaseDuration',
      align: "left",
      toFixed: 2,
      width: 100,
      multiply: 1000
    },
    {
      label: "dbCount",
      key: "databaseCallCount",
      width: 100
    },

    {
      label: "extMs",
      key: 'externalDuration',
      align: "left",
      toFixed: 2,
      width: 100,
      multiply: 1000
    },
    {
      label: "extCount",
      key: "externalCallCount",
      width: 100
    },
    {
      label: "qMs",
      key: 'queueDuration',
      align: "left",
      toFixed: 2,
      width: 100,
      multiply: 1000
    }
]

export const stringOptions = [
  { key: 'e', text: '=', value: '=' },
  { key: 'ne', text: '!=', value: '!=' },
  { key: 'l', text: 'LIKE', value: 'LIKE' },
  { key: 'in', text: 'IS NULL', value: 'IS NULL' },
  { key: 'inn', text: 'IS NOT NULL', value: 'IS NOT NULL' }
]

export const numericOptions = [
  { key: 'e', text: '=', value: '=' },
  { key: 'ne', text: '!=', value: '!=' },
  { key: 'm', text: '>', value: '>' },
  { key: 'me', text: '>=', value: '>=' },
  { key: 'l', text: '<', value: '<' },
  { key: 'le', text: '<=', value: '<=' },
  { key: 'is', text: 'IS NULL', value: 'IS NULL' },
  { key: 'inn', text: 'IS NOT NULL', value: 'IS NOT NULL' }
]

export const booleanOptions = [
  { key: 'is', text: 'IS', value: 'IS' },
  { key: 'in', text: 'IS NOT', value: 'IS NOT' },
  { key: 'isn', text: 'IS NULL', value: 'IS NULL' },
  { key: 'inn', text: 'IS NOT NULL', value: 'IS NOT NULL' }
]
