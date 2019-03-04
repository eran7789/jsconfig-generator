const vscode = require('vscode');
const lodashFP = require('lodash/fp');
const fs = require('fs');
const { join } = require('path');

const CONFIG_FLAG = '--config';

function getWebpackScripts(scripts) {
  return lodashFP.filter(script => script.includes('webpack'), scripts);
}

function getConfigsFromScripts(scripts) {
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

function getPathDirNames(path) {
  return fs
    .readdirSync(path)
    .filter(file => 
      fs.statSync(join(path, file)).isDirectory()
    )
    .map(dir => ({
      path: join(path, dir),
      alias: dir
    }));
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('jsconfig.generate', function () {
    const packageJson = require(`${vscode.workspace.workspaceFolders[0].uri.path}/package.json`);

    if (!packageJson) {
      console.log('No package.json found in root folder!');

      return;
    }

    const webpackScripts = getWebpackScripts(packageJson.scripts);
    const configs = getConfigsFromScripts(webpackScripts);
    const aliasPaths = lodashFP.flow([
      lodashFP.map(config => {
        return lodashFP.map.convert({ cap: false })((path, alias) => {
          if (path === 'node_modules') {
            return null;
          }

          return { alias, path };
        }, config.resolve.alias)
      }),
      lodashFP.flatten,
      lodashFP.uniqBy(alias => alias.alias),
      lodashFP.compact
    ])(configs);
    const modulesPaths = lodashFP.flow([
      lodashFP.map(config => {
        return lodashFP.map(module => {
          if (module === 'node_modules') {
            return null;
          }

          return module;
        }, config.resolve.modules)
      }),
      lodashFP.flatten,
      lodashFP.uniq,
      lodashFP.compact
    ])(configs)
    const modulesPathAndAlias = lodashFP.flatten(modulesPaths.map(getPathDirNames));
    let paths = {};

    lodashFP.forEach(alias => {
      paths = lodashFP.set([alias.alias], alias.path, paths);
    }, aliasPaths);
    lodashFP.forEach(alias => {
      paths = lodashFP.set([alias.alias], alias.path, paths);
    }, modulesPathAndAlias);

    const jsconfig = {
      compilerOptions: {
        baseUrl: '.',
        paths
      }
    };

    try {
      const jsconfigPath = join('.', 'jsconfig.json');
      // vscode.writeFile(vscode.Uri.file(jsconfigPath), jsconfig, { 
      //   create: true, 
      //   overwrite: true 
      // });
      // const pathUri = vscode.Uri.file(jsconfigPath);
      // const fsProvider = vscode.FileSystemProvider.writeFile;
      // console.log(fsProvider)

      fs.writeFile(jsconfigPath, jsconfig, error => console.log(error));
    } catch(error) {
      console.log(error);
    }

    // console.log([...aliasPaths, ...modulesPathAndAlias]);

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
