// Load modules

var Hoek = require('hoek');
var Joi = require('joi');
var _ = require('lodash');
var Radius = require('radclient');


// todo:
//  better logging
//  support custom dictionaries via path


// Declare internals

var internals = {};


//  Defaults

internals.defaults = {};


internals.defaults.accessRequest = {
    code: 'Access-Request',
    secret: null,
    identifier: _.random(0, 255)
};


internals.defaults.clientOptions = {
    port: 1812,
    timeout: 2000,
    retries: 3
};

// Access-Request radius response codes
internals.responseCodes = {
    accept: 'Access-Accept',
    reject: 'Access-Reject'
};


// Plugin
// Module interface

exports.register = function (server, options, next) {

    // validate options
    Joi.validate(options, internals.schemas.pluginOptions, function (err, pluginOptions) {

        // register failed
        if (err) {
            return next(err);
        }

        // server - for logging, etc
        internals.server = server;

        // plugin options
        internals.pluginOptions = pluginOptions;

        // expose validate function for use with hapi-auth-basic
        server.expose('validate', internals.validate);

        // expose clientOptions to enable changes during runtime
        server.expose('clientOptions', internals.pluginOptions);

        return next();
    });
};


exports.register.attributes = {
    pkg: require('../package.json')
};


// Hapi Auth
// hapi-auth-basic validate
internals.validate = function (userName, userPassword, callback) {

    // client options
    var clientOptions = internals.createClientOptions(internals.pluginOptions);

    // access-request packet
    // update with user attributes
    var accessRequest = internals.createAccessRequest(userName, userPassword, internals.pluginOptions);

    // authenicate user via radius
    internals.authenticate(accessRequest, clientOptions, function (err, isValid) {

        return callback(err, isValid, { id: userName });
    });
};


internals.createAccessRequest = function (userName, userPassword, options) {

    // radius access-request packet
    var opts = Hoek.clone(options);

    // add userName and userPassword to .attributes
    // move ipAddress to .attributes
    //  attributes: ['NAS-IP-Address', options.client.ipAddress]
    opts.attributes = [
        ['NAS-IP-Address', opts.ipAddress],
        ['User-Name', userName],
        ['User-Password', userPassword]
    ];
    delete opts.ipAddress;

    // remove client options
    delete opts.options;

    // access-request packet
    // merge with access-request defaults
    return Hoek.applyToDefaults(internals.defaults.accessRequest, opts);
};


internals.createClientOptions = function (options) {

    var opts = Hoek.clone(options);

    var hosts = opts.options.host;

    // $lab:coverage:off$

    // convert to an array if not already
    if (!_.isArray(hosts)) {
        hosts = [ hosts ];
    }

    // one radius host for connection
    opts.options.host = _.sample(hosts);

    // $lab:coverage:on$

    return Hoek.applyToDefaults(internals.defaults.clientOptions, opts.options);
};


// Logging

internals.log = function (tags, message) {

    // $lab:coverage:off$

    internals.server.log(tags, message);

    // $lab:coverage:on$
};


// Authenication

internals.authenticate = function (packet, options, callback) {

    Radius(packet, options, function (err, response) {

        // $lab:coverage:off$

        if (err) {

            internals.log(
                ['error', 'auth-radius'],
                err
            );

            return callback(err);
        }

        // $lab:coverage:on$

        var isValid = _.isEqual(internals.responseCodes.accept, response.code);

        // add better logging of radius response later
        // internals.log(
        //     ['log', 'auth-radius', 'response'],
        //     'Response: ' + response + '\nAttributes: ' + response.attributes + '\nisValid: ' + isValid
        // );

        return callback(null, isValid);
    });
};


// Schemas

internals.schemas = {};


internals.schemas.accessRequest = Joi.object().keys({
    code: Joi.string().default(internals.defaults.accessRequest.code),
    secret: Joi.string().required(),
    identifier: Joi.number().integer().min(0).max(255).default(_.random(0, 255)),
    attributes: Joi.array().required()
});


internals.schemas.clientOptions = Joi.object().keys({
    host: Joi.any().required(),
    port: Joi.number().default(internals.defaults.clientOptions.port),
    timeout: Joi.number().default(internals.defaults.clientOptions.timeout),
    retries: Joi.number().default(internals.defaults.clientOptions.retries)

    // todo:  dictionaries
});


internals.schemas.pluginOptions = Joi.object().keys({
    ipAddress: Joi.string().ip().required(),
    secret: Joi.string().required(),
    identifier: Joi.number().integer().optional(),
    options: internals.schemas.clientOptions
});
