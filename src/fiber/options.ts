import { OwnerType } from "../core/type-shared";

export const options: {
    afterUpdate: null|((instance: OwnerType) => void);
    beforeUnmount: null|((instance: OwnerType) => void);
    afterMount: null|((instance: OwnerType) => void);
} = {
    afterMount: null,
    afterUpdate: null,
    beforeUnmount: null,
};
