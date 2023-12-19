import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('vscode-spring-i18n.create', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selection = editor.selection;
			const text = editor.document.getText(selection);

			const key = await vscode.window.showInputBox({ prompt: 'Enter a key for the i18n pair' });
			if (key) {
				const filePath = await selectPropertiesFile();
				if (filePath) {
					const fullFilePath = getFullFilePath(filePath.label);

					fs.readFile(fullFilePath, 'utf8', (err, data) => {
						if (err) {
							vscode.window.showErrorMessage('Failed to read properties file');
						} else if (data.includes(key)) {
							vscode.window.showErrorMessage('Key already exists');
						} else {
							saveI18nMessage(fullFilePath, key, text);
						}
					});
				}
			}
		}
	});

	context.subscriptions.push(disposable);
}

async function selectPropertiesFile(): Promise<vscode.QuickPickItem | undefined> {
	const config = vscode.workspace.getConfiguration('spring.i18n');
	const propertiesFilePaths = config.get<string[]>('propertiesFilePaths');
	const filePaths: vscode.QuickPickItem[] = propertiesFilePaths ? propertiesFilePaths.map(path => ({ label: path })) : [];
	return vscode.window.showQuickPick(filePaths, { placeHolder: 'Select a properties file' });
}

function getFullFilePath(label: string): string {
	return path.join(
		vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? '',
		label
	);
}

function saveI18nMessage(fullFilePath: string, key: string, text: string) {
	const pair = `\n${key} = ${text}`;
	fs.appendFile(fullFilePath, pair, (err) => {
		if (err) {
			vscode.window.showErrorMessage('Failed to save i18n message');
		} else {
			vscode.window.showInformationMessage('Saved i18n message');
			vscode.window.showTextDocument(vscode.Uri.file(fullFilePath));
		}
	});
}