import React from 'react';
import { ObjectTypeDraggable } from './object-types/object-type-draggable';

import { DropTarget } from 'react-dnd';
import { InteractableTypes } from '../types';
import conditionalJoin from '../helpers/conditional-join';

// See https://github.com/react-dnd/react-dnd/issues/330
@DropTarget([InteractableTypes.TABLE, InteractableTypes.FIELD],
    {
        drop (props, monitor) {
            const item = monitor.getItem();
            const itemType = monitor.getItemType();

            if (itemType === InteractableTypes.TABLE) {
                props.actions.deleteTable(item.tableName);
            } else if (itemType === InteractableTypes.FIELD) {
                props.actions.deleteField(item.tableName, item.fieldName);
            }
        }
    },
    (connect, monitor) => ({
        dropTargetNode: connect.dropTarget(),
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver()
    })
)
export default class ObjectTypesTab extends React.Component {
    render () {
        const dropTargetNode = this.props.dropTargetNode;
        const { canDrop, isOver } = this.props;

        const TableType = ObjectTypeDraggable(InteractableTypes.TABLE_TYPE);
        const FieldType = ObjectTypeDraggable(InteractableTypes.FIELD_TYPE);

        return dropTargetNode(
            <div className={conditionalJoin({
                "tab-component dropzone": true,
                "dropzone-delete-drag": canDrop,
                "dropzone-delete-hover": isOver
            }, " ")}>
                <TableType name="Table" imgSrc="table.png" />
                <FieldType name="Field" imgSrc="field.png" />
            </div>
        );
    }
}
