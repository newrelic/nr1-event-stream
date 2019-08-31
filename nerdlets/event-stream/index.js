import React from 'react';
import PropTypes from 'prop-types';
import { nerdGraphQuery, nrdbQuery } from './utils';
import TransactionTable from './components/transactionTable'
import HeaderInternal from './components/header'
import { Tabs, TabsItem, Modal, Button, LineChart } from 'nr1';
import JSONPretty from 'react-json-pretty';
import { Header, Grid } from 'semantic-ui-react'
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
          filters: {},
          previousIds: [],
          queryStatus: ""
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
            if(this.state.enabled && this.state.queryStatus != "start"){
                await this.setState({queryStatus: "start"})
                let { entity, baseQuery, events, bucketMs, eventLength, previousIds } = this.state

                // keep only first 1000 events
                if(events.length > 1000) events = events.slice(0,1000)

                // only get events from 2 seconds ago
                let currentTimestamp = new Date().getTime()

                // do not query ids that have already been found
                let query = `${baseQuery} AND traceId NOT IN (${"'"+previousIds.join("','") + "'"}) SINCE 2 seconds ago LIMIT 2000`
                let result = await nrdbQuery(entity.account.id, query)
                console.log(result.length, new Date().getTime())
                events.push(...result)

                // store newIds into array for filtering use
                let newIds = []
                let newEvents = events.filter((event)=>{
                  newIds.push(event.traceId)
                  let timestampDiff = currentTimestamp - event.timestamp
                  return timestampDiff <= bucketMs
                })

                // sort by timestamp
                newEvents = newEvents.sort((a, b) => (a.timestamp > b.timestamp) ? -1 : 1)
                eventLength.push(newEvents.length)
                if(eventLength.length > 25) eventLength.unshift()
                  
                await this.setState({events: newEvents, eventLength: eventLength, previousIds: newIds, queryStatus: "end" })
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
        // let errorEvents = events.filter((event)=> event.error || event.errorMessage || event["error.message"] || event["error.class"] || parseFloat(event["response.status"])>299)
        // let dbEvents = events.filter((event)=> event.databaseDuration)
        // let extEvents = events.filter((event)=> event.externalDuration)
        // let queueEvents = events.filter((event)=> event.queueDuration)

        return (
          <>
            
            <Grid>
              <Grid.Row style={{paddingBottom:"0px"}}>
                <Grid.Column>
                  <Header size='large'  style={{paddingTop: "10px", paddingLeft: "10px"}}>Event Stream</Header>

                  <Sparklines data={this.state.eventLength} height={15} limit={50} style={{ strokeWidth: 0.2 }}>
                    <SparklinesLine color="black" style={{ strokeWidth: 0.2 }}/>
                    <SparklinesSpots size={0.3} />
                  </Sparklines>
                  {/* <LineChart
                      accountId={this.state.accountId}
                      query={`SELECT count(*) as 'RPM' FROM Transaction,TransactionError WHERE entityGuid='${this.props.nerdletUrlState.entityGuid}' SINCE 1 minutes ago TIMESERIES AUTO`}
                      style={{height:"150px", paddingTop: "10px", paddingLeft: "10px", paddingRight: "10px"}}
                  /> */}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row columns={16}>
                {/* <Grid.Column width={2}>
                  Attribute Search
                </Grid.Column> */}
                <Grid.Column width={16}>

      
                    <HeaderInternal state={this.state} setParentState={this.setParentState} filters={this.state.filters} enabled={this.state.enabled} eventLength={this.state.eventLength}/>
                    <Tabs defaultSelectedItem="tab-1" style={{fontSize:"14px"}}>
                      <TabsItem itemKey="tab-1" label="All">
                        <TransactionTable events={events} rowSelect={this.rowSelect} handleFilter={this.handleFilter}/>
                      </TabsItem>

                      {/* <TabsItem itemKey="tab-2" label="Database">
                        <TransactionTable events={dbEvents} rowSelect={this.rowSelect} handleFilter={this.handleFilter} cols={[METRICS.host, METRICS.name, METRICS.code, METRICS.duration, METRICS.dbDuration, METRICS.databaseCallCount ]} />
                      </TabsItem>
                      <TabsItem itemKey="tab-3" label="External">
                        <TransactionTable events={extEvents} rowSelect={this.rowSelect} handleFilter={this.handleFilter} cols={[METRICS.host, METRICS.name, METRICS.code, METRICS.duration, METRICS.externalDuration, METRICS.externalCallCount ]} />
                      </TabsItem>
                      <TabsItem itemKey="tab-4" label="Queues">
                        <TransactionTable events={queueEvents} rowSelect={this.rowSelect} handleFilter={this.handleFilter} />
                      </TabsItem>
                      <TabsItem itemKey="tab-5" label="Errors">
                        <TransactionTable events={errorEvents} rowSelect={this.rowSelect} handleFilter={this.handleFilter} />
                      </TabsItem> */}

                    </Tabs>
                    <Modal hidden={this.state.hidden} onClose={this.onClose}> 
                        <JSONPretty data={this.state.jsonTemp}></JSONPretty>
                        <Button onClick={this.onClose}>Close</Button>
                    </Modal>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </>
        )
    }
}
