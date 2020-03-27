import React from 'react';
import { Icon, Modal, Button, Header, Popup } from 'semantic-ui-react';
import { AutoSizer, Column, Table } from 'react-virtualized';
import { APM_REQ, APM_DEFAULT } from '../lib/metrics';
import { rowRenderer } from './row-renderer';
import { nrdbQuery } from '../lib/utils';

import { navigation } from 'nr1';

function openChartBuilder(query, account) {
  const nerdlet = {
    id: 'wanda-data-exploration.nrql-editor',
    urlState: {
      initialActiveInterface: 'nrqlEditor',
      initialChartType: 'json',
      initialAccountId: account,
      initialNrqlValue: query,
      isViewingQuery: true,
    },
  };
  navigation.openOverlay(nerdlet);
}

export default class EventTable extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      TOTAL_WIDTH: 0,
      AVAILABLE_WIDTH_PER_COLUMN: 0,
      columns: [],
      errorMsg: '',
    };
    this.determineColumnWidths = this.determineColumnWidths.bind(this);
    this.openHostEntity = this.openHostEntity.bind(this);
    this.updateFilter = this.updateFilter.bind(this);
    this.addFilter = this.addFilter.bind(this);
  }

  async openHostEntity(hostname, accountId) {
    let entityGuid = null;
    let systemSample = await nrdbQuery(
      accountId,
      `SELECT * FROM SystemSample WHERE hostname = '${hostname}' LIMIT 1`
    );
    if (systemSample[0] && systemSample[0].entityGuid)
      entityGuid = systemSample[0].entityGuid;

    // container fallback
    if (!entityGuid && hostname.length == 12) {
      let processSample = await nrdbQuery(
        accountId,
        `SELECT * FROM ProcessSample WHERE containerId LIKE '${hostname}%' LIMIT 1`
      );
      if (processSample[0] && processSample[0].entityGuid)
        entityGuid = processSample[0].entityGuid;
    }

    if (entityGuid) {
      navigation.openStackedEntity(entityGuid);
    } else {
      this.setState({
        errorMsg: `Unable to find entityGuid for ${hostname}, have you installed Infrastructure?`,
      });
    }
  }

  determineColumnWidths(columns) {
    let { TOTAL_WIDTH, AVAILABLE_WIDTH_PER_COLUMN } = this.state;
    let columnsWithWidths = 0;
    let consumedWidth = 0;

    columns.forEach(col => {
      if (col.width) {
        columnsWithWidths++;
        consumedWidth += col.width;
      }
    });

    let remainingColumns = columns.length - columnsWithWidths;
    let remainingWidth = TOTAL_WIDTH - consumedWidth;
    AVAILABLE_WIDTH_PER_COLUMN = remainingWidth / remainingColumns - 20;

    if (isNaN(AVAILABLE_WIDTH_PER_COLUMN)) {
      AVAILABLE_WIDTH_PER_COLUMN = 100;
    }

    this.setState({ AVAILABLE_WIDTH_PER_COLUMN });
  }

  addFilter = (key, val, originalVal) => {
    let { keySet } = this.props;
    let operator = '=';
    let type = 'string';
    for (var z = 0; z < keySet.length; z++) {
      if (keySet[z].title == key) {
        type = keySet[z].type;
        break;
      }
    }

    if (type == 'string' || type == '') val = `'${val}'`;
    if (type == 'numeric') {
      operator = '>=';
      val = originalVal;
    }
    let value = `\`${key}\` ${operator} ${val}`;
    this.updateFilter({ label: value, value: value });
  };

  updateFilter = data => {
    let { filters, setParentState } = this.props;
    filters[data.label] = data.value;
    setParentState({ filters: filters });
    this.forceUpdate();
  };

  createColumns(columns) {
    return columns.map((column, i) => {
      const cellRenderer = (data, column) => {
        let value = data.cellData;
        if (isNaN(value)) {
          // do string actions
        } else {
          // do number actions
          if (column.multiply) value = value * column.multiply;
          if (column.toFixed) value = value.toFixed(column.toFixed);
          if (column.key == 'timestamp')
            value = new Date(value).toLocaleTimeString();
        }

        switch (column.key) {
          case 'traceId':
            return (
              <Icon
                style={{ cursor: 'pointer' }}
                name="search"
                onClick={() =>
                  openChartBuilder(
                    this.props.query + ` AND traceId='${value}'`,
                    this.props.accountId
                  )
                }
              />
            );
          case 'host':
            return (
              <Popup
                basic
                hoverable
                trigger={
                  <span
                    style={{ color: '#357dbb', cursor: 'pointer' }}
                    title={value}
                  >
                    {value}
                  </span>
                }
                style={{ padding: 0, margin: 0, width: 10 }}
              >
                <Button
                  style={{ width: 170, marginRight: 0, borderRadius: 0 }}
                  labelPosition="left"
                  basic
                  icon="search"
                  content="View Entity"
                  onClick={() =>
                    this.openHostEntity(value, this.props.accountId)
                  }
                />
                <Button
                  style={{ width: 170, marginRight: 0, borderRadius: 0 }}
                  labelPosition="left"
                  basic
                  icon="add"
                  content="Add to Query"
                  onClick={() => this.addFilter(column.key, value)}
                />
              </Popup>
            );
          default:
            if (column.keys) {
              for (var z = 0; z < column.keys.length; z++) {
                if (data.rowData[column.keys[z]]) {
                  column.key = column.keys[z];
                  break;
                }
              }
            }
            if (
              column.key != 'timestamp' &&
              data.rowData &&
              data.rowData.traceId
            ) {
              return (
                <Popup
                  basic
                  hoverable
                  trigger={
                    <span style={{ cursor: 'pointer' }} title={value}>
                      {value}
                    </span>
                  }
                  style={{ padding: 0, margin: 0, width: 10 }}
                >
                  <Button
                    style={{ width: 170, marginRight: 0, borderRadius: 0 }}
                    labelPosition="left"
                    basic
                    icon="search"
                    content="View Event"
                    onClick={() =>
                      openChartBuilder(
                        this.props.query +
                          ` AND traceId='${data.rowData.traceId}'`,
                        this.props.accountId
                      )
                    }
                  />
                  <Button
                    style={{ width: 170, marginRight: 0, borderRadius: 0 }}
                    labelPosition="left"
                    basic
                    icon="add"
                    content="Add to Query"
                    onClick={() =>
                      this.addFilter(column.key, value, data.cellData)
                    }
                  />
                </Popup>
              );
            }
        }

        return value;
      };

      const cellDataGetter = (data, column) => {
        let key = column.key;
        let cellData = data.rowData[key];

        if (column.keys) {
          for (var z = 0; z < column.keys.length; z++) {
            if (data.rowData[column.keys[z]]) {
              cellData = data.rowData[column.keys[z]];
              break;
            }
          }
        }

        return cellData;
      };

      return (
        <Column
          disableSort={true}
          key={i}
          label={column.label}
          width={column.width || this.state.AVAILABLE_WIDTH_PER_COLUMN}
          cellRenderer={data => cellRenderer(data, column)}
          cellDataGetter={data => cellDataGetter(data, column)}
        />
      );
    });
  }

  render() {
    const { events } = this.props;

    return (
      <div>
        <AutoSizer>
          {({ height, width }) => {
            this.setState({ TOTAL_WIDTH: width });
            this.determineColumnWidths(this.props.columns);
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
                rowRenderer={data => rowRenderer(data, events)}
              >
                {this.createColumns(this.props.columns)}
              </Table>
            );
          }}
        </AutoSizer>

        <Modal basic open={this.state.errorMsg != ''}>
          <Header icon="close" content="Error" />
          <Modal.Content>
            <h3>{this.state.errorMsg}</h3>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={() => this.setState({ errorMsg: '' })} negative>
              Dismiss
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}
