import React from 'react';

export default class ObjectType extends React.Component {
    render() {
        return (
            <div className="padded obj-type">
                <p>{this.props.name}</p>
            </div>
        );
    }
}
