import React from 'react';
import PropTypes from 'prop-types';
import { nerdGraphQuery, nrdbQuery, uniqByPropMap } from './lib/utils';
import EventTable from './components/event-table';
import MenuBar from './components/menu-bar';
import { Grid } from 'semantic-ui-react';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import { APM_DEFAULT, APM_REQ } from './lib/metrics'

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
          keySet: [],
          enabled: true, 
          bucketMs: { key: 1, label: '30 sec', value: 30000 }, 
          filters: {},
          previousIds: [],
          queryTracker: "",
          queryStatus: "",
          entity: {account:{id:null}},
          columns: []
        }
        this.setParentState = this.setParentState.bind(this);
        this.getParentState = this.getParentState.bind(this);
        this.loadEntity = this.loadEntity.bind(this);
        this.startTimer = this.startTimer.bind(this);
    }

    async componentDidMount(){
      let columns = [...APM_REQ, ...APM_DEFAULT]
      await this.setState({columns})
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

              let { entity, entityGuid, bucketMs, previousIds, events, eventLength, queryTracker, columns } = this.state
              let baseQuery = `SELECT ${setQueryAttributes(columns)} FROM Transaction, TransactionError WHERE entityGuid = '${entityGuid}'`

              // do not query ids that have already been found
              let query = `${baseQuery} `
              query += Object.keys(this.state.filters).map((filter)=>`AND ${this.state.filters[filter]} `).toString().replace(/,/g,"")
              if(queryTracker != query){
                console.log(query)
                events = []
                await this.setState({queryTracker: query})
              }
              query += ` AND traceId NOT IN (${"'"+previousIds.join("','") + "'"}) `
              query += `SINCE 2 seconds ago LIMIT 2000`

              let result = await nrdbQuery(entity.account.id, query)

              // add new results to events array
              events.unshift(...result)  
                     
              let newIds = []
              let currentTimestamp = new Date().getTime()
              events = events.filter((event)=>{
                let timestampDiff = currentTimestamp - event.timestamp
                newIds.push(event.traceId)
                return timestampDiff <= bucketMs.value
              })

              eventLength.push(result.length)

              if(eventLength.length > 25) eventLength.unshift(); 
              await this.setState({events, eventLength, previousIds: newIds, queryStatus: "end" })
          }
      },1500);
  }

    async loadEntity() {
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
          let baseQuery = ""
          let keySet = []
          switch(data.actor.entity.domain){
            case "APM":
                baseQuery = `SELECT ${setQueryAttributes(columns)} FROM Transaction, TransactionError WHERE entityGuid = '${entityGuid}'`
                console.log(baseQuery)
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
                  <MenuBar 
                    filters={this.state.filters} 
                    columns={this.state.columns} 
                    bucketMs={this.state.bucketMs} 
                    query={this.state.queryTracker} 
                    accountId={this.state.entity.account.id} 
                    keySet={this.state.keySet} 
                    enabled={this.state.enabled} 
                    setParentState={this.setParentState}/>
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
                    <EventTable 
                      events={this.state.events} 
                      columns={this.state.columns} 
                      query={this.state.queryTracker} 
                      accountId={this.state.entity.account.id} 
                      filters={this.state.filters} 
                      keySet={this.state.keySet} 
                      setParentState={this.setParentState} 
                      getParentState={this.getParentState}/>
                </Grid.Column>
              </Grid.Row>
            </Grid>
        )
    }
}
