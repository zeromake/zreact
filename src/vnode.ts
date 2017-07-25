import { Component } from "./component";
import { IKeyValue } from "./types";

export class VNode {
    public nodeName: string | Component | ((props?: IKeyValue, state?: IKeyValue, context?: IKeyValue) => VNode);
    public children: Array<VNode|string>;
    public attributes?: IKeyValue;
    public key?: any;
}
