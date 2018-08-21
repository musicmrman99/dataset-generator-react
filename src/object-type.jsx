import React from 'react';

import { DragSource } from 'react-dnd';
import InteractableTypes from './interactable-types';

// NOTE: This module assumes that 'resourceManager' is global.
//       This is likely to be set in index.jsx

const dragSpec = {
    beginDrag (props) {
        return {
            typeID: props.typeID
        }
    }
}

function dragCollector (connect, monitor) {
    return {
        dragSourceNode: connect.dragSource()
    }
}

@DragSource(InteractableTypes.OBJECT_TYPE, dragSpec, dragCollector)
export default class ObjectType extends React.Component {
    constructor (props) {
        super(props);

        // Initialise until async init is completed
        this.state = {
            imgSrc: ""
        };

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
        const dragSourceNode = this.props.dragSourceNode;
        return dragSourceNode(
            <div className="object-type">
                <p className="object-type-name">{this.props.name}</p>
                <img src={this.state.imgSrc} alt={this.props.name+" object type"}
                    className="object-type-image" />
            </div>
        );
    }
}
