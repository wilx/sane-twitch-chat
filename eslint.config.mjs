import globals from "globals";
import js from "@eslint/js";

export default [{
    ignores: ["output/*.js"]
}, js.configs.recommended, {
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.greasemonkey,
            Atomics: "readonly",
            SharedArrayBuffer: "readonly"
        },
        ecmaVersion: "latest",
        sourceType: "module"
    },

    rules: {
        "array-bracket-spacing": ["error", "never"],
        "arrow-spacing": ["error", { before: true, after: true }],
        "comma-dangle": ["error", "never"],
        "comma-spacing": ["error", { before: false, after: true }],
        "dot-location": ["error", "property"],
        indent: ["error", 4],
        "key-spacing": ["error", { beforeColon: false, afterColon: true }],
        "keyword-spacing": ["error", { before: true, after: true }],
        "no-multi-spaces": "error",
        "no-trailing-spaces": "error",
        "operator-linebreak": ["error", "before"],
        "object-curly-spacing": ["error", "always"],
        "space-before-blocks": ["error", "always"],
        "space-in-parens": ["error", "never"],
        "space-infix-ops": "error",
        "space-unary-ops": ["error", { words: true, nonwords: false }],
        semi: [2, "always"]
    }
}];
