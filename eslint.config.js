import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
];
const OFF = 0;
// const WARN = 1;
const ERROR = 2;

export const config = {
	parser: '@typescript-eslint/parser',
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	extends: ['standard-with-typescript', 'plugin:react/recommended','plugin:@typescript-eslint/recommended'],
	settings: {
		'react': {
			'version': 'detect', // 自动检测 React 版本
		},
		// 这个配置是用于指定模块导入解析器的配置，主要用于告诉 ESLint 如何解析模块导入语句
		'import/resolver': {
			// node：指定了使用 Node.js 解析模块导入语句的配置。在这里，配置了支持的文件扩展名，包括 .tsx、.ts、.js 和 .json。
			node: {
				extensions: ['.tsx', '.ts', '.js', '.json'],
			},
			// typescript：指定了使用 TypeScript 解析模块导入语句的配置。这个配置为空对象，表示使用默认配置。
			typescript: {},
		},
	},
	overrides: [
		// 检测ts和tsx，注意files要包括文件，否则会报错
		{
			files: ['./src/**/*.ts', './src/**/*.tsx','./package.json'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				sourceType: 'module',
				project: './tsconfig.json', // 指定 TypeScript 配置文件
			},
		},
		// 不检测js文件的类型, 有ignorePatterns就不需要了
		{
			extends: ['plugin:@typescript-eslint/disable-type-checked'],
			files: ['./**/*.js'],
		},
	],
	plugins: ['react','@typescript-eslint'],
	rules: {
		// 对象的最后一个可以增加【,】
		'@typescript-eslint/comma-dangle': OFF,
		// 单引号关闭
		'@typescript-eslint/quotes': OFF,
		// 需要分号
		'@typescript-eslint/semi': OFF,
		// 不允许使用var
		'no-var': ERROR,
		// 函数不需要ts标注返回类型
		'@typescript-eslint/explicit-function-return-type': OFF,
		'no-tabs': OFF,
		'@typescript-eslint/indent': OFF,
	},
	// 忽略文件
	ignorePatterns: [
		'/lib/**/*', // Ignore built files.
		'**/*.js',
	],
};