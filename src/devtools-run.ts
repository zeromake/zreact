import { options, findDOMNode, findVDom } from "zreact";
import { getInitDevTools } from "./devtools-base";

const initDevTools = getInitDevTools(options, findDOMNode, findVDom);

initDevTools();
