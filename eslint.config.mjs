import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    {
        ignores: ["node_modules/*", "static/*", "dist/*"],
    },
    ...compat.extends("@redhat-cloud-services/eslint-config-redhat-cloud-services"), {
        languageOptions: {
            globals: {
                insights: "readonly",
            },
        },

        rules: {
            "sort-imports": [
                "error", {ignoreDeclarationSort: true}
            ],

            "rulesdir/forbid-pf-relative-imports": "off",
        },
    },
    ...compat.extends("plugin:@typescript-eslint/recommended").map(config => ({
        ...config,
        files: ["src/**/*.ts", "src/**/*.tsx"],
    })),
    {
        files: ["src/**/*.ts", "src/**/*.tsx"],

        plugins: {
            "@typescript-eslint": typescriptEslint,
        },

        languageOptions: {
            parser: tsParser,
        },

        rules: {
            "react/prop-types": "off",
        },
    }
];
