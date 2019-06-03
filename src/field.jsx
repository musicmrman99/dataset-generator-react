import React from 'react';

import { DragSource } from 'react-dnd';
import { InteractableTypes, ObjectTypes } from './types';

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
            <div className="object-instance-field" onClick={
                (event) => {
                    event.stopPropagation();
                    this.props.actions.setCurrentObject(ObjectTypes.FIELD, [this.props.tableName, this.props.name].join("/"));
                }
            }>
                <span>Name: {this.props.name}</span>
            </div>
        )
    }
}
