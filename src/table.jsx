import React from 'react';
import Field from './field';

import { DragSource, DropTarget } from 'react-dnd';
import { InteractableTypes, ObjectTypes } from './types';
import conditionalJoin from './helpers/conditional-join';

@DragSource(InteractableTypes.TABLE,
    {
        beginDrag (props) {
            return { tableName: props.name };
        }
    },
    (connect, monitor) => ({ dragSourceNode: connect.dragSource() })
)
@DropTarget([InteractableTypes.FIELD_CONSTRUCTOR, InteractableTypes.FIELD],
    {
        drop (props, monitor) {
            const itemType = monitor.getItemType();
            if (itemType === InteractableTypes.FIELD_CONSTRUCTOR) {
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
            <Field key={field.name} name={field.name}
                settings={field.settings} tableName={this.props.name}
                currentObject={this.props.currentObject}
                actions={this.props.actions} />)

        return dragSourceNode(
            <div className={conditionalJoin({
                "object-instance-table border-available": true,
                "current-object": (
                    this.props.currentObject.type === ObjectTypes.TABLE && // never true: null === TABLE
                    [this.props.name].every(
                        (name, index) => this.props.currentObject.path[index] === name
                    )
                ),
            }, " ")} onClick={(event) => {
                event.stopPropagation();
                this.props.actions.setCurrentObject(ObjectTypes.TABLE, this.props.name);
            }}>
                <span>Name: tbl{this.props.name}</span>
                <hr />
                {dropTargetNode(
                    <div className={conditionalJoin({
                        "object-instance-table-fields border-available": true,
                        "dropzone-create-drag": (canDrop && sourceType === InteractableTypes.FIELD_CONSTRUCTOR),
                        "dropzone-create-hover": (isOver && sourceType === InteractableTypes.FIELD_CONSTRUCTOR),
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
