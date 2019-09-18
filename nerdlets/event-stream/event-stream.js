import React from 'react';
import { nerdGraphQuery, apmQuery, nrdbQuery, uniqByPropMap, getCollection, eventStreamQuery } from './lib/utils';
import EventTable from './components/event-table';
import MenuBar from './components/menu-bar';
import { Grid, Dimmer, Loader, Header } from 'semantic-ui-react';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import { APM_DEFAULT, APM_REQ } from './lib/metrics'
import { NerdGraphQuery } from 'nr1';
import gql from 'graphql-tag';

function setQueryAttributes(columns){
  let attributes = ""

  for(let z=0;z<columns.length;z++){
    if(columns[z].keys){
      for(let y=0;y<columns[z].keys.length;y++){
        attributes += columns[z].keys[y] + ","
      }
    }
    if(columns[z].key){
      attributes += columns[z].key + ","
    }
  }

  if(attributes == "") return "*"
  return "traceId,"+ attributes.slice(0, -1)
}

export default class EventStream extends React.Component {

    constructor(props){
        super(props)
        this.state = { 
          entityGuid: null,
          stats: {},
          events: [],
          eventLength: [],
          keySet: [],
          enabled: true, 
          bucketMs: { key: 1, label: '30 sec', value: 30000 }, 
          filters: {},
          previousIds: [],
          queryTracker: "",
          queryStatus: "",
          entity: null,
          columns: [],
          snapshots: [],
          loading: false,
          queryTimestamp: 0,
        }
        this.setParentState = this.setParentState.bind(this);
        this.getParentState = this.getParentState.bind(this);
        this.loadEntity = this.loadEntity.bind(this);
        this.startTimer = this.startTimer.bind(this);
        this.fetchSnapshots = this.fetchSnapshots.bind(this);
    }

    async componentDidMount(){
      let columns = [...APM_REQ, ...APM_DEFAULT]
      await this.setState({columns})
      this.loadEntity()
      this.fetchSnapshots()
    }

    componentDidUpdate({nerdletUrlState}) {
        if(nerdletUrlState.entityGuid != this.props.nerdletUrlState.entityGuid) {
          console.log('reloading entity')
          this.loadEntity()
        }
    }

    async fetchSnapshots(){
      let snapshots = await getCollection("eventStreamSnapshots")
      this.setState({snapshots})
    }

    startTimer(){
      this.refresh = setInterval(async ()=>{
          if(this.state.enabled && this.state.queryStatus != "start"){
              await this.setState({queryStatus: "start"})

              let { entity, entityGuid, bucketMs, previousIds, events, eventLength, queryTracker, columns, queryTimestamp } = this.state
              let baseQuery = `SELECT ${setQueryAttributes(columns)} FROM Transaction, TransactionError WHERE entityGuid = '${entityGuid}'`
              let currentTimestamp = new Date().getTime()
              if(queryTimestamp == 0) queryTimestamp = currentTimestamp

              // filter current events out of bucket
              events = events.filter((event)=>{
                let timestampDiff = currentTimestamp - event.timestamp
                return timestampDiff <= bucketMs.value
              })

              // construct query
              let query = `${baseQuery} `
              query += Object.keys(this.state.filters).map((filter)=>`AND ${this.state.filters[filter]} `).toString().replace(/,/g,"")
              if(queryTracker != query){
                console.log(`NRDB Query: ${query}`)
                events = []
                eventLength = []
                await this.setState({queryTracker: query})
              }
              query += ` AND traceId NOT IN (${"'"+previousIds.join("','") + "'"}) `

              // fetch events
              let nerdGraphResults = await NerdGraphQuery.query({query: gql`${eventStreamQuery(entityGuid,entity.account.id,query, queryTimestamp)}`})
              let nerdGraphData = (((nerdGraphResults || {}).data || {}).actor || {}).account || {}
              let result = nerdGraphData.nrdbEvents.results || []
              let resultStats = nerdGraphData.stats.results || []
              let stats = resultStats[0] || {}

              // set timestamp for next query, use last timestamp found, else set current timestamp as next
              if(result[0] && result[0].timestamp){
                queryTimestamp = result[0].timestamp
              }else{
                queryTimestamp = currentTimestamp
              }

              // ensure duplicate transactions are not re-queried
              let filterIds = result.filter((event)=> event.timestamp == queryTimestamp).map((event)=>event.traceId)

              // add new results to front of events array
              events.unshift(...result)

              eventLength.push(stats.count)
              if(eventLength.length > 25) eventLength.unshift(); 
              await this.setState({events, eventLength, previousIds: filterIds, queryTimestamp, stats, queryStatus: "end" })
          }
      },1500);
  }

    async loadEntity() {
        await this.setState({loading: true})

        let {entityGuid} = this.props.nerdletUrlState
        let {columns} = this.state

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
          if(data.actor.entity){
            let baseQuery = ""
            let keySet = []
            switch(data.actor.entity.domain){
              case "APM":
                  baseQuery = `SELECT ${setQueryAttributes(columns)} FROM Transaction, TransactionError WHERE entityGuid = '${entityGuid}'`
                  console.log(`NRDB Base Query: ${baseQuery}`)
                  keySet = await nrdbQuery(data.actor.entity.account.id, `SELECT keyset() FROM Transaction, TransactionError WHERE entityGuid = '${entityGuid}'`)
                  keySet = keySet.map((k) => ({ title: k.key, type: k.type }))
                  const uniqueById = uniqByPropMap("title");
                  keySet = uniqueById(keySet);
                  break;
              case "BROWSER": // not supported yet
                  // baseQuery = `SELECT * FROM Mobile WHERE id = '${id}'`
                  break;
              default:
                //
            }

            await this.setState({ entityGuid, baseQuery, entity: data.actor.entity, accountId: data.actor.entity.account.id, keySet })
            this.startTimer()

          }else{
            await this.setState({entity: null})
            console.log("entity is null, ensure this has been deployed against the correct account")
          }
        } else {
          await this.setState({entity: null})
        }
        await this.setState({loading: false})
    }

    setParentState(data){
      this.setState(data)
    }

    getParentState(key){
      return this.state[key]
    }

    render() {
        let { entity, loading, eventLength, filters, columns, bucketMs, queryTracker, keySet, enabled, snapshots, events, stats } = this.state 
        let dimmerOn = loading || eventLength.length == 0 || !entity
        let unableToAccessEntity = !loading && !entity && eventLength.length == 0
        return (
            <Grid style={{height:"100%"}}>
              <Grid.Row>
                <Grid.Column>
                  <MenuBar 
                    entity={entity}
                    filters={filters} 
                    columns={columns} 
                    bucketMs={bucketMs} 
                    query={queryTracker} 
                    keySet={keySet} 
                    enabled={enabled} 
                    snapshots={snapshots}
                    setParentState={this.setParentState}
                    fetchSnapshots={this.fetchSnapshots} />
                </Grid.Column>
              </Grid.Row>

              <Grid.Row style={{paddingBottom:"0px",paddingTop:"0px"}}>
                <Grid.Column>
                  <Sparklines data={eventLength} height={15} limit={50} style={{ strokeWidth: 0.2 }}>
                    <SparklinesLine color="#00B3D7" style={{ strokeWidth: 0.2 }}/>
                    <SparklinesSpots size={0.3} />
                  </Sparklines>
                </Grid.Column>
              </Grid.Row>

              <Grid.Row columns={16} stretched style={{height:"77%", paddingTop:"0px"}}>
                <Grid.Column width={16}>
                    <Dimmer active={dimmerOn} style={{display: dimmerOn ? "" : "none", height:"108%"}}>
                        <Loader size="large" style={{display: (loading || eventLength.length == 0) && !unableToAccessEntity ? "" : "none"}}>Loading Entity</Loader>
                        <Header inverted style={{display: unableToAccessEntity ? "" : "none"}}>
                          Nerdpack unable to access this entity!
                          <Header.Subheader>Have you deployed against the correct account?</Header.Subheader>
                        </Header>               
                    </Dimmer>

                    <h3 style={{maxHeight:"20px", paddingRight:"5px", margin:0, textAlign:"right"}} className="filters-header">{stats.count || 0} Transactions since 1 minute ago</h3>

                    <EventTable style={{display: dimmerOn ? "none" : ""}}
                        events={events} 
                        columns={columns} 
                        query={queryTracker} 
                        accountId={((entity || {}).account || {}).id || 0} 
                        filters={filters} 
                        keySet={keySet} 
                        setParentState={this.setParentState} 
                        getParentState={this.getParentState}/>
                    }
                </Grid.Column>
              </Grid.Row>
            </Grid>
        )
    }
}