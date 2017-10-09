/* jshint node: true */
"use strict";

/**
 * TODO Review exceptions. All of them
 */

var express = require('express'),
    MongoClient = require('mongodb').MongoClient,
    bodyParser = require('body-parser'),
    config = require('./config'),
    base64 = require('js-base64').Base64,
    orchestrator = require('./orchestrator.js'),
    util = require('util');

// Orchestrator collection in MongoDB
var orchestratorDb;

/**
 * Extract headers related to Fiware.
 * These headers are:
 *  - Fiware-Service
 *  - Fiware-ServicePath
 * @param {Object} flowHeaders The headers in HTTP request.
 * @returns An object containing 'Fiware-Service' and 'Fiware-ServicePath' attributes
 */
function extractFiwareHeaders(flowHeaders) {
  var flowHeader = {};
  for (var header in flowHeaders) {
    if ('authorization' == header.toLowerCase()) {
      let jwData = JSON.parse(base64.decode(flowHeaders[header].split('.')[1]));
      flowHeader = {
        'Fiware-Service': jwData['service'],
        'Fiware-ServicePath': '/'
      }
      break;
    }
  }
  return flowHeader;
}

/**
 * Retrieve all currently configured flows, including Perseo rules
 * and Orion subscriptions created for these flows.
 *
 * No body is needed for httpRequest. Mandatory headers are:
 *  - Authorization: JWT header with 'service' header set.
 *
 * The response sent back to the caller will contain:
 *  - Code 500: If there was an error while retrieving the flows;
 *  - Code 200: If everything went OK
 *
 * @param {Object} httpRequest The HTTP request
 * @param {*} httpResponse The HTTP response object to be sent back to the
 * requester.
 */
function processGetFlows(httpRequest, httpResponse) {
  var flowHeader = extractFiwareHeaders(httpRequest.headers);
  console.log('Received a GET request for all flows');
  console.log('Flow headers are ' + util.inspect(flowHeader, {showHidden: false, depth: null}));
  orchestratorDb.find({service: flowHeader['Fiware-Service']}, {perseoRules: 0, orionSubscriptionsV2: 0, _id: 0}).toArray(function (err, flows) {
    if (err) {
      console.log('An error occurred: ' + err);
      httpResponse.status(500).send({msg: 'failed to retrieve data'});
    } else {
      console.log('Returning flows: ');
      console.log(util.inspect(flows, {showHidden: false, depth: null}));

      httpResponse.status(200).send(flows);
    }
  })
}


/**
 * Retrieve a particular flow, including Perseo rules
 * and Orion subscriptions created for this flow.
 *
 * The httpRequest object should have an attribute 'params.flowid' that
 * specifies which flow is being retrieved.
 *
 * The response sent back to the caller will contain:
 *  - Code 500: If there was an error while retrieving this flow;
 *  - Code 200: If everything went OK
  *
 * No body is needed for httpRequest. Mandatory headers are:
 *  - Authorization: JWT header with 'service' header set.
 *
 * @param {Object} httpRequest The HTTP request
 * @param {Object} httpResponse The HTTP response object to be sent back to the
 * requester.
 */
function processGetFlow(httpRequest, httpResponse) {
  var flowHeader = extractFiwareHeaders(httpRequest.headers);
  console.log('Received a GET request for flow: ' + httpRequest.params.flowid);
  console.log('Flow headers are ' + util.inspect(flowHeader, {showHidden: false, depth: null}));
  orchestratorDb.findOne({service: flowHeader['Fiware-Service'], id: httpRequest.params.flowid}, {perseoRules: 0, orionSubscriptionsV2: 0}, function(err, flow) {
    if (err) {
      console.log('An error occurred: ' + err);
      httpResponse.status(500).send({msg: 'failed to retrieve data'});
    } else {
      console.log('Returning filtered flow: ');
      console.log(util.inspect(flow, {showHidden: false, depth: null}));




      httpResponse.status(200).send({msg: 'ok', flow: flow});
    }
  })
}

/**
 * Add a new flow into the system.
 *
 * The body should include the flow description. A tutorial on how to build
 * such description can be checked in the documentation of this component.
 *
 * Mandatory headers are:
 *  - Authorization: JWT header with 'service' header set.
 *
 * The response sent back to the caller will contain:
 *  - Code 400: If there is no flow data in the request body;
 *  - Code 500: If there was an error while adding this flow;
 *  - Code 200: If everything went OK
 *
 * @param {Object} httpRequest The HTTP request
 * @param {Object} httpResponse The HTTP response object to be sent back to the
 * requester.
 */
function processPostFlow(httpRequest, httpResponse) {
  let flowData = httpRequest.body;
  var flowHeader = extractFiwareHeaders(httpRequest.headers);
  console.log('Received a POST request');
  console.log('Flow headers are ' + util.inspect(flowHeader, {showHidden: false, depth: null}));

  if (!flowData) {
    console.log('Missing flow data.');
    httpResponse.status(400).send({msg: 'missing flow data'});
    return;
  }

  try {
    orchestrator.addFlow(flowHeader, flowData, function(err) {
      if (err) {
        console.log('An error occurred: ' + err);
        httpResponse.status(500).send({msg: 'failed to insert data'});
        throw err;
      } else {
        console.log('Returning flow: ');
        console.log(util.inspect(flowData, {showHidden: false, depth: null}));
        httpResponse.status(200).send({msg: 'flow created ', flow: flowData});
      }
    });
  } catch (err) {
    console.log('An error occurred: ' + err);
    console.log(util.inspect(err, {showHidden: false, depth: null}));
    httpResponse.status(err.retCode).send({msg: 'error while adding flow', details: err.msg});
  }
}



/**
 * Remove a flow from the system.
 *
 * Mandatory headers are:
 *  - Authorization: JWT header with 'service' header set.
 *
 * The response sent back to the caller will contain:
 *  - Code 404: If the flow is unknown;
 *  - Code 500: If there was an error while removing this flow;
 *  - Code 200: If everything went OK
 *
 * @param {Object} httpRequest The HTTP request
 * @param {Object} httpResponse The HTTP response object to be sent back to the
 * requester.
 */
function processDeleteFlow(httpRequest, httpResponse) {
  var flowHeader = extractFiwareHeaders(httpRequest.headers);
  console.log('Received a DELETE request for flow: ' + httpRequest.params.flowid);
  console.log('Flow headers are ' + util.inspect(flowHeader, {showHidden: false, depth: null}));
  orchestrator.deleteFlow(flowHeader, httpRequest.params.flowid, function(err, nRemoved) {
    if (err) {
      httpResponse.status(500).send({msg: 'failed to remove flow'});
      throw err;
    }
    if (nRemoved === 0) {
      httpResponse.status(404).send({msg: 'given flow is unknown'});
    } else {
      httpResponse.status(200).send({msg: 'flow removed', id: httpRequest.params.flowid});
    }
  })
}

/**
 * Remove a flow from the system.
 *
 * Mandatory headers are:
 *  - Authorization: JWT header with 'service' header set.
 *
 * The response sent back to the caller will contain:
 *  - Code 404: If the flow is unknown;
 *  - Code 500: If there was an error while removing this flow;
 *  - Code 200: If everything went OK
 *
 * @param {Object} httpRequest The HTTP request
 * @param {Object} httpResponse The HTTP response object to be sent back to the
 * requester.
 */
function processDeleteFlows(httpRequest, httpResponse) {
  var flowHeader = extractFiwareHeaders(httpRequest.headers);
  console.log('Received a DELETE request for all flows');
  console.log('Flow headers are ' + util.inspect(flowHeader, {showHidden: false, depth: null}));
  orchestratorDb.find({service: flowHeader['Fiware-Service']}).forEach(function(flowData) {
    orchestrator.deleteFlow(flowHeader, flowData.id, function(err, nRemoved) {
      if (err) {
        httpResponse.status(500).send({msg: 'failed to remove flow'});
        throw err;
      }
      if (nRemoved === 0) {
        httpResponse.status(404).send({msg: 'given flow is unknown'});
      } else {
        httpResponse.status(200).send({msg: 'flow removed', id: httpRequest.params.flowid});
      }
    });
  });
}


/**
 * Substitute a flow in the system.
 *
 * The body should include the new flow description. A tutorial on how to build
 * such description can be checked in the documentation of this component.
 *
 * A flow with the same ID should already exists in the system.
 *
 * Mandatory headers are:
 *  - Authorization: JWT header with 'service' header set.
 *
 * The response sent back to the caller will contain:
 *  - Code 400: If there is no flow data in the request body;
 *  - Code 404: If the specified flow doesn't yet exist in the system;
 *  - Code 500: If there was an error while removing the flow or if there
 *              was an error while adding the new flow. In the latter, the
 *              previous flow won't be re-deployed;
 *  - Code 200: If everything went OK;
 *
 * @param {Object} httpRequest The HTTP request
 * @param {Object} httpResponse The HTTP response object to be sent back to the
 * requester.
 */
function processPutFlow(httpRequest, httpResponse) {
  console.log('Received a PUT request for flow ' + httpRequest.params.flowid);
  console.log('Flow headers are ' + util.inspect(flowHeader, {showHidden: false, depth: null}));
  if (!httpRequest.body) {
    httpResponse.status(400).send({msg: 'missing flow data'});
    return;
  }

  let flowData = httpRequest.body;
  var flowHeader = extractFiwareHeaders(httpRequest.headers);
  let backupFlow;

  let addFlowFunc = function () {
    try {
      orchestrator.addFlow(flowHeader, flowData, function (err) {
        console.log('Flow addition ended.');
        if (err) {
          console.log('Failed to add flow: ' + err);
          httpResponse.status(500).send({ msg: 'failed to insert data' });
          throw err;
        }
        console.log('Flow was updated: ' + flowData);
        httpResponse.status(200).send({ msg: 'flow updated', flow: flowData });
        return;
      });
    } catch (err) {
      if (backupFlow != undefined) {
        // Putting back previous flow
        orchestrator.addFlow(flowHeader, backupFlow, function (err) { });
      }
      httpResponse.status(err.retCode).send({ msg: 'error while adding flow', details: err.msg});
    }
  }

  let deleteFlowFunc = function() {
    orchestrator.deleteFlow(flowHeader, httpRequest.params.flowid, function(err, nRemoved) {
    if (err) {
      console.log('Failed to remove flow: ' + err);
      httpResponse.status(500).send({msg: 'failed to remove flow'});
      throw err;
    }
    if (nRemoved === 0) {
      console.log('Flow is not known');
      httpResponse.status(404).send({msg: 'given flow is unknown'});
      return;
    }
    console.log('Starting flow addition.');
    addFlowFunc();
    console.log('Flow addition started.');
    });
  }

  orchestratorDb.findOne({service: flowHeader['Fiware-Service'], id: httpRequest.params.flowid}, {perseoRules: 0, orionSubscriptionsV2: 0}, function(err, flow) {
    if (err) {
      console.log('An error occurred: ' + err);
      httpResponse.status(500).send({msg: 'failed to retrieve data'});
    } else {
      backupFlow = flow;
    }
    console.log('Starting flow deletion.');
    deleteFlowFunc();
    console.log('Flow deletion started.');
  })


}

function init() {
  console.log('Initializing orchestrator...');
  var app = express();
  app.use(bodyParser.json());
  console.log('Registering express endpoints...');

  // Express callback endpoint registration
  app.get('/v1/flow', processGetFlows);
  app.get('/v1/flow/:flowid', processGetFlow);
  app.post('/v1/flow', processPostFlow);
  app.delete('/v1/flow', processDeleteFlows);
  app.delete('/v1/flow/:flowid',processDeleteFlow)
  app.put('/v1/flow/:flowid', processPutFlow);
  console.log('Endpoints registered.')

  var url = config.mongo.url;
  var opt = {
    connectTimeoutMS: 2500,
    reconnectTries: 100,
    reconnectInterval: 2500,
    autoReconnect: true
  }

  console.log('Starting orchestrator service...');
  MongoClient.connect(url, opt, function (err, database) {
    if (err) {
      throw err;
    }
    orchestratorDb = database.collection('flows');
    orchestratorDb.ensureIndex({id: 1}, {unique: true});
    orchestrator.setDb(orchestratorDb);
    app.listen(3000, function () {
      console.log('Flow service started');
    })
  })
}

exports.init = init;