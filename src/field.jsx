import React from 'react';

export default class Field extends React.Component {
    render () {
        return (
            <div className="object-instance-field">
                <span>Name: {this.props.name}</span>
                <p>Settings: {JSON.stringify(this.props.settings)}</p>
            </div>
        )
    }
}
