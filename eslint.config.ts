import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";
import vue from "eslint-plugin-vue";
import eslint from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";
// @ts-expect-error 次のアプデを待つ
import _import from "eslint-plugin-import";
import parser from "vue-eslint-parser";
import gitignore from "eslint-config-flat-gitignore";

export default defineConfigWithVueTs(
  vue.configs["flat/essential"],
  vueTsConfigs.recommended,
  eslint.configs.recommended,
  typescriptEslint.configs.recommendedTypeChecked,
  prettier,
  gitignore(),
  {
    plugins: {
      import: _import,
    },
    languageOptions: {
      parser: parser,
      ecmaVersion: 5,
      sourceType: "script",

      parserOptions: {
        parser: "@typescript-eslint/parser",
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-misused-promises": "off",

      "no-undef": "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],

      "no-control-regex": "off",
      "import/order": "error",
    },
  }
);
