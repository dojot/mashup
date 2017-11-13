/* jshint node: true */
"use strict";

/**
 * Translate a JSON from node-RED to a perseo-fe request (only
 * body part).
 */

var util = require('util'),
    config = require('./config'),
    resolver = require('./resolver'),
    tools = require('./simple-tools'),
    orchtypes = require('./orchestrator-types');


/**
 * Check if a string is a valid geofence operator
 * It will be checked against orchtypes.OrionTypes.GeoFenceOperator values.
 * @param {string} op Geofence operator to be tested
 */
function isValidGeoOperator(op) {
  for (let validOperator in orchtypes.OrionTypes.GeoFenceOperator) {
    if (op === orchtypes.OrionTypes.GeoFenceOperator[validOperator]) {
      return true;
    }
  }
  return false;
}

function buildErrorMessage(errorMsg, node) {
  let ret = { error : errorMsg};
  if (node != null) {
    ret.nodeid = node.id;
  }
  return ret;
}

/**
 * Add a composed condition that negates all other conditions described in 'node'
 * parameter
 * @param {object} node The node containing all other conditions
 * @param {string} ruleValue
 * @param {*} ruleType
 * @param {Request} request
 */
function addNegatedFixedEventCondition(node, request) {
  let ret = {
    'msg' : 'ok',
    'retCode': 0
  }
  // Sanity checks
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i] == undefined || arguments[i] === null) {
      ret.msg = buildErrorMessage('invalid parameter', node);
      ret.retCode = 400;
      throw ret;
    }
  }
  // End of sanity checks

  for (let ruleIx = 0; ruleIx < node.rules.length; ruleIx++) {
    let ruleOperation = node.rules[ruleIx].t;
    let ruleValue = node.rules[ruleIx].v;
    let ruleType = node.rules[ruleIx].vt;

    // If there is an opposite operator for this one.
    if (ruleOperation in orchtypes.NodeRed.NegatedLogicalOperators) {
      switch (ruleOperation) {
        case 'btwn':
          // 'Between' is simply greater than the minimum and less than the maximum.
          addFixedEventCondition(node, 'lt', ruleValue, ruleType, request);
          ruleValue = node.rules[ruleIx].v2;
          ruleType = node.rules[ruleIx].v2t;
          addFixedEventCondition(node, 'gte', ruleValue, ruleType, request);
          break;
        default:
          addFixedEventCondition(node, orchtypes.NodeRed.NegatedLogicalOperators[ruleOperation], ruleValue, ruleType, request);
      }
    } else {
      if (ruleOperation in orchtypes.NodeRed.LogicalOperators) {
        ret.msg = 'operator has no negated form';
      } else {
        ret.retCode = 400;
        ret.msg = buildErrorMessage('invalid operator', node);
        throw ret;
      }
    }
  }
}

function addEventCondition(node, ruleOperation, ruleValue, ruleType, request, eventConditionArray) {
  let ret = {
    'msg' : 'ok',
    'retCode': 0
  }
  // Sanity checks
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i] == undefined || arguments[i] === null) {
      ret.msg = buildErrorMessage('invalid parameter', node);
      ret.retCode = 400;
      throw ret;
    }
  }
  // End of sanity checks

  if (ruleOperation in orchtypes.NodeRed.LogicalOperators) {
    let nodeProperty = tools.trimProperty(node.property, '.');
    tools.addUniqueToArray(request.variables, nodeProperty);
    tools.addUniqueToArray(request.inputDevice.attributes, nodeProperty);
    eventConditionArray.push({'q' : nodeProperty + ' ' + orchtypes.NodeRed.LogicalOperators[ruleOperation] + ' ' + ruleValue });
  } else if (isValidGeoOperator(ruleOperation)) {
    // Sanity checks
    if (ruleValue.length == 0) {
      ret.msg = buildErrorMessage('empty georeference node', node);
      ret.retCode = 400;
      throw ret;
    } else {
      if (ruleType == orchtypes.NodeRed.GeoFenceMode.POLYLINE) {
        // For now, georeferenced tests uses only one attribute.
        let expression = {
          'georel': ruleOperation,
          'coords': '',
          'geometry': ''
        };
        expression.geometry = orchtypes.OrionTypes.GeoFenceMode.POLYGON;
        expression.coords = '';
        for (let i = 0; i < ruleValue.length; i++) {
          let point = ruleValue[i];
          expression.coords += point.latitude + ',' + point.longitude + ';';
        }
        // Closing the polygon
        expression.coords += ruleValue[0].latitude + ',' + ruleValue[0].longitude;
        eventConditionArray.push(expression);
      } else {
        ret.msg = buildErrorMessage('invalid geofence mode', node);
        ret.retCode = 400;
        throw ret;
      }
    }
  } else {
    ret.msg = buildErrorMessage('invalid operator', node);
    ret.retCode = 400;
    throw ret;
  }
}


function addFixedEventCondition(node, ruleOperation, ruleValue, ruleType, request) {
  addEventCondition(node, ruleOperation, ruleValue, ruleType, request, request.pattern.fixedEventConditions);
}

function addFirstEventCondition(node, ruleOperation, ruleValue, ruleType, request) {
  addEventCondition(node, ruleOperation, ruleValue, ruleType, request, request.pattern.firstEventConditions);
}

function addSecondEventCondition(node, ruleOperation, ruleValue, ruleType, request) {
  addEventCondition(node, ruleOperation, ruleValue, ruleType, request, request.pattern.secondEventConditions);
}

function extractFurtherNodes(objects, node, outputIx, request, extractDataFromNodeFn) {

  if (extractDataFromNodeFn == undefined) {
    extractDataFromNodeFn = extractDataFromNode;
  }

  let ret = {
    'retCode': 0,
    'msg': 'ok',
    'requestList': []
  }

  for (let i = 0; i < arguments.length; i++) {
    if ((arguments[i] == null) || (arguments[i] == undefined)) {
      ret.retCode = 400;
      ret.msg = buildErrorMessage('invalid parameter', node);
      delete ret.requestList;
      throw ret;
    }
  }

  if (node.wires[outputIx].length == 0) {
    // This is the last node.
    ret.requestList.push(request);
  } else {
    for (let wire = 0; wire < node.wires[outputIx].length; wire++) {
      let requestClone = tools.cloneSimpleObject(request);
      let nextNode = objects[node.wires[outputIx][wire]];
      let result = extractDataFromNodeFn(objects, nextNode, requestClone);
      ret.requestList = ret.requestList.concat(result.requestList);
    }
  }
  return ret;
}

function extractDataFromNode(objects, node, request) {
  let ret = {
    'retCode': 0,
    'msg': 'ok',
    'requestList': []
  }

  let tempRet;
  console.log('Node type:' + node.type);

  function analyzeReturn() {
    if (tempRet.retCode === 0) {
      ret.requestList = ret.requestList.concat(tempRet.requestList);
    } else {
      ret.retCode = 400;
      ret.msg.error += tempRet.msg.error + ', ';
      ret.msg.nodeid += tempRet.msg.nodeid + ', ';
      delete ret.requestList;
      throw ret;
    }
  }

  switch (node.type) {
    //
    // INPUT NODES
    //
    case orchtypes.NodeRed.NodeType.INPUT_DEVICE : {
      let requestClone = tools.cloneSimpleObject(request);
      delete requestClone.inputDevice.idPattern;
      delete requestClone.inputDevice.typePattern;
      requestClone.inputDevice.type = node._device_type;
      requestClone.inputDevice.id = node._device_id;
      tempRet = extractFurtherNodes(objects, node, 0, requestClone);
      analyzeReturn();
      break;
    }

    case orchtypes.NodeRed.NodeType.INPUT_DEVICE_TEMPLATE : {
      let requestClone = tools.cloneSimpleObject(request);
      delete requestClone.inputDevice.id;
      delete requestClone.inputDevice.type;
      // TODO This must change to the proper value.
      requestClone.inputDevice.typePattern = '.*' + node._device_template_id + '.*';
      requestClone.inputDevice.idPattern = '.*';
      tempRet = extractFurtherNodes(objects, node, 0, requestClone);
      analyzeReturn();
      break;
    }

    //
    // LOGIC NODES
    //
    case orchtypes.NodeRed.NodeType.SWITCH : {
      for (let ruleIx = 0; ruleIx < node.rules.length; ruleIx++) {
        let ruleOperation = node.rules[ruleIx].t;
        let ruleValue = node.rules[ruleIx].v;
        let ruleType = node.rules[ruleIx].vt;
        if (ruleOperation in orchtypes.NodeRed.LogicalOperators) {
          // If this operator is supported.
          let requestClone = tools.cloneSimpleObject(request);
          switch (ruleOperation) {
            case 'btwn':
              let ruleLowerValue = ruleValue;
              let ruleUpperValue = node.rules[ruleIx].v2;
              addFixedEventCondition(node, 'eq', '' + ruleLowerValue + '..' + ruleUpperValue, ruleType, requestClone);
              break;
            case 'else':
              addNegatedFixedEventCondition(node, requestClone);
              tools.addUniqueToArray(requestClone.inputDevice.attributes, tools.trimProperty(node.property, '.'));
              break;
            default:
              addFixedEventCondition(node, ruleOperation, ruleValue, ruleType, requestClone);
          }
          tempRet = extractFurtherNodes(objects, node, ruleIx, requestClone);
          analyzeReturn();
        }
      }
      break;
    }
    case orchtypes.NodeRed.NodeType.EDGEDETECTION : {
      for (let ruleIx = 0; ruleIx < node.rules.length; ruleIx++) {
        let ruleOperation = node.rules[ruleIx].t;
        let ruleValue = node.rules[ruleIx].v;
        let ruleType = node.rules[ruleIx].vt;
        let requestClone = tools.cloneSimpleObject(request);
        switch (ruleOperation) {
          case 'edge-up':
            addFirstEventCondition(node, 'lt', ruleValue, ruleType, requestClone);
            addSecondEventCondition(node, 'gte', ruleValue, ruleType, requestClone);
          break;
          case 'edge-down':
            addFirstEventCondition(node, 'gte', ruleValue, ruleType, requestClone);
            addSecondEventCondition(node, 'lt', ruleValue, ruleType, requestClone);
          break;
        }
        tempRet = extractFurtherNodes(objects, node, ruleIx, requestClone);
        analyzeReturn();
      }
      break;
    }
    case orchtypes.NodeRed.NodeType.GEOFENCE : {
      let ruleValue = node.points;
      let ruleType = node.mode;
      switch (node.filter) {
      case 'inside' :
        addFixedEventCondition(node, orchtypes.OrionTypes.GeoFenceOperator.COVEREDBY, ruleValue, ruleType, request);
        break;
      case 'outside' :
        addFixedEventCondition(node, orchtypes.OrionTypes.GeoFenceOperator.DISJOINT, ruleValue, ruleType, request);
        break;
      case 'enters' :
        addFirstEventCondition(node, orchtypes.OrionTypes.GeoFenceOperator.DISJOINT, ruleValue, ruleType, request);
        addSecondEventCondition(node, orchtypes.OrionTypes.GeoFenceOperator.COVEREDBY, ruleValue, ruleType, request);
        break;
      case 'exits':
        addFirstEventCondition(node, orchtypes.OrionTypes.GeoFenceOperator.COVEREDBY, ruleValue, ruleType, request);
        addSecondEventCondition(node, orchtypes.OrionTypes.GeoFenceOperator.DISJOINT, ruleValue, ruleType, request);
        break;
      }
      tempRet = extractFurtherNodes(objects, node, 0, request);
      analyzeReturn();
      break;
    }

    //
    // CONTENT GENERATION NODES
    //
    case orchtypes.NodeRed.NodeType.CHANGE : {
      for (let ruleIx = 0; ruleIx < node.rules.length; ruleIx++) {
        // Add a new internal variable to be referenced by other nodes.
        // All new structures will be assembled during after flow analysis (before request translation)
        let path = tools.tokenize(node.rules[ruleIx].p, '.');
        if (node.rules[ruleIx].tot === 'msg') {
          // Referenced variable
          tools.objectify(request.internalVariables, path, '{{' + node.rules[ruleIx].to + '}}');
        } else {
          // Referenced variable
          tools.objectify(request.internalVariables, path, node.rules[ruleIx].to);
        }
      }

      tempRet = extractFurtherNodes(objects, node, 0, request);
      analyzeReturn();
      break;
    }
    case orchtypes.NodeRed.NodeType.TEMPLATE : {
      // Add a new internal variable to be referenced by other nodes.
      // All new structures will be assembled during after flow analysis (before request translation)
      let path = tools.tokenize(node.field, '.');
      // Referenced variable
      tools.objectify(request.internalVariables, path, node.template);

      tempRet = extractFurtherNodes(objects, node, 0, request);
      analyzeReturn();
      break;
    }

    //
    // OUTPUT NODES
    //
    case orchtypes.NodeRed.NodeType.OUTPUT_DEVICE : {
      request.action.notificationEndpoint = config.perseo_fe.url + '/noticesv2'
      request.action.type = orchtypes.PerseoTypes.ActionType.UPDATE;
      request.action.parameters = {
        'id' : node._device_id,
        'type' : node._device_type,
        'isPattern' : false,
        'attributes' : node.attrs
      }
      ret.requestList.push(request);
      break;
    }

    case orchtypes.NodeRed.NodeType.HTTP_REQUEST:
      request.action.notificationEndpoint = config.perseo_fe.url + '/noticesv2'
      request.action.type = orchtypes.PerseoTypes.ActionType.POST;
      request.action.template = node.body;
      request.action.parameters = {
        'url' : node.url,
        'method' : node.method,
        'headers' : '{{headers}}'
      }

      if (request.action.parameters.url == '') {
        request.action.parameters.url = '{{url}}'
      }
      if (request.action.parameters.method == 'use') {
        request.action.parameters.method = '{{method}}'
      }
      ret.requestList.push(request);
      break;

    case orchtypes.NodeRed.NodeType.EMAIL:
      request.action.notificationEndpoint = config.perseo_fe.url + '/noticesv2'
      request.action.type = orchtypes.PerseoTypes.ActionType.EMAIL;
      request.action.parameters = {
        'to' : node.to,
        'from' : node.from,
        'subject' : node.subject,
        'smtp' : node.server
      };
      request.action.template = node.body;
      ret.requestList.push(request);
      break;

    case orchtypes.NodeRed.NodeType.HISTORY:
      request.action.notificationEndpoint = config.cygnus.url + "/notify";

      ret.requestList.push(request);

      break;
  }
  return ret;
}

/**
 * Merge two expressions together
 * @param {Object} expression The expression on which the expressions will be merged
 * @param {Object} eventConditions The source of new expressions
 */
function concatenateExpression(expression, eventConditions) {
  for (let condition in eventConditions) {
    if (eventConditions.hasOwnProperty(condition)) {
      for (let query in eventConditions[condition]) {
        if (expression[query] == undefined) {
          expression[query] = eventConditions[condition][query];
        } else {
          expression[query] += '; ' + eventConditions[condition][query];
        }
      }
    }
  }
}

function transformToOrionSubscriptions(requests) {
  let orionSubscriptions = [];
  for (let i = 0; i < requests.length; i++) {
    let request = requests[i];
    let orionSubscription = tools.cloneSimpleObject(orchtypes.orionSubscriptionTemplate);
    orionSubscription.subscription.description = 'Subscription for ' + requests[i].inputDevice.id;
    if (request.inputDevice.id != undefined) {
      orionSubscription.subscription.subject.entities.push( {
        'type' : request.inputDevice.type,
        'id' : request.inputDevice.id
      });
    } else {
      orionSubscription.subscription.subject.entities.push( {
        'typePattern' : request.inputDevice.typePattern,
        'idPattern' : request.inputDevice.idPattern
      });
    }

    orionSubscription.subscription.notification.http.url = request.action.notificationEndpoint;

    if (request.pattern.fixedEventConditions.length != 0) {
      // Only add 'condition' attribute if there is something to test
      orionSubscription.subscription.subject['condition'] = { 'expression' : {}, 'attrs': request.inputDevice.attributes};
      concatenateExpression(orionSubscription.subscription.subject.condition.expression, request.pattern.fixedEventConditions);
    }

    if (request.pattern.firstEventConditions.length != 0 && request.pattern.secondEventConditions.length != 0) {
      // Only add 'condition' attribute if there is something to test
      if (!('condition' in orionSubscription.subscription.subject)) {
        orionSubscription.subscription.subject['condition'] = { 'expression' : {}, 'attrs': request.inputDevice.attributes};
      }

      // Create the first subscription
      let orionSubsClone = tools.cloneSimpleObject(orionSubscription);
      orionSubsClone.originalRequest = requests[i];
      orionSubsClone.subscriptionOrder = 1;
      concatenateExpression(orionSubsClone.subscription.subject.condition.expression, request.pattern.firstEventConditions);
      orionSubscriptions.push(orionSubsClone);

      // Create the second subscription
      orionSubsClone = tools.cloneSimpleObject(orionSubscription);
      orionSubsClone.originalRequest = requests[i];
      orionSubsClone.subscriptionOrder = 2;
      concatenateExpression(orionSubsClone.subscription.subject.condition.expression, request.pattern.secondEventConditions);
      orionSubscriptions.push(orionSubsClone);
    } else {
      orionSubscription.subscriptionOrder = 0;
      orionSubscription.originalRequest = requests[i];
      orionSubscriptions.push(orionSubscription);
    }
  }
  return orionSubscriptions;
}

function transformToPerseoRequest(request) {

  if (request.action.type == "") {
    return null;
  }

  let varAccess;

  let specialVars = {
    tags: ['payload'],
    used: []
  };

  let perseoRule = tools.cloneSimpleObject(orchtypes.perseoRuleTemplate);

  perseoRule.name = request.name;

  // Processing actions - all referenced variables will be translated
  perseoRule.action.type = request.action.type;
  switch (request.action.type) {
    case orchtypes.PerseoTypes.ActionType.UPDATE: {
      // Only attributes should be updated.
      let attributesVar = request.action.parameters.attributes;
      varAccess = resolver.accessVariable(request.internalVariables, tools.tokenize(attributesVar, '.'), specialVars);
      if (varAccess.result !== 'ok') {
        throw "failure";
      }
      let attributes = varAccess.data;
      let resolvedVariables;
      // Attributes can be a string - in case of a variable defined in a
      // 'template' node - or an object - in case of a variable defined
      // in 'switch' nodes
      if (typeof attributes == 'object') {
        resolvedVariables = resolver.resolveVariables(request.internalVariables, JSON.stringify(attributes), specialVars);
      } else if (typeof attributes == 'string') {
        resolvedVariables = resolver.resolveVariables(request.internalVariables, attributes, specialVars);
      }
      perseoRule.action.parameters = request.action.parameters;
      perseoRule.action.parameters.attributes = [];
      // This must be a json, so let's add some quotes.
      attributes = JSON.parse(resolvedVariables.data);
      for (let varName in attributes) {
        if (attributes.hasOwnProperty(varName)){
          perseoRule.action.parameters.attributes.push({
            'name' : varName,
            'value' : attributes[varName]
          });
        }
      }
      for (let i = 0; i < specialVars.used.length; i++){
        tools.addUniqueToArray(request.variables, specialVars.used[i]);
      }
    }
    break;
    case orchtypes.PerseoTypes.ActionType.POST : {
      // Translate body
      let postBodyVar = request.action.template;
      let resolvedVariables;

      if (postBodyVar === 'payload') {
        perseoRule.action.mirror = true;
        perseoRule.action.template = 'dummy-template';
      } else {
        perseoRule.action.mirror = false;
        varAccess = resolver.accessVariable(request.internalVariables, tools.tokenize(postBodyVar, '.'));
        if (varAccess.result !== 'ok') {
          throw "failure";
        }
        let postBody = varAccess.data;

        if (typeof postBody === 'object') {
          postBody = JSON.stringify(postBody);
        }

        let resolvedVariables = resolver.resolveVariables(request.internalVariables, postBody, specialVars);

        if (typeof resolvedVariables.data === 'object') {
          perseoRule.action.template = '\'' + JSON.stringify(resolvedVariables.data) + '\'';
        } else {
          perseoRule.action.template = resolvedVariables.data;
        }
        for (let i = 0; i < specialVars.used.length; i++){
          tools.addUniqueToArray(request.variables, specialVars.used[i]);
        }
      }

      perseoRule.action.parameters = request.action.parameters;

      if (perseoRule.action.parameters.url == '{{url}}') {
        resolvedVariables = resolver.resolveVariables(request.internalVariables, request.internalVariables['url'], specialVars);
        perseoRule.action.parameters.url = resolvedVariables.data;
        for (let i = 0; i < specialVars.used.length; i++){
          tools.addUniqueToArray(request.variables, specialVars.used[i]);
        }
      }

      if (perseoRule.action.parameters.method == '{{method}}') {
        resolvedVariables = resolver.resolveVariables(request.internalVariables, request.internalVariables['method'], specialVars);
        perseoRule.action.parameters.method = resolvedVariables.data;
        for (let i = 0; i < specialVars.used.length; i++){
          tools.addUniqueToArray(request.variables, specialVars.used[i]);
        }
      }

      // Processing headers
      if ('headers' in request.internalVariables) {
        let headers = request.internalVariables['headers'];
        if (typeof headers == 'object') {
          resolvedVariables = resolver.resolveVariables(request.internalVariables, JSON.stringify(headers), specialVars);
        } else if (typeof headers == 'string') {
          resolvedVariables = resolver.resolveVariables(request.internalVariables, headers, specialVars);
        }
        for (let i = 0; i < specialVars.used.length; i++){
          tools.addUniqueToArray(request.variables, specialVars.used[i]);
        }
        perseoRule.action.parameters.headers = JSON.parse(resolvedVariables.data);
      } else {
        perseoRule.action.parameters.headers = "";
      }
    }
    break;
    case orchtypes.PerseoTypes.ActionType.EMAIL : {
      // Translate body
      let emailBodyVar = request.action.template;
      varAccess = resolver.accessVariable(request.internalVariables, tools.tokenize(emailBodyVar, '.'));
      if (varAccess.result !== 'ok') {
        throw "failure";
      }
      let emailBody = varAccess.data;
      if (typeof emailBody === 'object') {
        emailBody = JSON.stringify(emailBody);
      }

      let resolvedVariables = resolver.resolveVariables(request.internalVariables, emailBody, specialVars);
      perseoRule.action.parameters = request.action.parameters;

      if (typeof resolvedVariables.data === 'object') {
        perseoRule.action.template = '\'' + JSON.stringify(resolvedVariables.data) + '\'';
      } else {
        perseoRule.action.template = resolvedVariables.data;
      }

      for (let i = 0; i < specialVars.used.length; i++){
        tools.addUniqueToArray(request.variables, specialVars.used[i]);
      }
    }
    break;
  }

  perseoRule.text = 'select *';
  perseoRule.text += ', \"' + request.name + '\" as ruleName';
  let sourceEvent = 'ev';
  if (request.pattern.secondEventConditions.length != 0) {
    sourceEvent = 'ev2';
  }

  for (let i = 0; i < request.variables.length; i++) {
    perseoRule.text += ', ' + sourceEvent + '.' + request.variables[i] + '? as ' + request.variables[i];
  }

  perseoRule.text += ' from pattern [';
  perseoRule.text += 'every ev = iotEvent(';
  if (request.pattern.fixedEventSubscriptionId != '') {
    perseoRule.text += 'cast(subscriptionId?, String) = \"' + request.pattern.fixedEventSubscriptionId + '\"';
  } else if (request.pattern.firstEventSubscriptionId != '' && request.pattern.secondEventSubscriptionId != '') {
    perseoRule.text += 'cast(subscriptionId?, String) = \"' + request.pattern.firstEventSubscriptionId + '\")';
    perseoRule.text += ' -> ev2 = iotEvent(cast(subscriptionId?, String) = \"' + request.pattern.secondEventSubscriptionId + '\"';
  }
  perseoRule.text += ')]';
  return perseoRule;
}

function generatePerseoRequest(subscriptionId, subscriptionOrder, originalRequest) {
  switch (subscriptionOrder) {
    case 0:
      originalRequest.pattern.fixedEventSubscriptionId = subscriptionId;
    break;
    case 1:
      originalRequest.pattern.firstEventSubscriptionId = subscriptionId;
      break;
    case 2:
      originalRequest.pattern.secondEventSubscriptionId = subscriptionId;
      break;
  }

  let shouldCreateRule = false;
  if (subscriptionOrder == 1 || subscriptionOrder == 2) {
    // This should be a chained-event rule.
    if (originalRequest.pattern.firstEventSubscriptionId != '' && originalRequest.pattern.secondEventSubscriptionId != '') {
      // It is OK to create the rule.
      shouldCreateRule = true;
    }
  } else if (subscriptionOrder == 0) {
    // This is a simple rule.
    shouldCreateRule = true;
  }

  if (shouldCreateRule == true) {
    return transformToPerseoRequest(originalRequest);
  } else {
    return undefined;
  }
}

function translateMashup(mashupJson) {
  console.log('Starting mashup translation');

  let orionSubscriptions = [];
  let objects = {};

  for (let i = 0; i < mashupJson.length; i++) {
    objects[mashupJson[i].id] = mashupJson[i];
  }

  for (var id in objects) {
    if (objects[id].type == orchtypes.NodeRed.NodeType.INPUT_DEVICE || objects[id].type == orchtypes.NodeRed.NodeType.INPUT_DEVICE_TEMPLATE) {
      let emptyRequest = tools.cloneSimpleObject(orchtypes.requestTemplate);
      let requests = extractDataFromNode(objects, objects[id], emptyRequest, objects[id].device);
      // Name all requests
      for (let i = 0; i < requests.requestList.length; i++) {
        requests.requestList[i].name = 'rule_' + id.replace('.', '_') + '_' + (i + 1);
      }
      let tempResults = transformToOrionSubscriptions(requests.requestList);
      orionSubscriptions = orionSubscriptions.concat(tempResults);
    }
  }

  // console.log('Results:');
  // console.log(util.inspect(orionSubscriptions, {showHidden: false, depth: null}))

  return orionSubscriptions;
}

exports.isValidGeoOperator = isValidGeoOperator;
exports.addNegatedFixedEventCondition = addNegatedFixedEventCondition;
exports.addEventCondition = addEventCondition;
exports.addFixedEventCondition = addFixedEventCondition;
exports.addFirstEventCondition = addFirstEventCondition;
exports.addSecondEventCondition = addSecondEventCondition;
exports.extractFurtherNodes = extractFurtherNodes;
exports.extractDataFromNode = extractDataFromNode;
exports.transformToOrionSubscriptions = transformToOrionSubscriptions;
exports.transformToPerseoRequest = transformToPerseoRequest;
exports.generatePerseoRequest = generatePerseoRequest;
exports.translateMashup = translateMashup;
