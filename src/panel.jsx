import React from 'react';

import ScrollableTabs from './generics/scrollable-tabs';
import ObjectTypesTab from './tabs/object-types-tab';

export default class Panel extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            activeTabIndex: 0
        };
    }

    render () {
        const tabs = [
            [0, "Object Types"]
        ];

        // Get the name of each tab and create a function to switch to that tab.
        const tabInfo = tabs.map( ([index, name]) => [
            name, () => { this.setState({activeTabIndex: index}); }
        ]);

        const index = this.state.activeTabIndex;
        return (
            <div className="panel span span-2">
                <ScrollableTabs tabInfo={tabInfo} />
                {(index === 0) && <ObjectTypesTab actions={this.state.actions} />}
            </div>
        );
    }
}
