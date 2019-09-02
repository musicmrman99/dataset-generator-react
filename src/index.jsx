import React from 'react';
import ReactDOM from 'react-dom';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { FlexibleDragDropContext } from  './generics/flexible-dnd';

import Header from './header';
import Panel from './panel';
import Workspace from './workspace';
import Footer from './footer';

import { ObjectTypes, ObjectSettingsDefs } from './types';
import { Trees, Selectors, TraversalConflictPriority, isSpecialNode } from './helpers/trees';
import pathHelpers, { Slashes } from './helpers/path';
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

const assert = Object.freeze({
    // Ensure the table exists (this should never fail, but you never know)
    tableExists (tables, tableName) {
        const tableExists = Boolean(tables.find((checkTable) => checkTable.name === tableName) != undefined);
        if (!tableExists) {
            throw Error("No such table '"+tableName+"'");
        }
    },

    // Ensure the given field in the given table exists (this should never fail, but you never know)
    fieldExists (tables, tableName, fieldName) {
        const table = tables.find((table) => table.name === tableName);
        const fieldExists = Boolean(table.fields.find((checkField) => checkField.name === fieldName) != undefined);
        if (!fieldExists) {
            throw Error("No such field '"+fieldName+"'");
        }
    }
});

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// WARNING: DO NOT USE NON-PRIVATE METHODS STAND-ALONE
// - non-private methods must be bound to App's 'this'
// - private methods must be called in the style:
//     objectOperations._privateMethod()
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const objectOperations = Object.freeze({
    _createObject(type, spec) {
        return Object.assign(
            // Defaults
            {
                name: "",
                settings: JSON.parse(JSON.stringify(ObjectSettingsDefs[type].defaults))
            },
            // Overwrite with caller's object
            spec
        );
    },

    createTable (tableSpec) {
        // Ensure that the name is unique
        if ("name" in tableSpec) {
            tableSpec.name = getUniqueName(tableSpec.name,
                this.state.tables.map((table) => table.name)
            )
        }

        // ie. tables.push(), the React-friendly way
        const newTable = objectOperations._createObject(ObjectTypes.TABLE,
            Object.assign({ // Additional things required by a table object
                fields: []
            }, tableSpec));
        const newTables = this.state.tables.concat(newTable);
        this.setState({tables: newTables});
    },

    deleteTable (name) {
        assert.tableExists(this.state.tables, name)

        // Filter out the given table
        const newTables = this.state.tables.filter((table) => (table.name !== name));
        this.setState({tables: newTables});
    },

    createField(tableName, fieldSpec) {
        // Ensure the table exists (this should never fail, but you never know)
        assert.tableExists(this.state.tables, tableName)

        // Ensure that the name is unique in this table
        if ("name" in fieldSpec) {
            const table = this.state.tables.find((table) => table.name === tableName)
            fieldSpec.name = getUniqueName(fieldSpec.name,
                table.fields.map((field) => field.name)
            )
        }

        // ie. tables[tableName].fields.push(), the React-friendly way
        const newField = objectOperations._createObject(ObjectTypes.FIELD, fieldSpec);
        const newTables = this.state.tables.slice();
        const tableIndex = newTables.findIndex((table) => table.name === tableName);
        const table = newTables[tableIndex] = Object.assign({}, newTables[tableIndex]);
        table.fields = table.fields.concat(newField);

        this.setState({tables: newTables});
    },

    deleteField (tableName, fieldName) {
        // Ensure the table exists (this should never fail, but you never know)
        assert.tableExists(this.state.tables, tableName);
        assert.fieldExists(this.state.tables, tableName, fieldName);

        // Remove the field
        const newTables = this.state.tables.slice();
        const tableIndex = newTables.findIndex((table) => table.name === tableName);
        const table = newTables[tableIndex] = Object.assign({}, newTables[tableIndex]);
        table.fields = table.fields.filter((field) => field.name !== fieldName);

        this.setState({tables: newTables});
    },

    moveField(fieldName, fromTableName, toTableName) {
        assert.tableExists(this.state.tables, fromTableName);
        assert.tableExists(this.state.tables, toTableName);
        assert.fieldExists(this.state.tables, fromTableName, fieldName);

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

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// WARNING: DO NOT USE NON-PRIVATE METHODS STAND-ALONE
// - non-private methods must be bound to App's 'this'
// - private methods must be called in the style:
//     objectReferenceManagement._privateMethod()
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const objectReferenceManagement = Object.freeze({
    _objRef(objType, objPath) {
        return Object.freeze({
            type: objType,
            path: pathHelpers.split_path(objPath, Slashes.LEADING)
        });
    },

    _checkValid(objRef) {
        // Check the object type
        // If objRef.type is not in ObjectTypes, which should (hopefully) never happen
        if (!Object.values(ObjectTypes).some((type) => type === objRef.type)) {
            throw new Error("Invalid object type (setCurrentObject()): "+objRef.type);
        }

        // Check the object path
        // Some of these may be 'undefined', depending on the object type
        const [tableName, fieldName] = objRef.path;

        if (objRef.type === ObjectTypes.TABLE || objRef.type === ObjectTypes.FIELD) {
            assert.tableExists(this.state.tables, tableName);
        }
        if (objRef.type === ObjectTypes.FIELD) {
            assert.fieldExists(this.state.tables, tableName, fieldName);
        }
    },

    getObject(objType, objPath) {
        const objRef = objectReferenceManagement._objRef.apply(this, [objType, objPath]);
        objectReferenceManagement._checkValid.apply(this, [objRef]);
        return objRef;
    },

    resolveObject(objRef) {
        // It's always going to need to dereference the table part.
        const tableIndex = this.state.tables.findIndex(
            (table) => table.name === objRef.path[0]);
        const table = this.state.tables[tableIndex];
        if (objRef.type === ObjectTypes.TABLE) return table;

        // Next, dereference the field
        const fieldIndex = table.fields.findIndex(
            (field) => field.name === objRef.path[1]);
        const field = table.fields[fieldIndex];
        if (objRef.type === ObjectTypes.FIELD) return field;
    }
});

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// WARNING: DO NOT USE NON-PRIVATE METHODS STAND-ALONE
// - non-private methods must be bound to App's 'this'
// - private methods must be called in the style:
//     currentObjectManagement._privateMethod()
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const currentObjectManagement = Object.freeze({
    // If someone uses this to edit the current object, then they'll get what
    // they deserve - a lot of problems. It's called ***GET*** for a reason! :)
    // (See 'setCurrentObject()' for a safe way)
    getCurrentObject() {
        return this.state.currentObject;
    },

    resolveCurrentObject() {
        return objectReferenceManagement.resolveObject.apply(
            this, [this.state.currentObject]
        );
    },

    // You can also set the current object (which you can't )
    setCurrentObject(objectType, objectPath) {
        this.setState({
            currentObject: objectReferenceManagement.getObject.apply(
                this, [objectType, objectPath]
            )
        });
    }
});

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// WARNING: DO NOT USE NON-PRIVATE METHODS STAND-ALONE
// - non-private methods must be bound to App's 'this'
// - private methods must be called in the style:
//     objectPropertiesOperations._privateMethod()
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const objectPropertiesOperations = Object.freeze({
    _mergeObjectSettings(type, oldSettings, newSettings) {
        return Trees.translate(
            [newSettings, oldSettings, ObjectSettingsDefs[type].defaults],
            // newSettings and oldSettings must be in the default settings set:
            (mtn) => !isSpecialNode(mtn[2]),
            // For each setting, take the first found from: new, old, default
            Selectors.first,
            // Construct from an empty object
            null,
            {
                // Conflicts will arise if newSettings is not a full settings
                // tree. In that case, recurse down the non-leaf nodes from the
                // old (or default) settings tree. This ensures that all old
                // settings are kept, regardless of whether newSettings is
                // incomplete.
                conflictPriority: TraversalConflictPriority.NON_LEAF
            }
        );
    },

    _updateTableName(tableName, newName) {
        assert.tableExists(this.state.tables, tableName);

        // Ensure that the new name is unique
        newName = getUniqueName(newName,
            this.state.tables.map((table) => table.name)
        )

        const newTables = this.state.tables.slice();
        const tableIndex = newTables.findIndex((table) => table.name === tableName);
        const table = newTables[tableIndex] = Object.assign({}, newTables[tableIndex]);
        table.name = newName;

        this.setState({tables: newTables});
    },

    _updateTableSettings(tableName, newSettings) {
        assert.tableExists(this.state.tables, tableName);

        const newTables = this.state.tables.slice();
        const tableIndex = newTables.findIndex((table) => table.name === tableName);
        const table = newTables[tableIndex] = Object.assign({}, newTables[tableIndex]);
        table.settings = objectPropertiesOperations._mergeObjectSettings(
            ObjectTypes.TABLE, table.settings, newSettings)

        this.setState({tables: newTables});
    },

    _updateFieldName(tableName, fieldName, newName) {
        assert.tableExists(this.state.tables, tableName);
        assert.fieldExists(this.state.tables, tableName, fieldName);

        const newTables = this.state.tables.slice();

        const tableIndex = newTables.findIndex((table) => table.name === tableName);
        const table = newTables[tableIndex] = Object.assign({}, newTables[tableIndex]);

        // Ensure that the new name is unique in this table
        newName = getUniqueName(newName,
            table.fields.map((field) => field.name)
        )

        table.fields = table.fields.slice();
        const fieldIndex = table.fields.findIndex((field) => field.name === fieldName);
        const field = table.fields[fieldIndex] = Object.assign({}, table.fields[fieldIndex]);
        field.name = newName;

        this.setState({tables: newTables});
    },

    _updateFieldSettings(tableName, fieldName, newSettings) {
        assert.tableExists(this.state.tables, tableName);
        assert.fieldExists(this.state.tables, tableName, fieldName);

        const newTables = this.state.tables.slice();

        const tableIndex = newTables.findIndex((table) => table.name === tableName);
        const table = newTables[tableIndex] = Object.assign({}, newTables[tableIndex]);

        table.fields = table.fields.slice();
        const fieldIndex = table.fields.findIndex((field) => field.name === fieldName);
        const field = table.fields[fieldIndex] = Object.assign({}, table.fields[fieldIndex]);

        field.settings = objectPropertiesOperations._mergeObjectSettings(
            ObjectTypes.FIELD, field.settings, newSettings);

        this.setState({tables: newTables});
    },

    updateObjectName(objInfo, newName) {
        // FIXME: Just do it the hacky way for now
        switch (objInfo.type) {
            case ObjectTypes.TABLE:
                objectPropertiesOperations._updateTableName.apply(
                    this, [objInfo.path[0], newName]);
                break;

            case ObjectTypes.FIELD:
                objectPropertiesOperations._updateFieldName.apply(
                    this, [objInfo.path[0], objInfo.path[1], newName]);
                break;
        }
    },

    updateObjectSettings(objInfo, newSettings) {
        // FIXME: Just do it the hacky way for now
        switch (objInfo.type) {
            case ObjectTypes.TABLE:
                objectPropertiesOperations._updateTableSettings.apply(
                    this, [objInfo.path[0], newSettings]);
                break;

            case ObjectTypes.FIELD:
                objectPropertiesOperations._updateFieldSettings.apply(
                    this, [objInfo.path[0], objInfo.path[1], newSettings]);
                break;
        }
    }
});

const globalOperations = Object.freeze({
    getVersion() {
        return this.state.version;
    }
});

const pageManagement = Object.freeze({
    // Based on https://stackoverflow.com/a/7317311
    unloadHandler(shouldUnload, event) {
        const result = shouldUnload();
        if (result) {
            // Just implement every single possible method of doing this
            event.preventDefault(); // The new one - recommended by the standard
            (event || window.event).returnValue = result; // A bit older
            return result; // Very old
        }
    },

    shouldPageUnload() {
        return this.state.isUnsaved ? "do-not-unload" : undefined;
    }
});

@DragDropContext(HTML5Backend)
@FlexibleDragDropContext
export default class App extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            version: 0.2,
            isUnsaved: false,

            tables: [],
            currentObject: {type: null, path: null}
        }

        this.actions = {
            createTable: objectOperations.createTable.bind(this),
            deleteTable: objectOperations.deleteTable.bind(this),
            createField: objectOperations.createField.bind(this),
            deleteField: objectOperations.deleteField.bind(this),
            moveField: objectOperations.moveField.bind(this),

            getObject: objectReferenceManagement.getObject.bind(this),
            resolveObject: objectReferenceManagement.resolveObject.bind(this),
            setCurrentObject: currentObjectManagement.setCurrentObject.bind(this),
            getCurrentObject: currentObjectManagement.getCurrentObject.bind(this),
            resolveCurrentObject: currentObjectManagement.resolveCurrentObject.bind(this),

            updateObjectName: objectPropertiesOperations.updateObjectName.bind(this),
            updateObjectSettings: objectPropertiesOperations.updateObjectSettings.bind(this)
        }

        this.globalActions = {
            getVersion: globalOperations.getVersion.bind(this)
        }

        // NOTE: This can still be overriden by the user to discard changes.
        this.shouldPageUnload = pageManagement.shouldPageUnload.bind(this);
        window.addEventListener("beforeunload",
            (e) => pageManagement.unloadHandler(this.shouldPageUnload, e)
        );
    }

    render () {
        return (<div>
            <Header globalActions={this.globalActions}></Header>
            <main>
                <div className="content span-container">
                    <Panel tables={this.state.tables} actions={this.actions} />
                    <Workspace
                        tables={this.state.tables}
                        currentObject={this.state.currentObject}
                        actions={this.actions} />
                </div>
            </main>
            <Footer></Footer>
        </div>);
    }
}

// Load the app into the 'real' DOM
window.onload = function () {
    const main = document.getElementById("react-root");
    ReactDOM.render(<App />, main);
};
