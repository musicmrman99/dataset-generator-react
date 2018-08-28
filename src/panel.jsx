import React from 'react';
import ObjectTypes from './object-types';

export default class Panel extends React.Component {
    render () {
        return (
            <div className="panel span span-2">
                <ObjectTypes.TableType name="Table" imgSrc="table.png" />
                <ObjectTypes.FieldType name="Field" imgSrc="field.png" />
            </div>
        );
    }
}


