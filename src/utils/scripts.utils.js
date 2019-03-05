const vscode = require('vscode');
const lodashFP = require('lodash/fp');

const CONFIG_FLAG = '--config';

const getWebpackScripts = (scripts) => {
  return lodashFP.filter(script => script.includes('webpack'), scripts);
}

const getConfigsFromScripts = (scripts) => {
  return lodashFP.flow([
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
    }),
    lodashFP.uniq,
    lodashFP.compact
  ])(scripts);
}

module.exports = {
  getWebpackScripts,
  getConfigsFromScripts
};
