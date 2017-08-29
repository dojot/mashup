/* jshint node: true */
"use strict";
/**
 * Translate a JSON from node-RED to a perseo-fe request (only
 * body part).
 */

var util = require('util'),
    config = require('./config');

/**
 * All constants from node-RED-generated flows
 */
var NodeRed = {
  NodeType: {
    OUTPUT_DEVICE: 'device in',
    INPUT_DEVICE: 'device out',
    SWITCH: 'switch',
    CHANGE: 'change',
    HTTP_REQUEST: 'http request out',
    TEMPLATE: 'template',
    GEOFENCE: 'geofence',
    EMAIL: 'e-mail',
    EDGEDETECTION: 'edgedetection',
    HTTP_POST: 'http post',
    HISTORY: 'history'
  },
  LogicalOperators: {
    'eq': '==',
    'neq': '!=',
    'lt': '<',
    'lte': '<=',
    'gt': '>',
    'gte': '>=',
    'cont' : '~=',
    'btwn': 'between',
    'else': 'else'
    /*
    - not yet -
    'regex' : 'regex',
    'true' : '1',
    'false' : '0',
    'null' : 'null',
    'nnull' : '!null',
    */
  },
  NegatedLogicalOperators: {
    'eq': 'neq',
    'neq': 'eq',
    'lt': 'gte',
    'lte': 'gt',
    'gt': 'lte',
    'gte': 'lt',
    'btwn': ''
    /*
    - not yet -
    'cont' : 'contains',
    'regex' : 'regex',
    'true' : '1',
    'false' : '0',
    'null' : 'null',
    'nnull' : '!null',
    'else' : ''
    */
  },
  ValueTypes: {
    FLOAT: 'num',
    STRING: 'str',
    BOOL: 'bool'
  },
  GeoFenceMode : {
    POLYLINE: 'polyline'
  }
}


// Orion types as described in:
// - https://jsapi.apiary.io/previews/null/introduction/specification/geographical-queries
var OrionTypes = {
  GeoFenceMode : {
    POINT: 'point',
    LINE: 'line',
    POLYGON: 'polygon',
    BOX: 'box'
  },

  GeoFenceOperator: {
    NEAR: 'near',
    COVEREDBY: 'coveredBy',
    INTERSECTS: 'intersects',
    EQUALS: 'equals',
    DISJOINT: 'disjoint'
  }
}

var PerseoTypes = {
  ActionType: {
    UPDATE: 'update',
    POST: 'post',
    EMAIL: 'email'
  }
}

var requestTemplate = {
  // Rule name
  'name': '',

  // List of variables that will be used for output generation
  'variables': [],

  // Variables created in flows that will be referenced in output
  // nodes (supposedly)
  'internalVariables': {},

  // Conditions and their support data
  'pattern': {
    'fixedEventConditions' : [],
    'fixedEventSubscriptionId' : '',
    'firstEventConditions': [],
    'firstEventSubscriptionId' : '',
    'secondEventConditions': [],
    'secondEventSubscriptionId' : ''
  },

  // Action taken by this rule
  'action': {
    // Where this action will take place.
    'notificationEndpoint': '',

    // One of the PerseoTypes.ActionType.
    'type': '',

    // Text to be included in the action. Depends on which action is taken
    'template': '',

    // Action parameters. Depend on which action is taken.
    'parameters': {}
  },

  // Input device specification
  'inputDevice': {
    'type': '',
    'id': '',
    'attributes': []
  }
};

var orionSubscriptionTemplate = {
  'subscription' : {
    'description': '',
    'subject': {
      'entities': []
      // This attribute might include
      // 'condition': {
      //   'expression': {}
      // }
      // But if this is empty, it shouldn't exist
    },
    'notification': {
      'http': {
        url: ''
      }
      // This attribute might include
      // attrs: []
      // But if this is empty, it shouldn't exist
    }
  },
  subscriptionOrder: '',
  originalRequest: {}
};

var perseoRuleTemplate = {
  'name' : '',
  'text' : '',
  'action' : {
    'type' : '',
    'template' : '',
    'parameters' : {}
  }
}

/**
 * Clone a simple object (without any functions)
 * @param {Simple JS object} obj The object to be cloned
 * @return The clone.
 */
function cloneSimpleObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Add an object to an array.
 * If the object is already in the array, nothing is changed.
 * @param {Array} array The array to be changed.
 * @param {*} obj The object to be added
 */
function addUniqueToArray(array, obj) {
  let found = false;
  for (let i in array) {
    if (array[i] === obj) {
      found = true;
    }
  }
  if (found == false) {
    array.push(obj);
  }
}


/**
 * Check if a string is a valid geofence operator
 * It will be checked against OrionTypes.GeoFenceOperator values.
 * @param {string} op Geofence operator to be tested
 */
function isValidGeoOperator(op) {
  for (let validOperator in OrionTypes.GeoFenceOperator) {
    if (op === OrionTypes.GeoFenceOperator[validOperator]) {
      return true;
    }
  }
  return false;
}

/**
 * Remove a prefix from a string.
 * This is useful to get rid of a "payload." in strings such as "payload.output.a".
 * In this case, the string "output.a" is returned.
 * @param {string} property The property string to be trimmed.
 * @param {string} keyword The keyword which will mark the beginning of the remaining string.
 * @return The remainder of the string, without the keywork.
 */
function trimProperty(property, keyword) {
  var payloadLength = keyword.length;
  return property.slice(property.indexOf(keyword) + payloadLength);
}

/**
 * Tokenizes a string
 * @param {string} text The text to be tokenized
 * @param {string} token The token to be used
 * @return {Array} The tokenized string.
 */
function tokenize(text, token) {
  let ret = [];
  let remainder = text;

  let beginIndex = remainder.indexOf(token);
  while (beginIndex >= 0) {
    let begin = remainder.slice(0, beginIndex);
    remainder = remainder.slice(beginIndex + token.length);
    ret.push(begin);
    beginIndex = remainder.indexOf(token);
  }
  ret.push(remainder);
  return ret;
}

/**
 * Adds a particular parameter described by a 'path' into an object.
 *
 * For instance, suppose the following object:
 * obj = {
 *   descr : {
 *     owner : {
 *       name : 'user'
 *     }
 *   }
 * }
 *
 * Calling objectify(obj, 'descr.owner.resource.id', 12345) will generate:
 * {
 *   descr : {
 *     owner : {
 *       name : 'user',
 *       resource: {
 *         id: 12345
 *       }
 *     }
 *   }
 * }
 *
 * @param {Object} obj The object to be changed
 * @param {string} path The path to be added
 * @param {*} value The value to be associated to this path
 */
function objectify(obj, path, value) {
  if (path.length == 1) {
    obj[path[0]] = value;
  } else {
    let currAttr = path[0];
    path.shift();
    if (obj[currAttr] == undefined) {
      obj[currAttr] = {};
    }
    obj[currAttr] = objectify(obj[currAttr], path, value);
  }
  return obj;
}

/**
 * Converts a moustache-encoded string into a bash-like text, returning
 * all used variables.
 *
 * Example:
 * let text: "Attributes {{payload.attr1}} and {{payload.attr2}}"
 * Calling resolveVariabled(text) will return
 * translatedTemplate:  "Attributes ${attr1} and ${attr2}"
 * inputVariables: ["attr1", "attr2"]
 *
 * @param {string} template The template to be transformed
 */
function resolveVariables(template) {
  let ret = {
    translatedTemplate : template,
    inputVariables: []
  }
  let beginTagIndex = ret.translatedTemplate.search('{{');
  let endTagIndex = ret.translatedTemplate.search('}}');
  while ((beginTagIndex >= 0) && (endTagIndex >= 0) && (beginTagIndex < endTagIndex)) {
    let begin = ret.translatedTemplate.slice(0, beginTagIndex);
    beginTagIndex += 2;
    let tag = ret.translatedTemplate.slice(beginTagIndex, endTagIndex);
    endTagIndex += 2;
    let remaining = ret.translatedTemplate.slice(endTagIndex);
    let convertedTag = trimProperty(tag, '.');
    addUniqueToArray(ret.inputVariables, convertedTag);
    ret.translatedTemplate = begin + '$\{' + convertedTag + '\}' + remaining;
    beginTagIndex = ret.translatedTemplate.search('{{');
    endTagIndex = ret.translatedTemplate.search('}}');
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
  for (let ruleIx = 0; ruleIx < node.rules.length; ruleIx++) {
    let ruleOperation = node.rules[ruleIx].t;
    let ruleValue = node.rules[ruleIx].v;
    let ruleType = node.rules[ruleIx].vt;

    // If there is an opposite operator for this one.
    if (ruleOperation in NodeRed.NegatedLogicalOperators) {
      switch (ruleOperation) {
        case 'btwn':
          // 'Between' is simply greater than the minimum and less than the maximum.
          addFixedEventCondition(node, 'lt', ruleValue, ruleType, request);
          ruleValue = node.rules[ruleIx].v2;
          ruleType = node.rules[ruleIx].v2t;
          addFixedEventCondition(node, 'gte', ruleValue, ruleType, request);
          break;
        case 'else':
          // This is this node!
          break;
        default:
          addFixedEventCondition(node, NodeRed.NegatedLogicalOperators[ruleOperation], ruleValue, ruleType, request);
      }
    }
  }
}

function addEventCondition(node, ruleOperation, ruleValue, ruleType, request, eventConditionArray) {
  if (ruleOperation in NodeRed.LogicalOperators) {
    let nodeProperty = trimProperty(node.property, '.');
    addUniqueToArray(request.variables, nodeProperty);
    addUniqueToArray(request.inputDevice.attributes, nodeProperty);
    eventConditionArray.push({'q' : nodeProperty + ' ' + NodeRed.LogicalOperators[ruleOperation] + ' ' + ruleValue });
  } else if (isValidGeoOperator(ruleOperation)) {
    // Sanity checks
    if (ruleType == undefined || ruleValue == undefined || (ruleValue != undefined && ruleValue.length == 0)) {
      throw {retCode: 400, msg:'empty georeference node'}
    }

    if (ruleType == NodeRed.GeoFenceMode.POLYLINE) {
      // For now, georeferenced tests uses only one attribute.
      let expression = {
        'georel': ruleOperation,
        'coords': '',
        'geometry': ''
      };
      expression.geometry = OrionTypes.GeoFenceMode.POLYGON;
      expression.coords = '';
      for (let i = 0; i < ruleValue.length; i++) {
        let point = ruleValue[i];
        expression.coords += point.latitude + ',' + point.longitude + ';';
      }
      // Closing the polygon
      expression.coords += ruleValue[0].latitude + ',' + ruleValue[0].longitude;
      eventConditionArray.push(expression);
    }
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

function extractFurtherNodes(objects, node, outputIx, request, requestList) {
  if (node.wires[outputIx].length == 0) {
    requestList.push(request);
  } else {
    for (let wire = 0; wire < node.wires[outputIx].length; wire++) {
      let nextNode = objects[node.wires[outputIx][wire]];
      let result = extractDataFromNode(objects, nextNode, request);
      requestList = requestList.concat(result);
    }
  }
  return requestList;
}

function extractDataFromNode(objects, node, request) {
  let requestList = [];
  switch (node.type) {

    //
    // INPUT NODES
    //
    case NodeRed.NodeType.INPUT_DEVICE : {
      let requestClone = cloneSimpleObject(request);
      requestClone.inputDevice.type = node._device_type;
      requestClone.inputDevice.id = node._device_id;
      requestList = extractFurtherNodes(objects, node, 0, requestClone, requestList);
      break;
    }

    //
    // LOGIC NODES
    //
    case NodeRed.NodeType.SWITCH : {
      for (let ruleIx = 0; ruleIx < node.rules.length; ruleIx++) {
        let ruleOperation = node.rules[ruleIx].t;
        let ruleValue = node.rules[ruleIx].v;
        let ruleType = node.rules[ruleIx].vt;
        if (ruleOperation in NodeRed.LogicalOperators) {
          // If this operator is supported.
          let requestClone = cloneSimpleObject(request);
          switch (ruleOperation) {
            case 'btwn':
              let ruleLowerValue = ruleValue;
              let ruleUpperValue = node.rules[ruleIx].v2;
              addFixedEventCondition(node, 'eq', '' + ruleLowerValue + '..' + ruleUpperValue, ruleType, requestClone);
              break;
            case 'else':
              addNegatedFixedEventCondition(node, requestClone);
              requestClone.inputDevice.attributes.push(trimProperty(node.property, '.'));
              break;
            default:
              addFixedEventCondition(node, ruleOperation, ruleValue, ruleType, requestClone);
          }
          requestList = extractFurtherNodes(objects, node, ruleIx, requestClone, requestList);
        }
      }
      break;
    }
    case NodeRed.NodeType.EDGEDETECTION : {
      for (let ruleIx = 0; ruleIx < node.rules.length; ruleIx++) {
        let ruleOperation = node.rules[ruleIx].t;
        let ruleValue = node.rules[ruleIx].v;
        let ruleType = node.rules[ruleIx].vt;
        let requestClone = cloneSimpleObject(request);
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
        requestList = extractFurtherNodes(objects, node, ruleIx, requestClone, requestList);
      }
      break;
    }
    case NodeRed.NodeType.GEOFENCE : {
      let ruleValue = node.points;
      let ruleType = node.mode;
      switch (node.filter) {
      case 'inside' :
        addFixedEventCondition(node, OrionTypes.GeoFenceOperator.COVEREDBY, ruleValue, ruleType, request);
        break;
      case 'outside' :
        addFixedEventCondition(node, OrionTypes.GeoFenceOperator.DISJOINT, ruleValue, ruleType, request);
        break;
      case 'enters' :
        addFirstEventCondition(node, OrionTypes.GeoFenceOperator.DISJOINT, ruleValue, ruleType, request);
        addSecondEventCondition(node, OrionTypes.GeoFenceOperator.COVEREDBY, ruleValue, ruleType, request);
        break;
      case 'exits':
        addFirstEventCondition(node, OrionTypes.GeoFenceOperator.COVEREDBY, ruleValue, ruleType, request);
        addSecondEventCondition(node, OrionTypes.GeoFenceOperator.DISJOINT, ruleValue, ruleType, request);
        break;
      }
      requestList = extractFurtherNodes(objects, node, 0, request, requestList);
      break;
    }

    //
    // CONTENT GENERATION NODES
    //
    case NodeRed.NodeType.CHANGE : {
      for (let ruleIx = 0; ruleIx < node.rules.length; ruleIx++) {
        // Add a new internal variable to be referenced by other nodes.
        // All new structures will be assembled during after flow analysis (before request translation)
        let path = tokenize(node.rules[ruleIx].p, '.');
        if (node.rules[ruleIx].tot === 'msg') {
          // Referenced variable
          objectify(request.internalVariables, path, '{{' + node.rules[ruleIx].to + '}}');
        } else {
          // Referenced variable
          objectify(request.internalVariables, path, node.rules[ruleIx].to);
        }
      }

      requestList = extractFurtherNodes(objects, node, 0, request, requestList);
      break;
    }
    case NodeRed.NodeType.TEMPLATE : {
      // Add a new internal variable to be referenced by other nodes.
      // All new structures will be assembled during after flow analysis (before request translation)
      let path = tokenize(node.field, '.');
      // Referenced variable
      objectify(request.internalVariables, path, node.template);

      requestList = extractFurtherNodes(objects, node, 0, request, requestList);
      break;
    }

    //
    // OUTPUT NODES
    //
    case NodeRed.NodeType.OUTPUT_DEVICE : {
      request.action.notificationEndpoint = config.perseo_fe.url + '/noticesv2'
      request.action.type = PerseoTypes.ActionType.UPDATE;
      request.action.parameters = {
        'id' : node._device_id,
        'type' : node._device_type,
        'isPattern' : false,
        'attributes' : node.attrs
      }
      requestList.push(request);
      break;
    }

    case NodeRed.NodeType.HTTP_REQUEST:
      request.action.notificationEndpoint = config.perseo_fe.url + '/noticesv2'
      request.action.type = PerseoTypes.ActionType.POST;
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
      requestList.push(request);
      break;

    case NodeRed.NodeType.EMAIL:
      request.action.notificationEndpoint = config.perseo_fe.url + '/noticesv2'
      request.action.type = PerseoTypes.ActionType.EMAIL;
      request.action.parameters = {
        'to' : node.to,
        'from' : node.from,
        'subject' : node.subject,
        'smtp' : node.server,
        'body' : node.body
      };
      requestList.push(request);
      break;

    case NodeRed.NodeType.HISTORY:
      request.action.notificationEndpoint = config.cygnus.url + "/notify";

      requestList.push(request);

      break;
  }
  return requestList;
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
    let orionSubscription = cloneSimpleObject(orionSubscriptionTemplate);
    orionSubscription.subscription.description = 'Subscription for ' + requests[i].inputDevice.id;
    orionSubscription.subscription.subject.entities.push( {
      'type' : request.inputDevice.type,
      'id' : request.inputDevice.id
    });

    // Filling fixed conditions
    for (let condition in request.fixedEventConditions) {
      if (request.fixedEventConditions.hasOwnProperty(condition)) {
        orionSubscription.subscription.subject['condition']['expression'][condition] += request.fixedConditions[condition];
      }
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
      let orionSubsClone = cloneSimpleObject(orionSubscription);
      orionSubsClone.originalRequest = requests[i];
      orionSubsClone.subscriptionOrder = 1;
      concatenateExpression(orionSubsClone.subscription.subject.condition.expression, request.pattern.firstEventConditions);
      orionSubscriptions.push(orionSubsClone);

      // Create the second subscription
      orionSubsClone = cloneSimpleObject(orionSubscription);
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
  
  let perseoRule = cloneSimpleObject(perseoRuleTemplate);

  perseoRule.name = request.name;

  // Processing actions - all referenced variables will be translated
  perseoRule.action.type = request.action.type;
  switch (request.action.type) {
    case PerseoTypes.ActionType.UPDATE: {
      // Only attributes should be updated.
      let attributesVar = request.action.parameters.attributes;
      let attributes = request.internalVariables[attributesVar];
      let resolvedVariables;
      // Attributes can be a string - in case of a variable defined in a
      // 'template' node - or an object - in case of a variable defined
      // in 'switch' nodes
      if (typeof attributes == 'object') {
        resolvedVariables = resolveVariables(JSON.stringify(attributes));
      } else if (typeof attributes == 'string') {
        resolvedVariables = resolveVariables(attributes);
      }
      perseoRule.action.parameters = request.action.parameters;
      perseoRule.action.parameters.attributes = [];
      attributes = JSON.parse(resolvedVariables.translatedTemplate);
      for (let varName in attributes) {
        if (attributes.hasOwnProperty(varName)){
          perseoRule.action.parameters.attributes.push({
            'name' : varName,
            'value' : attributes[varName]
          });
        }
      }
      for (let i = 0; i < resolvedVariables.inputVariables.length; i++){
        addUniqueToArray(request.variables, resolvedVariables.inputVariables[i]);
      }
    }
    break;
    case PerseoTypes.ActionType.POST : {
      // Translate body
      let postBodyVar = request.action.template;
      let postBody = request.internalVariables[postBodyVar];
      let resolvedVariables = resolveVariables(postBody);
      perseoRule.action.parameters = request.action.parameters;
      perseoRule.action.template = resolvedVariables.translatedTemplate;
      for (let i = 0; i < resolvedVariables.inputVariables.length; i++){
        addUniqueToArray(request.variables, resolvedVariables.inputVariables[i]);
      }

      if (perseoRule.action.parameters.url == '{{url}}') {
        resolvedVariables = resolveVariables(request.internalVariables['url']);
        perseoRule.action.parameters.url = resolvedVariables.translatedTemplate;
        for (let i = 0; i < resolvedVariables.inputVariables.length; i++){
          addUniqueToArray(request.variables, resolvedVariables.inputVariables[i]);
        }
      }

      if (perseoRule.action.parameters.method == '{{method}}') {
        resolvedVariables = resolveVariables(request.internalVariables['method']);
        perseoRule.action.parameters.method = resolvedVariables.translatedTemplate;
        for (let i = 0; i < resolvedVariables.inputVariables.length; i++){
          addUniqueToArray(request.variables, resolvedVariables.inputVariables[i]);
        }
      }

      // Processing headers
      if ('headers' in request.internalVariables) {
        let headers = request.internalVariables['headers'];
        if (typeof headers == 'object') {
          resolvedVariables = resolveVariables(JSON.stringify(headers));
        } else if (typeof headers == 'string') {
          resolvedVariables = resolveVariables(headers);
        }
        for (let i = 0; i < resolvedVariables.inputVariables.length; i++){
          addUniqueToArray(request.variables, resolvedVariables.inputVariables[i]);
        }
        perseoRule.action.parameters.headers = JSON.parse(resolvedVariables.translatedTemplate);
      } else {
        perseoRule.action.parameters.headers = "";
      }
    }
    break;
    case PerseoTypes.ActionType.EMAIL : {
      // Translate body
      let emailBodyVar = request.action.parameters.body;
      let emailBody = request.internalVariables[emailBodyVar];
      let resolvedVariables = resolveVariables(emailBody);
      perseoRule.action.parameters = request.action.parameters;
      perseoRule.action.parameters.body = resolvedVariables.translatedTemplate;
      for (let i = 0; i < resolvedVariables.inputVariables.length; i++){
        addUniqueToArray(request.variables, resolvedVariables.inputVariables[i]);
      }
    }
    break;
  }

  perseoRule.text = 'select *';
  perseoRule.text += ', \"' + request.name + '\" as ruleName';
  for (let i = 0; i < request.variables.length; i++) {
    perseoRule.text += ', ev.' + request.variables[i] + '? as ' + request.variables[i];
  }

  perseoRule.text += ' from pattern [';
  perseoRule.text += 'every ev = iotEvent(';
  if (request.pattern.fixedEventSubscriptionId != '') {
    perseoRule.text += 'cast(subscriptionId?, String) = \"' + request.pattern.fixedEventSubscriptionId + '\"';
  } else if (request.pattern.firstEventSubscriptionId != '' && request.pattern.secondEventSubscriptionId != '') {
    perseoRule.text += 'cast(subscriptionId?, String) = \"' + request.pattern.firstEventSubscriptionId + '\")';
    perseoRule.text += ' -> iotEvent(cast(subscriptionId?, String) = \"' + request.pattern.secondEventSubscriptionId + '\"';
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
    if (objects[id].type == 'device out') {
      let emptyRequest = cloneSimpleObject(requestTemplate);
      let requests = extractDataFromNode(objects, objects[id], emptyRequest, objects[id].device);
      // Name all requests
      for (let i = 0; i < requests.length; i++) {
        requests[i].name = 'rule_' + objects[id].z.replace('.', '_') + '_' + (i + 1);
      }
      let tempResults = transformToOrionSubscriptions(requests);
      orionSubscriptions = orionSubscriptions.concat(tempResults);
    }
  }

  // console.log('Results:');
  // console.log(util.inspect(orionSubscriptions, {showHidden: false, depth: null}))

  return orionSubscriptions;
}

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
