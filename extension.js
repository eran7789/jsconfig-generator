const vscode = require('vscode');
const lodashFP = require('lodash/fp');

const CONFIG_FLAG = '--config';

function getWebpackScripts(scripts) {
  return lodashFP.filter(script => script.includes('webpack'), scripts);
}

function getConfigsFromScripts(scripts) {
  return lodashFP.uniq(
    lodashFP.map(script => {
      if (!script.includes(CONFIG_FLAG)) {
        return require('webpack.config.js');
      }

      const startIndex = script.lastIndexOf(CONFIG_FLAG);
      const fromEndOfConfigToEndString = script.slice(startIndex + CONFIG_FLAG.length); 
      const trimmed = lodashFP.trimStart(fromEndOfConfigToEndString);
      const endIndex = trimmed.indexOf(' ');
      const location = trimmed.slice(0, endIndex === -1 ? trimmed.length : endIndex);

      return require(`${vscode.workspace.workspaceFolders[0].uri.path}/${location}`);
    }, scripts)
  );
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('jsconfig.generate', function () {
    // fs.readFile(`${vscode.workspace.workspaceFolders[0].uri.path}/package.json`, 'utf8', (err, data) => {
    //   if (err) {
    //     return;
    //   }

    //   console.log(data);
    // });

    const packageJson = require(`${vscode.workspace.workspaceFolders[0].uri.path}/package.json`);

    if (!packageJson) {
      console.log('No package.json found in root folder!');

      return;
    }

    const webpackScripts = getWebpackScripts(packageJson.scripts);
    const configs = getConfigsFromScripts(webpackScripts);


    // console.log(vscode.workspace.workspaceFolders[0].uri.path)
		vscode.window.showInformationMessage('hey');
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
