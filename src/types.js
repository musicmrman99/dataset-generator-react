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

// ==================================================
// Format/Structure Documentation
// ==================================================

// Each "object type settings" object must contain the following properties:

// defaults
// --------------------
// This contains the default settings for each object type. This is in a tree
// structure, where only primitive values are leaf nodes.
//
// form
// --------------------
// This defines the information about the HTML elements to use in the settings
// pane for each object type. Every input element defined should have a
// corresponding property in the 'defaults' tree (ie. there should be a leaf
// node at the same path in both trees).
//
// The following types of element are available:
//   - Text elements: These display a heading or paragraph in the form. Which
//     element is used depends on the depth of the text element in the tree.
//     Text elements at a depth of 1 to 6 use the heading 1 to 6 HTML elements.
//     Text elements at a depth of 7 or more use paragraph HTML elements.
//
//     Text element keys start with a '#', so they must be given as a string
//     literal. Text elements contain the following properties:
//       - text: This contains the text to display.
//         NOTE: Both the '#' and this property are required to make a node a
//               text element - excluding this property for a text element will
//               break the form.
//
//   - Datalist elements: These are hidden elements that define lists of
//     options. They can be used by input elements to provide autocomplete and
//     suggestion functionality.
//
//     Datalist element keys start with a '-', so they must be given as a string
//     literal. Datalist elements contain the following properties:
//       - options: An array containing the string values to use as options.
//         NOTE: Both the '-' and this property are required to make a node a
//               datalist element - excluding this property for a text element
//               will break the form.
//
//   - Input elements: These display an input that corresponds to a setting in
//     the 'defaults' tree. When the input is edited, the corresponding value in
//     the settings tree is updated.
//
//     Input element keys can be anything that would not make them another type
//     of element. Input elements contain the following properties:
//       - type: A string defining the type of the input. See:
//         https://www.w3schools.com/html/html_form_input_types.asp
//         NOTE: This property is required to make a node an input element -
//               excluding this property for an input element will break the
//               form.
//
//       - label: A string to display before the input element that tells the
//         user what the input represents.
//       - attrs (optional): An object containing any additional attributes to
//         pass to the input HTML element. Defaults to none.
//       - validator (optional): A function that recieves the new value of the
//         input as its argument, sanitises and validates that value, and
//         returns an object containing one of two keys:
//           - error: If the new value is invalid, even after any sanitisation,
//             then this must be set to a string stating why. (value must be
//             left undefined.)
//           - value: The sanitised and validated new value. (error must be left
//             undefined.)
//         NOTE: The 'validator' property is ignored for the "checkbox" input
//               type, as it can only be either true or false.
//
// A form is made up of a tree of elements, contained within sets of elements
// (plain objects). As such, each set can contain the following:
//   - *elements*: Element objects, as defined above.
//   - *element sets*: Other element sets, as defined here.
//   - _depends: This is an object that defines whether to display any sub-nodes
//     of the element set. It must contain the following properties:
//       - path: An array representing the path to a setting (ie. in the
//         structure of 'defaults').
//       - value: The value to check the the setting against - if the setting
//         has this value, the element set is shown, otherwise it is hidden.
//
// All elements and element sets must also have the following property:
//   - _index: An integer representing the order to display the form items in.
//     Lower values indicate being displayed further up the form, higher values
//     further down the form. Each element at any given level in the form tree
//     should have a unique integer for that level, thereby ensuring a
//     consistent layout every time the browser loads the form. The order of
//     elements whose _index values are equal is UNDEFINED, and MAY RESULT IN
//     DIFFERENT ORDERS IN DIFFERENT FORM STATES (see _depends) OR EVEN EACH
//     TIME THE BROWSER LOADS THE PAGE!!!

// ==================================================
// Table Definitions
// ==================================================

const tableDefaults = Object.freeze({
  numRecords: 1
});

const tableForm = Object.freeze({
  numRecords: {
    _index: 0,
    type: "number",
    label: "Number of Records",
    attrs: {
      "min": 1 // Not a good garuntee
    },
    validator: function (inp) {
      if (inp === "") return { value: 0 };

      const val = parseInt(inp);
      if (isNaN(val)) {
        return {
          error: "Invalid value for field 'numRecords': " + val
        };
      }
      if (val < 1) {
        return {
          error: "Invalid value for field 'numRecords' (below minimum): " + val
        };
      }

      return { value: val };
    }
  }
});

// ==================================================
// Field Definitions
// ==================================================

const fieldDefaults = Object.freeze({
  keySettings: {
    primaryKey: false,
    foreignKey: false,
    foreignKeyParams: {
      table: "",
      field: ""
    }
  },

  dataType: {
    dataType: "null",
    intSequence: {
      start: 0,
      step: 1,
      sequenceType: "infinite",
      loopingSequenceParams: {
        loopAt: 0
      }
    },
    intRandom: {
      start: 0,
      end: 1
    },
    floatSequence: {
      start: 0,
      step: 1,
      sequenceType: "infinite",
      loopingSequenceParams: {
        loopAt: 0
      }
    },
    floatRandom: {
      start: 0,
      end: 1,
      round: 1
    }
  }
});

const dataTypeList = [
  "null",
  "forename",
  "surname",
  "phoneNumber",
  "intSequence", // Has params
  "intRandom",  // Has params
  "floatSequence", // Has params
  "floatRandom", // Has params
];

const intSequenceTypeList = [
  "infinite",
  "looping"
];

const floatSequenceTypeList = [
  "infinite",
  "looping"
];

const fieldForm = Object.freeze({
  // Key Settings
  // --------------------------------------------------

  keySettings: {
    _index: 0,

    "#key-settings": {
      _index: 0,
      text: "Key Settings"
    },
    primaryKey: {
      _index: 1,
      type: "checkbox",
      label: "Is Primary Key"
    },

    foreignKey: {
      _index: 2,
      type: "checkbox",
      label: "Is Foreign Key"
    },
    foreignKeyParams: {
      _index: 3,
      _depends: { // Depends
        path: ["keySettings", "foreignKey"],
        value: true
      },

      "#foreign-key-settings": {
        _index: 0,
        text: "FKey Params"
      },

      table: {
        _index: 1,
        type: "text",
        label: "Foreign Key Table"
        // TODO: Can we provide a list here? (it would require data from the
        //       main tables tree - could we do it declaratively?)
        // NOTE: This will have to be validated on send, rather than on input,
        //       as we do not have access to the tables tree.
      },

      field: {
        _index: 2,
        type: "text",
        label: "Foreign Key Field"
        // NOTE: This will have to be validated on send, rather than on input,
        //       as we do not have access to the tables tree.
      }
    }
  },

  // Data Type
  // --------------------------------------------------

  dataType: {
    _index: 1,

    "#data-type": {
      _index: 0,
      text: "Data Type"
    },
    "-dataType": {
      _index: 1,
      options: dataTypeList
    },
    dataType: {
      _index: 2,
      type: "text",
      label: "Data Type",
      attrs: {
        list: "dataType"
      },
      validator: function (inp) {
        if (dataTypeList.some((dataType) => dataType === inp)) {
          return { value: inp };
        } else {
          return { error: "Data type not recognised: " + inp }
        }
      }
    },

    // Integer Sequence Type (additional parameters)
    // --------------------

    intSequence: {
      _index: 3,
      _depends: {
        path: ["dataType", "dataType"],
        value: "intSequence"
      },

      "#int-sequence": {
        _index: 0,
        text: "Integer Sequence Settings"
      },
      start: {
        _index: 1,
        type: "number",
        label: "Start Value",
        attrs: {
          step: 1
        }
      },
      step: {
        _index: 2,
        type: "number",
        label: "Step",
        attrs: {
          step: 1
        }
      },
      "-intSequenceType": {
        _index: 3,
        options: intSequenceTypeList
      },
      sequenceType: {
        _index: 4,
        type: "text",
        label: "Sequence Type",
        attrs: {
          list: "intSequenceType"
        },
        validator: function (inp) {
          if (intSequenceTypeList.some((seqType) => seqType === inp)) {
            return { value: inp };
          } else {
            return { error: "Integer sequence type not recognised: " + inp }
          }
        }
      },
      loopingSequenceParams: {
        _index: 5,
        _depends: {
          path: ["dataType", "intSequence", "sequenceType"],
          value: "looping"
        },

        "#looping-int-sequence": {
          _index: 0,
          text: "Looping Integer Sequence Settings"
        },
        loopAt: {
          _index: 1,
          type: "number",
          label: "Value to loop at",
          attrs: {
            step: 1
          }
        }
      }
    },
    
    // Random Integer Type (additional parameters)
    // --------------------

    intRandom: {
      _index: 4,
      _depends: {
        path: ["dataType", "dataType"],
        value: "intRandom"
      },

      start: {
        _index: 0,
        type: "number",
        label: "Start of Range",
        attrs: {
          step: 1
        }
      },
      end: {
        _index: 1,
        type: "number",
        label: "End of Range",
        attrs: {
          step: 1
        }
      }
    },

    // Float Sequence Type (additional parameters)
    // --------------------

    floatSequence: {
      _index: 5,
      _depends: {
        path: ["dataType", "dataType"],
        value: "floatSequence"
      },

      start: {
        _index: 1,
        type: "number",
        label: "Start Value"
      },
      step: {
        _index: 2,
        type: "number",
        label: "Step"
      },
      
      "-floatSequenceType": {
        _index: 3,
        options: floatSequenceTypeList
      },
      sequenceType: {
        _index: 4,
        type: "text",
        label: "Sequence Type",
        attrs: {
          list: "floatSequenceType"
        },
        validator: function (inp) {
          if (floatSequenceTypeList.some((seqType) => seqType === inp)) {
            return { value: inp };
          } else {
            return { error: "Float sequence type not recognised: " + inp }
          }
        }
      },
      loopingSequenceParams: {
        _index: 5,
        _depends: {
          path: ["dataType", "floatSequence", "sequenceType"],
          value: "looping"
        },

        "#looping-float-sequence": {
          _index: 0,
          text: "Looping Float Sequence Settings"
        },
        loopAt: {
          _index: 1,
          type: "number",
          label: "Value to loop at"
        }
      }
    },

    // Float Sequence Type (additional parameters)
    // --------------------

    floatRandom: {
      _index: 6,
      _depends: {
        path: ["dataType", "dataType"],
        value: "floatRandom"
      },

      start: {
        _index: 0,
        type: "number",
        label: "Start of Range"
      },
      end: {
        _index: 1,
        type: "number",
        label: "End of Range"
      }
    },

  }
});

// ==================================================
// All Definitions - Export
// ==================================================

export const ObjectSettingsDefs = Object.freeze({
  [ObjectTypes.TABLE]: {
    defaults: tableDefaults,
    form: tableForm
  },

  [ObjectTypes.FIELD]: {
    defaults: fieldDefaults,
    form: fieldForm
  }
});
