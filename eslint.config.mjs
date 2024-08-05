import globals from "globals";
import babelParser from "@babel/eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

// const GLOBALS_BROWSER_FIX = Object.assign({}, globals.browser, {
//     AudioWorkletGlobalScope: globals.browser['AudioWorkletGlobalScope ']
// });
// delete GLOBALS_BROWSER_FIX['AudioWorkletGlobalScope '];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["output/*.js"],
}, ...compat.extends("standard"), {
    languageOptions: {
        globals: {
            //...GLOBALS_BROWSER_FIX,
            ...globals.browser,
            ...globals.greasemonkey,
            Atomics: "readonly",
            SharedArrayBuffer: "readonly",
        },

        parser: babelParser,
        ecmaVersion: 11,
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                shippedProposals: true,
                classStaticBlock: true,
            },

            requireConfigFile: "false",
            babelOptions: {},
        },
    },

    rules: {
        semi: [2, "always"],
        indent: ["error", 4],
        "operator-linebreak": ["error", "before"],
    },
}];