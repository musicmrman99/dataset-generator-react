import React from 'react';
import Table from './table';

import { DropTarget } from 'react-dnd';
import InteractableTypes from './interactable-types';

import conditionalJoin from './helpers/conditional-join';

const dropSpec = {
    drop (props, monitor) {
        props.actions.createNewTable({name: "NewTable"});
    }
}

function dropCollector (connect, monitor) {
    return {
        dropTargetNode: connect.dropTarget(),
        isDragging: Boolean(monitor.getItem()),
        isOver: monitor.isOver()
    }
}

@DropTarget(InteractableTypes.OBJECT_TYPE, dropSpec, dropCollector)
export default class Workspace extends React.Component {
    render () {
        const dropTargetNode = this.props.dropTargetNode;
        const { isDragging, isOver } = this.props;

        // Add whatever props a table needs
        // About the 'key' prop: https://reactjs.org/docs/lists-and-keys.html
        const tables = this.props.tables.map((table) =>
            <Table key={table.name} name={table.name} settings={table.settings} fields={table.fields} />)

        return dropTargetNode(
            <div className={conditionalJoin({
                "workspace span span-10 dropzone": true,
                "dropzone-create-drag": isDragging,
                "dropzone-create-hover": isOver
            }, " ")}>
                {tables}
            </div>
        );
    }
}
