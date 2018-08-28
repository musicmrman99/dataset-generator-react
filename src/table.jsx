import React from 'react';

import { DragSource } from 'react-dnd';
import InteractableTypes from './interactable-types';

@DragSource(InteractableTypes.TABLE,
    {
        beginDrag (props) {
            return { tableName: props.name };
        }
    },
    (connect, monitor) => ({ dragSourceNode: connect.dragSource() })
)
export default class Table extends React.Component {
    render () {
        const dragSourceNode = this.props.dragSourceNode;
        return dragSourceNode(
            <div className="object-instance-table">
                <span>Name: tbl{this.props.name}</span>
                <hr />
                <p>Settings: {JSON.stringify(this.props.settings)}</p>
                <p>Fields: {JSON.stringify(this.props.fields)}</p>
            </div>
        )
    }
}
