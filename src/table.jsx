import React from 'react';
import Field from './field';

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
@DropTarget([InteractableTypes.FIELD_TYPE, InteractableTypes.FIELD],
    {
        drop (props, monitor) {
            const itemType = monitor.getItemType();
            if (itemType === InteractableTypes.FIELD_TYPE) {
                props.actions.createField(props.name, {name: "NewField"});
            } else if (itemType === InteractableTypes.FIELD) {
                const item = monitor.getItem();
                props.actions.moveField(item.fieldName, item.tableName, props.name);
            }
        }
    },
    (connect, monitor) => ({
        dropTargetNode: connect.dropTarget(),
        sourceType: monitor.getItemType(),
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver()
    })
)
export default class Table extends React.Component {
    render () {
        const [dragSourceNode, dropTargetNode] =
            [this.props.dragSourceNode, this.props.dropTargetNode];
        const { sourceType, canDrop, isOver } = this.props;

        // About the 'key' prop: https://reactjs.org/docs/lists-and-keys.html
        const fields = this.props.fields.map((field) =>
            <Field key={field.name}
                name={field.name} settings={field.settings}
                tableName={this.props.name} actions={this.props.actions} />)

        return dragSourceNode(
            <div className="object-instance-table">
                <span>Name: tbl{this.props.name}</span>
                <p>Settings: {JSON.stringify(this.props.settings)}</p>
                <hr />
                {dropTargetNode(
                    <div className={conditionalJoin({
                        "object-instance-table-fields dropzone": true,
                        "dropzone-create-drag": (canDrop && sourceType === InteractableTypes.FIELD_TYPE),
                        "dropzone-create-hover": (isOver && sourceType === InteractableTypes.FIELD_TYPE),
                        "dropzone-move-drag": (canDrop && sourceType === InteractableTypes.FIELD),
                        "dropzone-move-hover": (isOver && sourceType === InteractableTypes.FIELD)
                    }, " ")}>
                        {fields}
                    </div>
                )}
            </div>
        )
    }
}
