import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import next from '@next/eslint-plugin-next';
import { fixupConfigRules } from '@eslint/compat';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

export default tseslint.config(
    {
        ignores: [".next/**", "node_modules/**"],
    },
    {
        files: ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"],
        ...eslint.configs.recommended,
        ...importPlugin.flatConfigs.recommended,
        ...fixupConfigRules(compat.extends('plugin:@next/next/recommended')),
        plugins: {
            '@stylistic': stylistic,
            'import': importPlugin,
            '@next': next
        },
        extends: [
            stylistic.configs['all-flat'],
            // next.configs['core-web-vitals'],
        ],

        languageOptions: {
            globals: {
                ...globals.node,
            },

            ecmaVersion: 2020,
            sourceType: "commonjs",
        },

        rules: {
            "import/newline-after-import": ["error"],

            "@stylistic/spaced-comment": ["error", "always"],
            "@stylistic/function-call-spacing": ["error", "never"],
            "@stylistic/padded-blocks": ["error", "never"],
            "@stylistic/object-curly-spacing": ["error", "always"],
            "@stylistic/function-paren-newline": ["off"],
            "@stylistic/function-call-argument-newline": ["off"],
            "@stylistic/object-property-newline": ["off"],
            "@stylistic/space-before-function-paren": ["off"],
            "@stylistic/lines-between-class-members": ["error", "always", { "exceptAfterSingleLine": true }],
            "@stylistic/quote-props": ["error", "as-needed"],
            "@stylistic/array-element-newline": ["off"],
            "@stylistic/multiline-ternary": ["off"],
            "@stylistic/array-bracket-newline": ["off"],
            "@stylistic/implicit-arrow-linebreak": ["off"],
            "@stylistic/no-multi-spaces": ["error", { "ignoreEOLComments": true }],
            "@stylistic/multiline-comment-style": ["off"],
            "@stylistic/dot-location": ["error", "property"],
            "@stylistic/no-extra-parens": ["off"],
            "@stylistic/comma-dangle": ["error", "only-multiline"],
            "@stylistic/eol-last": ["off"],
            "@stylistic/quotes": ["error", "single"],
            "@stylistic/indent": ["error", 4, {
                "SwitchCase": 1,
            }],
            "@stylistic/lines-around-comment": ["error", {
                "beforeBlockComment": true,
                "afterBlockComment": false,
                "beforeLineComment": false,
                "afterLineComment": false,
                "allowBlockStart": true,
                "allowBlockEnd": true,
                "allowObjectStart": true,
                "allowObjectEnd": true,
                "allowArrayStart": true,
                "allowArrayEnd": true,
                "allowClassStart": true,
                "allowClassEnd": true,
            }],

            "global-strict": 0,
            "brace-style": ["error", "1tbs"],
            "no-sparse-arrays": ["warn"],
            eqeqeq: ["error", "always", { "null": "ignore" }],
            "no-else-return": ["error"],
            "no-extra-bind": ["error"],
            curly: ["error", "all"],
            "no-invalid-this": ["error"],
            "no-useless-escape": ["warn"],
            "no-useless-concat": ["warn"],
            "no-useless-constructor": ["warn"],
            "array-bracket-spacing": ["error", "never"],
        },
    },
    {
        files: ["**/*.ts"],
        extends: [
            ...tseslint.configs.strict,
            ...tseslint.configs.stylistic,
        ],
        rules: {
            "@typescript-eslint/no-unused-vars": ["error", {
                "vars": "local",
            }],
            "@typescript-eslint/no-explicit-any": ["warn"],
            "@typescript-eslint/no-inferrable-types": ["error", {
                "ignoreParameters": true
            }],
            "@typescript-eslint/consistent-type-assertions": ["error", {
                "assertionStyle": "as",
                "objectLiteralTypeAssertions": "never"
            }],
            "@typescript-eslint/ban-ts-comment": ["warn"],
            "@typescript-eslint/no-unused-vars": ["warn"],
            "@typescript-eslint/prefer-namespace-keyword": "off",
            "@typescript-eslint/explicit-member-accessibility": "error",
            "@typescript-eslint/no-namespace": "off",
            "@stylistic/type-annotation-spacing": ["error"]
        }
    }
);
