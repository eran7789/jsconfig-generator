const vscode = require('vscode');
const fs = require('fs');
const { join } = require('path');
const { set, merge, getOr, flow } = require('lodash/fp');

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

    flow([
      getWebpackScripts,
      getConfigsFromScripts,
      (configs) => {
        getPathsFromConfigs(configs, (error, paths) => {
          if (error) {
            console.log(error);
            vscode.window.showErrorMessage('Failed reading configurations :(');

            return;
          }

          const jsConfigPath = join(vscode.workspace.workspaceFolders[0].uri.path, 'jsconfig.json');
          let jsConfig = {};

          fs.readFile(jsConfigPath, (error, data) => {
            if (error) {
              jsConfig = {
                compilerOptions: {
                  baseUrl: '.',
                  paths
                },
                exclude: [
                  'node_modules'
                ]
              }
            } else {
              const configPaths = getOr({}, 'compilerOptions.paths', jsConfig);
            
              jsConfig = JSON.parse(data);
              
              const mergedPaths = merge(paths, configPaths);
              
              jsConfig = set(
                'compilerOptions.paths', 
                mergedPaths,
                jsConfig
              );
            }

            fs.writeFile(jsConfigPath, JSON.stringify(jsConfig, null, 2), (error) => {
              if (error) {
                console.log(error);
                vscode.window.showErrorMessage('Could not write file :(');

                return;
              }

              vscode.workspace.openTextDocument(jsConfigPath)
                .then(doc => {
                  if (!doc) {
                    vscode.window.showErrorMessage('Could not open jsconfig.json, Please open manually');
                  }

                  vscode.window.showTextDocument(doc)
                });
            });
          });
        });
      }
    ])(packageJson.scripts);

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
