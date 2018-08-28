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

    /**
     * Check if tableName already exists in the table list and suffix an index
     * to ensure it is unique.
     * @param {String} tableName The table name to check.
     * @returns {String} A unique table name.
     */
    getUniqueName (tableName) {
        const tablesWithName = this.state.tables.filter(
            (table) => table.name.includes(tableName)
        )
        // This table name would be unique
        if (tablesWithName.length === 0) return tableName;

        // Get the highest index for this name
        // NOTE: This is slow, but it would take a lot of handling to keep track
        // of table name updates.
        const suffixIndex = tablesWithName.reduce((accumMax, table) => {
            const nameIndex = table.name.split(tableName)[1];
            const checkMax = parseInt(nameIndex) || 0; // If NaN, use 0
            return Math.max(accumMax, checkMax);
        }, 0);

        // Concatenate the name and the next index for this name
        return tableName + (suffixIndex+1);
    }

    createNewTable (tableSpec) {
        // Ensure that the name is unique
        if ("name" in tableSpec) {
            tableSpec.name = this.getUniqueName(tableSpec.name)
        }

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
