// Learn more: https://docs.expo.dev/guides/monorepos/ 
const { getDefaultConfig } = require('expo/metro-config'); 
const path = require('path'); 
const projectRoot = __dirname; 
const workspaceRoot = path.resolve(projectRoot, '../..'); 
const config = getDefaultConfig(projectRoot); config.watchFolders = [workspaceRoot]; 
config.resolver.nodeModulesPaths = [ path.resolve(projectRoot, 'node_modules'), path.resolve(workspaceRoot, 'node_modules'), ]; 
const forcedModules = { react: path.resolve(projectRoot, 'node_modules/react'), 'react-native': path.resolve(projectRoot, 'node_modules/react-native'), }; 
config.resolver.resolveRequest = (context, moduleName, platform) => { 
    if (Object.prototype.hasOwnProperty.call(forcedModules, moduleName)) { 
        return { 
            filePath: require.resolve(forcedModules[moduleName]), type: 'sourceFile', 
        }; 
    } 
        return context.resolveRequest(context, moduleName, platform); 
}; 
module.exports = config;