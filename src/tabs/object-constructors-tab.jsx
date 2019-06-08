import React from 'react';
import { ObjectConstructorDraggable } from './sub-components/object-constructor';

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
export default class ObjectConstructorsTab extends React.Component {
    render () {
        const dropTargetNode = this.props.dropTargetNode;
        const { canDrop, isOver } = this.props;

        const TableType = ObjectConstructorDraggable(InteractableTypes.TABLE_CONSTRUCTOR);
        const FieldType = ObjectConstructorDraggable(InteractableTypes.FIELD_CONSTRUCTOR);

        return dropTargetNode(
            <div className={conditionalJoin({
                "tab-component border-available": true,
                "dropzone-delete-drag": canDrop,
                "dropzone-delete-hover": isOver
            }, " ")}>
                <TableType name="Table" imgSrc="table.png" />
                <FieldType name="Field" imgSrc="field.png" />
            </div>
        );
    }
}
