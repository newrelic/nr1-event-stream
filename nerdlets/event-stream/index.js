import React from 'react';
import PropTypes from 'prop-types';
import { nerdGraphQuery, nrdbQuery } from './lib/utils';
import EventTable from './components/event-table';
import FilterBar from './components/filter-bar';
import { Grid } from 'semantic-ui-react';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';

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
          entityGuid: null,
          events: [],
          eventLength: [],
          enabled: true, 
          bucketMs: 30000, 
          filters: {},
          previousIds: [],
          queryTracker: "",
          queryStatus: ""
        }
        this.setParentState = this.setParentState.bind(this);
        this.getParentState = this.getParentState.bind(this);
        this.startTimer = this.startTimer.bind(this);
    }

    componentDidMount(){
        this.loadEntity()
    }

    componentDidUpdate({nerdletUrlState}) {
        if(nerdletUrlState.entityGuid != this.props.nerdletUrlState.entityGuid) {
          console.log('reloading entity')
          this.loadEntity()
        }
    }

    startTimer(){
      this.refresh = setInterval(async ()=>{
          if(this.state.enabled && this.state.queryStatus != "start"){
              await this.setState({queryStatus: "start"})

              let { entity, baseQuery, bucketMs, previousIds, events, eventLength, queryTracker } = this.state

              // do not query ids that have already been found
              let query = `${baseQuery} `
              query += Object.keys(this.state.filters).map((filter)=>`AND ${this.state.filters[filter]} `).toString().replace(/,/g,"")
              if(queryTracker != query){
                console.log(query)
                await this.setState({queryTracker: query, events: []})
              }
              query += ` AND traceId NOT IN (${"'"+previousIds.join("','") + "'"}) `
              query += `SINCE 2 seconds ago LIMIT 2000`

              let result = await nrdbQuery(entity.account.id, query)

              // add new results to events array
              events.push(...result)  
                     
              let newIds = []
              let currentTimestamp = new Date().getTime()
              events = events.filter((event)=>{
                event.timestamp = new Date(event.timestamp).toLocaleTimeString()
                newIds.push(event.traceId)
                let timestampDiff = currentTimestamp - event.timestamp
                return timestampDiff <= bucketMs
              })

              result = result.sort((a, b)=>a.timestamp - b.timestamp)
              eventLength.push(result.length)

              if(eventLength.length > 25) eventLength.unshift(); 
              await this.setState({events:result, eventLength, previousIds: newIds, queryStatus: "end" })
          }
      },1500);
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
            case "BROWSER": // not supported yet
                // baseQuery = `SELECT * FROM Mobile WHERE id = '${id}'`
                break;
            default:
              //
          }

          await this.setState({ entityGuid, baseQuery, entity: data.actor.entity, accountId: data.actor.entity.account.id })
          this.startTimer()
          // this.setState({ entityGuid, baseQuery, entity: data.actor.entity, accountId: data.actor.entity.account.id }, () => this.startTimer())
        } else {
          await this.setState({entity: null})
        }
      }

    setParentState(data){
      this.setState(data)
    }

    getParentState(key){
      return this.state[key]
    }

    render() {
        return (
            <Grid style={{height:"100%"}}>
              <Grid.Row>
                <Grid.Column>
                  <FilterBar filters={this.state.filters} enabled={this.state.enabled} setParentState={this.setParentState} getParentState={this.getParentState}/>
                </Grid.Column>
              </Grid.Row>

              <Grid.Row style={{paddingBottom:"0px"}}>
                <Grid.Column>
                  <Sparklines data={this.state.eventLength} height={15} limit={50} style={{ strokeWidth: 0.2 }}>
                    <SparklinesLine color="#00B3D7" style={{ strokeWidth: 0.2 }}/>
                    <SparklinesSpots size={0.3} />
                  </Sparklines>
                </Grid.Column>
              </Grid.Row>

              <Grid.Row columns={16} stretched style={{height:"80%", paddingTop:"0px"}}>
                <Grid.Column width={16}>
                    <EventTable events={this.state.events} setParentState={this.setParentState} getParentState={this.getParentState}/>
                </Grid.Column>
              </Grid.Row>
            </Grid>
        )
    }
}
