import React from 'react';
import ReactDOM from 'react-dom';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import Panel from './panel';
import Workspace from './workspace';

import ResourceManager from './helpers/resource-manager';
window.resourceManager = new ResourceManager();

/**
 * Check if name already exists in the given set of names. If it does not,
 * return name. If it does, then return name suffixed with an incrementing
 * number to ensure it is unique.
 * @param {String} name The name to check.
 * @param {Array} set The set of items that the returned name must be unique
 * within.
 * @returns {String} A unique name, within the scope of the given set.
 */
function getUniqueName (fullName, set) {
    // 1. Split the given name into a (name, index) pair.
    const nameMatch = fullName.match(/^(.*?)([0-9]*)$/);
    const [name, nameIndex] = [nameMatch[1], parseInt(nameMatch[2]) || 0];

    // 2. Construct an array: [(name, index), ...], such that each
    //    name === the 'name' part of the given name's pair.
    const setNameIndexes = set.map((setFullName) => {
        const setNameMatch = setFullName.match(/^(.*?)([0-9]*)$/);
        const [setName, setNameIndex] = [setNameMatch[1], parseInt(setNameMatch[2]) || 0];

        // If it matches, return the index. If the index is "", use 0.
        if (setName === name) return parseInt(setNameIndex) || 0;
        else return null; // If no match, return null
    }).filter(
        (setNameIndex) => setNameIndex != null // Filter out the nulls
    )

    // RETURN: If this table name would be unique without further
    // processing, then return it.
    if (
        setNameIndexes.length === 0 ||
        !(setNameIndexes.includes(nameIndex))
    ) return fullName;

    // --------------------

    // 3. Find the lowest unused index from the resulting array.
    // Source: https://stackoverflow.com/a/30672958
    setNameIndexes.sort((a,b) => a-b) // Sort numerically
    var suffixIndex = -1;
    for (var i = 0; i < setNameIndexes.length; ++i) {
        if (setNameIndexes[i] !== i) {
            suffixIndex = i;
            break;
        }
    }
    if (suffixIndex === -1) {
        suffixIndex = setNameIndexes[setNameIndexes.length - 1] + 1;
    }

    // 4. If the index comes out as 0, then remove it completely
    if (suffixIndex === 0) {
        suffixIndex = "";
    }

    // RETURN: Concatenate and return the (now unique) full name.
    return name + suffixIndex;
}

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// WARNING: DO NOT USE THIS THESE STAND-ALONE - they must be bound to App's 'this'
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const objectOperations = Object.freeze({
    createTable (tableSpec) {
        // Ensure that the name is unique
        if ("name" in tableSpec) {
            tableSpec.name = getUniqueName(tableSpec.name,
                this.state.tables.map((table) => table.name)
            )
        }

        // ie. tables.push(), the React-friendly way
        const newTable = Object.assign(
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
        );
        const newTables = this.state.tables.concat(newTable);
        this.setState({tables: newTables});
    },

    deleteTable (name) {
        // Filter out the given table
        const newTables = this.state.tables.filter((table) => (table.name !== name));
        this.setState({tables: newTables});
    },

    createField(tableName, fieldSpec) {
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
            fieldSpec.name = getUniqueName(fieldSpec.name,
                table.fields.map((field) => field.name)
            )
        }

        const newField = Object.assign(
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

        // ie. tables[tableName].fields.push(), the React-friendly way
        const newTables = this.state.tables.slice();
        const tableIndex = newTables.findIndex((table) => table.name === tableName);
        const table = newTables[tableIndex] = Object.assign({}, newTables[tableIndex]);
        table.fields = table.fields.concat(newField);

        this.setState({tables: newTables});
    },

    deleteField (tableName, fieldName) {
        // Ensure the table exists (this should never fail, but you never know)
        const tableNames = this.state.tables.map((table) => table.name);
        const tableExists = Boolean(tableNames.find((checkTableName) => checkTableName === tableName));
        if (!tableExists) {
            throw Error("No such table '"+tableName+"'");
        }

        // Remove the field
        const newTables = this.state.tables.slice();
        const tableIndex = newTables.findIndex((table) => table.name === tableName);
        const table = newTables[tableIndex] = Object.assign({}, newTables[tableIndex]);
        table.fields = table.fields.filter((field) => field.name !== fieldName);

        this.setState({tables: newTables});
    },

    moveField(fieldName, fromTableName, toTableName) {
        // Ensure the 'from' and 'to' tables exist (this should never fail, but you never know)
        const tableNames = this.state.tables.map((table) => table.name);
        var tableExists;
        
        tableExists = Boolean(tableNames.find((checkTableName) => checkTableName === fromTableName));
        if (!tableExists) {
            throw Error("No such table '"+fromTableName+"'");
        }

        tableExists = Boolean(tableNames.find((checkTableName) => checkTableName === toTableName));
        if (!tableExists) {
            throw Error("No such table '"+toTableName+"'");
        }

        // From here, *some* field will be moved *somewhere*
        const newTables = this.state.tables.slice();

        // Move the field to the end of the same table
        if (fromTableName === toTableName) {
            // Find the objects represented by the given names
            const tableIndex = newTables.findIndex((table) => table.name === fromTableName);
            const table = newTables[tableIndex] = Object.assign({}, newTables[tableIndex]);
            table.fields = table.fields.slice();

            // The field's name is already unique, or it wouldn't be called what it is!

            // Move the field
            const fieldIndex = table.fields.findIndex((field) => field.name === fieldName);
            const field = table.fields[fieldIndex]; // Keep reference
            table.fields.splice(fieldIndex, 1); // Remove
            table.fields.push(field); // Push back

        // Move the field to the end of the other table
        } else {
            // Find the objects represented by the given names (and make necessary copies)
            const fromTableIndex = newTables.findIndex((table) => table.name === fromTableName);
            const fromTable = newTables[fromTableIndex] = Object.assign({}, newTables[fromTableIndex]);
            fromTable.fields = fromTable.fields.slice();

            const toTableIndex = newTables.findIndex((table) => table.name === toTableName);
            const toTable = newTables[toTableIndex] = Object.assign({}, newTables[toTableIndex]);
            toTable.fields = toTable.fields.slice();
        
            const fieldIndex = fromTable.fields.findIndex((field) => field.name === fieldName);
            const field = Object.assign({}, fromTable.fields[fieldIndex]);

            // Ensure that the name is unique in toTable
            field.name = getUniqueName(field.name,
                toTable.fields.map((field) => field.name)
            )

            // Move the field
            fromTable.fields.splice(fieldIndex, 1);
            toTable.fields.push(field);
        }

        this.setState({tables: newTables});
    }
});

@DragDropContext(HTML5Backend)
export default class App extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            tables: []
        }

        this.actions = {
            createTable: objectOperations.createTable.bind(this),
            deleteTable: objectOperations.deleteTable.bind(this),

            createField: objectOperations.createField.bind(this),
            deleteField: objectOperations.deleteField.bind(this),
            moveField: objectOperations.moveField.bind(this)
        }
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
