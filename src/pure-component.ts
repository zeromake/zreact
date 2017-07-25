import { Component } from "./component";
import { IKeyValue } from "./types";

/**
 * 简单组件state,props对象只有一层改变使用，超过一层改变就会无法更新
 * @constructor
 */
export class PureComponent extends Component {
    public isPureReactComponent: boolean = true;
    public shouldComponentUpdate (props: IKeyValue, state: IKeyValue): boolean  {
        // props,state只要一个不同就返回true
        return shallowDiffers(this.props, props) || shallowDiffers(this.state, state);
    }
}

/**
 * 判断两对象的属性值不同
 * @param a
 * @param b
 */
function shallowDiffers(a: IKeyValue, b: IKeyValue): boolean {
    for (const i in a) {
        if (!(i in b)) {
            return true;
        }
    }
    for (const i in b) {
        if (a[i] !== b[i]) {
            return true;
        }
    }
    return false;
}
