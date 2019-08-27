import React from 'react';
import PropTypes from 'prop-types';
import { nerdGraphQuery, nrdbQuery } from './utils';
import TransactionTable from './components/transactionTable'
import Header from './components/header'
import { Tabs, TabsItem, Modal, Button } from 'nr1';
import JSONPretty from 'react-json-pretty';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';

const METRICS = require("./metrics")

export default class MyNerdlet extends React.Component {
    static propTypes = {
        nerdletUrlState: PropTypes.object,
        launcherUrlState: PropTypes.object,
        width: PropTypes.number,
        height: PropTypes.number,
    };

    constructor(props){
        super(props)
        this.state = { 
          events: [], 
          eventLength: [],
          enabled: true, 
          bucketMs: 30000, 
          hidden: true, 
          jsonTemp: null, 
          filters: {} 
        }
        this.startTimer = this.startTimer.bind(this)
        this.onClose = this.onClose.bind(this);
        this.rowSelect = this.rowSelect.bind(this);
        this.setParentState = this.setParentState.bind(this);
        this.handleFilter = this.handleFilter.bind(this);
    }

    componentDidMount(){
        this.loadEntity()
    }

    componentDidUpdate({nerdletUrlState}) {
        if(nerdletUrlState.entityGuid != this.props.nerdletUrlState.entityGuid) {
          this.loadEntity()
        }
    }

    onClose() {
      this.setState({ hidden: true });
    }

    handleFilter(col,val){
      let tempFilters = this.state.filters
      tempFilters[col.id] = val
      if(col.id && col.id == "" && val && val != ""){
        this.setState({filters: tempFilters})
      }
    }

    async loadEntity() {
        const {entityGuid} = this.props.nerdletUrlState

        if(entityGuid) {
          // to work with mobile and browser apps, we need the 
          // (non guid) id's for these applications, since guid is 
          // not present in events like PageView, MobileSession, etc.
          const gql = `{
            actor {
              entity(guid: "${entityGuid}") {
                account {name id}
                name
                domain
                type
                guid
                ... on MobileApplicationEntity { applicationId }
                ... on BrowserApplicationEntity { applicationId }
                ... on ApmApplicationEntity { applicationId }
              }
            }
          }`
    
          let data = await nerdGraphQuery(gql)
          let baseQuery = ""
          switch(data.actor.entity.domain){
            case "APM":
                baseQuery = `SELECT * FROM Transaction, TransactionError WHERE entityGuid = '${entityGuid}'`
                break;
            case "BROWSER":
                baseQuery = `SELECT * FROM Mobile WHERE entityGuid = '${entityGuid}'`
                break;
            default:
              //
          }

          this.setState({ entityGuid,  baseQuery, entity: data.actor.entity, accountId: data.actor.entity.account.id }, () => this.startTimer())
        } else {
          await this.setState({entity: null})
        }
      }

    startTimer(){
        this.refresh = setInterval(async ()=>{
            if(this.state.enabled){
                let { entity, baseQuery, events, bucketMs, eventLength } = this.state
                let currentTimestamp = new Date().getTime()
                let startFrom = currentTimestamp - 3000
                let query = `${baseQuery} AND timestamp >= ${startFrom} LIMIT 2000`
                let result = await nrdbQuery(entity.account.id, query)
                events.push(...result)

                // keep only unique transactions and anything x seconds old
                var uniqueEvents = events.reduce((unique, o) => {
                    let timestampDiff = currentTimestamp - o.timestamp
                    // need handling for other unique identifiers
                    if(!unique.some(obj => obj.traceId === o.traceId)){
                        if(timestampDiff <= bucketMs){
                            unique.push(o);
                        }
                    }
                    return unique;
                },[]);
                eventLength.push(uniqueEvents.length)
                if(eventLength.length > 25){
                  eventLength.unshift()
                }
                this.setState({events: uniqueEvents.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1).reverse(), eventLength: eventLength })
            }
        },1500);
    }

    async rowSelect(id, other){
      let query = `${this.state.baseQuery} LIMIT 1 WHERE traceId = '${id}'`
      let result = await nrdbQuery(this.state.accountId, query)
      this.setState({hidden: false, jsonTemp: result[0]})
    }

    setParentState(data){
      this.setState(data)
    }

    applyFilters(events, filters){
      let tempEvents = events
      Object.keys(filters).forEach((filter)=>{
        tempEvents = tempEvents.filter((event) => event[filter] && filters[filter] && event[filter].toString().includes(filters[filter].toString()))
      })
      return tempEvents
    }

    render() {
        let events = this.applyFilters(this.state.events, this.state.filters)
        let errorEvents = events.filter((event)=> event.error || event.errorMessage || event["error.message"] || event["error.class"] || parseFloat(event["response.status"])>299)
        let dbEvents = events.filter((event)=> event.databaseDuration)
        let extEvents = events.filter((event)=> event.externalDuration)
        let queueEvents = events.filter((event)=> event.queueDuration)

        return (
          <>
            <Sparklines data={this.state.eventLength} height={15} limit={50} style={{ strokeWidth: 0.4 }}>
              <SparklinesLine color="black" style={{ strokeWidth: 0.4 }}/>
              <SparklinesSpots size={0.5} />
            </Sparklines>
            <Header state={this.state} setParentState={this.setParentState} filters={this.state.filters} enabled={this.state.enabled} eventLength={this.state.eventLength}/>
            <Tabs defaultSelectedItem="tab-1" style={{fontSize:"14px"}}>
              <TabsItem itemKey="tab-1" label="All">
                {`Events: ${events.length > 0 ? events.length : "No Event Data"}`}
                <TransactionTable events={events} rowSelect={this.rowSelect} handleFilter={this.handleFilter}/>
              </TabsItem>
              <TabsItem itemKey="tab-2" label="Database">
                {`Events: ${dbEvents.length > 0 ? dbEvents.length : "No Event Data"}`}
                <TransactionTable events={dbEvents} rowSelect={this.rowSelect} handleFilter={this.handleFilter} cols={[METRICS.host, METRICS.name, METRICS.code, METRICS.duration, METRICS.dbDuration, METRICS.databaseCallCount ]} />
              </TabsItem>
              <TabsItem itemKey="tab-3" label="External">
                {`Events: ${extEvents.length > 0 ? extEvents.length : "No Event Data"}`}
                <TransactionTable events={extEvents} rowSelect={this.rowSelect} handleFilter={this.handleFilter} cols={[METRICS.host, METRICS.name, METRICS.code, METRICS.duration, METRICS.externalDuration, METRICS.externalCallCount ]} />
              </TabsItem>
              <TabsItem itemKey="tab-4" label="Queues">
                {`Events: ${queueEvents.length > 0 ? queueEvents.length : "No Event Data"}`}
                <TransactionTable events={queueEvents} rowSelect={this.rowSelect} handleFilter={this.handleFilter} />
              </TabsItem>
              <TabsItem itemKey="tab-5" label="Errors">
                {`Events: ${errorEvents.length > 0 ? errorEvents.length : "No Event Data"}`}
                <TransactionTable events={errorEvents} rowSelect={this.rowSelect} handleFilter={this.handleFilter} />
              </TabsItem>
            </Tabs>
            <Modal hidden={this.state.hidden} onClose={this.onClose}> 
                <JSONPretty data={this.state.jsonTemp}></JSONPretty>
                <Button onClick={this.onClose}>Close</Button>
            </Modal>
          </>
        )
    }
}
