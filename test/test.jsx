const { h, Component } = require('../dist/zreact')
const scratch = 1
// (window.document.body || window.document.documentElement).appendChild(scratch);

class Comp extends Component {
    render() {
        return <span>span in a component</span>;
    }
}

let root;
function test(content) {
    // root = render(content, scratch, root);
}

test(<Comp />);
test(<div>just a div</div>);
test(<Comp />);

//console.log(test.render())

//export default test;
