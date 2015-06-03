// Load modules

var Hoek = require('hoek');
var Joi = require('joi');
var _ = require('lodash');
var radius = require('radclient');


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
    timeout: 2500,
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

    var schemas = internals.schemas;

    // validate options
    var clientOptions = Joi.validate(options, schemas.client);

    Hoek.assert(typeof clientOptions.error !== 'undefined', 'Radius-auth plugin options are invalid', clientOptions);

    // access-request packet
    internals.accessRequest = internals.createAccessRequest(clientOptions.value);

    // radius client options
    internals.clientOptions = internals.createClientOptions(clientOptions.value);

    // Logging
    internals.server = server;

    // expose validate function for use with hapi-auth-basic
    server.expose('validate', internals.validate);

    // expose clientOptions to enable changes during runtime
    server.expose('clientOptions', internals.clientOptions);

    return next();
};


exports.register.attributes = {
    pkg: require('../package.json')
};


// Hapi Auth
// hapi-auth-basic validate
internals.validate = function (userName, userPassword, callback) {

    var userAttributes = {
        attributes: [
            ['User-Name', userName],
            ['User-Password', userPassword]
        ]
    };

    // access-request packet
    // update with user attributes
    internals.accessRequest = Hoek.merge(internals.accessRequest, userAttributes);

    // authenicate user via radius
    internals.authenticate(internals.accessRequest, internals.clientOptions, function (err, isValid) {

        return callback(err, isValid, { id: userName });
    });
};


internals.createAccessRequest = function (options) {

    // radius access-request packet

    var opts = Hoek.clone(options);

    // move ipAddress to .attributes
    //  attributes: ['NAS-IP-Address', options.client.ipAddress]
    opts.attributes = [
        ['NAS-IP-Address', opts.ipAddress]
    ];
    delete opts.ipAddress;

    // remove client options
    delete opts.options;

    // validate access-request
    // access-request packet
    var result = Joi.validate(opts, internals.schemas.accessRequest);

    Hoek.assert(typeof result.error !== 'undefined', 'Radius access-request packet options are invalid', result);

    // merge with access-request defaults
    return Hoek.applyToDefaults(internals.defaults.accessRequest, result.value);
};


internals.createClientOptions = function (options) {

    // radius client options
    var opts = Hoek.clone(options.options);

    // required options:
    // host - string or array or strings
    opts.host = internals.getHost(opts.host);

    var result = Joi.validate(opts, internals.schemas.clientOptions);

    Hoek.assert(typeof result.error !== 'undefined', 'Radius client options are invalid', result);

    // merge with clientOptions defaults
    return Hoek.applyToDefaults(internals.defaults.clientOptions, result.value);
};


internals.getHost = function (hosts) {

    if (!_.isArray(hosts)) {
        hosts = _.toArray(hosts);
    }

    // return one radius host for connection
    return _.sample(hosts);
};


// Logging

internals.log = function (tags, message) {

    internals.server.log(tags, message);
};


// Authenication

internals.authenticate = function (packet, options, callback) {

    radius(packet, options, function (err, response) {

        if (err) {
            internals.log(
                ['error', 'auth-radius'],
                err
            );

            return callback(err);
        }

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
    attributes: Joi.array().items(
        Joi.string().equal('NAS-IP-Address', 'User-Name', 'User-Password').required(),
        Joi.string().required()
    ).required()
});


internals.schemas.clientOptions = Joi.object().keys({
    host: Joi.any().required(),
    port: Joi.number().default(internals.defaults.clientOptions.port),
    timeout: Joi.number().default(internals.defaults.clientOptions.timeout),
    retries: Joi.number().default(internals.defaults.clientOptions.retries)
    // todo:  dictionaries
});


internals.schemas.options = Joi.object().keys({
    host: Joi.any().required(),
    port: Joi.number().optional(),
    timeout: Joi.number().optional(),
    retries: Joi.number().optional()
});


internals.schemas.client = Joi.object().keys({
    ipAddress: Joi.string().ip().required(),
    secret: Joi.string().required(),
    identifier: Joi.number().integer().optional(),
    options: internals.schemas.options.required()
});
