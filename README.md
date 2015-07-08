# hapi-radius  [![Build Status](https://travis-ci.org/iostat42/hapi-radius.svg?branch=master)](https://travis-ci.org/iostat42/hapi-radius)

[![Join the chat at https://gitter.im/iostat42/hapi-radius](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/iostat42/hapi-radius?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Hapi radius plugin.

This plugin is in the very early stages of development.  Pleast note that a working radius server is required in order for the tests to pass.  I will remedy this as soon as possible.


## Install
```bash
git clone https://github.com/iostat42/hapi-radius.git
```

## Usage


#### Basic Plugin Config:
```bash
{
    register: require('../..'),
    options: {
        ipAddress: '192.168.1.10',
        secret: 'mySharedSecret',
        options: {
            host: [ 'radiusA', 'radiusB' ], // accepts single or array of hosts
            port: 1812
        }
    }
}
```

#### Override testing default config:

##### Create test/artifacts/config.js

```bash
var config = {};

// Radius

config.radius = {
    ipAddress: '192.168.1.10',
    secret: 'mySharedSecret',
    options: {
        host: [ 'radiusA', 'radiusB' ], // accepts single or array of hosts
    }
};

// Config options for tests

config.app = {
    name: 'hapi-radius'
};

// Plugins to register

config.plugins = [
  {
    register: require('../..'),
    options: config.radius
  }
];

config.pluginOptions = {};


// User

config.user = {
    userName: 'user1',
    password: 'password'
};


module.exports = config;
```


#### Run Tests:

```bash
$ npm test
```



## License

MIT
