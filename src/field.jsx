import React from 'react';

import { DragSource } from 'react-dnd';
import { FDnDConnectDragSource, FDnDExcludeDrag } from './generics/flexible-dnd';
import { InteractableTypes, ObjectTypes } from './types';
import conditionalJoin from './helpers/conditional-join';

@DragSource(InteractableTypes.FIELD,
    {
        beginDrag (props) {
            return {
                tableName: props.tableName,
                fieldName: props.name
            };
        }
    },
    (connect, monitor) => ({ dragSourceNode: FDnDConnectDragSource(connect.dragSource()) })
)
export default class Field extends React.Component {
    updateName (newName) {
        this.props.actions.updateObjectName(
            this.props.actions.getObject(
                ObjectTypes.FIELD,
                [this.props.tableName, this.props.name].join("/")
            ), newName
        );
    }

    render () {
        const dragSourceNode = this.props.dragSourceNode;
        return dragSourceNode(
            <div className={conditionalJoin({
                "object-instance-field border-available": true,
                "current-object": (
                    this.props.currentObject.type === ObjectTypes.FIELD && // never true: null === FIELD
                    [this.props.tableName, this.props.name].every(
                        (name, index) => this.props.currentObject.path[index] === name
                    )
                ),
            }, " ")} onClick={(event) => {
                event.stopPropagation();
                this.props.actions.setCurrentObject(
                    ObjectTypes.FIELD,
                    [this.props.tableName, this.props.name].join("/")
                );
            }}>
                <span>Name: {FDnDExcludeDrag(<input
                    type="text"
                    value={this.props.name}
                    onChange={(event) => {
                        this.updateName(event.target.value);
                    }}
                    onClick={(event) => event.stopPropagation() /*Don't bubble*/}>
                </input>)}</span>
            </div>
        )
    }
}
