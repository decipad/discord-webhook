"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
function executeWebhook(payload, webhookURL) {
    let stringifiedPayload = JSON.stringify(payload);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', webhookURL, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(stringifiedPayload);
}
exports.default = executeWebhook;
