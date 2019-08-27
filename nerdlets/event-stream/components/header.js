import React from 'react';
import { Button, Icon } from 'semantic-ui-react';

export default class TransactionEventTable extends React.PureComponent {

  renderRemoveFilterButtons(filters, setParentState){
    let tempFilters = filters
    let removeFilter = (filter) => { 
      delete tempFilters[filter]
      setParentState({filters:tempFilters})
    }
    return Object.keys(filters).map((filter, i)=>{
      return <Button key={i} onClick={()=>removeFilter(filter)} icon labelPosition="right" size={"mini"} ><Icon name='remove' />{filters[filter]}</Button>
    })
  }

  render() {
    return (
      <div style={{float:"right"}}>
        <Button.Group icon size={"mini"} >
          {this.renderRemoveFilterButtons(this.props.filters, this.props.setParentState)}
          {' '}
          <Button size={"mini"} positive={this.props.enabled} onClick={()=>this.props.setParentState({"enabled":!this.props.enabled})}>
            <Icon size={"small"} name={this.props.enabled?"pause":"play"} />
          </Button>
        </Button.Group>
      </div>
    )
  }
}