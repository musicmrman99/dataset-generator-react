import React from 'react';
import PropTypes from 'prop-types';

// --------------------------------------------------
// WARNING: There may be issues with this code, particularly recursion
//   (nesting wrapped components/elements) - IT HAS NOT BEEN TESTED
// --------------------------------------------------

// From: https://reactjs.org/docs/higher-order-components.html
function getDisplayName(WrappedComponent) {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

const FDnDCtx = React.createContext();

// React component class decorator
export function FlexibleDragDropContext (WrappedComponent) {
    /*
    Example usage:

    @DragDropContext(HTML5Backend)
    @FlexibleDragDropContext
    class App extends React.Component {
        ...
    }
    */

    class FDnDStatus extends React.Component {
        constructor (props) {
            super(props);
    
            this.actions = {
                setStatus: this.setStatus.bind(this)
            };
    
            this.state = Object.assign({
                dragActive: true,
                dropActive: true,
            }, this.actions);
        }
    
        setStatus (newStatus) {
            this.setState(Object.assign({}, this.state, newStatus));
        }
    
        render () {
            return (<FDnDCtx.Provider value={this.state}>
                <WrappedComponent {...this.props} />
            </FDnDCtx.Provider>);
        }
    }
    FDnDStatus.displayName = "FDnDStatus("+getDisplayName(WrappedComponent)+")";

    return FDnDStatus;
}

// Drag Source / Drop Target connector overrides
// --------------------------------------------------

/*
Example usage
----------

As a collector function for drag source:
```
function (connect, monitor) {
    return {
        connectDragSource: FDnDConnectDragSource(connect.dragSource())
    };
}
```

As a collector function for drop target:
```
function (connect, monitor) {
    return {
        connectDragSource: FDnDConnectDropTarget(connect.dropTarget()),
        sourceType: monitor.getItemType(),
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver()
    };
}
```
*/

// A little utility
function passThrough (node) { return node; }

export function FDnDConnectDragSource (connectDragSource) {
    return (component) => (<FDnDCtx.Consumer>
        {(context) => {
            const switchedConnectDragSource = context.dragActive ?
                connectDragSource :
                passThrough;
            return switchedConnectDragSource(component);
        }}
    </FDnDCtx.Consumer>);
}

export function FDnDConnectDropTarget (connectDropTarget) {
    return (component) => (<FDnDCtx.Consumer>
        {(context) => {
            const switchedConnectDropTarget = context.dropActive ?
                connectDropTarget :
                passThrough;
            return switchedConnectDropTarget(component);
        }}
    </FDnDCtx.Consumer>);
}

// Exclude and Include
// --------------------------------------------------

// Internal only
class FDnDAdjustDrag extends React.Component {
    render () {
        return (<span
            onMouseEnter={() =>
                this.context.setStatus({ dragActive: this.props.set })
            }
            onMouseLeave={() =>
                this.context.setStatus({ dragActive: !this.props.set })
            }>
            {this.props.children}
        </span>);
    }
}
FDnDAdjustDrag.contextType = FDnDCtx;
FDnDAdjustDrag.propTypes = {
    set: PropTypes.bool.isRequired
};

export function FDnDExcludeDrag (children) {
    return (<FDnDAdjustDrag set={false}>
        {children}
    </FDnDAdjustDrag>);
}

export function FDnDIncludeDrag (children) {
    return (<FDnDAdjustDrag set={true}>
        {children}
    </FDnDAdjustDrag>);
}

// TODO: Add exclude/include for drop
