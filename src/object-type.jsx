import React from 'react';

// NOTE: This assumes that 'resourceManager' is global.
//       This is likely to be set in index.jsx

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

    render() {
        return (
            <div className="object-type">
                <p className="object-type-name">{this.props.name}</p>
                <img src={this.state.imgSrc} alt={this.props.name+" object type"}
                    className="object-type-image" />
            </div>
        );
    }
}
