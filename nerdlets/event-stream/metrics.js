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
        width: "100px",
      },
      host: {
        id: "host",
        name: "host",
        align: "left",
        width: "125px"
      },
      duration: {
        id: 'duration',
        name: "ms",
        align: "left",
        toFixed: 4,
        width: "55px",
        multiplyBy: 1000
      },
      dbDuration: {
        id: 'databaseDuration',
        name: "dbMs",
        align: "left",
        toFixed: 4,
        width: "55px",
        multiplyBy: 1000
      },
      externalDuration: {
        id: "externalDuration",
        name: "extMs",
        align: "left",
        toFixed: 4,
        width: "55px",
        multiplyBy: 1000
      },
      queueDuration: {
        id: "queueDuration",
        name: "qMs",
        align: "left",
        toFixed: 4,
        width: "55px",
        multiplyBy: 1000
      },
      code: {
        id: 'response.status',
        name: 'code',
        align: 'center',
        width: "55px"
      },
      databaseCallCount: {
        id: 'databaseCallCount',
        name: 'dbCallCount',
        align: 'left',
        width: "55px"
    },
    externalCallCount: {
      id: 'externalCallCount',
      name: 'externalCallCount',
      align: 'left',
      width: "55px"
    }
}