import React from 'react';
import ReactDOM from 'react-dom';

import Panel from './panel.jsx';
import Workspace from './workspace.jsx';

export default class App extends React.Component {
    render() {
        return (
            <div className="content span-container">
                <Panel />
                <Workspace />
            </div>
        );
    }
}

window.onload = function () {
    const main = document.getElementsByTagName("main")[0];
    ReactDOM.render(<App />, main);
}
