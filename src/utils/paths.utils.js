const lodashFP = require('lodash/fp');
const fs = require('fs');
const { join } = require('path');

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
    lodashFP.uniqBy(alias => alias.alias),
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

const getPathsFromConfigs = (configs) => {
  const aliasPaths = getAliasPathsFromConfigs(configs);
  const modulesPaths = getModulesPathsFromConfigs(configs);
  const modulesPathAndAlias = lodashFP.flatten(modulesPaths.map(getPathDirNames));
  let paths = {};

  lodashFP.forEach(alias => {
    paths = lodashFP.set([alias.alias], alias.path, paths);
  }, aliasPaths);
  lodashFP.forEach(alias => {
    paths = lodashFP.set([alias.alias], alias.path, paths);
  }, modulesPathAndAlias);

  return paths;
}

module.exports = {
  getPathsFromConfigs
};
