import React from 'react';
import ObjectType from './object-type';
import ObjectTypes from './object-types';

export default class Panel extends React.Component {
    render() {
        return (
            <div className="panel span span-2">
                <ObjectType typeID={ObjectTypes.TABLE} name="Table" imgSrc="table.png" />
                <ObjectType typeID={ObjectTypes.FIELD} name="Field" imgSrc="field.png" />
            </div>
        );
    }
}
