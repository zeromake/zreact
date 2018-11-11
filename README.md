[![Travis Build Status](https://travis-ci.org/zeromake/zreact.svg?branch=master)](https://travis-ci.org/zeromake/zreact)
[![Coverage Status](https://coveralls.io/repos/github/zeromake/zreact/badge.svg?branch=master)](https://coveralls.io/github/zeromake/zreact?branch=master)

# zreact

copy to [anu](https://github.com/RubyLouvre/anu)

## Differ from anu

- source is typescript

## react 官方组件分割思想
**有状态的组件没有渲染：**

包含实际业务状态的组件不应该进行视图的渲染，而是应该将实际业务状态传递给子孙组件，让子孙组件来进行视图渲染；

**有渲染的组件没有状态：**

能够进行视图渲染的组件，不要包含实际的业务状态，而是通过接受父辈的参数来进行渲染；

**好处：**

这样的话，有渲染的组件没有实际的业务状态，就与实际的业务解耦了，能够更好的服务于其他的有状态的组件，实现组件的复用。
