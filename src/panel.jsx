import React from 'react';

import ScrollableTabs from './generics/scrollable-tabs';
import ObjectTypesTab from './tabs/object-types-tab';
import ObjectPropertiesTab from './tabs/object-properties-tab';

export default class Panel extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            activeTabIndex: 0
        };
    }

    render () {
        const tabs = [
            [0, "Object Types"],
            [1, "Object Properties"]
        ];

        // Get the name of each tab and create a function to switch to that tab.
        const tabInfo = tabs.map( ([index, name]) => [
            name, () => { this.setState({activeTabIndex: index}); }
        ]);

        const index = this.state.activeTabIndex;
        return (
            <div className="panel span span-2">
                <ScrollableTabs tabInfo={tabInfo} />
                {(index === 0) && <ObjectTypesTab actions={this.props.actions} />}
                {(index === 1) && <ObjectPropertiesTab actions={this.props.actions} />}
            </div>
        );
    }
}
