import React from 'react';

export default class ObjectType extends React.Component {
    render() {
        return (
            <div className="object-type">
                <p className="object-type-name">{this.props.name}</p>
                <img src={this.props.imgSrc} alt={this.props.name+" object type"}
                    className="object-type-image" />
            </div>
        );
    }
}
