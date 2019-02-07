import React from 'react';

import { ObjectSettingsDefs } from '../types';

export default class ObjectSettingsTab extends React.Component {
    updateField (objInfo, setting, newValue) {
        // TODO: implement this
        // can use:
        // - objInfo (if absolutely necessary, objInfo.type, objInfo.path, but
        //   this should be implemented in index.jsx)
        // - setting
        // - newValue
    }

    render () {
        const curObjInfo = this.props.actions.getCurrentObject();
        const curObj = this.props.actions.resolveCurrentObject();

        let settingsInputs = null;
        if (curObj != null) {
            const {_, inputs, validators} = ObjectSettingsDefs[curObjInfo.type];
            const settings = curObj.settings;

            settingsInputs = Object.entries(settings).map(([setting, value]) => (
                <input key={setting}
                    type={inputs[setting].type}
                    value={value}
                    onChange={(event) => {
                        this.updateField(
                            curObjInfo, setting,
                            validators[setting](event.target.value)
                        )
                    }}
                    {...inputs[setting].attrs}>
                </input>
            ));
        }

        return (
            <div className="tab-component">
                {settingsInputs}
            </div>
        );
    }
}
