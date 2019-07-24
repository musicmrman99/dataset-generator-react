import React from 'react';

import { ObjectSettingsDefs } from '../types';
import { Trees, TraversalConflictPriority, resolvePath, insertAtPath } from '../helpers/trees';
import Value from '../helpers/value'

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

        // Input - input form elements (both ordinary and select types)
        } else {
            // As the settings for the current object are the only settings that
            // are ever going to be displayed (this is ensured in render()),
            // this can safely get the current object itself and assume that it
            // is the object to update the settings for. ... The alternative
            // would be to do some ugly argument-passing.
            const curObjInfo = this.props.actions.getCurrentObject();

            // Some DOM event callbacks (utility functions, partially to
            // reduce this rediculous indentation). These are arrow functions to
            // ensure their 'this' is bound to the 'this' of this function.
            // (Get your head around that if you can.) I didn't want to manually
            // '.bind()' - ugly thing.

            const updateDontValidate = (event, propName) => {
                this.props.actions.updateObjectSettings(
                    curObjInfo,
                    insertAtPath({}, settingPath, event.target[propName], true)
                );
            }

            const updateAfterValidate = (event, propName) => {
                let result = null;
                if (inputInfo.validator !== undefined) {
                    // Must produce a Value
                    result = inputInfo.validator(event.target[propName]);
                } else {
                    result = new Value(event.target[propName]);
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
            }

            let inputElement = null;
            switch (inputInfo.type) {
            // Most inputs work like this.
            // Initially, don't validate on change - that would prevent the user
            // being able to enter some valid inputs. For example, it would be
            // impossible to enter a full email address (the first character
            // can't be an '@', but the string must have an '@' in it after the
            // first character is typed!!).
            case "text":
            case "url":
            case "color":
            case "email":
            case "tel":
            case "date":
            case "time":
                inputElement = (<input
                    type={inputInfo.type}
                    value={settingVal}
                    onChange={(e) => updateDontValidate(e, "value")}
                    onBlur={(e) => updateAfterValidate(e, "value")}
                    {...inputInfo.attrs}>
                </input>);
                break;

            // For numeric inputs, use the "valueAsNumber" attribute instead of
            // just "value" to ensure the value is of the expected type. Again,
            // don't validate on change. For example, it would otherwise be
            // impossible to enter values in e-notation (ie. "1e-12").
            case "number":
            case "range":
                inputElement = (<input
                    type={inputInfo.type}
                    value={settingVal}
                    onChange={(e) => updateDontValidate(e, "valueAsNumber")}
                    onBlur={(e) => updateAfterValidate(e, "valueAsNumber")}
                    {...inputInfo.attrs}>
                </input>);
                break;    

            // For checkboxes, use the "checked" attribute instead of its value.
            // Also, it dosn't need a validator for something that the HTML
            // itself validates - a checkbox can only be on or off.
            case "checkbox":
                inputElement = (<input
                    type={inputInfo.type}
                    checked={settingVal}
                    onChange={(e) => updateDontValidate(e, "checked")}
                    {...inputInfo.attrs}>
                </input>);
                break;

            // Pretend that 'select' is a type of input (NOTE: it's not). This
            // also doesn't need a validator (see 'checkbox' for why).
            case "select":
                const optionElements = Object.entries(inputInfo.options).map(
                    ([optionKey, optionValue]) => (<option key={optionKey}
                        value={optionKey}>
                        {optionValue}
                    </option>)
                );
    
                inputElement = (<select
                    value={settingVal}
                    onChange={(e) => updateDontValidate(e, "value")}
                    {...inputInfo.attrs}>
                    {optionElements}
                </select>);
                break;

            // Notably, some inputs are not defined above:
            // - "datetime-local", "month", "week": These are not supported in
            //   all browsers (ahem, Firefox), so should not be used yet.
            // - "password": Is not needed for a data generation app. Its only
            //   purpose is to hide the input's contents, which isn't very
            //   useful when trying to configure settings for generating data.
            // - "file": Same as "password" - not useful.
            // - "radio": This was difficult to implement in the current
            //   architecture. However, it is not actually needed - instead, use
            //   the "select" input, setting its validator function to reject if
            //   the given value is not in the list.
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
