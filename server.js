"use strict";

var express = require('express'),
    MongoClient = require('mongodb').MongoClient,
    bodyParser = require('body-parser'),
    assert = require('assert'),
    translator = require('./translator'),
    request = require('request'),
    util = require('util'),
    config = require('./config'),
    base64 = require('js-base64').Base64;

var db;
var col;

var app = express();
app.use(bodyParser.json());


/**
 * Generates a random ID.
 * @returns A random ID formatted as hexadecimal string.
 */
function sid() {
  const UINT32_MAX = 4294967295;
  return (1 + Math.random()*UINT32_MAX).toString(16);
}

/**
 * Callback function to perseo HTTP requests
 * @param {*} error
 * @param {*} response
 * @param {*} body
 */
function perseoCallback(error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(util.inspect(body, {showHidden: false, depth: null}));
  } else {
    if (error) {
      console.log(error);
    }
  }
}

/**
 * Callback function to orion HTTP requests
 * @param {*} error
 * @param {*} response
 * @param {*} body
 */

function orionSubsUpdateCallback(err,doc) {
  if (err) {
    throw err;
  }
}

function orionGeoRefSubscriptionCallback(flowHeader, flowId, relatedPerseoRequests, error, response, body) {
  if (!error && response.statusCode == 201) {
    let location = response.headers.location;
    var indexId = location.lastIndexOf('/');
    let subscriptionId = location.slice(indexId + 1);
    let filter = {service: flowHeader['Fiware-Service'], id: flowId};
    let updateOperation =  { $push: {"orion_subscriptions_v2": subscriptionId} };
    col.findOneAndUpdate(filter, updateOperation, {new: true}, orionSubsUpdateCallback);

    let perseoRequests = translator.doGeoRefPostTranslation(relatedPerseoRequests, subscriptionId);

    // Once this subscription is created, let's create all rules with this subscriptionId
    for (var i = 0; i < perseoRequests.length; i++) {
      let flowRequest = perseoRequests[i];
      request.post({url: config.perseo_fe.url + '/rules', json: flowRequest, headers: flowHeader}, perseoCallback);
    }

  } else {
    if (error) {
      console.log(error);
    }
  }
}


function orionSubscriptionCallback(flowHeader, flowId, error, response, body) {
  if (!error && response.statusCode == 200) {
    let subscriptionId = body.subscribeResponse.subscriptionId;
    let filter = {service: flowHeader['Fiware-Service'], id: flowId};
    let updateOperation =  { $push: {"orion_subscriptions": subscriptionId} };
    col.findOneAndUpdate(filter, updateOperation, {new: true}, orionSubsUpdateCallback);
  } else {
    if (error) {
      console.log(error);
    }
  }
}

/**
 * Callback function to orion HTTP requests
 * @param {*} error
 * @param {*} response
 * @param {*} body
 */
function orionCallback(error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(util.inspect(body, {showHidden: false, depth: null}));
  } else {
    if (error) {
      console.log(error);
    }
  }
}

/**
 * Extract headers related to Fiware.
 * These headers are:
 *  - Fiware-Service
 *  - Fiware-ServicePath
 * @param {*} flowHeaders The headers in HTTP request.
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

function addFlow(flowHeader, flowData, callback) {
  if ((!('id' in flowData)) || (flowData.id.length == 0)) {
    flowData.id = sid();
  }

  if (!('enabled' in flowData)) {
    flowData.enabled = true;
  }

  flowData.created = Date.now();
  flowData.updated = flowData.created;
  flowData.service = flowHeader['Fiware-Service'];
  flowData.servicePath = flowHeader['Fiware-ServicePath'];

  // Translate flow to perseo and/or orion
  var flowRequests = translator.translateMashup(flowData.flow);
  // Store perseo data so that the rules can be properly removed in the future
  flowData['perseoRules'] = {
    headers : {}, // Headers used to create these rules (and so to remove them)
    rules : []    // List of rule identifiers
  };

  if ('perseoRequests' in flowRequests) {
    // Send the requests
    for (var i = 0; i < flowRequests.perseoRequests.length; i++) {
      let flowRequest = flowRequests.perseoRequests[i];
      request.post({url: config.perseo_fe.url + '/rules', json: flowRequest.perseoRequest, headers: flowHeader}, perseoCallback);
      flowData.perseoRules.rules.push(flowRequest.ruleName);
    }
    flowData.perseoRules.headers = flowHeader;
  }

  if ('orionRequests' in flowRequests) {
    // Send the requests
    for (var i = 0; i < flowRequests.orionRequests.length; i++) {
      let flowRequest = flowRequests.orionRequests[i];
      request.post({url: config.orion.url + '/v1/updateContext/', json: flowRequest, headers: flowHeader}, orionCallback);
    }
  }

  if ('orionSubscriptions' in flowRequests) {
    // Send the requests
    for (var i = 0; i < flowRequests.orionSubscriptions.length; i++) {
      let flowRequest = flowRequests.orionSubscriptions[i];
      request.post({url: config.orion.url + '/v1/subscribeContext/', json: flowRequest, headers: flowHeader}, function(error, response, body) {
        orionSubscriptionCallback(flowHeader, flowData.id, error, response, body);
      });
    }
  }


  if ('orionGeoRefSubscriptions' in flowRequests) {
    // Send the requests
    for (var i = 0; i < flowRequests.orionGeoRefSubscriptions.length; i++) {
      let geoRefData = flowRequests.orionGeoRefSubscriptions[i];
      let flowRequest = geoRefData.subscription;
      // Update flowData perseo rule names - adding those rules that are not yet
      // created
      for (let ruleIx = 0; ruleIx < geoRefData.relatedPerseoRequests.length; ruleIx++) {
        flowData.perseoRules.rules.push(geoRefData.relatedPerseoRequests[ruleIx].name);
      }

      request.post({url: config.orion.url + '/v2/subscriptions/', json: flowRequest, headers: flowHeader}, function(error, response, body) {
        orionGeoRefSubscriptionCallback(flowHeader, flowData.id, geoRefData.relatedPerseoRequests, error, response, body);
      });
    }
  }
  col.insertOne(flowData, function(err, result) {
    callback(err);
    return;
  });
}

function deleteFlow(flowHeader, flowid, callback) {
  // Removing related rules
  col.findOne({id: flowid, service: flowHeader['Fiware-Service']}, function(err, flow) {
    if (err) {
      // An error ocurred
      callback(err, 0);
      return;
    }

    if (flow != null) {
      // Remove all perseo rules related to this flow
      if (flow.perseoRules != undefined) {
        for (var i = 0; i < flow.perseoRules.rules.length; i++) {
          let flowId = flow.perseoRules.rules[i];
          let flowHeader = flow.perseoRules.headers;
          request.delete({url: config.perseo_fe.url + "/rules/" + flowId, headers: flowHeader}, perseoCallback);
        }
      }

      // Remove all subscription in orion - version 1
      if (flow.orion_subscriptions != undefined) {
        for (var i = 0; i < flow.orion_subscriptions.length; i++) {
          // Same headers as perseo stuff
          let flowHeader = flow.perseoRules.headers;
          request.post({url: config.orion.url + '/v1/unsubscribeContext/', json: {subscriptionId: flow.orion_subscriptions[i]}, headers: flowHeader}, orionCallback);
        }
      }

      // Remove all subscription in orion - version 2
      if (flow.orion_subscriptions_v2 != undefined) {
        for (var i = 0; i < flow.orion_subscriptions_v2.length; i++) {
          // Same headers as perseo stuff
          let flowHeader = flow.perseoRules.headers;
          request.delete({url: config.orion.url + '/v2/subscriptions/' + flow.orion_subscriptions_v2[i], headers: flowHeader}, orionCallback);
        }
      }

      col.remove({id: flowid}, null, function(err, nRemoved) {
        callback(err, nRemoved);
        return;
      });
    } else {
      // There is no such element in the database.
      callback(null, 0);
      return;
    }
  })
}


//
// GET handler
//
app.get('/v1/flow', function (httpRequest, httpResponse) {
  var flowHeader = extractFiwareHeaders(httpRequest.headers);
  col.find({service: flowHeader['Fiware-Service']}, {_id: 0}).toArray(function (err, flows) {
  //col.find({}, {_id: 0}).toArray(function (err, flows) {
    if (err) {
      httpResponse.status(500).send({msg: 'failed to retrieve data'});
      throw err;
    }
    httpResponse.status(200).send(flows);
  })
})

//
// POST handler
//
app.post('/v1/flow', function (httpRequest, httpResponse) {
  let flowData = httpRequest.body;
  var flowHeader = extractFiwareHeaders(httpRequest.headers);

  if (!flowData) {
    httpResponse.status(400).send({msg: "missing flow data"});
    return;
  }

  addFlow(flowHeader, flowData, function(err) {
    if (err) {
      httpResponse.status(500).send({msg: 'failed to insert data'});
      throw err;
    }
    httpResponse.status(200).send({msg: 'flow created ', flow: flowData});
  });
})

//
// DELETE handler
//
app.delete('/v1/flow', function (httpRequest, httpResponse) {
  var flowHeader = extractFiwareHeaders(httpRequest.headers);
  col.find({service: flowHeader['Fiware-Service']}).forEach(function(flowData) {
    for (var i = 0; i < flowData.perseoRules.rules.length; i++) {
      let flowId = flowData.perseoRules.rules[i];
      let flowHeader = flowData.perseoRules.headers;
      request.delete({url: config.perseo_fe.url + "/rules/" + flowId, headers: flowHeader}, perseoCallback);
    }

    for (var i = 0; i < flowData.orion_subscriptions.length; i++) {
      // Same headers as perseo stuff
      let flowHeader = flowData.perseoRules.headers;
      request.post({url: config.orion.url + '/v1/unsubscribeContext/', json: {subscriptionId: flowData.orion_subscriptions[i]}, headers: flowHeader}, orionCallback);
    }

    // Remove all subscription in orion - version 2
    for (var i = 0; i < flowData.orion_subscriptions_v2.length; i++) {
      // Same headers as perseo stuff
      let flowHeader = flowData.perseoRules.headers;
      request.delete({url: config.orion.url + '/v2/subscriptions/' + flowData.orion_subscriptions_v2[i], headers: flowHeader}, orionCallback);
    }


  });
  col.remove();
  httpResponse.status(200).send({msg: 'all flows removed'})
})


//
// GET handler - single version
//
app.get('/v1/flow/:flowid', function (httpRequest, httpResponse) {
  var flowHeader = extractFiwareHeaders(httpRequest.headers);
  col.findOne({service: flowHeader['Fiware-Service'], id: httpRequest.params.flowid}, function(err, flow) {
    if (err) {
      httpResponse.status(500).send({msg: 'failed to retrieve data'});
      throw err;
    }
    httpResponse.status(200).send({msg: 'ok', flow: flow});
  })
})


//
// PUT handler - single version
//
app.put('/v1/flow/:flowid', function (httpRequest, httpResponse) {
  let flowData = httpRequest.body;
  var flowHeader = extractFiwareHeaders(httpRequest.headers);

  if (!flowData) {
    httpResponse.status(400).send({msg: "missing flow data"});
    return;
  }

  deleteFlow(flowHeader, httpRequest.params.flowid, function(err, nRemoved) {
    if (err) {
      httpResponse.status(500).send({msg: 'failed to remove flow'});
      throw err;
    }
    if (nRemoved === 0) {
      httpResponse.status(404).send({msg: 'given flow is unknown'});
      return;
    }
    addFlow(flowHeader, flowData, function(err) {
      if (err) {
        httpResponse.status(500).send({msg: 'failed to insert data'});
        throw err;
      }
      httpResponse.status(200).send({msg: 'flow updated', flow: flowData});
      return;
    });
  });
})


//
// DELETE handler - single version
//
app.delete('/v1/flow/:flowid', function (httpRequest, httpResponse) {
  var flowHeader = extractFiwareHeaders(httpRequest.headers);
  deleteFlow(flowHeader, httpRequest.params.flowid, function(err, nRemoved) {
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
})

var url = config.mongo.url;
var opt = {
  connectTimeoutMS: 2500,
  reconnectTries: 100,
  reconnectInterval: 2500,
  autoReconnect: true
}

MongoClient.connect(url, opt, function (err, database) {
  if (err) throw err;

  db = database;
  col = db.collection('flows');
  col.ensureIndex({id: 1}, {unique: true});
  app.listen(3000, function () {
    console.log('Flow service started');
  })
})
