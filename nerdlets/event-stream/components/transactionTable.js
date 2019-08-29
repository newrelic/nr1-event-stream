import React from 'react';
import { Spinner } from 'nr1';
import { Table, Input } from 'semantic-ui-react';
const METRICS = require("../metrics")

export default class TransactionEventTable extends React.PureComponent {

  constructor(props){
    super(props)
    this.state = {
      filters: {}
    }
    this.searchChange = this.searchChange.bind(this);
  }

  searchChange(e){
    let filters = this.state.filters
    if(e.target.value != ""){
      filters[e.target.id] = e.target.value
    }else{
      delete filters[e.target.id]
    }
    this.setState({filters})
  }

  applyFilters(events, filters){
    let tempEvents = events
    Object.keys(filters).forEach((filter)=>{
      tempEvents = tempEvents.filter((event)=>{
          if(event[filter] && filters[filter] && isNaN(event[filter]) && isNaN(filters[filter])){
            return event[filter].toLowerCase().includes(filters[filter].toLowerCase())
          }else if(!isNaN(event[filter] && !isNaN(filters[filter]))){
            let val = parseFloat(event[filter])
            return val >= parseFloat(filters[filter])
          }
          return true
        })
    })
    return tempEvents
  }

  render() {
    const {events, cols} = this.props
    let tableEvents = this.applyFilters(events, this.state.filters)

    let COLUMNS = cols || [
        METRICS.host, METRICS.name, METRICS.code, METRICS.duration, METRICS.dbDuration, METRICS.externalDuration, METRICS.queueDuration
    ]

    if (!events) return <Spinner />

    return <>
              <Table celled compact size='small' style={{marginTop:0}} striped>
                    <Table.Header>
                      <Table.Row>
                        <Table.Cell></Table.Cell>
                        {COLUMNS.map(column => {
                          return <Table.Cell style={{width:column.width || "100%"}}><input className="table-search" id={column.id} onChange={this.searchChange} size="small" placeholder={`${column.name}`}/></Table.Cell>
                        })}                          
                      </Table.Row>
                      <Table.Row>
                        <Table.HeaderCell style={{width:"70px"}}>time</Table.HeaderCell>
                        {COLUMNS.map(column => {                          
                          return <Table.HeaderCell style={{width:column.width || "100%"}} key={column.id}>{column.name}</Table.HeaderCell>
                        })}
                    </Table.Row>
                  </Table.Header>
              <Table.Body>
              {tableEvents.map(row => {

                return <Table.Row key={row.timestamp + ":" + new Date().getTime() + ":" + row.traceId}>
                  <Table.Cell style={{width:"70px"}} onClick={() => this.props.rowSelect(row.traceId,"")}>{new Date(row.timestamp).toLocaleTimeString()}</Table.Cell>
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

                    let badStatus = column.id == "response.status" && parseFloat(columnData) > 299 ? true : false;

                    return <Table.Cell negative={badStatus} onClick={()=>this.props.handleFilter(column, columnData)} className={column.align || 'right'} style={{width:column.width || "100%"}} key={columnId}>{columnData}</Table.Cell>
                  })}
                </Table.Row>
              })}
            </Table.Body>
          </Table>
    </>
  }
}