import { h, Component } from '../dist/zreact'


class App extends Component {
    constructor() {
        super()
        this.state = {
            num: 0
        }
    }
    test() {
        console.log('----')
    }
    render(props, state) {
        return <h1 onClick={ this.test() }>test{ state.num }</h1>
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
                            <p>{modeItem}1111</p>
                        </div>
                    )
                })
            }
        </div>
    }
}

console.log(test.render())

export default test;
