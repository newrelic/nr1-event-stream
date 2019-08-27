import React from 'react';
import { Spinner } from 'nr1';
const METRICS = require("../metrics")

export default class TransactionEventTable extends React.PureComponent {

  render() {
    const {events, cols} = this.props

    let COLUMNS = cols || [
        METRICS.host, METRICS.name, METRICS.code, METRICS.duration, METRICS.dbDuration, METRICS.externalDuration, METRICS.queueDuration
    ]

    if (!events) return <Spinner />

    return <table className="process-table">
      <thead>
        <tr>
          <th className="left">time</th>
          {COLUMNS.map(column => {
            return <th className={column.align || 'center'} key={column.id}>{column.name}</th>
          })}
        </tr>
      </thead>
      <tbody>
        {events.map(row => {
          return <tr key={row.timestamp + ":" + new Date().getTime() + ":" + row.traceId}>
            <td className="left" onClick={() => this.props.rowSelect(row.traceId,"")}>{new Date(row.timestamp).toLocaleTimeString()}</td>
            {COLUMNS.map(column => {
                let columnData = row[column.id]
                let columnId = column.id
                if(column.ids && column.ids.length > 0){
                    for(let z=0;z<[column.ids].length;z++){
                        if(row[column.ids[z]]){
                            column.id = column.ids[z]
                            columnData = row[column.ids[z]].replace("WebTransaction/","").replace("http://","").replace("https://","")
                            break;
                        }
                    }
                }
                if(column.multiplyBy){
                    columnData = columnData * column.multiplyBy
                }
                if(column.toFixed && columnData){
                    columnData = columnData.toFixed(column.toFixed)
                }
              return <td onClick={()=>this.props.handleFilter(column, columnData)} className={column.align || 'right'} style={{width: column.width || ""}} key={columnId}>{columnData}</td>
            })}
          </tr>
        })}
      </tbody>
    </table>
  }
}