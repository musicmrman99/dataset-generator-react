import React from 'react';
import Table from './table';

import { DropTarget } from 'react-dnd';
import { InteractableTypes } from './types';
import conditionalJoin from './helpers/conditional-join';

@DropTarget(InteractableTypes.TABLE_CONSTRUCTOR,
    {
        drop (props, monitor) {
            props.actions.createTable({ name: "NewTable" });
        }
    },
    (connect, monitor) => ({
        dropTargetNode: connect.dropTarget(),
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver()
    })
)
export default class Workspace extends React.Component {
    render () {
        const dropTargetNode = this.props.dropTargetNode;
        const { canDrop, isOver } = this.props;

        // About the 'key' prop: https://reactjs.org/docs/lists-and-keys.html
        const tables = this.props.tables.map((table) =>
            <Table key={table.name} name={table.name}
                settings={table.settings} fields={table.fields}
                currentObject={this.props.currentObject}
                actions={this.props.actions} />)

        return dropTargetNode(
            <div className={conditionalJoin({
                "workspace span span-10 border-available": true,
                "dropzone-create-drag": canDrop,
                "dropzone-create-hover": isOver
            }, " ")}>
                {tables}
            </div>
        );
    }
}
