/* jshint node: true */
"use strict";
var fs = require('fs'),
    util = require('util'),
    translator = require('../../../orchestrator/translator.js'),
    chai = require('chai');

var expect = chai.expect;


function execute() {
  describe('Orion subscriptions', function() {
    describe('Generate Orion subscription with no tests', function() {
      it('should generate the subscription request without errors', function(done) {
        let requests = [];
        let expected = {};

        function reset() {
          requests = [
            {
              "name": "",
              "variables": [],
              "internalVariables": {},
              "pattern": {
                "fixedEventConditions" : [],
                "fixedEventSubscriptionId" : "",
                "firstEventConditions": [],
                "firstEventSubscriptionId" : "",
                "secondEventConditions": [],
                "secondEventSubscriptionId" : ""
              },
              "action": {
                "notificationEndpoint": "perseo-endpoint",
                "type": "",
                "template": "",
                "parameters": {}
              },
              "inputDevice": {
                "type": "device",
                "id": "device-id-1",
                "attributes": []
              }
            }
          ];
          expected = {
            "subscription": {
              "description": "Subscription for device-id-1",
              "notification": {
                "http": {
                  "url": "perseo-endpoint"
                }
              },
              "subject": {
                "entities": [
                  {
                    "id": "device-id-1",
                    "type": "device"
                  }
                ]
              }
            },
            "subscriptionOrder": 0
          };
        };

        reset();
        let results = translator.transformToOrionSubscriptions(requests);
        expect(results.length).to.equal(1);
        expect(results[0].subscription).to.deep.equal(expected.subscription);
        done();
      });
    });

    describe('Generate Orion subscription with fixed logical tests', function() {
      it('should generate the subscription request without errors', function(done) {
        let requests = [];
        let expected = {};

        function reset() {
          requests = [
            {
              "name": "",
              "variables": ["temperature", "pressure"],
              "internalVariables": {},
              "pattern": {
                "fixedEventConditions" : [
                  {"q" : "temperature>50"},
                  {"q" : "pressure<1.5"}
                ],
                "fixedEventSubscriptionId" : "",
                "firstEventConditions": [],
                "firstEventSubscriptionId" : "",
                "secondEventConditions": [],
                "secondEventSubscriptionId" : ""
              },
              "action": {
                "notificationEndpoint": "perseo-endpoint",
                "type": "",
                "template": "",
                "parameters": {}
              },
              "inputDevice": {
                "type": "device",
                "id": "device-id-1",
                "attributes": ["temperature", "pressure"]
              }
            }
          ];
          expected = {
            "subscription": {
              "description": "Subscription for device-id-1",
              "notification": {
                "http": {
                  "url": "perseo-endpoint"
                }
              },
              "subject": {
                "entities": [
                  {
                    "id": "device-id-1",
                    "type": "device"
                  }
                ],
                "condition": {
                  "attrs": ["temperature", "pressure"],
                  "expression": {
                    "q" : "temperature>50; pressure<1.5"
                  }
                }
              }
            },
            "subscriptionOrder": 0
          };
        };

        reset();
        let results = translator.transformToOrionSubscriptions(requests);
        expect(results.length).to.equal(1);
        expect(results[0].subscription).to.deep.equal(expected.subscription);
        done();
      });
    });


    describe('Generate Orion subscription with fixed georef tests', function() {
      it('should generate the subscription request without errors', function(done) {
        let requests = [];
        let expected = {};

        function reset() {
          requests = [
            {
              "name": "",
              "variables": ["position"],
              "internalVariables": {},
              "pattern": {
                "fixedEventConditions" : [
                  {"georel" : "coveredBy", "coords" : "0,0;0,1;1,1;1,0;0,0;", "geometry" : "polygon"}
                ],
                "fixedEventSubscriptionId" : "",
                "firstEventConditions": [],
                "firstEventSubscriptionId" : "",
                "secondEventConditions": [],
                "secondEventSubscriptionId" : ""
              },
              "action": {
                "notificationEndpoint": "perseo-endpoint",
                "type": "",
                "template": "",
                "parameters": {}
              },
              "inputDevice": {
                "type": "device",
                "id": "device-id-1",
                "attributes": ["position"]
              }
            }
          ];
          expected = {
            "subscription": {
              "description": "Subscription for device-id-1",
              "notification": {
                "http": {
                  "url": "perseo-endpoint"
                }
              },
              "subject": {
                "entities": [
                  {
                    "id": "device-id-1",
                    "type": "device"
                  }
                ],
                "condition": {
                  "attrs": ["position"],
                  "expression": {
                    "georel" : "coveredBy", "coords" : "0,0;0,1;1,1;1,0;0,0;", "geometry" : "polygon"
                  }
                }
              }
            },
            "subscriptionOrder": 0
          };
        };

        reset();
        let results = translator.transformToOrionSubscriptions(requests);
        expect(results.length).to.equal(1);
        expect(results[0].subscription).to.deep.equal(expected.subscription);
        done();
      });
    });



    describe('Generate Orion subscription with mixed (logical and georef) tests', function() {
      it('should generate the subscription request without errors', function(done) {
        let requests = [];
        let expected = {};

        function reset() {
          requests = [
            {
              "name": "",
              "variables": ["position", "temperature", "pressure"],
              "internalVariables": {},
              "pattern": {
                "fixedEventConditions" : [
                  {"georel" : "coveredBy", "coords" : "0,0;0,1;1,1;1,0;0,0;", "geometry" : "polygon"},
                  {"q" : "temperature>50"},
                  {"q" : "pressure<1.5"}
                ],
                "fixedEventSubscriptionId" : "",
                "firstEventConditions": [],
                "firstEventSubscriptionId" : "",
                "secondEventConditions": [],
                "secondEventSubscriptionId" : ""
              },
              "action": {
                "notificationEndpoint": "perseo-endpoint",
                "type": "",
                "template": "",
                "parameters": {}
              },
              "inputDevice": {
                "type": "device",
                "id": "device-id-1",
                "attributes": ["position", "temperature", "pressure"]
              }
            }
          ];
          expected = {
            "subscription": {
              "description": "Subscription for device-id-1",
              "notification": {
                "http": {
                  "url": "perseo-endpoint"
                }
              },
              "subject": {
                "entities": [
                  {
                    "id": "device-id-1",
                    "type": "device"
                  }
                ],
                "condition": {
                  "attrs": ["position", "temperature", "pressure"],
                  "expression": {
                    "georel" : "coveredBy", "coords" : "0,0;0,1;1,1;1,0;0,0;", "geometry" : "polygon",
                    "q" : "temperature>50; pressure<1.5"
                  }
                }
              }
            },
            "subscriptionOrder": 0
          };
        };

        reset();
        let results = translator.transformToOrionSubscriptions(requests);
        expect(results.length).to.equal(1);
        expect(results[0].subscription).to.deep.equal(expected.subscription);
        done();
      });
    });


    describe('Generate Orion subscription with chained logical tests', function() {
      it('should generate the subscription request without errors', function(done) {
        let requests = [];
        let expected = {};

        function reset() {
          requests = [
            {
              "name": "",
              "variables": ["temperature", "pressure"],
              "internalVariables": {},
              "pattern": {
                "fixedEventConditions" : [],
                "fixedEventSubscriptionId" : "",
                "firstEventConditions": [
                  {"q" : "temperature>50"},
                  {"q" : "pressure<1.5"}
                ],
                "firstEventSubscriptionId" : "",
                "secondEventConditions": [
                  {"q" : "temperature>150"},
                  {"q" : "pressure<11.5"}
                ],
                "secondEventSubscriptionId" : ""
              },
              "action": {
                "notificationEndpoint": "perseo-endpoint",
                "type": "",
                "template": "",
                "parameters": {}
              },
              "inputDevice": {
                "type": "device",
                "id": "device-id-1",
                "attributes": ["temperature", "pressure"]
              }
            }
          ];
          expected = [
            {
              "subscription": {
                "description": "Subscription for device-id-1",
                "notification": {
                  "http": {
                    "url": "perseo-endpoint"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "device-id-1",
                      "type": "device"
                    }
                  ],
                  "condition": {
                    "attrs": ["temperature", "pressure"],
                    "expression": {
                      "q" : "temperature>50; pressure<1.5"
                    }
                  }
                }
              },
              "subscriptionOrder": 1
            },
            {
              "subscription": {
                "description": "Subscription for device-id-1",
                "notification": {
                  "http": {
                    "url": "perseo-endpoint"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "device-id-1",
                      "type": "device"
                    }
                  ],
                  "condition": {
                    "attrs": ["temperature", "pressure"],
                    "expression": {
                      "q" : "temperature>150; pressure<11.5"
                    }
                  }
                }
              },
              "subscriptionOrder": 2
            }
          ];
        };

        reset();
        let results = translator.transformToOrionSubscriptions(requests);
        expect(results.length).to.equal(2);
        expect(results[0].subscription).to.deep.equal(expected[0].subscription);
        expect(results[1].subscription).to.deep.equal(expected[1].subscription);
        done();
      });
    });

    describe('Generate Orion subscription with chained georef tests', function() {
      it('should generate the subscription request without errors', function(done) {
        let requests = [];
        let expected = {};

        function reset() {
          requests = [
            {
              "name": "",
              "variables": ["position"],
              "internalVariables": {},
              "pattern": {
                "fixedEventConditions" : [],
                "fixedEventSubscriptionId" : "",
                "firstEventConditions": [
                  {"georel" : "coveredBy", "coords" : "0,0;0,1;1,1;1,0;0,0;", "geometry" : "polygon"}
                ],
                "firstEventSubscriptionId" : "",
                "secondEventConditions": [
                  {"georel" : "coveredBy", "coords" : "10,10;10,11;11,11;11,10;10,10;", "geometry" : "polygon"}
                ],
                "secondEventSubscriptionId" : ""
              },
              "action": {
                "notificationEndpoint": "perseo-endpoint",
                "type": "",
                "template": "",
                "parameters": {}
              },
              "inputDevice": {
                "type": "device",
                "id": "device-id-1",
                "attributes": ["position"]
              }
            }
          ];
          expected = [
            {
              "subscription": {
                "description": "Subscription for device-id-1",
                "notification": {
                  "http": {
                    "url": "perseo-endpoint"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "device-id-1",
                      "type": "device"
                    }
                  ],
                  "condition": {
                    "attrs": ["position"],
                    "expression": {
                      "georel" : "coveredBy", "coords" : "0,0;0,1;1,1;1,0;0,0;", "geometry" : "polygon"
                    }
                  }
                }
              },
              "subscriptionOrder": 1
            },
            {
              "subscription": {
                "description": "Subscription for device-id-1",
                "notification": {
                  "http": {
                    "url": "perseo-endpoint"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "device-id-1",
                      "type": "device"
                    }
                  ],
                  "condition": {
                    "attrs": ["position"],
                    "expression": {
                      "georel" : "coveredBy", "coords" : "10,10;10,11;11,11;11,10;10,10;", "geometry" : "polygon"
                    }
                  }
                }
              },
              "subscriptionOrder": 2
            }
          ];
        };

        reset();
        let results = translator.transformToOrionSubscriptions(requests);
        expect(results.length).to.equal(2);
        expect(results[0].subscription).to.deep.equal(expected[0].subscription);
        expect(results[1].subscription).to.deep.equal(expected[1].subscription);
        done();
      });
    });


    describe('Generate Orion subscription with chained mixed (logical and georef) tests', function() {
      it('should generate the subscription request without errors', function(done) {
        let requests = [];
        let expected = {};

        function reset() {
          requests = [
            {
              "name": "",
              "variables": ["position", "temperature", "pressure"],
              "internalVariables": {},
              "pattern": {
                "fixedEventConditions" : [],
                "fixedEventSubscriptionId" : "",
                "firstEventConditions": [
                  {"georel" : "coveredBy", "coords" : "0,0;0,1;1,1;1,0;0,0;", "geometry" : "polygon"},
                  {"q" : "temperature>50"},
                  {"q" : "pressure<1.5"}
                ],
                "firstEventSubscriptionId" : "",
                "secondEventConditions": [
                  {"georel" : "coveredBy", "coords" : "10,10;10,11;11,11;11,10;10,10;", "geometry" : "polygon"},
                  {"q" : "temperature>150"},
                  {"q" : "pressure<11.5"}
                ],
                "secondEventSubscriptionId" : ""
              },
              "action": {
                "notificationEndpoint": "perseo-endpoint",
                "type": "",
                "template": "",
                "parameters": {}
              },
              "inputDevice": {
                "type": "device",
                "id": "device-id-1",
                "attributes": ["position", "temperature", "pressure"]
              }
            }
          ];
          expected = [
            {
              "subscription": {
                "description": "Subscription for device-id-1",
                "notification": {
                  "http": {
                    "url": "perseo-endpoint"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "device-id-1",
                      "type": "device"
                    }
                  ],
                  "condition": {
                    "attrs": ["position", "temperature", "pressure"],
                    "expression": {
                      "georel" : "coveredBy", "coords" : "0,0;0,1;1,1;1,0;0,0;", "geometry" : "polygon",
                      "q" : "temperature>50; pressure<1.5"
                    }
                  }
                }
              },
              "subscriptionOrder": 1
            },
            {
              "subscription": {
                "description": "Subscription for device-id-1",
                "notification": {
                  "http": {
                    "url": "perseo-endpoint"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "device-id-1",
                      "type": "device"
                    }
                  ],
                  "condition": {
                    "attrs": ["position", "temperature", "pressure"],
                    "expression": {
                      "georel" : "coveredBy", "coords" : "10,10;10,11;11,11;11,10;10,10;", "geometry" : "polygon",
                      "q" : "temperature>150; pressure<11.5"
                    }
                  }
                }
              },
              "subscriptionOrder": 2
            }
          ];
        };

        reset();
        let results = translator.transformToOrionSubscriptions(requests);
        expect(results.length).to.equal(2);
        expect(results[0].subscription).to.deep.equal(expected[0].subscription);
        expect(results[1].subscription).to.deep.equal(expected[1].subscription);
        done();
      });
    });

  });

  describe('Perseo rules', function() {
    describe('Generate Perseo rule with UPDATE action', function() {
      it('should generate the rule creation request without errors', function(done) {
        let request = {};
        let expected = {};

        function reset() {
          request = {
            "name": "simple-rule-1",
            "variables": ["temperature"],
            "internalVariables": {
              'output-var' : {
                'attr1' : '{{payload.temperature}}'
              }
            },
            "pattern": {
              "fixedEventConditions" : [],
              "fixedEventSubscriptionId" : "123456",
              "firstEventConditions": [],
              "firstEventSubscriptionId" : "",
              "secondEventConditions": [],
              "secondEventSubscriptionId" : ""
            },
            "action": {
              "notificationEndpoint": "perseo-endpoint",
              "type": "update",
              "template": "",
              "parameters": {
                "id" : "output-device-id",
                "type" : "virtual",
                "isPattern" : false,
                "attributes" : "output-var"
              }
            },
            "inputDevice": {
              "type": "device",
              "id": "device-id-1",
              "attributes": []
            }
          };
          expected = {
            "action": {
              "parameters": {
                "attributes": [
                  {
                    "name": "attr1",
                    "value": "${temperature}"
                  }
                ],
                "id": "output-device-id",
                "isPattern": false,
                "type": "virtual",
              },
              "template": "",
              "type": "update",
            },
            "name": "simple-rule-1",
            "text": "select *, \"simple-rule-1\" as ruleName, ev.temperature? as temperature from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"123456\")]"
          }
        };

        reset();
        let results = translator.transformToPerseoRequest(request);
        expect(results).to.deep.equal(expected);
        done();
      });
    });
describe('Generate Perseo rule with UPDATE action', function() {
      it('should generate the rule creation request without errors', function(done) {
        let request = {};
        let expected = {};

        function reset() {
          request = {
            "name": "simple-rule-1",
            "variables": ["temperature"],
            "internalVariables": {
              'output-var' : {
                'attr1' : '{{payload.temperature}}'
              }
            },
            "pattern": {
              "fixedEventConditions" : [],
              "fixedEventSubscriptionId" : "123456",
              "firstEventConditions": [],
              "firstEventSubscriptionId" : "",
              "secondEventConditions": [],
              "secondEventSubscriptionId" : ""
            },
            "action": {
              "notificationEndpoint": "perseo-endpoint",
              "type": "update",
              "template": "",
              "parameters": {
                "id" : "output-device-id",
                "type" : "virtual",
                "isPattern" : false,
                "attributes" : "output-var"
              }
            },
            "inputDevice": {
              "type": "device",
              "id": "device-id-1",
              "attributes": []
            }
          };
          expected = {
            "action": {
              "parameters": {
                "attributes": [
                  {
                    "name": "attr1",
                    "value": "${temperature}"
                  }
                ],
                "id": "output-device-id",
                "isPattern": false,
                "type": "virtual",
              },
              "template": "",
              "type": "update",
            },
            "name": "simple-rule-1",
            "text": "select *, \"simple-rule-1\" as ruleName, ev.temperature? as temperature from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"123456\")]"
          }
        };

        reset();
        let results = translator.transformToPerseoRequest(request);
        expect(results).to.deep.equal(expected);
        done();
      });
    });

    describe('Generate Perseo rule with EMAIL action', function() {
      it('should generate the rule creation request without errors', function(done) {
        let request = {};
        let expected = {};

        function reset() {
          request = {
            "name": "simple-rule-1",
            "variables": ["temperature"],
            "internalVariables": {
              'email-body' : "This is an email body with {{payload.temperature}}"
            },
            "pattern": {
              "fixedEventConditions" : [],
              "fixedEventSubscriptionId" : "123456",
              "firstEventConditions": [],
              "firstEventSubscriptionId" : "",
              "secondEventConditions": [],
              "secondEventSubscriptionId" : ""
            },
            "action": {
              "notificationEndpoint": "perseo-endpoint",
              "type": "email",
              "template": "",
              "parameters": {
                "to" : "to@user.com",
                "from" : "from@user.com",
                "subject" : "This is a test",
                "smtp" : "smtp@server.com",
                "body" : "email-body"
              }
            },
            "inputDevice": {
              "type": "device",
              "id": "device-id-1",
              "attributes": []
            }
          };
          expected = {
            "action": {
              "parameters": {
                "to" : "to@user.com",
                "from" : "from@user.com",
                "subject" : "This is a test",
                "smtp" : "smtp@server.com",
                "body" : "This is an email body with ${temperature}"
              },
              "template": "",
              "type": "email",
            },
            "name": "simple-rule-1",
            "text": "select *, \"simple-rule-1\" as ruleName, ev.temperature? as temperature from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"123456\")]"
          }
        };

        reset();
        let results = translator.transformToPerseoRequest(request);
        expect(results).to.deep.equal(expected);
        done();
      });
    });

  });
}

exports.execute = execute;