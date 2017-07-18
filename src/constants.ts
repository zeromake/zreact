// 不进行render
export const NO_RENDER = 0;
// 同步render标记
export const SYNC_RENDER = 1;
// 用于Component.forceUpdate方法更新组件时的标记
export const FORCE_RENDER = 2;
// 异步render标记
export const ASYNC_RENDER = 3;

export const ATTR_KEY = "__preactattr_";

// 使用number值的style属性
export const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
