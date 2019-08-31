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
        // width: "250px",
      },
      host: {
        id: "host",
        name: "host",
        align: "left",
        width: "120px"
      },
      duration: {
        id: 'duration',
        name: "ms",
        align: "left",
        toFixed: 2,
        width: "20px",
        multiplyBy: 1000
      },
      dbDuration: {
        id: 'databaseDuration',
        name: "dbMs",
        align: "left",
        toFixed: 2,
        width: "20px",
        multiplyBy: 1000
      },
      externalDuration: {
        id: "externalDuration",
        name: "extMs",
        align: "left",
        toFixed: 2,
        width: "20px",
        multiplyBy: 1000
      },
      queueDuration: {
        id: "queueDuration",
        name: "qMs",
        align: "left",
        toFixed: 2,
        width: "20px",
        multiplyBy: 1000
      },
      code: {
        id: 'response.status',
        name: 'code',
        align: 'center',
        width: "20px",
      },
      databaseCallCount: {
        id: 'databaseCallCount',
        name: 'dbCallCount',
        align: 'left',
        width: "20px",
    },
    externalCallCount: {
      id: 'externalCallCount',
      name: 'externalCallCount',
      align: 'left',
      width: "20px",
    }
}