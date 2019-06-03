import React from 'react';

import { ObjectSettingsDefs } from '../types';
import { Trees, TraversalConflictPriority, resolvePath, insertAtPath } from '../helpers/trees';

export default class ObjectSettingsTab extends React.Component {
    constructor(props) {
        super(props);
        this.toElement = this.toElement.bind(this);
    }

    // Tests if the given MTN is disabled, based on if its dependencies are met
    // (from settings).
    isEnabled (mtn, settings) {
        const inputTreeInfo = mtn.values[1];

        // For boolean switches, if they are not 'on', then do not
        // display all of thier parameters.
        try {
            const _dep = inputTreeInfo._depends;
            if (
                // If a non-leaf node (which is the only kind of node that can
                // be disabled due to failing a dependency check). 'null' values
                // should be cut as well.
                !mtn.isLeaf &&
                // If the tree depends on anything
                _dep !== undefined &&
                // If the dependency is not satisfied
                resolvePath(settings, _dep.path) !== _dep.value
            ) {
                return false;
            }
        } catch (e) {
            if (e instanceof TypeError) {
                return false; // If the dependency does not exist
            } else {
                throw e;
            }
        }

        return true;
    }

    // Used as a callback to convert the given data/graphics info object (an
    // MTN) into an object containing a React element and index dicating where
    // to position the element in the form. This function will do any necessary
    // conversions between setting values as stored in state and HTML element
    // attributes.
    toElement (settingMTN) {
        let returnElement = null;

        const settingKey = settingMTN.key;
        const settingVal = settingMTN.values[0];
        const inputInfo = settingMTN.values[1];
        const settingPath = settingMTN.parentPath.concat(settingKey);
        const settingDepth = settingPath.length;

        // Heading/Text - form elements that do not have corresponding settings
        if (settingKey.startsWith("#")) {
            if (settingDepth <= 6) {
                const HS = "h"+settingDepth; // Heading (Sized)
                returnElement = (<HS key={settingKey}>{inputInfo.text}</HS>);
            } else {
                returnElement = (<p key={settingKey}>{inputInfo.text}</p>);
            }

        // Datalist - lists that can be used by input elements for autocomplete
        } else if (settingKey.startsWith("-")) {
            const options = inputInfo.options.map(
                (option) => (<option key={option} value={option}></option>)
            );

            // Name the datalist after the given key (excluding the initial "-")
            returnElement = (<datalist key={settingKey} id={settingKey.slice(1)}>
                {options}
            </datalist>);

        // Input - input form elements
        } else {
            // As the settings for the current object are the only settings that
            // are ever going to be displayed (this is ensured in render()),
            // this can safely get the current object itself and assume that it
            // is the object to update the settings for. ... The alternative
            // would be to do some ugly argument-passing.
            const curObjInfo = this.props.actions.getCurrentObject();

            let inputElement = null;
            switch (inputInfo.type) {
            // Most inputs work like this ...
            case "color":
            case "date":
            case "datetime-local":
            case "email":
            case "month":
            case "number":
            case "range":
            case "tel":
            case "text":
            case "time":
            case "url":
            case "week":
                inputElement = (<input type={inputInfo.type}
                    value={settingVal}
                    onChange={(e) => {
                        this.props.actions.updateObjectSettings(
                            curObjInfo,
                            insertAtPath({}, settingPath, e.target.value, true)
                        );
                    }}
                    onBlur={(e) => {
                        let result = null;
                        if (inputInfo.validator !== undefined) {
                            result = inputInfo.validator(e.target.value)
                        } else {
                            result = { value: e.target.value };
                        }

                        if (result.error != null) {
                            // WARNING: alerts can get quite irritating
                            alert(result.error);
                            return;
                        }

                        this.props.actions.updateObjectSettings(
                            curObjInfo,
                            insertAtPath({}, settingPath, result.value, true)
                        );
                    }}
                    {...inputInfo.attrs}>
                </input>);
                break;

            // Checkbox is slightly different - use its "checked" attribute
            // instead of its value.
            case "checkbox":
                inputElement = (<input type={inputInfo.type}
                    checked={settingVal}
                    onChange={(e) => {
                        // Don't need a validator for something that the HTML
                        // itself validates - a checkbox can only be on or off.
                        this.props.actions.updateObjectSettings(
                            curObjInfo,
                            insertAtPath({}, settingPath, e.target.checked, true)
                        );
                    }}
                    {...inputInfo.attrs}>
                </input>);
                break;

            // Notably, "radio" is not included at all - instead, use a text
            // input with a list defined, setting its validator function to
            // reject if the given value is not in the list. If sub-sections
            // need to be opened based on the input's value, then set the
            // sub-section's _depends.value to the relevant string.
            }

            // Return the input wrapped in a label.
            // NOTE: The 'key' attribute must be given, or React will throw
            //       errors. While this isn't returning an array directly, it is
            //       a mapping function for an array, and so results in an array.
            returnElement = (<label key={settingKey}>
                {inputInfo.label+":"}
                {inputElement}
            </label>);
        }

        // Include the sort index
        return {
            _element: returnElement,
            _index: inputInfo._index
        };
    }

    render () {
        const curObjInfo = this.props.actions.getCurrentObject();
        const curObj = this.props.actions.resolveCurrentObject();

        let settingsInputs = null;
        if (curObj != null) {
            const {form} = ObjectSettingsDefs[curObjInfo.type];
            const settings = curObj.settings;

            settingsInputs = Trees.translate(
                [settings, form],
                (mtn) => {
                    // Handle special properties
                    if (mtn.key === "_depends") return false; // Cut _depends
                    else if (mtn.key === "_index") return true; // Keep _index

                    // Otherwise, just check if it's enabled
                    else if (this.isEnabled(mtn, settings)) {
                        return true; // Keep
                    } else {
                        return false; // Cut
                    }
                },
                // Return the React element for each non-pruned element
                (mtn) => {
                    // Handle special properties
                    // _index is defined on *every* node in the form (including
                    // non-leaf nodes). Return the index unchanged to keep it
                    // associated with all non-leaf nodes.
                    if (mtn.key === "_index") return mtn.values[1];

                    // Otherwise, just translate to an element
                    return this.toElement(mtn);
                },
                null,
                {
                    // A list of specific attributes that 'define' each type of
                    // 'item' node (heading, input, etc.). Item nodes are also
                    // objects, but are not part of the tree.
                    isLeaf: (node) => (
                        node["type"] !== undefined || // Input node
                        node["options"] !== undefined || // Datalist node
                        node["text"] !== undefined // Heading/Text node
                    ),

                    // Conflicts mean the trees in types.js don't match - fix it
                    conflictPriority: TraversalConflictPriority.NEITHER
                }
            );

            // Flatten into order
            settingsInputs = Trees.flatten(
                settingsInputs,
                [],
                {
                    isLeaf: (node) => (node._element !== undefined),

                    // Sort nodes by the index included in the element wrapper
                    comparator: function (mtn1, mtn2) {
                        // Not an element - ignore it
                        if (mtn1.key === "_index" || mtn2.key === "_index") {
                            // Always sorts after everything else, or this
                            // happens: if A == B, and B == C, then A == C,
                            // which breaks the sort.
                            return 1;
                        }

                        // An element - compare
                        return mtn1.values[0]._index - mtn2.values[0]._index;
                    }
                }

            // Remove the wrapper
            ).map(
                (elementWrapper) => elementWrapper._element
            );
        }

        return (
            <div className="tab-component">
                {settingsInputs}
            </div>
        );
    }
}
