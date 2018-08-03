import React from 'react';
import ObjectType from './object-type';

export default class Panel extends React.Component {
    render() {
        return (
            <div className="panel span span-2">
                <ObjectType typeID="table" name="Table" />
            </div>
        );
    }
}
