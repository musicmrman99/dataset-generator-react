import React from 'react';

export default class ObjectPropertiesTab extends React.Component {
    render () {
        const curObj = this.props.actions.resolveCurrentObject();
        let settingsGraphical = null
        if (curObj != null) {
            const settings = curObj.settings;

            // TODO: change this to create inputs for each of the settings,
            // rather than just outputting them.
            settingsGraphical = Object.entries(settings).map(
                item => <p>{item[0]+" = "+item[1]}</p>)
        }

        return (
            <div className="tab-component">
                {settingsGraphical}
            </div>
        );
    }
}
