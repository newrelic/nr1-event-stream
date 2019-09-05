import React from 'react';
import { Icon } from 'semantic-ui-react';
import { AutoSizer, Column, Table } from 'react-virtualized'; 
import { APM_REQ, APM_DEFAULT } from '../lib/metrics';
import { rowRenderer } from './row-renderer';
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
      columns: []
    };
    this.determineColumnWidths = this.determineColumnWidths.bind(this);
    this.createColumns = this.createColumns.bind(this);
  }

  componentDidMount(){
    const columns = [...APM_REQ, ...APM_DEFAULT]
    this.setState({columns})
    this.determineColumnWidths(columns)
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

        return column.key == "traceId" ? 
                <Icon name='search' onClick={()=>openChartBuilder(this.props.query + ` AND traceId='${value}'`, this.props.accountId)}/>: 
                value
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
    </div>
  }
}