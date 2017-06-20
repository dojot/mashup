
/**
 * Translate a JSON from node-RED to a perseo-fe request (only
 * body part).
 */

var util = require('util'),
    config = require('./config');

/**
 * All constants from node-RED-generated flows
 */
NodeRed = {
  NodeType: {
    OUTPUT_DEVICE: 'device in',
    INPUT_DEVICE: 'device out',
    SWITCH: 'switch',
    CHANGE: 'change',
    HTTP_REQUEST: 'http request',
    TEMPLATE: 'template',
    GEOFENCE: 'geofence',
    EMAIL: 'e-mail'
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
  },
  GeoFenceMode : {
    POLYLINE: 'polyline'
  }
}


// Orion types as described in:
// - https://jsapi.apiary.io/previews/null/introduction/specification/geographical-queries
OrionTypes = {
  GeoFenceMode : {
    POINT: "point",
    LINE: "line",
    POLYGON: "polygon",
    BOX: "box"
  },

  GeoFenceOperator: {
    NEAR: "near",
    COVEREDBY: "coveredBy",
    INTERSECTS: "intersects",
    EQUALS: "equals",
    DISJOINT: "disjoint"
  }
}

PerseoTypes = {
  ActionType: {
    UPDATE: 'update',
    POST: 'post',
    EMAIL: 'email'
  }
}

/**
 * @typedef {Object} Request
 * @property {String} name Rule name
 * @property {Array} variables Array of strings selecting which variables will be used in all
 * notifications generated by this request.
 * @property {Object} pattern Pattern to be matched to fire the rule. This property contains the
 * device type and an array of filters (in the form 'Variable? == value', in plain Strings)
 * @property {Object} action The action to be taken when an event matches this rule. Possible
 * types are:
 *  - NodeRed.NodeType.CHANGE : updates a variable in orion
 *  - NodeRed.NodeType.HTTP_REQUEST : sends a HTTP message to an arbitrary endpoint
 * @property {String} outputDevice: The device to be updated, if needed.
 * @property {Object} condition: All extra filters for this request, such as geofencing parameters.
 * @property {Object} flags: general flags to control what's happening with this structure.
 *  - hasGeoRef: indicates whether this structure has georef data or not.
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
  },
  "condition": {
    "expression" : {},
    "relatedPerseoRequests": []
  },
  "flags": {
    "hasGeoRef" : false
  }
};

/**
 * Wrapper that performs a deep copy of an object
 * @param {Object} obj Object to be cloned
 */
function cloneRequest(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Remove a particular keyword from a string.
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
 *
 * Example:
 * {{Variable}} contains this value {{Value}}
 *
 * becomes
 *
 * ${Variable} contains this value ${Value}
 * detectedVariables: ['ev.Variable? as Variable', 'ev.Value? as Value']
 *
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

/**
 * Adds a new filter to a perseo rule creation request.
 *
 * Example:
 * addFilter(node, '>', '10', 'integer', request), with node.property = "attr" will generate:
 * 'and (cast(cast(attr?, String), integer) > cast(10, integer))'
 *
 * @param {Object} node The node-red flow node being analyzed
 * @param {String} ruleOperation The rule operation to be added (like '<', '>', etc.)
 * @param {*} ruleValue Rule value (value cast will be generated by this function, no need to add it beforehand)
 * @param {String} ruleType Value type, such as float, integer or String.
 * @param {Object} request The request being built.
 */
function addFilter(node, ruleOperation, ruleValue, ruleType, request) {
  // As this is a 'dynamic' property for perseo, it must end with a question mark.
  var nodeProperty = trimProperty(node.property, '.');
  var nodePropertyWithCast = generateCastFromValueType(nodeProperty + '?', ruleType);
  var ruleValueWithCast = generateCastFromValueType('\"' + ruleValue + '\"', ruleType);
  request.pattern.otherFilters.push(' and (' + nodePropertyWithCast + ' ' + NodeRed.LogicalOperators[ruleOperation] + ' ' + ruleValueWithCast + ')');

  // TODO Change this to a proper comparison condition test, such as attribute > value
  request.inputDevice.attributes.push(nodeProperty);
}


/**
 * Generated a negated set of checks based on a list of rules.
 * All the rules are concatenated with AND operator. This function should be
 * used when dealing with 'otherwise' test keywords in 'switch' nodes.
 *
 * Example:
 * switch:
 *  - value > 10
 *  - value < 5
 *
 * becomes:
 *  "(cast(cast(value?, String), integer) <= 10)", "and (cast(cast(value?, String), integer) >= 5)"
 *
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
      ruleType = rules[currRule].vt;
      ruleValue = generateCastFromValueType('\"' + rules[currRule].v + '\"', ruleType);
      nodeProperty = trimProperty(property, '.');
      nodePropertyWithCast = generateCastFromValueType(nodeProperty + '?', ruleType);

      // Remember: all verifications are preceded by at least device ID (automatically added when
      // building the final perseo request.
      switch (ruleOperation) {
        case 'btwn':
          // Normally, this should be >= and <
          rule = nodePropertyWithCast + ' ' + NodeRed.LogicalOperators['lt'] + ' ' + ruleValue;
          ruleValue = generateCastFromValueType('\"' + rules[currRule].v2 + '\"', ruleType);
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

          requestClone.pattern.type = deviceType;
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
          for (var wire = 0; wire < node.wires[wireset].length; wire++) {
            nextNode = objects[node.wires[wireset][wire]];
            var result = extractDataFromNode(objects, nextNode, requestClone, deviceType, deviceName);
            perseoRequestResults = tempResults.concat(result);
            tempResults = perseoRequestResults;
          }
        }
      }
      break;
    case NodeRed.NodeType.GEOFENCE:
      if (node.inside == "true") {
        request.condition.expression.georel = OrionTypes.GeoFenceOperator.COVEREDBY;
      } else {
        request.condition.expression.georel = OrionTypes.GeoFenceOperator.DISJOINT;
      }

      if (node.mode == NodeRed.GeoFenceMode.POLYLINE) {
        request.condition.expression.geometry = OrionTypes.GeoFenceMode.POLYGON;
        request.condition.expression.coords = "";
        for (var i = 0; i < node.points.length; i++) {
          let point = node.points[i];
          request.condition.expression.coords += point.latitude + ',' + point.longitude + ';';
        }
        // Closing the polygon
        request.condition.expression.coords += node.points[0].latitude + ',' + node.points[0].longitude;
      }

      request.flags.hasGeoRef = true;
      for (var wireset = 0; wireset < node.wires.length; wireset++) {
        for (var wire = 0; wire < node.wires[wireset].length; wire++) {
          nextNode = objects[node.wires[wireset][wire]];
          var result = extractDataFromNode(objects, nextNode, request, deviceType, deviceName);
          perseoRequestResults = tempResults.concat(result);
          tempResults = perseoRequestResults;
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
    case NodeRed.NodeType.EMAIL:
      request.action.type = PerseoTypes.ActionType.EMAIL;
      request.action.parameters = {
        "to": node.to,
        "from": node.from,
        "subject": node.subject,
        "smtp" : node.server
      };
      perseoRequestResults.push(request);
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
function transformToPerseoRequests(mashupId, requests, currSize) {
  perseoRequests = [];

  for (var i = 0; i < requests.length; i++) {
    // Let's save the rule name before anything.
    // If there is georef information in this request we won't run into trouble
    // with rule names when creating the related perseo request.
    let ruleName = "rule_" + mashupId.replace(".", "_") + "_" + (i + 1 + currSize);
    requests[i].name = ruleName;

    if (requests[i].flags.hasGeoRef == true) {
      // This should not be added right now - it depends on a subscription to orion
      continue;
    }

    // Change the mashupId dots to a underscore - perseo doesn't allow rule
    // names with dots.
    let perseoRequest = transformToPerseoRequest(requests[i]);
    perseoRequests.push({ruleName, perseoRequest});
  }
  return perseoRequests;
}

/**
 * Transform the internal representation of perseo-fe request to a format
 * that it actually can process.
 * @param {Request} request A request to be transformed.
 * @returns {PerseoRequest} An array of objects containing the properly transformed
 * request.
 */
function transformToPerseoRequest(request) {
  var perseoRequest = {};

  perseoRequest['name'] = request.name;
  perseoRequest['text'] = 'select *';
  perseoRequest['text'] += ', \"' + request.name + '\" as ruleName';
  perseoRequest['text'] += ', ev.type? as Type';
  perseoRequest['text'] += ', ev.id? as ID';
  for (var othervar = 0; othervar < request.variables.length; othervar++) {
    perseoRequest['text'] += ', ' + request.variables[othervar];
  }

  perseoRequest['text'] += ' from pattern [';
  perseoRequest['text'] += 'every ev = iotEvent(';
  perseoRequest['text'] += 'id? = \"' + request.pattern.type + '\" ';
  for (var filter = 0; filter < request.pattern.otherFilters.length; filter++) {
    perseoRequest['text'] += request.pattern.otherFilters[filter] + ' ';
  }
  perseoRequest['text'] += ')]';
  perseoRequest['action'] = request.action;
  if (request.action.type == PerseoTypes.ActionType.UPDATE) {
    perseoRequest.action.parameters.id = request.outputDevice.id;
    perseoRequest.action.parameters.type = request.outputDevice.type;
  }

  return perseoRequest;
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
        orionSubscriptionClone.duration = "P100Y"; // 100 years subscription.
        orionSubscriptions.push(orionSubscriptionClone);
      }
    }
  }
  return orionSubscriptions;
}


/**
 * Transform the internal representation of orion subscription to a format
 * that it actually can process.
 * The actual subscription is contained in 'subscription' attribute.
 * @param {Request} requests An array of requests to be transformed.
 * @returns {Array} An array of objects containing the properly transformed
 * requests.
 */
function transformToOrionGeoRefSubscriptions(requests, subscribedVariables) {
  let orionSubscriptions = [];
  for (var i = 0; i < requests.length; i++) {
    if (requests[i].flags.hasGeoRef == true) {
      // Perseo subscription requests.
      let orionSubscription = {
        subscription : {
          description: "",
          subject: {
            entities: [],
            condition: {
              expression: {}
            }
          },
          notification: {
            http: {
              url: ""
            },
            attrs: []
          }
        },
        relatedPerseoRequests: []
      };
      orionSubscription.subscription.description = "Geofence subscription for " + requests[i].inputDevice.id;
      orionSubscription.subscription.subject.entities.push( {
        "type" : requests[i].inputDevice.type,
        "id" : requests[i].inputDevice.id
      });

      orionSubscription.subscription.subject.condition.expression = requests[i].condition.expression;
      orionSubscription.subscription.notification.http.url = config.perseo_fe.url + "/noticesv2";

      // v2 subscriptions don't need duration specification.

      // These perseo rules need an extra "and subscriptionId == XYZ" filter. This value will
      // only be available after creating the subscription. We will save them with the georef
      // subscriptions so that the post-processing request function can be properly executed.
      orionSubscription.relatedPerseoRequests.push(requests[i]);
      orionSubscriptions.push(orionSubscription);
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
  var orionGeoRefSubsResults = [];
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
      let perseoRequests = transformToPerseoRequests(objects[id].z, requests, perseoResults.length);
      let orionRequests = transformToOrionRequest(requests);
      let orionSubscriptions = transformToOrionSubscriptions(requests, subscribedVariables);
      let orionGeoRefSubscriptions = transformToOrionGeoRefSubscriptions(requests);

      tempResults = perseoResults.concat(perseoRequests);
      perseoResults = tempResults;
      tempResults = orionResults.concat(orionRequests);
      orionResults = tempResults;
      tempResults = orionSubsResults.concat(orionSubscriptions);
      orionSubsResults = tempResults;
      tempResults = orionGeoRefSubsResults.concat(orionGeoRefSubscriptions);
      orionGeoRefSubsResults = tempResults;
    }
  }

  segmentedResults = {
    "perseoRequests": perseoResults,
    "orionRequests": orionResults,
    "orionSubscriptions" : orionSubsResults,
    "orionGeoRefSubscriptions" : orionGeoRefSubsResults
  };

  return segmentedResults;
}

/**
 * Adds a new filter to a set of perseo requests related to a orion subscription.
 *
 * When dealing with georeferenced nodes, a perseo rule cannot be added before creating
 * a subscription in orion - as perseo is not able to work with georef values. Therefore,
 * all associated rules must be updated so that the orion subscription ID is added to
 * the filter list.
 *
 * @param {Array} relatedPerseoRequests The perseo requests to be modified.
 * @param {String} subscriptionId The subscription ID to be added
 */
function doGeoRefPostTranslation(relatedPerseoRequests, subscriptionId) {
  // TODO Check if changing attributes from an object inside an array actually changes it (not a copy of it)
  let perseoRequests = []
  for (let i = 0; i < relatedPerseoRequests.length; i++) {
    let perseoRequest = relatedPerseoRequests[i];
    let ruleName = perseoRequest.name;

    // If the only test in this flow is a georef node.
    if (perseoRequest.pattern.type == "") {
      perseoRequest.pattern.type = perseoRequest.inputDevice.id;
    }

    addFilter({property : 'subscriptionId'}, 'eq', subscriptionId, NodeRed.ValueTypes.STRING, perseoRequest);
    perseoRequests.push(transformToPerseoRequest(perseoRequest));
  }
  return perseoRequests;
}

exports.translateMashup = translateMashup;
exports.doGeoRefPostTranslation = doGeoRefPostTranslation;
