import { ObjectTypes } from '../types';
import pathHelpers, { Slashes } from '../helpers/path';
import objectHelpers from './helpers/object-helpers';
import assert from './helpers/assert';

const _objectReferenceOperations = Object.freeze({
    // Private Pure Methods
    // ----------

    objRef(objType, objPath) {
        return Object.freeze({
            type: objType,
            path: pathHelpers.split_path(objPath, Slashes.LEADING)
        });
    },

    // Private Non-Pure Methods
    // ----------

    checkValid(objRef) {
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
    }
});

const objectReferenceOperations = Object.freeze({
    // Public Non-Pure Methods
    // ----------

    getObject(objType, objPath) {
        const objRef = _objectReferenceOperations.objRef(objType, objPath);
        _objectReferenceOperations.checkValid.call(this, objRef);
        return objRef;
    },

    resolveObject(objRef) {
        // It's always going to need to dereference the table part.
        const tableIndex = objectHelpers.getObjectIndex(
            this.state.tables, objRef.path[0]);
        const table = this.state.tables[tableIndex];
        if (objRef.type === ObjectTypes.TABLE) return table;

        // Next, dereference the field
        const fieldIndex = objectHelpers.getObjectIndex(
            table.fields, objRef.path[1]);
        const field = table.fields[fieldIndex];
        if (objRef.type === ObjectTypes.FIELD) return field;
    }
});

export default objectReferenceOperations;
