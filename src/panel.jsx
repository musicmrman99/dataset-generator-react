import React from 'react';
import ScrollableTabs from './generics/scrollable-tabs';

import ObjectTypesTab from './object-types-tab/object-types-tab';
import AnotherTab from './object-types-tab/another-tab';

export default class Panel extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            activeTabIndex: 0
        };

        this.tabInfo = {
            0: {
                name: "Object Types",
                component: ObjectTypesTab,
                componentProps: []
            },
            1: {
                name: "Another Tab",
                component: AnotherTab,
                componentProps: []
            },
            2: {
                name: "Long Object Types Tab",
                component: ObjectTypesTab,
                componentProps: []
            }
        }
    }

    render () {
        // Get the name of each tab and create a function to switch to that tab
        // from the current tabInfo table.
        const tabInfo = this.tabInfo[this.state.activeTabIndex];
        const scrollableTabsInfo = Object.entries(this.tabInfo).reduce(
            (collector, [index, tabInfo]) => {
                collector.push([
                    tabInfo.name,
                    () => { this.setState({activeTabIndex: index}); }
                ]);
                return collector;
            }, []
        )

        return (
            <div className="panel span span-2">
                <ScrollableTabs tabInfo={scrollableTabsInfo} />
                <tabInfo.component {...tabInfo.componentProps} />
            </div>
        );
    }
}
