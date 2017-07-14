import { h } from '../dist/zreact'

class App {
    render() {
        return <h1>testApp</h1>
    }
}

const test = {
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
