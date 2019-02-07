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


// Each "object type settings" object must contain three properties:

// - defaults:
//   This contains the default settings for each object type. Calling ".keys()
//   on this object will return all of the valid settings for the object type.

// - inputs:
//   This defines the information about the 'input' element to use in the
//   settings pane for this object. Each setting's input definition must contain
//   two properties:
//   - type:
//     A string defining the type of the input.
//     See: https://www.w3schools.com/html/html_form_input_types.asp
//   - attrs:
//     An object containing any additional attributes to pass to the input
//     element. Use a blank object ("{}") for none.

// - validators:
//   This defines a single combined validation and sanitasation function for
//   for each setting that either returns the value to change the setting to, or
//   raises an exception if the input (even after any sanitisation) is invalid.

// NOTE: settings objects (in this context, 'defaults') must be flat objects -
// nested settings are not supported.

export const ObjectSettingsDefs = Object.freeze({
    [ObjectTypes.TABLE]: {
        defaults: {
            numRecords: 1
        },

        inputs: {
            numRecords: {
                type: "number",
                attrs: {
                    "min": 1 // Not a good garuntee
                }
            }
        },

        validators: {
            numRecords (inp) {
                const val = parseInt(inp);
                if (isNaN(val)) {
                    throw new Error("Invalid value for field 'numRecords': "+val);
                }
                if (val < 1) {
                    throw new Error("Invalid value for field 'numRecords' (below minimum): "+val);
                }
                return val;
            }
        }
    },

    [ObjectTypes.FIELD]: {
        defaults: {
            // TODO: Fill this out
        },

        inputs: {
            // TODO: Fill this out
        },

        validators: {
            // TODO: Fill this out
        }
    }
});
