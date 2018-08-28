import React from 'react';
import ObjectTypes from './object-types';

import { DropTarget } from 'react-dnd';
import InteractableTypes from './interactable-types';
import conditionalJoin from './helpers/conditional-join';

@DropTarget(InteractableTypes.TABLE,
    {
        drop (props, monitor) {
            props.actions.deleteTable(monitor.getItem().tableName);
        }
    },
    (connect, monitor) => ({
        dropTargetNode: connect.dropTarget(),
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver()
    })
)
export default class Panel extends React.Component {
    render () {
        const dropTargetNode = this.props.dropTargetNode;
        const { canDrop, isOver } = this.props;
        
        return dropTargetNode(
            <div className={conditionalJoin({
                "panel span span-2 dropzone": true,
                "dropzone-delete-drag": canDrop,
                "dropzone-delete-hover": isOver
            }, " ")}>
                <ObjectTypes.TableType name="Table" imgSrc="table.png" />
                <ObjectTypes.FieldType name="Field" imgSrc="field.png" />
            </div>
        );
    }
}
