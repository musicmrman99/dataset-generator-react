import { ObjectTypes } from '../types';
import { mapPath } from '../helpers/map-path';
import { clone, insert, del } from '../helpers/map-utils';
import getUniqueName from '../helpers/get-unique-name';

import assert from './helpers/assert';
import objectHelpers from './helpers/object-helpers';

const objectOperations = Object.freeze({
    // Public Non-Pure Methods
    // ----------

    createTable(tableSpec) {
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
            [objectHelpers.afterLastIndex, insert(objectHelpers.createObject(
                ObjectTypes.TABLE,
                Object.assign(
                    { fields: [] }, // Structural attributes of a table
                    tableSpec
                )
            ))]
        ]);
        this.setState({tables: newTables});
    },

    deleteTable(tableName) {
        assert.tableExists(this.state.tables, tableName)

        // ie. tables.remove(<index of tableName>), the React-friendly way
        const newTables = clone(this.state.tables);
        mapPath(newTables, [
            [objectHelpers.indexOfObject(tableName), del]
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
        const table = objectHelpers.getObject(this.state.tables, tableName);
        fieldSpec.name = getUniqueName(fieldSpec.name,
            objectHelpers.getNamesOf(table.fields)
        );

        // ie. tables[<index of tableName>].fields.push(), the React-friendly way
        const newTables = clone(this.state.tables);
        mapPath(newTables, [
            [objectHelpers.indexOfObject(tableName), clone],
            ["fields", clone],
            [objectHelpers.afterLastIndex, insert(
                objectHelpers.createObject(ObjectTypes.FIELD, fieldSpec)
            )]
        ]);
        this.setState({tables: newTables});
    },

    deleteField(tableName, fieldName) {
        // Ensure the table exists (this should never fail, but you never know)
        assert.tableExists(this.state.tables, tableName);
        assert.fieldExists(this.state.tables, tableName, fieldName);

        // ie. tables[<index of tableName>].fields.remove(<index of fieldName>), the React-friendly way
        const newTables = clone(this.state.tables);
        mapPath(newTables, [
            [objectHelpers.indexOfObject(tableName), clone],
            ["fields", clone],
            [objectHelpers.indexOfObject(fieldName), del]
        ]);
        this.setState({tables: newTables});
    },

    moveField(fieldName, fromTableName, toTableName) {
        assert.tableExists(this.state.tables, fromTableName);
        assert.tableExists(this.state.tables, toTableName);
        assert.fieldExists(this.state.tables, fromTableName, fieldName);

        // From here, *some* field will be moved *somewhere*
        const newTables = clone(this.state.tables);

        // WARNING: moveField is modified in-place during object mapping!
        var moveField = null;

        // Delete (and grab fromField)
        mapPath(newTables, [
            [objectHelpers.indexOfObject(fromTableName), clone], // Clone fromTable
            ["fields", clone], // Clone fromTable.fields
            [
                objectHelpers.indexOfObject(fieldName),
                (field) => {
                    moveField = clone(field); // Grab moveField (copy)
                    return del(field); // Delete moveField from fromTable
                }
            ]
        ]);

        // Insert (fromField)
        mapPath(newTables, [
            [objectHelpers.indexOfObject(toTableName), clone], // Clone toTable
            [
                "fields",
                (fields) => {
                    // Ensure that moveField's name is unique in toTable (this is why we copied moveField)
                    moveField.name = getUniqueName(moveField.name,
                        objectHelpers.getNamesOf(fields)
                    )

                    return clone(fields); // Clone toTable.fields
                }
            ],
            [objectHelpers.afterLastIndex, insert(moveField)] // Re-insert moveField
        ]);

        this.setState({tables: newTables});
    }
});

export default objectOperations;
