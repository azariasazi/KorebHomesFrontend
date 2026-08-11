// Learn more: https://docs.expo.dev/guides/monorepos/ 
const { getDefaultConfig } = require('expo/metro-config'); 
const path = require('path'); 
const projectRoot = __dirname; 
const workspaceRoot = path.resolve(projectRoot, '../..'); 
const config = getDefaultConfig(projectRoot); config.watchFolders = [workspaceRoot]; 
config.resolver.nodeModulesPaths = [ path.resolve(projectRoot, 'node_modules'), path.resolve(workspaceRoot, 'node_modules'), ]; 
const forcedReactPath = path.resolve(projectRoot, 'node_modules/react'); 
config.resolver.resolveRequest = (context, moduleName, platform) => { 
    if (moduleName === 'react') { 
        return context.resolveRequest(context, forcedReactPath, platform); 
    } 
    return context.resolveRequest(context, moduleName, platform); 
}; 
module.exports = config;