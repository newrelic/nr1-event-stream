import React from 'react';
import Select from 'react-select';
import {
  Icon,
  Button,
  Popup,
  Modal,
  Search,
  Form,
  List,
  Table,
} from 'semantic-ui-react';
import { navigation } from 'nr1';
import {
  stringOptions,
  numericOptions,
  booleanOptions,
  APM_REQ,
  APM_DEFAULT,
} from '../lib/metrics';
import { writeDocument, deleteDocument } from '../lib/utils';
import _ from 'lodash';

const initialState = { isLoading: false, results: [], value: '', type: '' };

function Filter({ attribute, value, removeFilter }) {
  return (
    <div className="filter">
      <span onClick={removeFilter}>
        {value} <Icon link name="close" />
      </span>
    </div>
  );
}

function openChartBuilder(query, account) {
  const nerdlet = {
    id: 'wanda-data-exploration.nrql-editor',
    urlState: {
      initialActiveInterface: 'nrqlEditor',
      initialChartType: 'table',
      initialAccountId: account,
      initialNrqlValue: query,
      isViewingQuery: true,
    },
  };
  navigation.openOverlay(nerdlet);
}

export default class MenuBar extends React.PureComponent {
  state = initialState;

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      attributeSelected: '',
      isLoading: false,
      results: [],
      type: '',
      filterValue: '',
      operator: '',
      addColumnMultiplier: 1,
      addColumnToFixed: null,
    };
    this.updateFilter = this.updateFilter.bind(this);
    this.updateBucket = this.updateBucket.bind(this);
    this.removeFilter = this.removeFilter.bind(this);
    this.filterModal = this.filterModal.bind(this);
    this.columnModal = this.columnModal.bind(this);
    this.handleResultSelect = this.handleResultSelect.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.filtersContainer = this.filtersContainer.bind(this);
    this.updateColumns = this.updateColumns.bind(this);
    this.removeColumn = this.removeColumn.bind(this);
    this.viewSnapshots = this.viewSnapshots.bind(this);
    this.writeSnapshot = this.writeSnapshot.bind(this);
    this.deleteSnapshot = this.deleteSnapshot.bind(this);
  }

  handleResultSelect = (e, { result }) => {
    this.setState({
      attributeSelected: result.title,
      type: result.type,
      value: result.title,
      operator: '',
    });
  };

  handleSearchChange = (e, { value }) => {
    this.setState({
      isLoading: true,
      value,
      attributeSelected: '',
      operator: '',
    });

    setTimeout(() => {
      if (this.state.value.length < 1) return this.setState(initialState);

      const re = new RegExp(_.escapeRegExp(this.state.value), 'i');
      const isMatch = result => re.test(result.title);

      this.setState({
        isLoading: false,
        results: _.filter(this.props.keySet, isMatch),
      });
    }, 300);
  };

  updateBucket = data => {
    this.props.setParentState({ bucketMs: data });
    this.forceUpdate();
  };

  updateFilter = data => {
    let { filters, setParentState } = this.props;
    filters[data.label] = data.value;
    setParentState({ filters: filters });
    this.forceUpdate();
  };

  removeFilter = label => {
    let { filters, setParentState } = this.props;
    delete filters[label];
    setParentState({ filters: filters });
    this.forceUpdate();
  };

  updateColumns = () => {
    let { columns, setParentState } = this.props;
    let {
      attributeSelected,
      addColumnLabel,
      addColumnWidth,
      addColumnMultiplier,
      addColumnToFixed,
    } = this.state;
    let column = {
      key: attributeSelected,
      label: addColumnLabel ? addColumnLabel : attributeSelected,
    };
    if (addColumnWidth) column.width = addColumnWidth;
    if (addColumnMultiplier) column.multiply = addColumnMultiplier;
    columns.push(column);
    setParentState({ columns });
    this.forceUpdate();
  };

  removeColumn = i => {
    let { columns, setParentState } = this.props;
    columns.splice(i, 1);
    setParentState({ columns });
    this.forceUpdate();
  };

  columnModal() {
    let { isLoading, results, value } = this.state;
    return (
      <Modal
        closeIcon
        centered={false}
        trigger={
          <Button
            className="filter-button"
            icon="columns"
            content="Modify Columns"
          />
        }
      >
        <Modal.Header>Modify Columns</Modal.Header>
        <Modal.Content image>
          <Modal.Description>
            <Form>
              <Form.Group widths="equal">
                <Form.Field width={6} error={!this.state.attributeSelected}>
                  <Popup
                    basic
                    content="Select an attribute"
                    trigger={<label>Attribute</label>}
                  />
                  <Search
                    fluid
                    style={{ width: '100%' }}
                    loading={isLoading}
                    onResultSelect={this.handleResultSelect}
                    onSearchChange={_.debounce(this.handleSearchChange, 500, {
                      leading: true,
                    })}
                    results={results}
                    value={value}
                    icon={'search'}
                    input={{ fluid: true }}
                  />
                </Form.Field>

                <Form.Input
                  width={4}
                  fluid
                  label="Label - optional"
                  value={this.state.addColumnLabel}
                  onChange={(e, d) =>
                    this.setState({ addColumnLabel: d.value })
                  }
                />
                <Form.Input
                  width={4}
                  fluid
                  label="Width (px) - optional"
                  value={this.state.addColumnWidth}
                  onChange={(e, d) =>
                    this.setState({ addColumnWidth: d.value })
                  }
                />
              </Form.Group>
              <Form.Group
                style={{ display: this.state.type != 'numeric' ? 'none' : '' }}
              >
                <Form.Input
                  disabled={this.state.type != 'numeric'}
                  width={4}
                  fluid
                  label="Multiplier"
                  value={this.state.addColumnMultiplier}
                  onChange={(e, d) =>
                    this.setState({ addColumnMultiplier: d.value })
                  }
                />
                <Form.Input
                  disabled={this.state.type != 'numeric'}
                  width={4}
                  fluid
                  label="Fix Decimals Places"
                  value={this.state.addColumnToFixed}
                  onChange={(e, d) =>
                    this.setState({ addColumnToFixed: d.value })
                  }
                />
              </Form.Group>
              <Button
                onClick={this.updateColumns}
                disabled={!this.state.attributeSelected}
                style={{
                  float: 'right',
                  backgroundColor: '#edeeee',
                  color: 'black',
                }}
              >
                Add Column
              </Button>
              <Button
                onClick={() =>
                  this.props.setParentState({
                    columns: [...APM_REQ, ...APM_DEFAULT],
                  })
                }
              >
                Reset Columns
              </Button>
            </Form>
            {/* <h4>Default Columns</h4>
              {APM_REQ.map((metric,i)=>{
                if(i!=0){
                  return <div>{metric.key}</div>
                }
              })} */}
            <h4>Columns</h4>
            {this.props.columns.length == 0 ? 'None defined.' : ''}
            <List divided relaxed>
              {this.props.columns.map((metric, i) => {
                if (i > 1 && metric.key) {
                  return (
                    <List.Item key={i}>
                      <List.Icon
                        onClick={() => this.removeColumn(i)}
                        name="close"
                        size="small"
                        verticalAlign="middle"
                        style={{ cursor: 'pointer' }}
                      />
                      <List.Content>
                        Key: {metric.key} - Label: {metric.label}
                      </List.Content>
                    </List.Item>
                  );
                }
              })}
            </List>
          </Modal.Description>
        </Modal.Content>
      </Modal>
    );
  }

  filterModal() {
    const {
      isLoading,
      value,
      results,
      attributeSelected,
      filterValue,
      type,
      operator,
    } = this.state;
    const { keySet } = this.props;

    const addFilter = () => {
      if (
        operator != '' &&
        type != '' &&
        filterValue != '' &&
        attributeSelected != ''
      ) {
        let val =
          type == 'string' || type == '' ? `'${filterValue}'` : filterValue;
        let value = `\`${attributeSelected}\` ${operator} ${val}`;
        this.updateFilter({ label: value, value: value });
      }
    };

    let selectedOptions = stringOptions;
    switch (this.state.type) {
      case 'numeric':
        selectedOptions = numericOptions;
        break;
      case 'string':
        selectedOptions = stringOptions;
        break;
      case 'boolean':
        selectedOptions = booleanOptions;
        break;
      default:
      //
    }

    if (keySet.length == 0)
      return (
        <Button className="filter-button">
          <Icon name="spinner" loading />
          Loading Filters
        </Button>
      );
    let addFilterEnabled =
      !this.state.attributeSelected ||
      !this.state.operator ||
      !this.state.filterValue;
    return (
      <Modal
        size="small"
        style={{ height: '200px' }}
        closeIcon
        centered={false}
        trigger={
          <Button
            className="filter-button"
            icon="filter"
            content="Filter"
            style={{ backgroundColor: 'none' }}
          />
        }
      >
        <Modal.Header>Add Filters</Modal.Header>
        <Modal.Content image>
          <Modal.Description>
            <Form>
              <Form.Group widths="equal">
                <Form.Field width={6} error={!this.state.attributeSelected}>
                  <Popup
                    basic
                    content="Select an attribute"
                    trigger={<label>Attribute</label>}
                  />

                  <Search
                    fluid
                    style={{ width: '100%' }}
                    loading={isLoading}
                    onResultSelect={this.handleResultSelect}
                    onSearchChange={_.debounce(this.handleSearchChange, 500, {
                      leading: true,
                    })}
                    results={results}
                    value={value}
                    icon={'search'}
                    input={{ fluid: true }}
                  />
                </Form.Field>

                <Form.Select
                  fluid
                  error={!this.state.operator}
                  label="Operator"
                  options={selectedOptions}
                  value={this.state.operator}
                  width={3}
                  onChange={(e, d) => this.setState({ operator: d.value })}
                />
                <Form.Input
                  error={!this.state.filterValue}
                  fluid
                  label="Value"
                  value={this.state.filterValue}
                  width={6}
                  onChange={(e, d) => this.setState({ filterValue: d.value })}
                />
              </Form.Group>

              <Form.Button
                disabled={addFilterEnabled}
                style={{
                  float: 'right',
                  backgroundColor: '#edeeee',
                  color: 'black',
                }}
                onClick={() => addFilter()}
              >
                Add Filter
              </Form.Button>
            </Form>
          </Modal.Description>
        </Modal.Content>

        <Modal.Actions>{this.filtersContainer()}</Modal.Actions>
      </Modal>
    );
  }

  filtersContainer() {
    return (
      <div className="filters-container" style={{ textAlign: 'left' }}>
        <h3 className="filters-header">Filters:</h3>

        {Object.keys(this.props.filters).map(label => {
          return (
            <Filter
              key={`${label}/${this.props.filters[label]}`}
              attribute={label}
              value={label}
              removeFilter={() => this.removeFilter(label)}
            />
          );
        })}
      </div>
    );
  }

  async writeSnapshot(query, entity, bucketMs) {
    let snapshot = {
      t: new Date().getTime(),
      e: entity,
      q: query,
      b: bucketMs,
    };
    await writeDocument(
      'eventStreamSnapshots',
      `ss_${snapshot.t}_${entity.domain}`,
      snapshot
    );
    this.props.fetchSnapshots();
  }

  async deleteSnapshot(snapshot) {
    await deleteDocument('eventStreamSnapshots', snapshot.id);
    this.props.fetchSnapshots();
  }

  viewSnapshots() {
    return this.props.snapshots.length > 0 ? (
      <Modal
        size="small"
        style={{ height: '200px' }}
        closeIcon
        centered={false}
        trigger={
          <Button
            className="filter-button"
            icon="camera"
            content={`View Snapshots (${this.props.snapshots.length})`}
            style={{ backgroundColor: 'none' }}
          />
        }
      >
        <Modal.Header>Snapshots</Modal.Header>
        <Modal.Content style={{ padding: '10px' }}>
          <Table compact striped color="blue">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Start</Table.HeaderCell>
                <Table.HeaderCell>End</Table.HeaderCell>
                <Table.HeaderCell>Time (Sec)</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {this.props.snapshots.map(snapshot => {
                let startMs = snapshot.document.t - snapshot.document.b.value;
                let query = `${snapshot.document.q} SINCE ${startMs} UNTIL ${snapshot.document.t} LIMIT MAX`;
                return (
                  <Table.Row>
                    <Table.Cell>
                      {new Date(startMs).toLocaleDateString()}
                    </Table.Cell>
                    <Table.Cell>
                      {new Date(startMs).toLocaleTimeString()}
                    </Table.Cell>
                    <Table.Cell>
                      {new Date(snapshot.document.t).toLocaleTimeString()}
                    </Table.Cell>
                    <Table.Cell>{snapshot.document.b.value / 1000}</Table.Cell>
                    <Table.Cell>
                      <Button
                        icon="chart line"
                        onClick={() =>
                          openChartBuilder(query, this.props.entity.account.id)
                        }
                        content="View"
                        style={{ float: 'left' }}
                      />
                      <Button
                        icon="chart line"
                        onClick={() => this.deleteSnapshot(snapshot)}
                        content="Delete"
                        negative
                        style={{ float: 'right' }}
                      />
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </Modal.Content>
      </Modal>
    ) : (
      <Button
        className="filter-button"
        disabled
        icon="camera"
        content="View Snapshots"
        style={{ backgroundColor: 'none' }}
      />
    );
  }

  render() {
    const quickFilterOptions = [
      {
        key: 1,
        label: 'Errors',
        value:
          "(error IS TRUE OR (httpResponseCode NOT LIKE '2%%' AND httpResponseCode NOT LIKE '3%%') OR error.message IS NOT NULL)",
      },
      { key: 2, label: 'Database', value: 'databaseCallCount > 0' },
      { key: 3, label: 'External', value: 'externalCallCount > 0' },
      { key: 4, label: 'Queues', value: 'queueDuration is NOT NULL' },
    ];

    const timeBucketOptions = [
      { key: 1, label: '30 sec', value: 30000 },
      { key: 2, label: '40 sec', value: 40000 },
      { key: 3, label: '50 sec', value: 50000 },
      { key: 4, label: '1 min', value: 60000 },
      { key: 5, label: '2 min', value: 120000 },
      { key: 6, label: '3 min', value: 180000 },
      { key: 7, label: '4 min', value: 240000 },
      { key: 8, label: '5 min', value: 300000 },
    ];

    const handleClick = () => {
      if (this.props.enabled) this.props.setParentState({ enabled: false });
      if (!this.props.enabled)
        this.props.setParentState({ enabled: true, events: [] });
    };

    return (
      <div>
        <div className="utility-bar">
          <div className="react-select-input-group">
            <label>Add Quick Filters</label>
            <Select
              options={quickFilterOptions}
              onChange={this.updateFilter}
              value={null}
              classNamePrefix="react-select"
            />
          </div>

          {this.viewSnapshots()}

          <div className="flex-push"></div>

          {this.filterModal()}
          {this.columnModal()}

          <Popup
            basic
            content="View in Chart Builder"
            trigger={
              <Button
                className="filter-button"
                icon="chart line"
                onClick={() =>
                  openChartBuilder(
                    this.props.query,
                    this.props.entity.account.id
                  )
                }
                content="View Query"
              />
            }
          />

          <Popup
            basic
            content="Snapshot Events in View"
            trigger={
              <Button
                className="filter-button"
                icon="camera"
                onClick={() =>
                  this.writeSnapshot(
                    this.props.query,
                    this.props.entity,
                    this.props.bucketMs
                  )
                }
                content="Snapshot"
              />
            }
          />

          <Popup
            basic
            content="Pause / Resume Event Stream"
            trigger={
              <Button
                className="filter-button"
                style={{ width: '95px' }}
                icon={this.props.enabled ? 'pause' : 'play'}
                onClick={handleClick}
                content={this.props.enabled ? 'Pause' : ' Play'}
              />
            }
          />

          <div
            className="react-select-input-group"
            style={{ width: '90px', textAlign: 'center' }}
          >
            <Popup
              basic
              content="Retain events for N seconds"
              trigger={<label>Retain for</label>}
            />
            <Select
              options={timeBucketOptions}
              onChange={this.updateBucket}
              value={this.props.bucketMs}
              classNamePrefix="react-select"
            />
          </div>
        </div>

        {this.filtersContainer()}
      </div>
    );
  }
}
