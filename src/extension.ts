import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('vscode-spring-i18n.create', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selection = editor.selection;
			const text = editor.document.getText(selection);
			if (!selection.isEmpty) {
				const key = await vscode.window.showInputBox({ prompt: 'Enter a key for the property' });
				if (key) {
					const config = vscode.workspace.getConfiguration('spring.i18n');
					const propertiesFilePaths = config.get<string[]>('propertiesFilePaths') || [];

					let filePath;
					if (propertiesFilePaths.length > 0) {
						// Let the user choose a path
						filePath = await vscode.window.showQuickPick(propertiesFilePaths, { placeHolder: 'Select a properties file' });
					} else {
						// Use the default path
						filePath = config.get<string>('defaultPropertiesFilePath') ?? 'src/main/resources/messages.properties';
					}
					if (filePath) {
						const fullFilePath = getFullFilePath(filePath);
						if (!fs.existsSync(fullFilePath)) {
							fs.writeFileSync(fullFilePath, '');
							saveI18nMessage(fullFilePath, key, text);
						} else {
							fs.readFile(fullFilePath, 'utf8', (err, data) => {
								if (err) {
									vscode.window.showErrorMessage(`Failed to read properties file ${fullFilePath}`);
								} else if (data.includes(key)) {
									vscode.window.showErrorMessage(`Key ${key} already exists`);
								} else {
									saveI18nMessage(fullFilePath, key, text);
								}
							});
						}
					}
				}
			}
		}
	});

	context.subscriptions.push(disposable);
}

function getFullFilePath(label: string): string {
	return path.join(
		vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? '',
		label
	);
}

function saveI18nMessage(fullFilePath: string, key: string, text: string) {
	const formattedText = text.split('\r\n').join('\\\r\n');
	const pair = `\n${key} = ${formattedText}`;
	fs.appendFile(fullFilePath, pair, (err) => {
		if (err) {
			vscode.window.showErrorMessage('Failed to save i18n message');
		} else {
			vscode.window.showInformationMessage(`Saved ${pair}`);
			vscode.window.showTextDocument(vscode.Uri.file(fullFilePath));
		}
	});
}