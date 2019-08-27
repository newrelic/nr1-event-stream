module.exports = {
    traceId: {
        id: "traceId",
        name: "id",
        align: "left"
      },
      name: {
        ids: ['request.uri','name','transactionName'],
        name: "name",
        align: "left",
        width: "100px"
      },
      host: {
        id: "host",
        name: "host",
        align: "left"
      },
      duration: {
        id: 'duration',
        name: "ms",
        align: "left",
        toFixed: 4
      },
      dbDuration: {
        id: 'databaseDuration',
        name: "dbMs",
        align: "left",
        toFixed: 4
      },
      externalDuration: {
        id: "externalDuration",
        name: "extMs",
        align: "left",
        toFixed: 4
      },
      queueDuration: {
        id: "queueDuration",
        name: "qMs",
        align: "left",
        toFixed: 4
      },
      code: {
        id: 'response.status',
        name: 'code',
        align: 'left'
      },
      databaseCallCount: {
        id: 'databaseCallCount',
        name: 'dbCallCount',
        align: 'left'
    },
    externalCallCount: {
      id: 'externalCallCount',
      name: 'externalCallCount',
      align: 'left'
    }
}