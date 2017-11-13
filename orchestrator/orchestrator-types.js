/* jshint node: true */
"use strict";

/**
 * All constants from node-RED-generated flows
 */
var NodeRed = {
  NodeType: {
    OUTPUT_DEVICE: 'device in',
    INPUT_DEVICE: 'device out',
    SWITCH: 'switch',
    CHANGE: 'change',
    HTTP_REQUEST: 'http-request-out',
    TEMPLATE: 'template',
    GEOFENCE: 'geofence',
    EMAIL: 'e-mail',
    EDGEDETECTION: 'edgedetection',
    HTTP_POST: 'http post',
    HISTORY: 'history',
    INPUT_DEVICE_TEMPLATE: 'device template out'
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
    'typePattern': '',
    'idPattern' : '',
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
    'parameters' : {},
    'mirror' : false
  }
}

exports.NodeRed = NodeRed;
exports.OrionTypes = OrionTypes;
exports.PerseoTypes = PerseoTypes;
exports.requestTemplate = requestTemplate;
exports.orionSubscriptionTemplate = orionSubscriptionTemplate;
exports.perseoRuleTemplate = perseoRuleTemplate;
