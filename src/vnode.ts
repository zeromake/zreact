import { Component } from "./component";

export class VNode {
    public nodeName: string| Component;
    public children: any[];
    public attributes: any | undefined;
    public key: any | undefined;
}
