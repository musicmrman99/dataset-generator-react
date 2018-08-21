import React from 'react';
import ReactDOM from 'react-dom';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import Panel from './panel';
import Workspace from './workspace';

import ResourceManager from './helpers/resource-manager';
window.resourceManager = new ResourceManager();

// builds fine, but spits errors from VS Code
@DragDropContext(HTML5Backend)
export default class App extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            tables: []
        }

        this.actions = {
            createNewTable: this.createNewTable.bind(this)
        }
    }

    createNewTable (tableSpec) {
        this.state.tables.push(Object.assign({
            name: "",
            settings: {
                numRecords: 0
            },
            fields: []
        }, tableSpec));
    }

    render () {
        return (
            <div className="content span-container">
                <Panel tables={this.state.tables} actions={this.actions} />
                <Workspace tables={this.state.tables} actions={this.actions} />
            </div>
        );
    }
}

window.onload = function () {
    const main = document.getElementsByTagName("main")[0];
    ReactDOM.render(<App />, main);
}
