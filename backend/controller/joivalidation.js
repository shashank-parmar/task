const Joi = require("joi");

const studSchema = Joi.object({
    profilePicture: Joi.string(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(), 
    mobile: Joi.string().min(10).max(10).required(),
    token: Joi.any(),
});

module.exports={
    studSchema,
}