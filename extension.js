const vscode = require('vscode');
const { join } = require('path');
const fs = require('fs');
const { set, merge, getOr } = require('lodash/fp');

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
    const jsConfigPath = join(vscode.workspace.workspaceFolders[0].uri.path, 'jsconfig.json');
    let jsConfig = {};

    try {
      if (fs.existsSync(jsConfigPath)) {
        const configPaths = getOr({}, 'compilerOptions.paths', jsConfig);
        
        jsConfig = require(jsConfigPath);
        
        const mergedPaths = merge(paths, configPaths);
        
        jsConfig = set(
          'compilerOptions.paths', 
          mergedPaths,
          jsConfig
        );
      } else {
        jsConfig = {
          compilerOptions: {
            baseUrl: '.',
            paths
          },
          exclude: [
            'node_modules'
          ]
        }
      };

      fs.writeFileSync(jsConfigPath, JSON.stringify(jsConfig, null, 2));
      vscode.workspace.openTextDocument(jsConfigPath)
       .then(doc => {
         if (!doc) {
          vscode.window.showErrorMessage('Could not open jsconfig.json, Please open manually');
         }

         vscode.window.showTextDocument(doc)
       });
    } catch (error) {
      console.log(error);

      vscode.window.showErrorMessage('Could not write file :(');
    }

  	context.subscriptions.push(disposable);
  });
};

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
