import { NAMESPACE } from "./browser";
import { patchStyle } from "./style";
import { eventAction, rform } from "./event";
import { typeNumber, emptyObject, noop } from "../../core/util";
import { EffectTag } from "../../fiber/effect-tag";

// 布尔属性的值末必为true,false
// https://github.com/facebook/react/issues/10589
