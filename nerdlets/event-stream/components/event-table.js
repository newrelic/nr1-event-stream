import React from 'react';
import { Icon, Modal, Button, Header } from 'semantic-ui-react';
import { AutoSizer, Column, Table } from 'react-virtualized'; 
import { APM_REQ, APM_DEFAULT } from '../lib/metrics';
import { rowRenderer } from './row-renderer';
import { nerdGraphQuery } from '../lib/utils';

import { navigation } from 'nr1';

function openChartBuilder(query, account) {
  const nerdlet = {
    id: 'wanda-data-exploration.nrql-editor',
    urlState: {
      initialActiveInterface: 'nrqlEditor',
      initialChartType:'json',
      initialAccountId: account,
      initialNrqlValue: query,
      isViewingQuery: true,
    }
  }
  navigation.openOverlay(nerdlet)
}

export default class EventTable extends React.PureComponent {

  constructor(props){
    super(props)
    this.state = {
      TOTAL_WIDTH: 0,
      AVAILABLE_WIDTH_PER_COLUMN: 0,
      columns: [],
      errorMsg:""
    };
    this.determineColumnWidths = this.determineColumnWidths.bind(this);
    this.createColumns = this.createColumns.bind(this);
    this.openHostEntity = this.openHostEntity.bind(this);
  }

  componentDidMount(){
    const columns = [...APM_REQ, ...APM_DEFAULT]
    this.setState({columns})
    this.determineColumnWidths(columns)
  }

  async openHostEntity(hostname){
    // attempt to fetch entity by host
    let gql = `
      {
        actor {
          entitySearch(query: "name IN ('${hostname}') AND domain IN ('INFRA')  AND type='HOST' AND reporting='true'") {
            query
            count
            results {
              entities {
                guid
              }
            }
          }
        }
    }`
  
    let infraResult = await nerdGraphQuery(gql)
    let entitySearchResults = ((((infraResult || {}).actor || {}).entitySearch || {}).results || {}).entities || []
  
    if(entitySearchResults.length == 1){
      let entity = {
        guid: entitySearchResults[0].guid,
        domain: 'INFRA',
        type: 'HOST',
      }
      
      navigation.openStackedEntity(entity);
    }else{
      this.setState({"errorMsg":"Unable to find entity, have you installed Infrastructure?"})
    }
  }

  determineColumnWidths(columns){
    let { TOTAL_WIDTH, AVAILABLE_WIDTH_PER_COLUMN } = this.state
    let columnsWithWidths = 0
    let consumedWidth = 0

    columns.forEach((col)=>{
      if(col.width){
        columnsWithWidths++
        consumedWidth += col.width
      }
    })

    let remainingColumns = columns.length - columnsWithWidths
    let remainingWidth = TOTAL_WIDTH - consumedWidth
    AVAILABLE_WIDTH_PER_COLUMN = (remainingWidth / remainingColumns) -20

    if(isNaN(AVAILABLE_WIDTH_PER_COLUMN)){
      AVAILABLE_WIDTH_PER_COLUMN = 100
    }

    this.setState({AVAILABLE_WIDTH_PER_COLUMN})
  }

  createColumns(columns){
    return columns.map((column, i)=>{

      const cellRenderer = (data, column) => {
        let value = data.cellData
        if(isNaN(value)){
          // do string actions
        }else{
          // do number actions
          if(column.multiply) value = value * column.multiply
          if(column.toFixed) value = value.toFixed(column.toFixed)
          if(column.key == "timestamp") value = new Date(value).toLocaleTimeString()
        }

        switch(column.key){
          case "traceId":
            return <Icon name='search' onClick={()=>openChartBuilder(this.props.query + ` AND traceId='${value}'`, this.props.accountId)}/>
          case "host":
            // containerIds have a length of 12
            // would need to do an additional query to determine the entity but that would be the host instead
            // consider switching this to just use straight nrql
            if(value.length != 12){
              return <span style={{color:"#357dbb", cursor: "pointer"}} title={value} onClick={()=>this.openHostEntity(value, this.props.accountId)}>{value}</span>
            }
        }

        return value
      }

      const cellDataGetter = (data, column) => {
        let key = column.key
        let cellData = data.rowData[key]

        if(column.keys){
          for(var z=0;z<column.keys.length;z++){
            if(data.rowData[column.keys[z]]){
              cellData = data.rowData[column.keys[z]]
              break
            }
          }
        }

        return cellData
      }

      return (
        <Column
          disableSort={true}
          key={i}
          label={column.label}
          width={column.width || this.state.AVAILABLE_WIDTH_PER_COLUMN}
          cellRenderer={(data)=>cellRenderer(data, column)}
          cellDataGetter={(data)=>cellDataGetter(data, column)}
        />
      )
    })
  }

  render() {
    const { events } = this.props

    return <div>
      <AutoSizer>
        {({ height, width }) => {
          this.setState({TOTAL_WIDTH: width})
          this.determineColumnWidths(this.state.columns)
          return (
            <Table
              className="event-table"
              rowClassName="event-table-row"
              width={width}
              height={height}
              headerClassName="event-table-header"
              headerHeight={30}
              header
              rowHeight={30}
              rowCount={events.length}
              rowGetter={({ index }) => events[index]}
              rowRenderer={(data)=>rowRenderer(data, events)}
            >
              {this.createColumns(this.state.columns)}
            </Table>
        )}
        }
      </AutoSizer>  

        <Modal basic open={this.state.errorMsg != ""}>
          <Header icon='close' content='Error' />
          <Modal.Content>
              <h3>{this.state.errorMsg}</h3>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={()=>this.setState({errorMsg:""})} negative>
              Dismiss
            </Button>
          </Modal.Actions>
        </Modal>  
    </div>
  }
}