import React from 'react';
import ReactDOM from 'react-dom';

import Panel from './panel';
import Workspace from './workspace';

import ResourceManager from './helpers/resource-manager';
window.resourceManager = new ResourceManager();

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
