/**
 * Shared TypeScript types for m2d2.
 */

/**
 * An HTMLElement extended by extDom with m2d2 properties and methods.
 * The real DOM node is the source of truth; the Proxy only wraps the edge.
 */
export interface M2d2Node extends HTMLElement {
    // m2d2 internal flags
    _m2d2?: boolean;
    _m2d2_display?: string;
    _template?: Element | null;
    __template?: Record<string, unknown> | null;
    /** Reconciliation key for items: a field name (string) or a function. */
    _itemKey?: string | ((item: any, index: number) => unknown);
    domNode?: Element;
    hasEventListeners?: boolean;
    items?: ItemsCollection;

    // m2d2-added properties
    text: string;
    html: string;
    css: DOMTokenList;
    show: boolean;

    // m2d2-added event handlers.
    // NOTE: onload is a native HTMLElement handler (typed as nullable on the DOM);
    // we do not redeclare it here to avoid conflicts. onready/onshow/onupdate are m2d2-specific.
    onready?: (ev: Event) => void;
    onshow?: (node: M2d2Node) => void;
    onupdate?: (ev: CustomEvent<UpdateDetail>) => void;

    // m2d2-added methods
    find: (selector: string) => M2d2Node | null;
    findAll: (selector?: string) => Element[];
    parent: () => M2d2Node | null;
    sibling: (selector: string) => M2d2Node | null;
    posterior: () => Element | null;
    anterior: () => Element | null;
    index: (() => number) | number; // number for <option>, function otherwise
    inView: () => boolean;
    getData?: (includeNotVisible?: boolean) => Record<string, unknown>;

    // dynamic links to children (node.key shortcuts)
    [key: string]: unknown;
}

/**
 * The detail object dispatched with "update" CustomEvents.
 */
export interface UpdateDetail {
    type: string;
    property: string;
    newValue: unknown;
    oldValue: unknown;
}

/**
 * A linked reference: [source, "prop"] or [source, "prop", transformFn].
 */
export type LinkedRef =
    | [source: object, prop: string]
    | [source: object, prop: string, fn: (val: unknown) => unknown];

/**
 * The items collection after extendItems: HTMLCollection + array-like methods.
 */
export interface ItemsCollection extends HTMLCollection {
    clear(): void;
    get(id: string | number): M2d2Node | null;
    remove(id: string | number): void;
    selected(): M2d2Node | null;
    unselect(): void;
    first(): M2d2Node | null;
    last(): M2d2Node | null;
    pop(): M2d2Node | null;
    shift(): M2d2Node | null;
    push(obj: unknown): void;
    unshift(obj: unknown): void;
    sort(compareFn?: (a: M2d2Node, b: M2d2Node) => number): void;
    reverse(): void;
    splice(start: number, deleteCount?: number, ...items: unknown[]): M2d2Node[];
    fill(value: unknown, start?: number, end?: number): void;
    copyWithin(target: number, start: number, end?: number): void;
    concat(...arrays: unknown[][]): void;
    forEach(cb: (item: M2d2Node, index: number) => void): void;
    map<U>(cb: (item: M2d2Node, index: number) => U): U[];
    filter(cb: (item: M2d2Node, index: number) => boolean): M2d2Node[];
    find(cb: (item: M2d2Node) => boolean): M2d2Node | undefined;
    find(sel: string): M2d2Node | null;
    findAll(sel?: string): Element[] | M2d2Node[];
    [key: string]: unknown;
}
