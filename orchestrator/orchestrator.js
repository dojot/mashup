/* jshint node: true */
"use strict";

var translator = require('./translator'),
    config = require('./config.js'),
    request = require('request'),
    util = require('util');

var orchestratorDb;

/**
 * Generates a random ID.
 * @returns A random ID formatted as hexadecimal string.
 */
function generatedFlowId() {
  const UINT32_MAX = 4294967295;
  return (1 + Math.random()*UINT32_MAX).toString(16);
}

/**
 * Callback function to HTTP requests
 * @param {Object} error Error object indicating any problem with the HTTP request
 * @param {Object} response The response to the HTTP request.
 * @param {Object} body The response content of this HTTP request.
 */
function simpleHttpCallback(error, response, body) {
  if (error) {
    console.log("Error with HTTP request: " + error);
  }
}

/**
 * Callback executed after creating a new subscription in Orion
 *
 * The main purpose of this callback is to invoke translator again so that it can
 * create a new Perseo rule - this time including the subscription ID just created.
 *
 * The subscription used in this function is from Orion v2 API.
 *
 * @param {Object} fiwareHeaders The Fiware headers used in this flow (Fiware-Service and Fiware-ServicePath)
 * @param {Integer} flowId The flow ID being created
 * @param {Object} originalRequest The original request containing internal translator data.
 * @param {String} type Subscription type, also got from the translator
 * @param {Object} error Error object indicating any problem with the HTTP request used to create this subscription
 * @param {Object} response The response to the subscription creation.
 * @param {Object} body The response content of this subscription creation.
 */
function orionSubscriptionCallbackV2(fiwareHeaders, flowId, originalRequest, subscriptionOrder, error, response, body) {

  console.log('Starting Orion subscription callback (V2).');
  console.log('Results are: error: ' + error + ', status code is ' + response.statusCode);

  if (!error && response.statusCode == 201) {
    let location = response.headers.location;
    var indexId = location.lastIndexOf('/');
    let subscriptionId = location.slice(indexId + 1);
    let filter = {service: fiwareHeaders['Fiware-Service'], id: flowId};

    console.log('Generating Perseo rules...');

    let perseoRequest = translator.generatePerseoRequest(subscriptionId, subscriptionOrder, originalRequest);

    console.log('Subscription ID is: ' + subscriptionId, ' subscription order is ' + subscriptionOrder);
    // Once this subscription is created, let's create all rules with this subscriptionId
    if (perseoRequest != undefined) {
      console.log('Perseo rules were generated.');
      console.log('Rules: ');
      console.log(util.inspect(perseoRequest, {showHidden: false, depth: null}));
      console.log('Sending Perseo rules creation request...');
      request.post({url: config.perseo_fe.url + '/rules', json: perseoRequest, headers: fiwareHeaders}, simpleHttpCallback);
      console.log('Perseo rules creation request were sent.');
    }

    console.log('Updating database with new subscription ID and Perseo rules...');
    // Update database including new subscription ID and new Perseo rule ID (yet to be created)
    let updateOperation =  { $push: {"orionSubscriptionsV2": subscriptionId, "perseoRules": originalRequest.name} };
    orchestratorDb.findOneAndUpdate(filter, updateOperation, {new: true}, function (err,doc) {
      if (err) {
        console.log('Database was not updated: ' + err);
        throw err;
      }
      console.log('Database was updated.');
    });
  } else {
    if (error) {
      console.log(error);
    }
  }
}

/**
 * Create all Orion subscriptions
 * @param {Object} orionSubscriptions
 * @param {String} endpoint
 * @param {Function} orionSubscriptionCallback
 */
function createOrionSubscription(fiwareHeaders, flowId, orionSubscriptions, endpoint, orionSubscriptionCallback) {
  for (let i = 0; i < orionSubscriptions.length; i++) {
    let subscriptionOrder = orionSubscriptions[i].subscriptionOrder;
    console.log('Creating subscription order: ' + subscriptionOrder);
    console.log('Request pattern is ' + util.inspect(orionSubscriptions[i].originalRequest.pattern))
    request.post({ url: config.orion.url + endpoint, json: orionSubscriptions[i].subscription, headers: fiwareHeaders},
      function(error, response, body) {
        orionSubscriptionCallback(fiwareHeaders, flowId, orionSubscriptions[i].originalRequest, subscriptionOrder, error, response, body);
      }
    );
  }
}

/**
 * Add a new flow into the system.
 *
 * This method will invoke mashup translation and sends all requests
 * to create Orion subscription and devices, and Perseo rules.
 *
 * fiwareHeaders attributes:
 *  - 'Fiware-Service'
 *  - 'Fiware-ServicePath'
 *
 * flowData attributes:
 *  - id: flow ID (optional)
 *  - flow: flow description (mandatory)
 *
 * callback parameters:
 *  - err: error object describing eventual problems (check documentation for
 * 'collection.insertOne' from MongoDb)
 *
 * @param {Object} fiwareHeaders An object containing the Fiware service headers
 * @param {Object} flowData The flow description.
 * @param {Function} callback Callback to be executed when this function finishes.
 */
function addFlow(fiwareHeaders, flowData, callback) {

  // If there is no ID in this flow, then create one.
  if ((!('id' in flowData)) || (flowData.id.length == 0)) {
    flowData.id = generatedFlowId();
  }

  // If this flow has no 'enabled' attribute, then create one.
  if (!('enabled' in flowData)) {
    flowData.enabled = true;
  }

  flowData.created = Date.now();
  flowData.updated = flowData.created;
  flowData.service = fiwareHeaders['Fiware-Service'];
  flowData.servicePath = fiwareHeaders['Fiware-ServicePath'];

  // Store perseo data so that the rules can be properly removed in the future
  flowData.perseoRules = [];

  console.log('Translating mashup descriptioooooooooooooooooooooooooon...');
  // Translate flow to perseo and/or orion
  let flowRequests = translator.translateMashup(flowData.flow);
  console.log('Mashup description translated.');
  console.log('Results: ' + util.inspect(flowRequests, {showHidden: false, depth: null}));

  createOrionSubscription(fiwareHeaders, flowData.id, flowRequests, '/v2/subscriptions', orionSubscriptionCallbackV2);
  console.log('Orion subscriptions requests were sent.');

  console.log('Updating database...');
  orchestratorDb.insertOne(flowData, function(err, result) {
    callback(err);
    console.log('Database updated. Returned code: ' + result);
    return;
  });
}


/**
 * Remove a flow from the system.
 *
 * This function will remove any related information for a flow
 * in the system, including Orion subscriptions and Perseo
 * rules.
 *
 * fiwareHeaders attributes:
 *  - 'Fiware-Service'
 *  - 'Fiware-ServicePath'
 *
 * callback parameters:
 *  - err: error object describing eventual problems (check documentation for
 * 'collection.insertOne' from MongoDb)
 *  - nRemoved: number of flows removed from the system.
 *
 * @param {Object} fiwareHeaders An object containing the Fiware service headers
 * @param {String} flowid The flow ID to be removed
 * @param {Function} callback Callback to be executed when this function finishes.
 */
function deleteFlow(fiwareHeaders, flowid, callback) {
  orchestratorDb.findOne({id: flowid, service: fiwareHeaders['Fiware-Service']}, function(err, flowData) {
    if (err) {
      // An error ocurred
      callback(err, 0);
      return;
    }

    if (flowData != null) {
      // Remove all perseo rules related to this flow
      console.log('Sending Perseo rules removal requests...');
      if ('perseoRules' in flowData) {
        for (var i = 0; i < flowData.perseoRules.length; i++) {
          let fiwareHeaders = {'Fiware-Service' : flowData.service, 'Fiware-ServicePath' : flowData.servicePath};
          console.log('Sending removal request for Perseo rule ' + flowData.perseoRules[i]);
          request.delete({url: config.perseo_fe.url + "/rules/" + flowData.perseoRules[i], headers: fiwareHeaders}, simpleHttpCallback);
        }
      }
      console.log('All Perseo rules removal request were sent.');

      // Remove all subscription in orion - version 2
      console.log('Sending Orion subscriptions removal requests (V2)...');
      if ('orionSubscriptionsV2' in flowData) {
        for (let i = 0; i < flowData.orionSubscriptionsV2.length; i++) {
          let fiwareHeaders = {'Fiware-Service' : flowData.service, 'Fiware-ServicePath' : flowData.servicePath};
          console.log('Sending removal request for Orion subscription (V2) ' + flowData.orionSubscriptionsV2[i]);
          request.delete({url: config.orion.url + '/v2/subscriptions/' + flowData.orionSubscriptionsV2[i], headers: fiwareHeaders}, simpleHttpCallback);
        }
      }
      console.log('All Orion subscription removal requests (V2) were sent.');

      console.log('Updating database...');
      orchestratorDb.remove({id: flowid}, null, function(err, nRemoved) {
        callback(err, nRemoved);
        console.log('Database was updated.');
        return;
      });
    } else {
      // There is no such element in the database.
      callback(null, 0);
      return;
    }
  })
}

/**
 * Set the collection to be used to store data generated by
 * orchestrator.
 * @param {Mongo Collection} db Mongo DB collection to be used
 */
function setDb(db) {
  orchestratorDb = db;
}

// Exports
exports.setDb = setDb;
exports.addFlow = addFlow;
exports.deleteFlow = deleteFlow;
