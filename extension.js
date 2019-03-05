const vscode = require('vscode');
const { join } = require('path');

const { 
  getWebpackScripts, 
  getConfigsFromScripts 
} = require('./src/utils/scripts.utils.js');
const { 
  getPathsFromConfigs
} = require('./src/utils/paths.utils');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('jsconfig.generate', function () {
    const packageJsonPath = join(vscode.workspace.workspaceFolders[0].uri.path, 'package.json');
    const packageJson = require(packageJsonPath);

    if (!packageJson) {
      console.log('No package.json found in root folder!');

      return;
    }

    const webpackScripts = getWebpackScripts(packageJson.scripts);
    const configs = getConfigsFromScripts(webpackScripts);
    const paths = getPathsFromConfigs(configs);
    const jsconfig = {
      compilerOptions: {
        baseUrl: '.',
        paths
      }
    };

    vscode.workspace.openTextDocument({ 
      content: JSON.stringify(jsconfig, null, 2), 
      language: 'json' 
    })
    .then(doc => {
      if (!doc) {
        vscode.window.showErrorMessage('Could not create new document');
      }

      vscode.window.showTextDocument(doc);
      vscode.window.showInformationMessage('Jsconfig proposal is ready in!');
    });
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
