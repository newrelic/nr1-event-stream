import React from 'react';
import Select from 'react-select'
import { Button, Icon, Dropdown, Menu, Checkbox } from 'semantic-ui-react';

function Filter({ attribute, value, removeFilter }) {
  return <div className="filter">
    <span onClick={removeFilter}>
      {value} <Icon link name='close' />
    </span>
  </div>
}

export default class FilterBar extends React.PureComponent {

  constructor(props){
    super(props)
    this.state = {}
    this.updateFilter = this.updateFilter.bind(this);
    this.removeFilter = this.removeFilter.bind(this);
  }

  componentDidMount(){
    console.log("mounting filter bar")
  }

  componentDidUpdate(nextProps){
    console.log("re-render filter bar")
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

  render() {
    const quickFilterOptions = [
      { key: 1, label: 'Errors', value: "error IS TRUE" },
      { key: 2, label: 'Database', value: "databaseCallCount > 0" },
      { key: 3, label: 'External', value: "externalCallCount > 0" },
      { key: 4, label: 'Queues', value: "queueDuration is NOT NULL" },
    ]

    return (
      <div>
        <div className="utility-bar">
          <div className="react-select-input-group">
            <label>Add Quick Filters</label>
            <Select
                options={quickFilterOptions}
                onChange={this.updateFilter}
                classNamePrefix="react-select"
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