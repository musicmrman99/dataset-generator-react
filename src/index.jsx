// React + React DnD + my React DnD extensions
import React from 'react';
import ReactDOM from 'react-dom';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { FlexibleDragDropContext } from  './generics/flexible-dnd';

// Resource Manager (used by Main Components)
import ResourceManager from './helpers/resource-manager';
window.resourceManager = new ResourceManager();

// Main Components
import Header from './header';
import Panel from './panel';
import Workspace from './workspace';
import Footer from './footer';

// Data Operations
import objectOperations from './data-operations/object-operations';
import objectPropertiesOperations from './data-operations/object-properties-operations';
import objectReferenceOperations from './data-operations/object-reference-operations';
import currentObjectOperations from './data-operations/current-object-operations';
import globalOperations from './data-operations/global-operations';
import pageManagement from './data-operations/page-management';

// Root Component
@DragDropContext(HTML5Backend)
@FlexibleDragDropContext
export default class App extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            version: 0.2,
            isUnsaved: false,

            tables: [],
            currentObject: {type: null, path: null}
        }

        this.actions = {
            createTable: objectOperations.createTable.bind(this),
            deleteTable: objectOperations.deleteTable.bind(this),
            createField: objectOperations.createField.bind(this),
            deleteField: objectOperations.deleteField.bind(this),
            moveField: objectOperations.moveField.bind(this),

            getObject: objectReferenceOperations.getObject.bind(this),
            resolveObject: objectReferenceOperations.resolveObject.bind(this),
            setCurrentObject: currentObjectOperations.setCurrentObject.bind(this),
            getCurrentObject: currentObjectOperations.getCurrentObject.bind(this),
            resolveCurrentObject: currentObjectOperations.resolveCurrentObject.bind(this),

            updateObjectName: objectPropertiesOperations.updateObjectName.bind(this),
            updateObjectSettings: objectPropertiesOperations.updateObjectSettings.bind(this)
        }

        this.globalActions = {
            getVersion: globalOperations.getVersion.bind(this),
            generate: globalOperations.generate.bind(this)
        }

        // NOTE: This can still be overriden by the user to discard changes.
        this.shouldPageUnload = pageManagement.shouldPageUnload.bind(this);
        window.addEventListener("beforeunload",
            (e) => pageManagement.unloadHandler(this.shouldPageUnload, e)
        );
    }

    render () {
        return (<div>
            <Header globalActions={this.globalActions}></Header>
            <main>
                <div className="content span-container">
                    <Panel tables={this.state.tables} actions={this.actions} />
                    <Workspace
                        tables={this.state.tables}
                        currentObject={this.state.currentObject}
                        actions={this.actions} />
                </div>
            </main>
            <Footer></Footer>
        </div>);
    }
}

// Load the app into the DOM
window.onload = function () {
    const main = document.getElementById("react-root");
    ReactDOM.render(<App />, main);
};
