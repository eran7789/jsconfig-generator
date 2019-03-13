const vscode = require('vscode');
const { filter, flow, map, trimStart, uniq, compact } = require('lodash/fp');
const { join } = require('path');

const CONFIG_FLAG = '--config';

const getWebpackScripts = (scripts) => {
  return filter(script => script.includes('webpack'), scripts);
}

const getConfigsFromScripts = (scripts) => {
  try {
    return flow([
      map(script => {
        if (!script.includes(CONFIG_FLAG)) {
          return require(join(vscode.workspace.workspaceFolders[0].uri.path, 'webpack.config.js'));
        }

        const startIndex = script.lastIndexOf(CONFIG_FLAG);
        const fromEndOfConfigToEndString = script.slice(startIndex + CONFIG_FLAG.length); 
        const trimmed = trimStart(fromEndOfConfigToEndString);
        const endIndex = trimmed.indexOf(' ');
        const location = trimmed.slice(0, endIndex === -1 ? trimmed.length : endIndex);

        return require(`${vscode.workspace.workspaceFolders[0].uri.path}/${location}`);
      }),
      uniq,
      compact
    ])(scripts);
  } catch(error) {
    console.log(error);

    vscode.window.showErrorMessage('Could not read webpack configs.');

    throw error;
  }
}

module.exports = {
  getWebpackScripts,
  getConfigsFromScripts
};
