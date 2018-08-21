import React from 'react';

export default class Table extends React.Component {
    render () {
        return (
            <div className="object-instance-table">
                <span>Name: tbl{this.props.name}</span>
                <hr />
                <p>Settings: {JSON.stringify(this.props.settings)}</p>
                <p>Fields: {JSON.stringify(this.props.fields)}</p>
            </div>
        )
    }
}
