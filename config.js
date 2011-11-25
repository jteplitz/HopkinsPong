var path = require('path');

var config_local;
if(path.existsSync('config_local.js')) {
    config_local = require('./config_local.js');
}

exports.databaseURL = config_local.databaseURL ? config_local.databaseURL :
    (process.env.databaseURL ? process.env.databaseURL :
    "mongodb://localhost/test");

exports.port = config_local.port ? config_local.port :
    (process.env.port ? process.env.port :
    (process.env.PORT ? process.env.PORT : //For cloud9
    3000));

exports.allowsBinaryModules = typeof config_local.allowsBinaryModules !== 'undefined' ?
    config_local.allowsBinaryModules :
    (process.env.allowsBinaryModules ? process.env.allowsBinaryModules : true);