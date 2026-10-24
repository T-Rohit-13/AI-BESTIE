// INARO — Standardised API Response Helpers
// All controllers use these to enforce the JSON contract documented in API_CONTRACTS.md.

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object} [data]
 */
const sendSuccess = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object} [extras] - Additional fields (e.g. errors array from validation)
 */
const sendError = (res, statusCode, message, extras = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...extras,
  });
};

module.exports = { sendSuccess, sendError };
