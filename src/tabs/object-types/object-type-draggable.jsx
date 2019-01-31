import React from 'react';
import { DragSource } from 'react-dnd';

import ObjectType from './object-type';

export function ObjectTypeDraggable (objectTypeDndType) {
    @DragSource(objectTypeDndType,
        {
            beginDrag (props) {
                return {};
            }
        },
        (connect, monitor) => ({ dragSourceNode: connect.dragSource() })
    )
    class _ObjectTypeDraggable extends React.Component {
        render () {
            const dragSourceNode = this.props.dragSourceNode;
            return dragSourceNode(
                <div>
                    <ObjectType name={this.props.name} imgSrc={this.props.imgSrc} />
                </div>
            );
        }
    }

    return _ObjectTypeDraggable;
}
