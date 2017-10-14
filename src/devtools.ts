import { getInitDevTools } from "./devtools-base";
import { options, findDOMNode, findVDom } from "zreact";

export const initDevTools = getInitDevTools(options, findDOMNode, findVDom);
