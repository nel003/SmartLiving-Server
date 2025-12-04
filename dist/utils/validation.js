"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWebSocketMessage = exports.validate = exports.validationSchemas = void 0;
const joi_1 = __importDefault(require("joi"));
const logger_1 = __importDefault(require("./logger"));
// Common validation patterns
const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    macAddress: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
    hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    devicePin: /^[0-9]+$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
};
// Validation schemas
exports.validationSchemas = {
    // User authentication
    signup: joi_1.default.object({
        username: joi_1.default.string()
            .alphanum()
            .min(3)
            .max(30)
            .required()
            .messages({
            'string.alphanum': 'Username must contain only alphanumeric characters',
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username cannot exceed 30 characters',
            'any.required': 'Username is required'
        }),
        email: joi_1.default.string()
            .email()
            .required()
            .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        password: joi_1.default.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
            .required()
            .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': 'Password must contain uppercase, lowercase, numbers and special characters',
            'any.required': 'Password is required'
        }),
        confirmPassword: joi_1.default.string()
            .valid(joi_1.default.ref('password'))
            .required()
            .messages({
            'any.only': 'Passwords do not match',
            'any.required': 'Password confirmation is required'
        })
    }),
    login: joi_1.default.object({
        usernameOrEmail: joi_1.default.string()
            .min(1)
            .required()
            .messages({
            'string.min': 'Username or email is required',
            'any.required': 'Username or email is required'
        }),
        password: joi_1.default.string()
            .min(1)
            .required()
            .messages({
            'string.min': 'Password is required',
            'any.required': 'Password is required'
        })
    }),
    // Device management
    addDevice: joi_1.default.object({
        name: joi_1.default.string()
            .min(1)
            .max(100)
            .required()
            .messages({
            'string.min': 'Device name is required',
            'string.max': 'Device name cannot exceed 100 characters',
            'any.required': 'Device name is required'
        }),
        icon: joi_1.default.string()
            .min(1)
            .max(50)
            .required()
            .messages({
            'string.min': 'Device icon is required',
            'string.max': 'Device icon name cannot exceed 50 characters',
            'any.required': 'Device icon is required'
        }),
        type: joi_1.default.string()
            .valid('ir', 'relay')
            .required()
            .messages({
            'any.only': 'Device type must be one of: ir, relay',
            'any.required': 'Device type is required'
        }),
        device_mac: joi_1.default.string()
            .pattern(patterns.macAddress)
            .required()
            .messages({
            'string.pattern.base': 'Device MAC address must be in valid format (e.g., AA:BB:CC:DD:EE:FF)',
            'any.required': 'Device MAC address is required'
        }),
        pin: joi_1.default.string()
            .pattern(patterns.devicePin)
            .required()
            .messages({
            'string.pattern.base': 'Device pin must be a valid number',
            'any.required': 'Device pin is required'
        })
    }),
    updateDevice: joi_1.default.object({
        name: joi_1.default.string()
            .min(1)
            .max(100)
            .required()
            .messages({
            'string.min': 'Device name is required',
            'string.max': 'Device name cannot exceed 100 characters',
            'any.required': 'Device name is required'
        }),
        icon: joi_1.default.string()
            .min(1)
            .max(50)
            .required()
            .messages({
            'string.min': 'Device icon is required',
            'string.max': 'Device icon name cannot exceed 50 characters',
            'any.required': 'Device icon is required'
        }),
        type: joi_1.default.string()
            .valid('ir', 'relay')
            .required()
            .messages({
            'any.only': 'Device type must be one of: ir, relay',
            'any.required': 'Device type is required'
        }),
        pin: joi_1.default.string()
            .pattern(patterns.devicePin)
            .required()
            .messages({
            'string.pattern.base': 'Device pin must be a valid number',
            'any.required': 'Device pin is required'
        })
    }),
    // User profile update
    updateProfile: joi_1.default.object({
        username: joi_1.default.string()
            .min(3)
            .max(50)
            .pattern(/^[a-zA-Z0-9_]+$/)
            .required()
            .messages({
            'string.min': 'Username must be at least 3 characters',
            'string.max': 'Username cannot exceed 50 characters',
            'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
            'any.required': 'Username is required'
        }),
        email: joi_1.default.string()
            .email()
            .required()
            .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        })
    }),
    // IR Button management
    addIrButton: joi_1.default.object({
        device_id: joi_1.default.number()
            .integer()
            .positive()
            .required()
            .messages({
            'number.base': 'Device ID must be a number',
            'number.integer': 'Device ID must be an integer',
            'number.positive': 'Device ID must be positive',
            'any.required': 'Device ID is required'
        }),
        label: joi_1.default.string()
            .min(1)
            .max(50)
            .required()
            .messages({
            'string.min': 'Button label is required',
            'string.max': 'Button label cannot exceed 50 characters',
            'any.required': 'Button label is required'
        }),
        command: joi_1.default.string()
            .min(1)
            .max(500)
            .required()
            .messages({
            'string.min': 'IR command is required',
            'string.max': 'IR command cannot exceed 500 characters',
            'any.required': 'IR command is required'
        }),
        protocol: joi_1.default.string()
            .valid('NEC', 'RC5', 'RC6', 'Sony', 'Panasonic', 'JVC', 'Samsung', 'LG', 'Sharp', 'Mitsubishi', 'Sanyo', 'Pioneer', 'Denon', 'Onkyo', 'Yamaha', 'Custom')
            .required()
            .messages({
            'any.only': 'Protocol must be one of the supported IR protocols',
            'any.required': 'IR protocol is required'
        }),
        icon: joi_1.default.string()
            .min(1)
            .max(50)
            .required()
            .messages({
            'string.min': 'Button icon is required',
            'string.max': 'Button icon name cannot exceed 50 characters',
            'any.required': 'Button icon is required'
        }),
        color: joi_1.default.string()
            .pattern(patterns.hexColor)
            .required()
            .messages({
            'string.pattern.base': 'Color must be a valid hex color (e.g., #FF0000)',
            'any.required': 'Button color is required'
        })
    }),
    // Push notification token
    pushToken: joi_1.default.object({
        token: joi_1.default.string()
            .min(1)
            .max(500)
            .required()
            .messages({
            'string.min': 'Push token is required',
            'string.max': 'Push token cannot exceed 500 characters',
            'any.required': 'Push token is required'
        })
    }),
    // WebSocket message validation
    wsMessage: joi_1.default.object({
        type: joi_1.default.string()
            .valid('init', 'toogle', 'ir_command', 'motion', 'energy', 'init_res')
            .required()
            .messages({
            'any.only': 'Message type must be one of: init, toogle, ir_command, motion, energy',
            'any.required': 'Message type is required'
        }),
        pin: joi_1.default.when('type', {
            is: joi_1.default.string().valid('toogle', 'ir_command'),
            then: joi_1.default.number().integer().positive().required(),
            otherwise: joi_1.default.number().integer().positive().optional()
        }),
        value: joi_1.default.boolean().optional(),
        command: joi_1.default.when('type', {
            is: 'ir_command',
            then: joi_1.default.string().min(1).max(500).required(),
            otherwise: joi_1.default.string().optional()
        }),
        protocol: joi_1.default.when('type', {
            is: 'ir_command',
            then: joi_1.default.string().valid('NEC', 'RC5', 'RC6', 'Sony', 'Panasonic', 'JVC', 'Samsung', 'LG', 'Sharp', 'Mitsubishi', 'Sanyo', 'Pioneer', 'Denon', 'Onkyo', 'Yamaha', 'Custom').required(),
            otherwise: joi_1.default.string().optional()
        }),
        for: joi_1.default.string().min(1).max(100).optional(),
        mac: joi_1.default.string().pattern(patterns.macAddress).optional(),
        device_type: joi_1.default.string().valid('ir', 'relay').optional()
    }),
    // URL parameters
    deviceId: joi_1.default.object({
        device_id: joi_1.default.string()
            .pattern(/^\d+$/)
            .required()
            .messages({
            'string.pattern.base': 'Device ID must be a valid number',
            'any.required': 'Device ID is required'
        })
    }),
    deviceMac: joi_1.default.object({
        device_mac: joi_1.default.string()
            .pattern(patterns.macAddress)
            .required()
            .messages({
            'string.pattern.base': 'Device MAC address must be in valid format',
            'any.required': 'Device MAC address is required'
        })
    }),
    buttonId: joi_1.default.object({
        buttonId: joi_1.default.string()
            .pattern(/^\d+$/)
            .required()
            .messages({
            'string.pattern.base': 'Button ID must be a valid number',
            'any.required': 'Button ID is required'
        })
    })
};
// Validation middleware factory
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const data = source === 'body' ? req.body :
            source === 'params' ? req.params :
                req.query;
        const { error, value } = schema.validate(data, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });
        if (error) {
            const errorDetails = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            logger_1.default.warn('Validation failed', {
                source,
                data,
                errors: errorDetails,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorDetails
            });
        }
        // Replace the original data with validated and sanitized data
        if (source === 'body') {
            req.body = value;
        }
        else if (source === 'params') {
            req.params = value;
        }
        else {
            req.query = value;
        }
        next();
    };
};
exports.validate = validate;
// WebSocket message validation
const validateWebSocketMessage = (message) => {
    const { error, value } = exports.validationSchemas.wsMessage.validate(message, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        return {
            isValid: false,
            error: errorMessage
        };
    }
    return {
        isValid: true,
        data: value
    };
};
exports.validateWebSocketMessage = validateWebSocketMessage;
exports.default = exports.validationSchemas;
