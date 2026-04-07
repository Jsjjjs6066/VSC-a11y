import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/test/**/*.test.js',
	workspaceFolder: '.',
	useInstallation: {
		fromPath: 'C:\\Users\\filip\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
	},
});
