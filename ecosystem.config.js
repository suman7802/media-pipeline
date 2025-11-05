/* eslint-disable no-undef */
module.exports = {
    apps: [
        {
            name: 'media-pipeline',
            instances: 'max',
            exec_mode: 'cluster',
            script: './build/server.js',
            env: {
                NODE_ENV: 'development',
                PORT: 8080,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 8080,
            },
        },
    ],
};
