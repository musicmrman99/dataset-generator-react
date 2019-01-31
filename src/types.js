export const InteractableTypes = Object.freeze({
    TABLE_TYPE: "TableType",
    FIELD_TYPE: "FieldType",
    TABLE: "Table",
    FIELD: "Field"
});

export const ObjectTypes = Object.freeze({
    TABLE: "table",
    FIELD: "field"
});

// This contains the default settings for each object type.
// Calling .keys() on this object will return all of the valid settings for each
// object type.
export const ObjectTypesSettings = Object.freeze({
    [ObjectTypes.TABLE]: {
        numRecords: 0
    },

    [ObjectTypes.FIELD]: {
        // TODO: fill this out
    }
});
