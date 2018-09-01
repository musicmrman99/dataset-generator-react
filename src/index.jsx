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
            createNewTable: this.createNewTable.bind(this),
            deleteTable: this.deleteTable.bind(this)
        }
    }

    /**
     * Check if name already exists in the given set of items. If it does not,
     * return name. If it does, then return name suffixed with an incrementing
     * number to ensure it is unique.
     * @param {String} name The name to check.
     * @param {Array} set The set of items that the returned name must be unique
     * within.
     * @returns {String} A unique name, within the scope of the given set.
     */
    getUniqueName (name, set) {
        const nameIndexes = set.map((objName) => {
            const match = objName.match(/^(.*?)([0-9]*)$/); // Split into name and index

            // If it matches, return the index. If the index is "", use 0.
            if (match[1] === name) return parseInt(match[2]) || 0;
            else return null; // If no match, return null
        }).filter(
            (objNameIndex) => objNameIndex != null // Filter out the nulls
        )

        // This table name would be unique
        if (nameIndexes.length === 0) return name;

        // Get the next index for this name
        const suffixIndex = nameIndexes.reduce(
            (accumMax, nameIndex) => Math.max(accumMax, nameIndex)
        , 0);

        return name + (suffixIndex+1);
    }

    createNewTable (tableSpec) {
        // Ensure that the name is unique
        if ("name" in tableSpec) {
            tableSpec.name = this.getUniqueName(tableSpec.name,
                this.state.tables.map((table) => table.name)
            )
        }

        // ie. tables.push(), the React-friendly way
        this.setState({tables: this.state.tables.concat(
            Object.assign(
                // Defaults
                {
                    name: "",
                    settings: {
                        numRecords: 0
                    },
                    fields: []
                },
                // Overwrite with caller's object
                tableSpec
            )
        )});
    }

    deleteTable (name) {
        this.setState({ tables: this.state.tables.filter(
            (table) => (table.name !== name)
        )});
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
