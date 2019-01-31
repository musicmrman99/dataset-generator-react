export const InteractableTypes = Object.freeze({
    TABLE_CONSTRUCTOR: "TableConstructor",
    FIELD_CONSTRUCTOR: "FieldConstructor",
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
