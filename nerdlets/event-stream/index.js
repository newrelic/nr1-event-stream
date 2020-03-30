import React from 'react';
import { NerdletStateContext } from 'nr1';
import EventStream from './event-stream';
export default class Root extends React.Component {
  render() {
    return (
      <NerdletStateContext.Consumer>
        {nerdletUrlState => (
              <EventStream
                nerdletUrlState={nerdletUrlState}
              />
        )}
      </NerdletStateContext.Consumer>
    );
  }
}
