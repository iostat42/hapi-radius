# hapi-radius

Hapi radius plugin.


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
        client: {
            ipAddress: '192.168.1.10',
            secret: 'mySharedSecret'
        },
        options: {
            host: [ 'radiusA', 'radiusB' ], // accepts single or array of hosts
        }
    }
}
```

#### Testing Config:

##### Create test/artifacts/config.js

```bash
var config = {};

// Radius

config.radius = {
    client: {
        ipAddress: '192.168.1.10',
        secret: 'mySharedSecret'
    },
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
