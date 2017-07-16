import { h, Component } from '../dist/zreact'


class App extends Component {
    test() {
        console.log('----')
    }
    render() {
        return <h1 onClick={ this.test }></h1>
    }
}

const test = {
    test() {
        console.log('-----')
    },
    render() {
        return <div>
            <App/>
            {
                [1, 2, 3].map(function(modeItem) {
                    return (
                        <div data-options="{test: 1}">
                            <p>{modeItem}</p>
                        </div>
                    )
                })
            }
        </div>
    }
}

console.log(test.render())

export default test;
