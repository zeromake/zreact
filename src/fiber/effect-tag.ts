/**
 * 当前元素状态
 */
export enum EffectTag {
    /**
     * 用于叠加其他任务
     */
    NOWORK = 1,
    /**
     * 决定程序是否继续往下遍历
     */
    WORKING = 2,
    /**
     * 插入或移动
     */
    PLACE = 3,
    /**
     * 设置文本
     */
    CONTENT = 5,
    /**
     * 更新属性
     */
    ATTR = 7,
    /**
     * 更新受控属性
     */
    DUPLEX = 11,
    /**
     * 移出DOM树 componentWillUnmount
     */
    DETACH = 13,
    /**
     * componentDidMount/Update/
     */
    HOOK = 17,
    /**
     * ref 总在钩子之后
     */
    REF = 19,
    /**
     * 回调
     */
    CALLBACK = 23,
    /**
     * hook
     */
    PASSIVE = 29,
    /**
     * DEVTOOL
     */
    DEVTOOL = 31,
    /**
     * 出错
     */
    CAPTURE = 33,
}

// 上面的副作用的功能与位置可能变化频繁，我们需确保它们从小到大排列
// PLACE, CONTENT, ATTR,
export const effectNames = [
    EffectTag.DUPLEX,
    EffectTag.DETACH,
    EffectTag.HOOK,
    EffectTag.REF,
    EffectTag.CALLBACK,
    EffectTag.PASSIVE,
    EffectTag.DEVTOOL,
    EffectTag.CAPTURE,
];

export const effectLength = effectNames.length;

// PLACE, CONTENT, DETACH 是基础因子，其他因子只能在它上面相乘
