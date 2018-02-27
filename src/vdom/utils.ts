
/**
 * 判断是否为Text节点
 * @param node
 */
export function isTextNode(node: Text | any): boolean {
    return node.splitText !== undefined;
}
