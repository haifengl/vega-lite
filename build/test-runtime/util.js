import * as tslib_1 from "tslib";
import * as fs from 'fs';
import { sync as mkdirp } from 'mkdirp';
import { stringValue } from 'vega-util';
export const generate = process.env.VL_GENERATE_TESTS;
export const output = 'test-runtime/resources';
export const selectionTypes = ['single', 'multi', 'interval'];
export const compositeTypes = ['repeat', 'facet'];
export const resolutions = ['union', 'intersect'];
export const bound = 'bound';
export const unbound = 'unbound';
export const tuples = [
    { a: 0, b: 28, c: 0 },
    { a: 0, b: 55, c: 1 },
    { a: 0, b: 23, c: 2 },
    { a: 1, b: 43, c: 0 },
    { a: 1, b: 91, c: 1 },
    { a: 1, b: 54, c: 2 },
    { a: 2, b: 81, c: 0 },
    { a: 2, b: 53, c: 1 },
    { a: 2, b: 76, c: 2 },
    { a: 3, b: 19, c: 0 },
    { a: 3, b: 87, c: 1 },
    { a: 3, b: 12, c: 2 },
    { a: 4, b: 52, c: 0 },
    { a: 4, b: 48, c: 1 },
    { a: 4, b: 35, c: 2 },
    { a: 5, b: 24, c: 0 },
    { a: 5, b: 49, c: 1 },
    { a: 5, b: 48, c: 2 },
    { a: 6, b: 87, c: 0 },
    { a: 6, b: 66, c: 1 },
    { a: 6, b: 23, c: 2 },
    { a: 7, b: 17, c: 0 },
    { a: 7, b: 27, c: 1 },
    { a: 7, b: 39, c: 2 },
    { a: 8, b: 68, c: 0 },
    { a: 8, b: 16, c: 1 },
    { a: 8, b: 67, c: 2 },
    { a: 9, b: 49, c: 0 },
    { a: 9, b: 15, c: 1 },
    { a: 9, b: 48, c: 2 }
];
const unitNames = {
    repeat: ['child_d', 'child_e', 'child_f'],
    facet: ['child_0', 'child_1', 'child_2']
};
export const hits = {
    discrete: {
        qq: [8, 19],
        qq_clear: [5, 16],
        bins: [4, 29],
        bins_clear: [18, 7],
        repeat: [5, 10, 17],
        repeat_clear: [13, 14, 2],
        facet: [2, 6, 9],
        facet_clear: [3, 4, 8]
    },
    interval: {
        drag: [[5, 14], [18, 26]],
        drag_clear: [[5], [16]],
        translate: [[6, 16], [24, 8]],
        bins: [[4, 8], [2, 7]],
        bins_clear: [[5], [9]],
        bins_translate: [[5, 7], [1, 8]],
        repeat: [[8, 29], [11, 26], [7, 21]],
        repeat_clear: [[8], [11], [17]],
        facet: [[1, 9], [2, 8], [4, 10]],
        facet_clear: [[3], [5], [7]]
    }
};
function base(iter, sel, opts = {}) {
    const data = { values: opts.values || tuples };
    const x = Object.assign({ field: 'a', type: 'quantitative' }, opts.x);
    const y = Object.assign({ field: 'b', type: 'quantitative' }, opts.y);
    const color = Object.assign({ field: 'c', type: 'nominal' }, opts.color);
    const size = Object.assign({ value: 100 }, opts.size);
    const selection = { sel };
    const mark = 'circle';
    if (iter % 2 === 0) {
        return {
            data,
            selection,
            mark,
            encoding: {
                x,
                y,
                size,
                color: {
                    condition: Object.assign({ selection: 'sel' }, color),
                    value: 'grey'
                }
            }
        };
    }
    else {
        return {
            data,
            layer: [
                {
                    selection,
                    mark,
                    encoding: {
                        x,
                        y,
                        size,
                        color,
                        opacity: { value: 0.25 }
                    }
                },
                {
                    transform: [{ filter: { selection: 'sel' } }],
                    mark,
                    encoding: { x, y, size, color }
                }
            ]
        };
    }
}
export function spec(compose, iter, sel, opts = {}) {
    const _a = base(iter, sel, opts), { data } = _a, specification = tslib_1.__rest(_a, ["data"]);
    const resolve = opts.resolve;
    const config = { scale: { rangeStep: 21 } }; // A lot of magic number in this file uses the old rangeStep = 21
    switch (compose) {
        case 'unit':
            return Object.assign({ data }, specification, { config });
        case 'facet':
            return {
                data,
                facet: { row: { field: 'c', type: 'nominal' } },
                spec: specification,
                resolve,
                config
            };
        case 'repeat':
            return {
                data,
                repeat: { row: ['d', 'e', 'f'] },
                spec: specification,
                resolve,
                config
            };
    }
    return null;
}
export function unitNameRegex(specType, idx) {
    const name = unitNames[specType][idx].replace('child_', '');
    return new RegExp(`child(.*?)_${name}`);
}
export function parentSelector(compositeType, index) {
    return compositeType === 'facet' ? `cell > g:nth-child(${index + 1})` : unitNames.repeat[index] + '_group';
}
export function brush(key, idx, parent, targetBrush) {
    const fn = key.match('_clear') ? 'clear' : 'brush';
    return `return ${fn}(${hits.interval[key][idx].join(', ')}, ${stringValue(parent)}, ${!!targetBrush})`;
}
export function pt(key, idx, parent) {
    const fn = key.match('_clear') ? 'clear' : 'pt';
    return `return ${fn}(${hits.discrete[key][idx]}, ${stringValue(parent)})`;
}
export function embedFn(browser) {
    return (specification) => {
        browser.execute(_ => window['embed'](_), specification);
    };
}
export function svg(browser, path, filename) {
    const xml = browser.executeAsync(done => {
        window['view'].runAfter((view) => view.toSVG().then((_) => done(_)));
    });
    if (generate) {
        mkdirp((path = `${output}/${path}`));
        fs.writeFileSync(`${path}/${filename}.svg`, xml.value);
    }
    return xml.value;
}
export function testRenderFn(browser, path) {
    return (filename) => {
        // const render =
        svg(browser, path, filename);
        // const file = fs.readFileSync(`${output}/${path}/${filename}.svg`);
        // expect(render).toEqual(file);
    };
}
//# sourceMappingURL=util.js.map