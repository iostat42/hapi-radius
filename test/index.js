// Load modules

var Lab = require('lab');
var Code = require('code');
var Hapi = require('hapi');
var Hoek = require('hoek');
var _ = require('lodash');
var Pkg = require('../package.json');
var MockRadius = require('mock-radius');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.test;
var expect = Code.expect;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var afterEach = lab.afterEach;


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
    catch(e) {
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

var TestConfig = './artifacts/config';


if (internals.moduleExists('./artifacts/config')) {
    TestConfig = require('./artifacts/config');
}
else {
    TestConfig = {};
}


var Config = Hoek.applyToDefaults(
    internals.defaults,
    TestConfig
);


// Tests

describe('Plugin Registration', function () {

    before(function (done) {

        internals.mockradius = new MockRadius();
        internals.mockradius.bind();
        done();
    });


    after(function (done) {

        internals.mockradius.close();
        internals.mockradius = null;
        done();
    });


    it('registers successfully', function (done) {

        var server = internals.server({});

        server.register(Config.plugins, function (err) {

            expect(err).to.not.exist();
            done();
        });
    });


    it('handles register errors', function (done) {

        // create an invalid config to trigger an error
        var server = internals.server({});

        var newPluginConfig = Hoek.clone(Config.plugins);

        delete newPluginConfig[0].options.ipAddress;
        delete newPluginConfig[0].options.secret;
        newPluginConfig[0].options.client = {
            ipAddress: '127.0.0.1',
            secret: 'radiusSuperSecret'
        };

        server.register(newPluginConfig, function (err) {

            expect(err).to.exist();
            done();
        });
    });
});


describe('hapi-radius', function () {

    var server;

    before(function (done) {

        internals.mockradius = new MockRadius();
        internals.mockradius.bind();
        done();
    });


    after(function (done) {

        internals.mockradius.close();
        internals.mockradius = null;
        done();
    });


    beforeEach(function (done) {

        server = new Hapi.Server();

        var newPluginConfig = Hoek.clone(Config.plugins);

        newPluginConfig[0].options.options.host = _.sample(newPluginConfig[0].options.options.host);

        server.register(Config.plugins, function (err) {

            expect(err).to.not.exist();
            done();
        });
    });


    it('validate function is exposed to server', function (done) {

        var validate = server.plugins[internals.pluginName].validate;

        var clientOptions = server.plugins[internals.pluginName].clientOptions;

        expect(validate).to.be.a.function();

        expect(clientOptions).to.be.an.object();

        done();
    });


    it('authenticates a user', function (done) {

        var validate = server.plugins[internals.pluginName].validate;

        validate(Config.user.userName, Config.user.password, function (err, isValid, credentials) {

            expect(err).to.not.exist();
            expect(isValid).to.be.equal(true);
            expect(credentials).to.be.an.object();
            done();
        });

    });


    it('fails to authenticate a user with bad credentials', function (done) {

        var validate = server.plugins[internals.pluginName].validate;

        var user = Hoek.clone(Config.user);

        var userName = user.userName + '44';
        var password = user.password + '44';

        validate(userName, password, function (err, isValid, credentials) {

            expect(err).to.not.exist();
            expect(isValid).to.be.equal(false);
            expect(credentials).to.be.an.object();
            done();
        });
    });
});
