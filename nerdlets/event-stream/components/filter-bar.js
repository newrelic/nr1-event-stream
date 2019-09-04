import React from 'react';
import Select from 'react-select';
import { Icon, Button, Popup, Modal, Search, Form, Divider, Label } from 'semantic-ui-react';
import _ from 'lodash';

const initialState = { isLoading: false, results: [], value: "", type: "" }

function Filter({ attribute, value, removeFilter }) {
  return <div className="filter">
    <span onClick={removeFilter}>
      {value} <Icon link name='close' />
    </span>
  </div>
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
    this.removeFilter = this.removeFilter.bind(this);
    this.filterModal = this.filterModal.bind(this);
    this.handleResultSelect = this.handleResultSelect.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
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
    const textOptions = [
      { key: 'e', text: '=', value: '=' },
      { key: 'l', text: 'LIKE', value: 'LIKE' },
      { key: 'in', text: 'IS NULL', value: 'IS NULL' },
      { key: 'inn', text: 'IS NOT NULL', value: 'IS NOT NULL' }
    ]
    const numericOptions = [
      { key: 'e', text: '=', value: '=' },
      { key: 'm', text: '>', value: '>' },
      { key: 'me', text: '>=', value: '>=' },
      { key: 'l', text: '<', value: '<' },
      { key: 'le', text: '<=', value: '<=' },
      { key: 'is', text: 'IS NULL', value: 'IS NULL' },
      { key: 'inn', text: 'IS NOT NULL', value: 'IS NOT NULL' }
    ]

    const addFilter = () => {
      let val = this.state.filterValue
      if(isNaN(val)) val = `'${val}'`
      let value = `\`${this.state.value}\` ${this.state.operator} ${val}`
      this.updateFilter({label: value,value: value})
    }

    if(keySet.length == 0) return <Button><Icon name='spinner' loading/>Loading Filters</Button>
    return (
        <Modal size="small" style={{height:"200px"}} closeIcon centered={false} trigger={<Button icon="filter" content="Filter"/>}>
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
                    options={this.state.type == "numeric" ? numericOptions : textOptions}
                    width={3}
                    onChange={(e,d)=>this.setState({operator:d.value})}
                  />
                  <Form.Input fluid label='Value' value={this.state.filterValue} width={6} onChange={(e,d)=>this.setState({filterValue:d.value})}/>
                </Form.Group>
                <Form.Button style={{float:"right"}} onClick={()=>addFilter()}>Add Filter</Form.Button>
              </Form>
          </Modal.Description>
        </Modal.Content>
      </Modal>
    )
  }

  render() {
    const quickFilterOptions = [
      { key: 1, label: 'Errors', value: "(error IS TRUE OR httpResponseCode NOT LIKE '2%%')" },
      { key: 2, label: 'Database', value: "databaseCallCount > 0" },
      { key: 3, label: 'External', value: "externalCallCount > 0" },
      { key: 4, label: 'Queues', value: "queueDuration is NOT NULL" },
    ]

    return (
      <div>
        <div className="utility-bar">

          <div className="react-select-input-group" style={{float:"left"}}>
            <label>Add Quick Filters</label>
            <Select
                options={quickFilterOptions}
                onChange={this.updateFilter}
                classNamePrefix="react-select"
              />
          </div>

          <div className="filter-menu-right">
            {this.filterModal()}
            <Popup content='Pause / Resume Event Stream' 
              trigger={<Button style={{width:"80px"}} icon={this.props.enabled ? "pause" : "play"} onClick={()=>this.props.setParentState({enabled:!this.props.enabled})} content={this.props.enabled ? "Pause" : " Play"} />} 
            />
          </div>

          {/* <AdvFilter setParentState={this.props.setParentState} getParentState={this.props.getParentState}/>
          <ColumnSelect setParentState={this.props.setParentState} getParentState={this.props.getParentState}/>
          <TimeBucket setParentState={this.props.setParentState} getParentState={this.props.getParentState}/> */}
        </div>

        <div className="filters-container">
          <h3 className="filters-header">Filters:</h3>

            {Object.keys(this.props.filters).map((label)=>{
              return <Filter 
                  key={`${label}/${this.props.filters[label]}`} 
                  attribute={label} 
                  value={label} 
                  removeFilter={()=>this.removeFilter(label)}/>
              })}
        </div>
      </div>
    )
  }
}