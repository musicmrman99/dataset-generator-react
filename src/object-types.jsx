import React from 'react';
import ObjectType from './object-type';

import { DragSource } from 'react-dnd';
import InteractableTypes from './interactable-types';

// This is basically a 'class factory'
export default Object.freeze(
    Object.entries({
        // VV   ADD NEW TYPES HERE   VV
        "TableType": InteractableTypes.TABLE_TYPE,
        "FieldType": InteractableTypes.FIELD_TYPE
    })
    .reduce(
        (accum, type) => {
            const [objectTypeName, objectTypeDndType] = type;

            @DragSource(objectTypeDndType,
                {
                    beginDrag (props) {
                        return {};
                    }
                },
                (connect, monitor) => ({ dragSourceNode: connect.dragSource() })
            )
            class ObjectTypeDraggable extends React.Component {
                render () {
                    const dragSourceNode = this.props.dragSourceNode;
                    return dragSourceNode(
                        <div>
                            <ObjectType name={this.props.name} imgSrc={this.props.imgSrc} />
                        </div>
                    );
                }
            }

            accum[objectTypeName] = ObjectTypeDraggable;
            return accum;
        }, {}
    )
);
