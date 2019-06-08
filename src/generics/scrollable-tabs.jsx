import React from 'react';
import Repeater from '../helpers/repeater'
import { isOverflowing } from '../helpers/is-overflowing';

export default class ScrollableTabs extends React.Component {
    constructor (props) {
        super(props);

        // For refering to the tabset
        this.tabSetRef = React.createRef();

        // Scrolling the tabset
        this.scrollSize = 10; //px
        this.scrollSpeed = 100; //ms
        this.scrollDirection = Object.freeze({
            LEFT: "left",
            RIGHT: "right"
        });

        this.scrollTabs = this.scrollTabs.bind(this); // This is a callback
        this.scrollRepeaters = Object.freeze({ // These actually do the work
            left: new Repeater(() => this.scrollTabs(this.scrollDirection.LEFT), this.scrollSpeed),
            right: new Repeater(() => this.scrollTabs(this.scrollDirection.RIGHT), this.scrollSpeed)
        });

        // Do not use scrollers initially, in case they are not needed
        this.state = {
            useScrollers: false
        };
    }

    scrollTabs (direction) {
        const tabSet = this.tabSetRef.current;
        switch (direction) {
            case this.scrollDirection.LEFT:
                // -this.scrollSize, cap at 0
                tabSet.scrollLeft = (
                    (tabSet.scrollLeft < this.scrollSize) ? (0) : (tabSet.scrollLeft - this.scrollSize)
                );
                break;

            case this.scrollDirection.RIGHT:
                // +10, cap at tabSet.offsetWidth
                tabSet.scrollLeft = (
                    (tabSet.scrollLeft > (tabSet.offsetWidth - this.scrollSize)) ?
                    (tabSet.offsetWidth) :
                    (tabSet.scrollLeft + this.scrollSize)
                );
                break;
        }
    }

    componentDidMount () {
        // If the tabset *does* overflow (x-axis), then re-render with scrollers
        if (isOverflowing(this.tabSetRef.current)[0]) {
            this.setState({useScrollers: true});
        }
    }

    render () {
        // Translate each given tab name and display function to a graphical button
        const tabs = this.props.tabInfo
            .map(([name, display]) => (
                <button className="tab" key={name} onClick={display}>
                    {name}
                </button>
            ));

        const scrollButtons = {
            left: <button className="tabset-scroller-button"
                onMouseDown={this.scrollRepeaters.left.start}
                onMouseUp={this.scrollRepeaters.left.stop}>
                    &lt;
                </button>,

            right: <button className="tabset-scroller-button"
                onMouseDown={this.scrollRepeaters.right.start}
                onMouseUp={this.scrollRepeaters.right.stop}>
                    &gt;
                </button>
        }

        return (
            <div className="tabset-scroller">
                {this.state.useScrollers ? scrollButtons.left : null}
                <div className="tabset" ref={this.tabSetRef}>
                    {tabs}
                </div>
                {this.state.useScrollers ? scrollButtons.right : null}
            </div>
        );
    }
}
