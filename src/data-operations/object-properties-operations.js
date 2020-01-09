import { ObjectTypes, ObjectSettingsDefs } from '../types';
import { Trees, Selectors, TraversalConflictPriority, isSpecialNode } from '../helpers/trees';
import { mapPath } from '../helpers/map-path';
import { clone, replace } from '../helpers/map-utils';
import getUniqueName from '../helpers/get-unique-name';
import assert from './helpers/assert';

import objectHelpers from './helpers/object-helpers';

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

        const newTables = clone(this.state.tables);
        mapPath(newTables, [
            [objectHelpers.indexOfObject(tableName), clone],
            ["name", replace(newName)]
        ]);
        this.setState({tables: newTables});
    },

    _updateFieldName(tableName, fieldName, newName) {
        assert.tableExists(this.state.tables, tableName);
        assert.fieldExists(this.state.tables, tableName, fieldName);

        // WARNING: newName is modified in-place during object mapping!

        const newTables = clone(this.state.tables);
        mapPath(newTables, [
            [objectHelpers.indexOfObject(tableName), clone],
            [
                "fields",
                (fields) => {
                    // Ensure that the new name is unique in this table
                    newName = getUniqueName(newName,
                        objectHelpers.getNamesOf(fields)
                    )
            
                    return clone(fields);
                }
            ],
            [objectHelpers.indexOfObject(fieldName), clone],
            ["name", replace(newName)]
        ]);
        this.setState({tables: newTables});
    },

    _updateTableSettings(tableName, newSettings) {
        assert.tableExists(this.state.tables, tableName);

        const newTables = clone(this.state.tables);
        mapPath(newTables, [
            [objectHelpers.indexOfObject(tableName), clone],
            [
                "settings",
                replace(objectPropertiesOperations._mergeObjectSettings(
                    ObjectTypes.TABLE, table.settings, newSettings
                ))
            ]
        ]);
        this.setState({tables: newTables});
    },

    _updateFieldSettings(tableName, fieldName, newSettings) {
        assert.tableExists(this.state.tables, tableName);
        assert.fieldExists(this.state.tables, tableName, fieldName);

        const newTables = clone(this.state.tables);
        mapPath(newTables, [
            [objectHelpers.indexOfObject(tableName), clone],
            ["fields", clone],
            [objectHelpers.indexOfObject(fieldName), clone],
            [
                "settings",
                replace(objectPropertiesOperations._mergeObjectSettings(
                    ObjectTypes.FIELD, field.settings, newSettings
                ))
            ]
        ]);
        this.setState({tables: newTables});
    },

    // Public Non-Pure Methods
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

export default objectPropertiesOperations;
