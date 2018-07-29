const React = require('react');
const ReactDOM = require('react-dom');

export class App extends React.Component {
    render() {
        return (
            <div></div>
        );
    }
}

window.onload = function () {
    const main = document.getElementsByTagName("main")[0];
    ReactDOM.render(<App />, main);
}
