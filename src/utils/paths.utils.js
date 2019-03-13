const vscode = require('vscode');
const fs = require('fs');
const { flow, map, flatten, uniqBy, compact, get, uniq, set } = require('lodash/fp');
const { join } = require('path');

const uniqAlias = alias => alias.alias;

const getPathDirNames = (path, callback) => {
  fs.readdir(path, (error, files) => {
    if (error) {
      callback(error);

      return;
    }

    const dirNames = files.filter(file => 
      fs.statSync(join(path, file)).isDirectory()
    )
    .map(dir => ({
      path: join(path, dir),
      alias: dir
    }));

    callback(error, dirNames);
  });
}

const getAliasPathsFromConfigs = (configs) => {
  return flow([
    map(config => {
      return map.convert({ cap: false })((path, alias) => {
        if (path === 'node_modules') {
          return null;
        }

        return { alias, path };
      }, get('resolve.alias', config))
    }),
    flatten,
    uniqBy(uniqAlias),
    compact
  ])(configs);
}

const getModulesPathsFromConfigs = (configs) => {
  return flow([
    map(config => {
      return map(module => {
        if (module === 'node_modules') {
          return null;
        }

        return module;
      }, get('resolve.modules', config))
    }),
    flatten,
    uniq,
    compact
  ])(configs);
}

const getSrcPaths = (callback) => {
  const srcPath = join(vscode.workspace.workspaceFolders[0].uri.path, 'src')

  if (fs.existsSync(srcPath)) {
    getPathDirNames(srcPath, (error, pathsAndAliases) => {
      callback(error, pathsAndAliases);
    });

    return;
  }

  callback(null, []);
}

const isArrAllTrue = (arr) => compact(arr).length === arr.length;

const getModulesPathsAndAliases = (modulesPaths, callback) => {
  let modulesPathAndAlias = [];
  let successArr = modulesPaths.map(() => false);

  modulesPaths.forEach((modulePath, index) => {
    getPathDirNames(modulePath, (error, dirNames) => {
      if (error) {
        callback(error);

        return;
      }
  
      modulesPathAndAlias = [...modulesPathAndAlias, ...dirNames];
      successArr[index] = true;
      
      if (isArrAllTrue(successArr)) {
        callback(error, modulesPathAndAlias);
      }
    });
  });
}

const getPathsFromConfigs = (configs, callback) => {
  const aliasPaths = getAliasPathsFromConfigs(configs);
  const modulesPaths = getModulesPathsFromConfigs(configs);

  getModulesPathsAndAliases(modulesPaths, (error, modulesPathAndAlias) => {
    if (error) {
      callback(error);

      return;
    }

    getSrcPaths((error, srcPathAndAliases) => {
      if (error) {
        callback(error);

        return;
      }

      let paths = {};

      flow([
        map(alias => {
          paths = set([`${alias.alias}/*`], [`${alias.path}/*`], paths);
        })
      ])(uniqBy(uniqAlias, [...modulesPathAndAlias, ...aliasPaths, ...srcPathAndAliases]));

      callback(error, paths);
    });
  });
}

module.exports = {
  getPathsFromConfigs
};
