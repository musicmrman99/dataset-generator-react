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
            deleteTable: this.deleteTable.bind(this),

            createNewField: this.createNewField.bind(this),
            deleteField: this.deleteField.bind(this)
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

    createNewField(tableName, fieldSpec) {
        // Ensure the table exists (this should never fail, but you never know)
        const tableNames = this.state.tables.map((table) => table.name);
        const tableExists = Boolean(tableNames.find((checkTableName) => checkTableName === tableName));
        if (!tableExists) {
            // If tableName === undefined, I laugh at you.
            throw Error("No such table '"+tableName+"'");
        }

        // Ensure that the name is unique in this table
        if ("name" in fieldSpec) {
            const table = this.state.tables.find((table) => table.name === tableName)
            fieldSpec.name = this.getUniqueName(fieldSpec.name,
                table.fields.map((field) => field.name)
            )
        }

        // ie. tables[tableName].fields.push(), the React-friendly way
        const newTables = this.state.tables.slice();
        const modTable = newTables.find((table) => table.name === tableName)
        modTable.fields.push(
            Object.assign(
                // Defaults
                {
                    name: "",
                    settings: {
                        // TODO: fill this out
                    }
                },
                // Overwrite with caller's object
                fieldSpec
            )
        );
        this.setState({tables: newTables});
    }

    deleteField (tableName, fieldName) {
        const newTables = this.state.tables.slice();
        const table = newTables.find((table) => table.name === tableName);
        table.fields = table.fields.filter((field) => field.name !== fieldName);
        this.setState({tables: newTables});
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
