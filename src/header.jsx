import React from 'react';

export default class Header extends React.Component {
    render () {
        return (
            <header className="span-container">
                <div className="span span-4">
                    <p id="title">
                        Dataset Generator v{this.props.globalActions.getVersion()}
                    </p>
                </div>
                <div className="span span-8">
                    <button type="button" id="generate">Generate</button>
                </div>
            </header>
        );
    }
}
