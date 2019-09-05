import React from 'react';
import Select from 'react-select';
import { Icon, Button, Popup, Modal, Search, Form, Divider } from 'semantic-ui-react';
import { navigation } from 'nr1';
import { stringOptions, numericOptions, booleanOptions } from '../lib/metrics'
import _ from 'lodash';

const initialState = { isLoading: false, results: [], value: "", type: "" }

function Filter({ attribute, value, removeFilter }) {
  return <div className="filter">
    <span onClick={removeFilter}>
      {value} <Icon link name='close' />
    </span>
  </div>
}

function openChartBuilder(query, account) {
  const nerdlet = {
    id: 'wanda-data-exploration.nrql-editor',
    urlState: {
      initialActiveInterface: 'nrqlEditor',
      initialChartType:'table',
      initialAccountId: account,
      initialNrqlValue: query,
      isViewingQuery: true,
    }
  }
  navigation.openOverlay(nerdlet)
}

export default class FilterBar extends React.PureComponent {
  state = initialState

  constructor(props){
    super(props)
    this.state = {
      value: "",
      isLoading: false,
      results: [],
      type: "",
      filterValue: "",
      operator: ""
    }
    this.updateFilter = this.updateFilter.bind(this);
    this.updateBucket = this.updateBucket.bind(this);
    this.removeFilter = this.removeFilter.bind(this);
    this.filterModal = this.filterModal.bind(this);
    this.handleResultSelect = this.handleResultSelect.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.filtersContainer = this.filtersContainer.bind(this);
  }

  handleResultSelect = (e, { result }) => {
    this.setState({ value: result.title, type: result.type })
  }

  handleSearchChange = (e, { value }) => {
    this.setState({ isLoading: true, value })

    setTimeout(() => {
      if (this.state.value.length < 1) return this.setState(initialState)

      const re = new RegExp(_.escapeRegExp(this.state.value), 'i')
      const isMatch = (result) => re.test(result.title)

      this.setState({
        isLoading: false,
        results: _.filter(this.props.keySet, isMatch),
      })
    }, 300)
  }

  updateBucket = (data) => {
    let { setParentState } = this.props
    this.props.setParentState({"bucketMs":data})
    this.forceUpdate()
  }

  updateFilter = (data) => {
    let { filters, setParentState } = this.props
    filters[data.label] = data.value
    setParentState({"filters":filters})
    this.forceUpdate()
  }

  removeFilter = (label) => {
    let { filters, setParentState } = this.props
    delete filters[label]
    setParentState({"filters":filters})
    this.forceUpdate()
  }

  filterModal(){
    const { isLoading, value, results } = this.state
    const { keySet } = this.props

    const addFilter = () => {
      let val = this.state.filterValue
      let operator = this.state.operator
      if(isNaN(val) && operator != "IS" && operator != "IS NOT") val = `'${val}'`
      let value = `\`${this.state.value}\` ${operator} ${val}`
      this.updateFilter({label: value, value: value})
    }

    let selectedOptions = stringOptions
    switch(this.state.type){
      case "numeric":
          selectedOptions = numericOptions
          break;
      case "string":
          selectedOptions = stringOptions
          break;
      case "boolean":
          selectedOptions = booleanOptions
          break
      default:
        //
    }

    if(keySet.length == 0) return <Button className="filter-button"><Icon name='spinner' loading/>Loading Filters</Button>
    return (
        <Modal size="small" style={{height:"200px"}} closeIcon centered={false} trigger={<Button className="filter-button" icon="filter" content="Filter" style={{backgroundColor:"none"}}/>}>
        <Modal.Header>Filters</Modal.Header>
        <Modal.Content image>
          <Modal.Description>

                <Search
                  fluid
                  style={{width:"100%"}}
                  loading={isLoading}
                  onResultSelect={this.handleResultSelect}
                  onSearchChange={_.debounce(this.handleSearchChange, 500, {
                    leading: true,
                  })}
                  results={results}
                  value={value}
                  icon={"search"}
                  input={{ fluid: true }}
                />

                <Divider />

              <Form>
                <Form.Group widths='equal'>
                  <Form.Input fluid label='Attribute' value={this.state.value} width={6} onChange={(e,d)=>this.setState({value:d.value})}/>
                  <Form.Select
                    fluid
                    label='Operator'
                    options={selectedOptions}
                    width={3}
                    onChange={(e,d)=>this.setState({operator:d.value})}
                  />
                  <Form.Input fluid label='Value' value={this.state.filterValue} width={6} onChange={(e,d)=>this.setState({filterValue:d.value})}/>
                </Form.Group>
                <Form.Button style={{float:"right"}} onClick={()=>addFilter()}>Add Filter</Form.Button>
              </Form>

          </Modal.Description>
        </Modal.Content>

        <Modal.Actions>
          {this.filtersContainer()}
        </Modal.Actions>
      </Modal>
    )
  }

  filtersContainer(){
    return  <div className="filters-container" style={{textAlign:"left"}}>
      <h3 className="filters-header">Filters:</h3>

      {Object.keys(this.props.filters).map((label)=>{
        return <Filter 
            key={`${label}/${this.props.filters[label]}`} 
            attribute={label} 
            value={label} 
            removeFilter={()=>this.removeFilter(label)}/>
        })}
      </div>
  }

  render() {
    const quickFilterOptions = [
      { key: 1, label: 'Errors', value: "(error IS TRUE OR httpResponseCode NOT LIKE '2%%')" },
      { key: 2, label: 'Database', value: "databaseCallCount > 0" },
      { key: 3, label: 'External', value: "externalCallCount > 0" },
      { key: 4, label: 'Queues', value: "queueDuration is NOT NULL" },
    ]

    const timeBucketOptions = [
      { key: 1, label: '5 sec', value: 5000 },
      { key: 2, label: '10 sec', value: 10000 },
      { key: 3, label: '20 sec', value: 20000 },
      { key: 4, label: '30 sec', value: 30000 },
      { key: 5, label: '40 sec', value: 40000 },
      { key: 6, label: '50 sec', value: 50000 },
      { key: 7, label: '60 sec', value: 60000 }
    ]

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

            <div className="flex-push"></div>

            {this.filterModal()}
            <Popup content='View in Chart Builder' 
              trigger={<Button className="filter-button" icon="chart line" onClick={() => openChartBuilder(this.props.query, this.props.accountId)} content="View Query" />} 
            />

            <Popup content='Pause / Resume Event Stream' 
              trigger={<Button className="filter-button" style={{width:"80px"}} icon={this.props.enabled ? "pause" : "play"} onClick={()=>this.props.setParentState({enabled:!this.props.enabled})} content={this.props.enabled ? "Pause" : " Play"} />} 
            />

            <div className="react-select-input-group" style={{width:"90px", textAlign:"center"}}>
              <Popup content='Retain events for N seconds' trigger={<label>Time Bucket</label>}/>
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
    )
  }
}