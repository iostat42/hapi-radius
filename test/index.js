'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Hoek = require('hoek');
const _ = require('lodash');
const MockRadius = require('mock-radius');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.experiment;
const it = lab.test;
const expect = Code.expect;
const before = lab.before;
const beforeEach = lab.beforeEach;
const after = lab.after;


// defaults

internals.defaults = {};


internals.defaults.radius = {
    ipAddress: '127.0.0.1',
    secret: 'radiusSuperSecret',
    options: {
        host: ['127.0.0.1'], // accepts single or array of hosts
        port: 1812
    }
};


// user to use for auth testing

internals.defaults.user = {
    userName: 'hulk',
    password: 'smash12345'
};


internals.defaults.plugins = [
    {
        register: require('..'),
        options: internals.defaults.radius
    }
];


internals.defaults.pluginOptions = {};


internals.pluginName = 'hapi-radius';


internals.moduleExists = function (name) {

    try {
        return require.resolve(name);
    }
    catch (e) {
        return false;
    }
};


internals.server = function (options) {

    if (_.isUndefined(options) || _.isNull(options)) {
        options = {};
    }

    return new Hapi.Server(options);
};


// merge test config with defaults

let TestConfig = './artifacts/config';


if (internals.moduleExists('./artifacts/config')) {
    TestConfig = require('./artifacts/config');
}
else {
    TestConfig = {};
}


const Config = Hoek.applyToDefaults(
    internals.defaults,
    TestConfig
);


// Tests

describe('Plugin Registration', () => {

    before((done) => {

        internals.mockradius = new MockRadius();
        internals.mockradius.bind();
        done();
    });


    after((done) => {

        internals.mockradius.close();
        internals.mockradius = null;
        done();
    });


    it('registers successfully', (done) => {

        const server = internals.server({});

        server.register(Config.plugins, (err) => {

            expect(err).to.not.exist();
            done();
        });
    });


    it('handles register errors', (done) => {

        // create an invalid config to trigger an error
        const server = internals.server({});

        const newPluginConfig = Hoek.clone(Config.plugins);

        delete newPluginConfig[0].options.ipAddress;
        delete newPluginConfig[0].options.secret;
        newPluginConfig[0].options.client = {
            ipAddress: '127.0.0.1',
            secret: 'radiusSuperSecret'
        };

        server.register(newPluginConfig, (err) => {

            expect(err).to.exist();
            done();
        });
    });
});


describe('hapi-radius', () => {

    let server;

    before((done) => {

        internals.mockradius = new MockRadius();
        internals.mockradius.bind();
        done();
    });


    after((done) => {

        internals.mockradius.close();
        internals.mockradius = null;
        done();
    });


    beforeEach((done) => {

        server = new Hapi.Server();

        const newPluginConfig = Hoek.clone(Config.plugins);

        newPluginConfig[0].options.options.host = _.sample(newPluginConfig[0].options.options.host);

        server.register(Config.plugins, (err) => {

            expect(err).to.not.exist();
            done();
        });
    });


    it('validate function is exposed to server', (done) => {

        const validate = server.plugins[internals.pluginName].validate;

        const clientOptions = server.plugins[internals.pluginName].clientOptions;

        expect(validate).to.be.a.function();

        expect(clientOptions).to.be.an.object();

        done();
    });


    it('authenticates a user', (done) => {

        const validate = server.plugins[internals.pluginName].validate;

        validate(Config.user.userName, Config.user.password, (err, isValid, credentials) => {

            expect(err).to.not.exist();
            expect(isValid).to.be.equal(true);
            expect(credentials).to.be.an.object();
            done();
        });

    });


    it('fails to authenticate a user with bad credentials', (done) => {

        const validate = server.plugins[internals.pluginName].validate;

        const user = Hoek.clone(Config.user);

        const userName = user.userName + '44';
        const password = user.password + '44';

        validate(userName, password, (err, isValid, credentials) => {

            expect(err).to.not.exist();
            expect(isValid).to.be.equal(false);
            expect(credentials).to.be.an.object();
            done();
        });
    });
});
