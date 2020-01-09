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
import { fetchFile } from './helpers/fetch-helpers';
import { mapPaths, mapPath } from './helpers/map-path'; // Object manipulation
import { del, clone, insert } from './helpers/map-utils'; // Useful for object manipulation
import pathHelpers, { Slashes } from './helpers/path'; // String manipulation
import ResourceManager from './helpers/resource-manager';
window.resourceManager = new ResourceManager();

import getUniqueName from './helpers/get-unique-name';
import assert from './data-operations/helpers/assert';

const objectOperations = Object.freeze({
    // Private Pure Methods
    // ----------

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

    _getObjectIndex(node, name) {
        return node.findIndex((table) => (table.name === name));
    },
    _getObject(node, name) {
        return node.find((table) => (table.name === name));
    },

    // Public Methods
    // ----------

    createTable (tableSpec) {
        // Ensure that the name exists and is unique in the table set
        if (!("name" in tableSpec)) {
            throw Error("createTable(spec): spec must contain a 'name' property");
        }
        tableSpec.name = getUniqueName(tableSpec.name,
            this.state.tables.map((table) => table.name)
        )

        // ie. tables.push(), the React-friendly way
        const newTables = clone(this.state.tables);
        mapPath(newTables, [
            [(node) => node.length, insert(objectOperations._createObject(
                ObjectTypes.TABLE,
                Object.assign(
                    { fields: [] }, // Structural attributes of a table
                    tableSpec
                )
            ))]
        ]);
        this.setState({tables: newTables});
    },

    deleteTable (tableName) {
        assert.tableExists(this.state.tables, tableName)

        // ie. tables.remove(<index of tableName>), the React-friendly way
        const newTables = clone(this.state.tables);
        mapPath(newTables, [
            [(node) => objectOperations._getObjectIndex(node, tableName), del]
        ]);
        this.setState({tables: newTables});
    },

    createField(tableName, fieldSpec) {
        // Ensure the table exists (this should never fail, but you never know)
        assert.tableExists(this.state.tables, tableName);

        // Ensure that the name exists and is unique in this table
        if (!("name" in fieldSpec)) {
            throw Error("createField(spec): spec must contain a 'name' property");
        }
        const table = objectOperations._getObject(this.state.tables, tableName);
        fieldSpec.name = getUniqueName(fieldSpec.name,
            table.fields.map((field) => field.name)
        );

        // ie. tables[<index of tableName>].fields.push(), the React-friendly way
        const newTables = clone(this.state.tables);
        mapPath(newTables, [
            [(node) => objectOperations._getObjectIndex(node, tableName), clone],
            ["fields", clone],
            [(node) => node.length, insert(
                objectOperations._createObject(ObjectTypes.FIELD, fieldSpec)
            )]
        ]);
        this.setState({tables: newTables});
    },

    deleteField (tableName, fieldName) {
        // Ensure the table exists (this should never fail, but you never know)
        assert.tableExists(this.state.tables, tableName);
        assert.fieldExists(this.state.tables, tableName, fieldName);

        // ie. tables[<index of tableName>].fields.remove(<index of fieldName>), the React-friendly way
        const newTables = clone(this.state.tables);
        mapPath(newTables, [
            [(node) => objectOperations._getObjectIndex(node, tableName), clone],
            ["fields", clone],
            [(node) => objectOperations._getObjectIndex(node, fieldName), del]
        ]);
        this.setState({tables: newTables});
    },

    moveField(fieldName, fromTableName, toTableName) {
        assert.tableExists(this.state.tables, fromTableName);
        assert.tableExists(this.state.tables, toTableName);
        assert.fieldExists(this.state.tables, fromTableName, fieldName);

        // From here, *some* field will be moved *somewhere*
        const newTables = clone(this.state.tables);

        // WARNING: Incoming higher-scope-than-is-nice variable hack and
        //          somewhat-difficult-to-read code ...
        //          For ease of understanding, READ COMMENTS FROM TOP TO BOTTOM.
        var moveField = null;

        // Delete (and grab fromField)
        mapPath(newTables, [
            [(tables) => objectOperations._getObjectIndex(tables, fromTableName), clone], // Clone fromTable
            ["fields", clone], // Clone fromTable.fields
            [
                (fields) => objectOperations._getObjectIndex(fields, fieldName),
                (field) => {
                    moveField = clone(field); // Grab moveField (copy)
                    return del(field); // Delete moveField from fromTable
                }
            ]
        ]);

        // Insert (fromField)
        mapPath(newTables, [
            [(tables) => objectOperations._getObjectIndex(tables, toTableName), clone], // Clone toTable
            [
                "fields",
                (fields) => {
                    // Ensure that moveField's name is unique in toTable (this is why we copied moveField)
                    moveField.name = getUniqueName(moveField.name,
                        fields.map((field) => field.name)
                    )

                    return clone(fields); // Clone toTable.fields
                }
            ],
            [
                (fields) => fields.length,
                insert(moveField) // Re-insert moveField
            ]
        ]);

        this.setState({tables: newTables});
    }
});

const objectReferenceOperations = Object.freeze({
    // Private Pure Methods
    // ----------

    _objRef(objType, objPath) {
        return Object.freeze({
            type: objType,
            path: pathHelpers.split_path(objPath, Slashes.LEADING)
        });
    },

    // Private Non-Pure Methods
    // ----------

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

    // Public Methods
    // ----------

    getObject(objType, objPath) {
        const objRef = objectReferenceOperations._objRef(objType, objPath);
        objectReferenceOperations._checkValid.call(this, objRef);
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

const currentObjectOperations = Object.freeze({
    // Public Methods
    // ----------

    // If someone uses this to edit the current object, then they'll get what
    // they deserve - a lot of problems. It's called ***GET*** for a reason! :)
    // (See 'setCurrentObject()' for a safe way)
    getCurrentObject() {
        return this.state.currentObject;
    },

    resolveCurrentObject() {
        return objectReferenceOperations.resolveObject.apply(
            this, [this.state.currentObject]
        );
    },

    // You can also set the current object (which you can't )
    setCurrentObject(objectType, objectPath) {
        this.setState({
            currentObject: objectReferenceOperations.getObject.apply(
                this, [objectType, objectPath]
            )
        });
    }
});

const objectPropertiesOperations = Object.freeze({
    // Private Pure Methods
    // ----------

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

    // Private Non-Pure Methods
    // ----------

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

    // Public Methods
    // ----------

    updateObjectName(objInfo, newName) {
        // FIXME: Just do it the hacky way for now
        switch (objInfo.type) {
            case ObjectTypes.TABLE:
                objectPropertiesOperations._updateTableName.call(
                    this, objInfo.path[0], newName);
                break;

            case ObjectTypes.FIELD:
                objectPropertiesOperations._updateFieldName.call(
                    this, objInfo.path[0], objInfo.path[1], newName);
                break;
        }
    },

    updateObjectSettings(objInfo, newSettings) {
        // FIXME: Just do it the hacky way for now
        switch (objInfo.type) {
            case ObjectTypes.TABLE:
                objectPropertiesOperations._updateTableSettings.call(
                    this, objInfo.path[0], newSettings);
                break;

            case ObjectTypes.FIELD:
                objectPropertiesOperations._updateFieldSettings.call(
                    this, objInfo.path[0], objInfo.path[1], newSettings);
                break;
        }
    }
});

const globalOperations = Object.freeze({
    // Private Pure Methods
    // ----------

    _build_generate_request(output_format, tables) {
        // For immutability (ie. so as not to modify the 'full' representation of
        // the UI's data), the data structure will have to be cloned all the way
        // down to any modifications.
        const sendTables = clone(tables).map((table) => {
            const newTable = clone(table);
            newTable["fields"] = clone(newTable["fields"]).map((field) => {
                const newField = clone(field);

                const actionList = [];
                if (newField["settings"]["keySettings"]["foreignKey"] === false) {
                    actionList.push([
                        ["settings", clone],
                        ["keySettings", clone],
                        ["foreignKeyParams", del]
                    ]);
                }
                if (newField["settings"]["dataType"]["dataType"] !== "numberSequence") {
                    actionList.push([
                        ["settings", clone],
                        ["dataType", clone],
                        ["numberSequence", del]
                    ]);
                } else {
                    if (newField["settings"]["dataType"]["numberSequence"]["sequenceType"] !== "looping") {
                        actionList.push([
                            ["settings", clone],
                            ["dataType", clone],
                            ["numberSequence", clone],
                            ["loopingSequenceParams", del]
                        ]);
                    }
                }
                if (newField["settings"]["dataType"]["dataType"] !== "randomNumber") {
                    actionList.push([
                        ["settings", clone],
                        ["dataType", clone],
                        ["randomNumber", del]
                    ]);
                }

                mapPaths(newField, actionList);
                return newField;
            });
            return newTable;
        });

        return {
            "general": {"output-format": output_format},
            "tables": sendTables
        };
    },

    // Public Methods
    // ----------

    getVersion() {
        return this.state.version;
    },

    generate() {
        fetchFile("POST", "/data-api/1.0.0/generate",
            { "Content-Type": "application/json" },
            // TODO: allow "single-table" output format (global object)
            JSON.stringify(globalOperations._build_generate_request(
                "multi-table", this.state.tables
            )),
            // TODO: allow the user to enter the filename (global object)
            "tables.zip"
        );
    }
});

// This is the part of the page management system that only the top-level App
// will interface with. See globalOperations for the parts of the page
// management system accessible to sub-components.
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

            getObject: objectReferenceOperations.getObject.bind(this),
            resolveObject: objectReferenceOperations.resolveObject.bind(this),
            setCurrentObject: currentObjectOperations.setCurrentObject.bind(this),
            getCurrentObject: currentObjectOperations.getCurrentObject.bind(this),
            resolveCurrentObject: currentObjectOperations.resolveCurrentObject.bind(this),

            updateObjectName: objectPropertiesOperations.updateObjectName.bind(this),
            updateObjectSettings: objectPropertiesOperations.updateObjectSettings.bind(this)
        }

        this.globalActions = {
            getVersion: globalOperations.getVersion.bind(this),
            generate: globalOperations.generate.bind(this)
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
