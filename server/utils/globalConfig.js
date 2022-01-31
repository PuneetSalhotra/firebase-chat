/* 
 * author: V Nani Kalyan
 */

mode = process.env.NODE_ENV;
// mode = "local";
config = {};

if (mode === 'local') {
    config.redisConfig = {
        "auth": "",
        "host": "10.0.1.226",
        "name": "staging server",
        "port": 6379,
        "ssh_host": "10.0.0.11",
        "ssh_password": "vVg\"3XM{",
        "ssh_user": "nanikalyan",
        "timeout_connect": 60000,
        "timeout_execute": 60000
    };
    config.efsPath = "/apistaging-data/";
    config.globalConfigKey = "global_config_local";
}

if (mode === 'staging') {
    config.redisIp = '10.0.1.226';
    config.redisPort = 6379;
    config.efsPath = "/apistaging-data/";
    config.globalConfigKey = "global_config_new";
}

if (mode === 'preprod') {
    config.efsPath = "/data/";
    config.redisIp = 'cache-preprod.7otgcu.0001.aps1.cache.amazonaws.com';
    config.redisPort = 6379;
    config.globalConfigKey = "global_config_new";
}

if(mode === 'prod') {
    config.redisIp = 'cache-production.7otgcu.ng.0001.aps1.cache.amazonaws.com';
    config.redisPort = 6379;
    config.efsPath = "/api-data/";
    config.globalConfigKey = "global_config";
}