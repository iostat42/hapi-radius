'use strict';

// Load modules

const _ = require('lodash');
const Joi = require('joi');


// Declare internals

const internals = {};


// Schemas

internals.schemas = {};


internals.schemas.accessRequest = Joi.object().keys({
    code: Joi.string().allow('Access-Request').required(),
    secret: Joi.string().required(),
    identifier: Joi.number().integer().min(0).max(255).default(_.random(0, 255)),
    attributes: Joi.array().required()
});


internals.schemas.clientOptions = Joi.object().keys({
    host: Joi.any().required(),
    port: Joi.number().default(1812),
    timeout: Joi.number().default(2000),
    retries: Joi.number().default(3)
});


// base options for the module
internals.schemas.radiusOptions = Joi.object().keys({
    ipAddress: Joi.string().ip().required(),
    secret: Joi.string().required(),
    identifier: Joi.number().integer().optional(),
    options: internals.schemas.clientOptions
});


module.exports = {
    radiusOptions: internals.schemas.radiusOptions,
    accessRquest: internals.schemas.accessRequest
};
