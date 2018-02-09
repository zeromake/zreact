[![Travis Build Status](https://travis-ci.org/zeromake/zreact.svg?branch=master)](https://travis-ci.org/zeromake/zreact)
[![Coverage Status](https://coveralls.io/repos/github/zeromake/zreact/badge.svg?branch=master)](https://coveralls.io/github/zeromake/zreact?branch=master)

# zreact

copy to [preact](https://github.com/developit/preact)

## Differ from preact

- source is typescript
- render return (null | undefined | boolean) not is a empty text and not render dom but devtools has vnode
- props.children is empty not is `[]` is a `null`
- add react api:
    - PureComponent
    - createClass
    - createFactory
    - createPortal
    - findDOMNode
    - isValidElement
    - unmountComponentAtNode
    - unstable_renderSubtreeIntoContainer
    - Children
- add react 16 api:
    - createRef
    - Component.getDerivedStateFromProps
- deprecated:
    - Component.prototype.componentWillMount
    - Component.prototype.componentWillReceiveProps
    - Component.prototype.componentWillUpdate
