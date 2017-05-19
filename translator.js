
/**
 * Translate a JSON from node-RED to a perseo-fe request (only
 * body part).
 */

var util = require('util'),
    config = require('./config');

NodeRed = {
  NodeType: {
    OUTPUT_DEVICE: 'device in',
    INPUT_DEVICE: 'device out',
    SWITCH: 'switch',
    CHANGE: 'change',
    HTTP_REQUEST: 'http request',
    TEMPLATE: 'template'
  },
  LogicalOperators: {
    "eq": "=",
    "neq": "!=",
    "lt": "<",
    "lte": "<=",
    "gt": ">",
    "gte": ">=",
    "btwn": "between",
    "else": "else"
    /*
    - not yet -
    "cont" : "contains",
    "regex" : "regex",
    "true" : "1",
    "false" : "0",
    "null" : "null",
    "nnull" : "!null",
    */
  },
  NegatedLogicalOperators: {
    "eq": "!=",
    "neq": "=",
    "lt": ">=",
    "lte": ">",
    "gt": "<=",
    "gte": "<",
    "btwn": ""
    /*
    - not yet -
    "cont" : "contains",
    "regex" : "regex",
    "true" : "1",
    "false" : "0",
    "null" : "null",
    "nnull" : "!null",
    "else" : ""
    */
  },
  ValueTypes: {
    FLOAT: 'num',
    STRING: 'str',
    BOOL: 'bool'
  }
}

PerseoTypes = {
  ActionType: {
    UPDATE: 'update',
    POST: 'post'
  }
}

/**
 * @typedef {Object} Request
 * @property {String} name Rule name
 * @property {Array} variables Array of strings selecting and naming variables from the request.
 * @property {Object} pattern Pattern to be matched to fire the rule. This property contains the
 * device type and an array of filters (in the form 'Variable? == value', in plain Strings)
 * @property {Object} action The action to be taken when an event matches this rule. Possible
 * types are:
 *  - NodeRed.NodeType.CHANGE : updates a variable in orion
 *  - NodeRed.NodeType.HTTP_REQUEST : sends a HTTP message to an arbitrary endpoint
 * @property {String} outputDevice: The device to be updated, if needed.
 */
var requestTemplate = {
  "name": "",
  "variables": [],
  "pattern": {
    "type": "",
    "otherFilters": []
  },
  "action": {
    "type": "",
    "template": "",
    "parameters": {}
  },
  "outputDevice": {
    "type": "",
    "id": "",
    "attributes": []
  },
  "inputDevice": {
    "type": "",
    "id": "",
    "attributes": []
  }
};

/**
 * Wrapper that performs a deep copy of a request
 * @param {Request} request Request to be cloned
 */
function cloneRequest(request) {
  return JSON.parse(JSON.stringify(request));
}

/**
 * Remove a particular keyword from a string
 * @param {String} property The property being changed
 * @param {String} keyword The keyword to be removed
 */
function trimProperty(property, keyword) {
  var payloadLength = keyword.length;
  return property.slice(property.indexOf(keyword) + payloadLength);
}

function generateCastFromValueType(property, nodeRedType) {
  switch (nodeRedType) {
    case NodeRed.ValueTypes.FLOAT:
      return 'cast(cast(' + property + ', String), float)';
    case NodeRed.ValueTypes.STRING:
      return 'cast(' + property + ', String)';
    case NodeRed.ValueTypes.BOOL:
      return 'cast(cast(' + property + ', String), int)';
    default:
      return 'cast(' + property + ', String)';
  }
}

function convertNodeRedValueType(type) {
  switch (type) {
    case NodeRed.ValueTypes.FLOAT:
      return 'float';
    case NodeRed.ValueTypes.STRING:
      return 'string';
    default:
      return 'string';
  }
}

/**
 * Converts a moustache-encoded string with variables to something like a bash string with variables.
 * @param {String} template The template being translated
 * @param {Array} detectedVariables Array of detected variables
 */
function extractVariables(template, detectedVariables) {
  var beginTagIndex = template.search('{{');
  var endTagIndex = template.search('}}');
  var translatedTemplate = undefined;
  if ((beginTagIndex >= 0) && (endTagIndex >= 0) && (beginTagIndex < endTagIndex)) {
    var begin = template.slice(0, beginTagIndex);
    beginTagIndex += 2;
    var tag = template.slice(beginTagIndex, endTagIndex);
    endTagIndex += 2;
    var remaining = template.slice(endTagIndex);
    var convertedTag = trimProperty(tag, ".");
    detectedVariables.push('ev.' + convertedTag + '? as ' + convertedTag);
    translatedTemplate = begin + '${' + convertedTag + '}' + remaining;
    translatedTemplate = extractVariables(translatedTemplate, detectedVariables);

  } else {
    translatedTemplate = template;
  }
  return translatedTemplate;
}

function addFilter(node, ruleOperation, ruleValue, ruleType, request) {
  // As this is a 'dynamic' property for perseo, it must end with a question mark.
  var nodeProperty = trimProperty(node.property, '.');
  var nodePropertyWithCast = generateCastFromValueType(nodeProperty + '?', ruleType);
  request.pattern.otherFilters.push(' and (' + nodePropertyWithCast + ' ' + NodeRed.LogicalOperators[ruleOperation] + ' ' + ruleValue + ')');

  // TODO Change this to a proper comparison condition test, such as attribute > value
  request.inputDevice.attributes.push(nodeProperty);
}


/**
 * Generated a negated set of checks based on a list of rules.
 * All the rules are concatenated with AND operator. This function should be
 * used when dealing with 'otherwise' test keywords.
 * @param {Array} rules Set of rules with tags v (value), vt (value type) and t
 * operation type)
 * @param {Array} filters List of strings containing the current rules
 */
function generateNegatedRules(property, rules, filters) {
  var ruleOperation = undefined;
  var ruleValue = undefined;
  var ruleType = undefined;

  var nodeProperty = undefined;
  var nodePropertyWithCast = undefined;

  var rule = undefined;
  var filter = '';

  for (currRule in rules) {
    ruleOperation = rules[currRule].t;

    // If there is an opposite operator for this one.
    if (ruleOperation in NodeRed.NegatedLogicalOperators) {
      ruleValue = rules[currRule].v;
      ruleType = rules[currRule].vt;
      nodeProperty = trimProperty(property, '.');
      nodePropertyWithCast = generateCastFromValueType(nodeProperty + '?', ruleType);

      // Remember: all verifications are preceded by at least device ID (automatically added when
      // building the final perseo request.
      switch (ruleOperation) {
        case 'btwn':
          // Normally, this should be >= and <
          rule = nodePropertyWithCast + ' ' + NodeRed.LogicalOperators['lt'] + ' ' + ruleValue;
          ruleValue = rules[currRule].v2;
          rule += ' (' + nodePropertyWithCast + ' ' + NodeRed.LogicalOperators['gte'] + ' ' + ruleValue + ')';
          break;
        default:
          rule = ' (' + nodePropertyWithCast + ' ' + NodeRed.NegatedLogicalOperators[ruleOperation] + ' ' + ruleValue + ')';
      }

      // Very first part of this negated rule.
      if (filter.len == 0) {
        filter = rule;
      } else {
        filter += ' and ' + rule;
      }
    }
  }
  filters.push(filter);
}

/**
 * Extract content from node-RED nodes and translate them
 * to related structures in perseo-fe request.
 * @param {Array} objects Array of all objects in this flow
 * @param {Object} node node-RED node to be analyzed
 * @param {Request} request Current perseo-fe request. Keep in mind that
 * a particular node in node-RED can generate multiple requests for
 * perseo-fe
 * @param {String} deviceType The current device being analyzed (source
 * device).
 */
function extractDataFromNode(objects, node, request, deviceType, deviceName) {
  var nextNode = undefined;
  var perseoRequestResults = [];
  var tempResults = [];

  switch (node.type) {
    case NodeRed.NodeType.OUTPUT_DEVICE:
      var requestClone = cloneRequest(request);
      requestClone.outputDevice.id = node._device_id;
      if (node._device_type == "virtual") {
        requestClone.outputDevice.type = node._device_type;
        requestClone.outputDevice.attributes.push({
          "name": "Device",
          "type": "String",
          "value": node.attrs
        });
        requestClone.outputDevice.attributes.push({
          "name": "TimeInstant",
          "type": "ISO8601",
          "value": ""
        });
      }
      perseoRequestResults.push(requestClone);
      break;
    case NodeRed.NodeType.INPUT_DEVICE:
      // Check all further nodes - this is the source.
      for (var wireset = 0; wireset < node.wires.length; wireset++) {
        for (var wire = 0; wire < node.wires[wireset].length; wire++) {
          // Create a new request so that it can be modified by other boxes.
          var requestClone = cloneRequest(request);
          requestClone.inputDevice.type = 'device';
          requestClone.inputDevice.id = node._device_id;
          nextNode = objects[node.wires[wireset][wire]];
          var result = extractDataFromNode(objects, nextNode, requestClone, node._device_id, node.name);
          perseoRequestResults = tempResults.concat(result);
          tempResults = perseoRequestResults;
        }
      }
      break;
    case NodeRed.NodeType.SWITCH:
      var ruleOperation = undefined;
      var ruleValue = undefined;
      var ruleType = undefined;
      // Each wireset inherently iterates over rules
      for (var wireset = 0; wireset < node.wires.length; wireset++) {
        ruleOperation = node.rules[wireset].t;
        if (ruleOperation in NodeRed.LogicalOperators) {
          // If this operator is supported.
          var requestClone = cloneRequest(request);
          ruleValue = node.rules[wireset].v;
          ruleType = node.rules[wireset].vt;
          switch (ruleOperation) {
            case 'btwn':
              ruleOperation = 'gte';
              addFilter(node, ruleOperation, ruleValue, ruleType, requestClone);
              ruleOperation = 'lt';
              ruleValue = node.rules[wireset].v2;
              ruleType = node.rules[wireset].v2t;
              addFilter(node, ruleOperation, ruleValue, ruleType, requestClone);
              break;
            case 'else':
              generateNegatedRules(node.property, node.rules, requestClone.pattern.otherFilters);
              break;
            default:
              addFilter(node, ruleOperation, ruleValue, ruleType, requestClone);
          }
          requestClone.pattern.type = deviceType;
          for (var wire = 0; wire < node.wires[wireset].length; wire++) {
            nextNode = objects[node.wires[wireset][wire]];
            var result = extractDataFromNode(objects, nextNode, requestClone, deviceType, deviceName);
            perseoRequestResults = tempResults.concat(result);
            tempResults = perseoRequestResults;
          }

        }
      }
      break;
    case NodeRed.NodeType.CHANGE:
      // Need to create a new request for each rule
      for (var rule = 0; rule < node.rules.length; rule++) {
        // Other possible rules are: delete and move.
        if (node.rules[rule].t == 'set' || node.rules[rule].t == 'change') {
          var requestClone = cloneRequest(request);
          requestClone.action.type = PerseoTypes.ActionType.UPDATE;
          requestClone.action.parameters = {
            "attributes": [
              {
                "name": trimProperty(node.rules[rule].p, '.'),
                "type": convertNodeRedValueType(node.rules[rule].tot),
                "value": node.rules[rule].to
              }
            ]
          };
          requestClone.outputDevice.attributes.push(
            {
              "name": trimProperty(node.rules[rule].p, '.'),
              "type": convertNodeRedValueType(node.rules[rule].tot),
              "value": "" // No value at creation time
            }
          );

          // Keep checking further boxes - there might be further switches and other actions
          for (var wireset = 0; wireset < node.wires.length; wireset++) {
            for (var wire = 0; wire < node.wires[wireset].length; wire++) {
              nextNode = objects[node.wires[wireset][wire]];
              var result = extractDataFromNode(objects, nextNode, requestClone, deviceType, deviceName);
              perseoRequestResults = tempResults.concat(result);
              tempResults = perseoRequestResults;
            }
          }
        }
      }

      break;
    case NodeRed.NodeType.HTTP_REQUEST:
      switch (node.method) {
        case "POST":
          request.action.type = PerseoTypes.ActionType.POST;
          request.action.parameters = {
            "url": node.url,
            "method": "POST",
            "headers": {
              "Content-type": "text/plain"
            }
          };
          break;
      }
      perseoRequestResults.push(request);
      tempResults = perseoRequestResults;
      break;
    case NodeRed.NodeType.TEMPLATE:
      var requestClone = cloneRequest(request);
      var detectedVariables = [];
      requestClone.action.template = extractVariables(node.template, detectedVariables);
      var fullVariableList = requestClone.variables.concat(detectedVariables);
      requestClone.variables = fullVariableList;
      // Do the string substitution
      // Keep checking further boxes - there might be further switches and other actions
      for (var wireset = 0; wireset < node.wires.length; wireset++) {
        for (var wire = 0; wire < node.wires[wireset].length; wire++) {
          nextNode = objects[node.wires[wireset][wire]];
          var result = extractDataFromNode(objects, nextNode, requestClone, deviceType, deviceName);
          perseoRequestResults = tempResults.concat(result);
          tempResults = perseoRequestResults;
        }
      }
      break;
  }
  return perseoRequestResults;
}

/**
 * Transform the internal representation of perseo-fe requests to a format
 * that it actually can process.
 * @param {Request} requests An array of requests to be transformed.
 * @returns {PerseoRequest} An array of objects containing the properly transformed
 * requests.
 */
function transformToPerseoRequest(mashupId, requests, currSize) {
  perseoRequests = [];

  for (var i = 0; i < requests.length; i++) {
    var perseoRequest = {};

    // Change the mashupId dots to a underscore - perseo doesn't allow rule
    // names with dots.
    var ruleName = "rule_" + mashupId.replace(".", "_") + "_" + (i + 1 + currSize);

    perseoRequest['name'] = ruleName;
    perseoRequest['text'] = 'select *';
    perseoRequest['text'] += ', \"' + ruleName + '\" as ruleName';
    perseoRequest['text'] += ', ev.type? as Type';
    perseoRequest['text'] += ', ev.id? as ID';
    for (var othervar = 0; othervar < requests[i].variables.length; othervar++) {
      perseoRequest['text'] += ', ' + requests[i].variables[othervar];
    }

    perseoRequest['text'] += ' from pattern [';
    perseoRequest['text'] += 'every ev = iotEvent(';
    perseoRequest['text'] += 'id = \"' + requests[i].pattern.type + '\" ';
    for (var filter = 0; filter < requests[i].pattern.otherFilters.length; filter++) {
      perseoRequest['text'] += requests[i].pattern.otherFilters[filter] + ' ';
    }
    perseoRequest['text'] += ')]';
    perseoRequest['action'] = requests[i].action;
    if (requests[i].action.type == PerseoTypes.ActionType.UPDATE) {
      perseoRequest.action.parameters.id = requests[i].outputDevice.id;
      perseoRequest.action.parameters.type = requests[i].outputDevice.type;
    }
    perseoRequests.push({ ruleName, perseoRequest });
  }
  return perseoRequests;
}


/**
 * Transform the internal representation of orion requests to a format
 * that it actually can process.
 * @param {Request} requests An array of requests to be transformed.
 * @returns {Array} An array of objects containing the properly transformed
 * requests.
 */
function transformToOrionRequest(requests) {
  orionRequests = [];
  for (var i = 0; i < requests.length; i++) {
    // Virtual device creation requests
    var orionRequest = {};
    orionRequest.updateAction = "APPEND";
    orionRequest.contextElements = [{
      "type": requests[i].outputDevice.type,
      "isPattern": "false",
      "id": requests[i].outputDevice.id,
      "attributes": requests[i].outputDevice.attributes
    }];
    orionRequests.push(orionRequest);
  }

  return orionRequests;
}


/**
 * Transform the internal representation of orion subscription to a format
 * that it actually can process.
 * @param {Request} requests An array of requests to be transformed.
 * @returns {Array} An array of objects containing the properly transformed
 * requests.
 */
function transformToOrionSubscriptions(requests, subscribedVariables) {
  let orionSubscriptions = [];
  for (var i = 0; i < requests.length; i++) {
    // Perseo subscription requests.
    orionSubscription = {};
    orionSubscription.entities = [ ];
    orionSubscription.entities.push( {
      "type" : requests[i].inputDevice.type,
      "isPattern" : "false",
      "id" : requests[i].inputDevice.id
    });
    orionSubscription.reference = config.perseo_fe.url + "/notices";
    orionSubscription.duration = config.orion.default_duration;

    // One request per attribute
    for (var j = 0; j < requests[i].inputDevice.attributes.length; j++) {
      let subscribedVariable = '' + requests[i].inputDevice.id + ':' + requests[i].inputDevice.attributes[j];
      // If this exact variable has already a subscription, there is no need to do it again
      if (subscribedVariables.find(function(str) { return str === subscribedVariable}) == undefined) {
        subscribedVariables.push(subscribedVariable);
        let orionSubscriptionClone = cloneRequest(orionSubscription);
        orionSubscriptionClone.attributes = [ requests[i].inputDevice.attributes[j] ];
        orionSubscriptionClone.notifyConditions = [ {
          "type" : "ONCHANGE",
          "condValues" : [
            requests[i].inputDevice.attributes[j]
          ]
        }];
        orionSubscriptions.push(orionSubscriptionClone);
      }
    }
  }
  return orionSubscriptions;
}

/**
 * Translate a mashup from node-RED to a series of requests to perseo-fe.
 *
 * @param {String} mashupJson The string containing the node-RED mashup description
 * @returns An array of objects {ruleName, perseoRequest} ready to be added to the body of a HTTP POST message
 * to perseo-fe. The rule name is the ID of a flow (or tab-id in nodeRED terminology) and it should
 * be used to associate all the rules that a particular flow generated.
 */
function translateMashup(mashupJson) {
  var segmentedResults = {};
  var perseoResults = [];
  var orionResults = [];
  var orionSubsResults = [];
  var tempResults = [];
  var objects = {};

  // Record of which variables already have a subscription.
  var subscribedVariables = [];

  //var boxes = JSON.parse(mashupJson);
  var boxes = mashupJson;
  for (var i = 0; i < boxes.length; i++) {
    objects[boxes[i].id] = boxes[i];
  }


  for (var id in objects) {
    if (objects[id].type == 'device out') {
      var perseoRequest = cloneRequest(requestTemplate);
      var requests = extractDataFromNode(objects, objects[id], perseoRequest, objects[id].device);
      let perseoRequests = transformToPerseoRequest(objects[id].z, requests, perseoResults.length);
      let orionRequests = transformToOrionRequest(requests);
      let orionSubscriptions = transformToOrionSubscriptions(requests, subscribedVariables);

      tempResults = perseoResults.concat(perseoRequests);
      perseoResults = tempResults;
      tempResults = orionResults.concat(orionRequests);
      orionResults = tempResults;
      tempResults = orionSubsResults.concat(orionSubscriptions);
      orionSubsResults = tempResults;
    }
  }

  segmentedResults = {
    "perseoRequests": perseoResults,
    "orionRequests": orionResults,
    "orionSubscriptions" : orionSubsResults
  };

  return segmentedResults;
}

exports.translateMashup = translateMashup;
