const vscode = require('vscode');
const lodashFP = require('lodash/fp');
const fs = require('fs');
const { join } = require('path');

const uniqAlias = alias => alias.alias;

const getPathDirNames = (path) => {
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

const getAliasPathsFromConfigs = (configs) => {
  return lodashFP.flow([
    lodashFP.map(config => {
      return lodashFP.map.convert({ cap: false })((path, alias) => {
        if (path === 'node_modules') {
          return null;
        }

        return { alias, path };
      }, config.resolve.alias)
    }),
    lodashFP.flatten,
    lodashFP.uniqBy(uniqAlias),
    lodashFP.compact
  ])(configs);
}

const getModulesPathsFromConfigs = (configs) => {
  return lodashFP.flow([
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
  ])(configs);
}

const getSrcPaths = () => {
  const srcPath = join(vscode.workspace.workspaceFolders[0].uri.path, 'src');
  let pathsAndAliases = [];

  if (fs.existsSync(srcPath)) {
    pathsAndAliases = getPathDirNames(srcPath)
  }

  return pathsAndAliases;
}

const getPathsFromConfigs = (configs) => {
  const aliasPaths = getAliasPathsFromConfigs(configs);
  const modulesPaths = getModulesPathsFromConfigs(configs);
  const modulesPathAndAlias = lodashFP.flatten(modulesPaths.map(getPathDirNames));
  const srcPathAndAliases = getSrcPaths();

  let paths = {};

  lodashFP.flow([
    lodashFP.map(alias => {
      paths = lodashFP.set([`${alias.alias}/*`], [`${alias.path}/*`], paths);
    })
  ])(lodashFP.uniqBy(uniqAlias, [...modulesPathAndAlias, ...aliasPaths, ...srcPathAndAliases]));

  return paths;
}

module.exports = {
  getPathsFromConfigs
};
