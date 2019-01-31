import React from 'react';
import { DragSource } from 'react-dnd';

// NOTE: This module assumes that 'resourceManager' is global.
//       This is likely to be set in index.jsx

export class ObjectConstructor extends React.Component {
    constructor (props) {
        super(props);

        // Initialise until async init is completed
        this.state = {
            imgSrc: ""
        };
    }

    componentDidMount () {
        // Async-initialised (kind-of-has-to-be state)
        resourceManager.getResourceTypes()
            .then((resourceTypes) => {
                return resourceManager.getResourcePath(
                    resourceTypes.image,
                    "object-types/" + this.props.imgSrc );
            })
            .then((resource) => {
                this.setState({ imgSrc: resource["path"] });
            });
    }

    render () {
        return (
            <div className="object-type">
                <p className="object-type-name">{this.props.name}</p>
                <img src={this.state.imgSrc} alt={this.props.name+" object type"}
                    className="object-type-image" />
            </div>
        );
    }
}

export function ObjectConstructorDraggable (objectConstructorDndType) {
    @DragSource(objectConstructorDndType,
        {
            beginDrag (props) {
                return {};
            }
        },
        (connect, monitor) => ({ dragSourceNode: connect.dragSource() })
    )
    class _ObjectConstructorDraggable extends React.Component {
        render () {
            const dragSourceNode = this.props.dragSourceNode;
            return dragSourceNode(
                <div>
                    <ObjectConstructor name={this.props.name} imgSrc={this.props.imgSrc} />
                </div>
            );
        }
    }

    return _ObjectConstructorDraggable;
}
