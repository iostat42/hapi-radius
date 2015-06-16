// Load modules

var Lab = require('lab');
var Code = require('code');
var Hapi = require('hapi');
var Hoek = require('hoek');
var _ = require('lodash');
var Config = require('./artifacts/config');
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


// tests todo:

// plugin
// registration success
// registration handles failure


// config
// one host or array
// defaults/minimum options

// radius client
// authentication success
// authentication with bad credentials]

internals.mockradius = new MockRadius();


internals.pluginName = 'hapi-radius';


internals.server = function (options) {

    if (_.isUndefined || _.isNull) {
        options = {};
    }

    return new Hapi.Server(options);
};


internals.register = function (server, options, callback) {

    server.register(Config.plugins, function (err) {

        expect(err).to.not.exist();

        return server;
    });
};


// Tests

describe('Plugin Registration', function () {

    it('registers successfully', function (done) {

        var server = internals.server({});

        server.register(Config.plugins, function (err) {

            expect(err).to.not.exist();
            done();
        });
    });


    it('registers successfully with a single host (non-array)', function (done) {

        var server = internals.server({});

        var newPluginConfig = Hoek.clone(Config.plugins);

        newPluginConfig[0].options.options.host = _.sample(newPluginConfig[0].options.options.host);

        server.register(newPluginConfig, function (err) {

            expect(err).to.not.exist();
            done();
        });
    });
});



describe('hapi-radius', function () {

    var server;


    before(function (done) {

        internals.mockradius.bind();
        done();
    });


    beforeEach(function (done) {

        server = new Hapi.Server();

        server.register(Config.plugins, function (err) {

            expect(err).to.not.exist();
            done();
        });
    });


    it('validate function is exposed to server', function (done) {

        var validate = server.plugins[internals.pluginName].validate;

        expect(validate).to.be.a.function();
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


    it('handles an internal server error', function (done) {

        var validate = server.plugins[internals.pluginName].validate;
        var opts = server.plugins[internals.pluginName].clientOptions;

        // opts.host = '127.0.0.1';
        opts.host = '192.168.1.2';
        opts.timeout = 10;
        opts.retries = 1;

        var user = Hoek.clone(Config.user);

        var userName = user.userName + '44';
        var password = user.password + '44';

        validate(userName, password, function (err, isValid, credentials) {

            expect(err).to.exist();
            done();
        });
    });
});



