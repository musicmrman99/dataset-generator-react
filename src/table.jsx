import React from 'react';

import { DragSource, DropTarget } from 'react-dnd';
import InteractableTypes from './interactable-types';
import conditionalJoin from './helpers/conditional-join';

@DragSource(InteractableTypes.TABLE,
    {
        beginDrag (props) {
            return { tableName: props.name };
        }
    },
    (connect, monitor) => ({ dragSourceNode: connect.dragSource() })
)
@DropTarget(InteractableTypes.FIELD_TYPE,
    {
        drop (props, monitor) {
            props.actions.createNewField(props.name, {name: "NewField"});
        }
    },
    (connect, monitor) => ({
        dropTargetNode: connect.dropTarget(),
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver()
    })
)
export default class Table extends React.Component {
    render () {
        const [dragSourceNode, dropTargetNode] =
            [this.props.dragSourceNode, this.props.dropTargetNode];
        const { canDrop, isOver } = this.props;

        return dragSourceNode(
            <div className="object-instance-table">
                <span>Name: tbl{this.props.name}</span>
                <hr />
                <p>Settings: {JSON.stringify(this.props.settings)}</p>
                {dropTargetNode(
                    <div className={conditionalJoin({
                        "table-fields dropzone": true,
                        "dropzone-create-drag": canDrop,
                        "dropzone-create-hover": isOver
                    }, " ")}>
                        <p>Fields: {JSON.stringify(this.props.fields)}</p>
                    </div>
                )}
            </div>
        )
    }
}
