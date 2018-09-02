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
                        "dropzone-create-drag": canDrop,
                        "dropzone-create-hover": isOver
                    }, " ")}>
                        {fields}
                    </div>
                )}
            </div>
        )
    }
}
