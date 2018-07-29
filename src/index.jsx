const React = require('react');
const ReactDOM = require('react-dom');

const Panel = require('./panel.jsx');
const Workspace = require('./workspace.jsx');

module.exports = class App extends React.Component {
    render() {
        return (
            <div className="content span-container">
                <Panel />
                <Workspace />
            </div>
        );
    }
}

window.onload = function () {
    const main = document.getElementsByTagName("main")[0];
    ReactDOM.render(<App />, main);
}
