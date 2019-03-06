# jsconfig-generator README

-- experimental at the moment --

Generate a jsconfig.json file based on webpack configs to enable absolute imports code completions.

## Commmads

Genarate jsconfig.json - Will read your webpack definitions and build a jsconfig.json to support absolute imports code completions. If jsconfig.json already exists in workspace root it will be merged and overwritten by the extension. A default for all "./src" dir will also be added.

## Example

![demo](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "jsconfig generator demo")