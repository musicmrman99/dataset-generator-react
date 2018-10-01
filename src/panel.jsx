import React from 'react';
import ObjectTypes from './object-types';

import { DropTarget } from 'react-dnd';
import InteractableTypes from './interactable-types';
import conditionalJoin from './helpers/conditional-join';

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
