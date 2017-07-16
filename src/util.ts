declare const Promise: any;

export const defer = typeof Promise === "function"
    ? Promise.resolve().then
    : setTimeout;
