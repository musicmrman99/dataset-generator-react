import React from 'react';

import { DragSource } from 'react-dnd';
import InteractableTypes from './interactable-types';

@DragSource(InteractableTypes.FIELD,
    {
        beginDrag (props) {
            return {
                tableName: props.tableName,
                fieldName: props.name
            };
        }
    },
    (connect, monitor) => ({ dragSourceNode: connect.dragSource() })
)
export default class Field extends React.Component {
    render () {
        const dragSourceNode = this.props.dragSourceNode;
        return dragSourceNode(
            <div className="object-instance-field">
                <span>Name: {this.props.name}</span>
                <p>Settings: {JSON.stringify(this.props.settings)}</p>
            </div>
        )
    }
}
