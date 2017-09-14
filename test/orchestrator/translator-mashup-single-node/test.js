/* jshint node: true */
"use strict";
var fs = require('fs'),
    util = require('util'),
    translator = require('../../../orchestrator/translator.js'),
    chai = require('chai');

var expect = chai.expect;


function execute() {
  describe('Internal process of flow nodes', function() {
    describe('Add an input device node', function() {
      it('should update the prototype properly', function(done) {

        let node = {};
        let objects = [];
        let request = {};
        let expected = {};
        let result = [];

        function reset() {
          node = {
            "id": "12345",
            "type": "device out",
            "name": "input-device",
            "device": "device",
            "_device_id": "abcd",
            "_device_label": "simple-device",
            "_device_type": "device",
            "wires": [
              []
            ]
          }

          objects[node.id] = node;

          request = {
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
              "type": "",
              "template": "", "mirror": false,
              "parameters": {}
            },
            "inputDevice": {
              "type": "",
              "id": "",
              "attributes": []
            }
          };

          expected = {
            request : {
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
                "type": "",
                "template": "", "mirror": false,
                "parameters": {}
              },
              "inputDevice": {
                "type": "device",
                "id": "",
                "attributes": []
              }
            }
          };
          result = [];
        }

        reset();
        expected.request.inputDevice.type = 'device';
        expected.request.inputDevice.id = 'abcd';
        result = translator.extractDataFromNode(objects, node, request);
        expect(result.requestList.length).equal(1);
        expect(result.requestList[0]).to.deep.equal(expected.request);

        done();
      });
    });

    describe('Add switch node', function() {
      it('should update the prototype properly', function(done) {
        let node = {};
        let objects = [];
        let request = {};
        let expected = {};
        let result = [];

        function reset() {
          node = {
            "id": "7ca9cb19.44a89c",
            "type": "switch",
            "z": "8b67149a.2cd508",
            "name": "",
            "property": "payload.TestedVariable",
            "propertyType": "msg",
            "rules": [
                {
                    "t": "eq",
                    "v": "abcdef",
                    "vt": "str"
                },
                {
                    "t": "eq",
                    "v": "123456",
                    "vt": "str"
                }
            ],
            "checkall": "true",
            "outputs": 2,
            "x": 632,
            "y": 388.3500061035156,
            "wires": [
                [],
                []
            ]
          }

          objects[node.id] = node;

          request = {
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
              "type": "",
              "template": "", "mirror": false,
              "parameters": {}
            },
            "inputDevice": {
              "type": "",
              "id": "",
              "attributes": []
            }
          };

          expected = {
            request : {
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
                "type": "",
                "template": "", "mirror": false,
                "parameters": {}
              },
              "inputDevice": {
                "type": "",
                "id": "",
                "attributes": []
              }
            }
          };
          result = [];
        }

        reset();
        result = translator.extractDataFromNode(objects, node, request);
        expect(result.requestList.length).equal(2);
        expected.request.pattern.fixedEventConditions = [{'q' : 'TestedVariable == abcdef'}];
        expected.request.inputDevice.attributes = ['TestedVariable'];
        expected.request.variables = ['TestedVariable'];
        expect(result.requestList[0]).to.deep.equal(expected.request);

        expected.request.pattern.fixedEventConditions = [{'q' : 'TestedVariable == 123456'}];
        expected.request.inputDevice.attributes = ['TestedVariable'];
        expected.request.variables = ['TestedVariable'];
        expect(result.requestList[1]).to.deep.equal(expected.request);

        done();
      });
    });


    describe('Add edgedetection node', function() {
      it('should update the prototype properly', function(done) {
        let node = {};
        let objects = [];
        let request = {};
        let expected = {};
        let result = [];

        function reset() {
          node = {
            "id": "a8c852c.e26873",
            "type": "edgedetection",
            "z": "e567a343.4ffb6",
            "name": "",
            "property": "payload.attr1",
            "propertyType": "msg",
            "rules": [
                {
                    "t": "edge-up",
                    "v": "100",
                    "vt": "num"
                },
                {
                    "t": "edge-down",
                    "v": "200",
                    "vt": "num"
                }
            ],
            "outputs": 2,
            "x": 555,
            "y": 292.3500061035156,
            "wires": [
                [],
                []
            ]
          }

          objects[node.id] = node;

          request = {
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
              "type": "",
              "template": "", "mirror": false,
              "parameters": {}
            },
            "inputDevice": {
              "type": "",
              "id": "",
              "attributes": []
            }
          };

          expected = {
            request : {
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
                "type": "",
                "template": "", "mirror": false,
                "parameters": {}
              },
              "inputDevice": {
                "type": "",
                "id": "",
                "attributes": []
              }
            }
          };
          result = [];
        }

        reset();
        result = translator.extractDataFromNode(objects, node, request);
        expect(result.requestList.length).equal(2);

        expected.request.pattern.firstEventConditions = [{'q' : 'attr1 < 100'}];
        expected.request.pattern.secondEventConditions = [{'q' : 'attr1 >= 100'}];
        expected.request.inputDevice.attributes = ['attr1'];
        expected.request.variables = ['attr1'];
        expect(result.requestList[0]).to.deep.equal(expected.request);

        expected.request.pattern.firstEventConditions = [{'q' : 'attr1 >= 200'}];
        expected.request.pattern.secondEventConditions = [{'q' : 'attr1 < 200'}];
        expected.request.inputDevice.attributes = ['attr1'];
        expected.request.variables = ['attr1'];
        expect(result.requestList[1]).to.deep.equal(expected.request);
        done();
      });
    });

    describe('Add geofence node', function() {
      it('should update the prototype properly', function(done) {
        let node = {};
        let objects = [];
        let request = {};
        let expected = {};
        let result = {};

        function reset() {
          node = {
            "id": "7c47ea69.86dedc",
            "type": "geofence",
            "z": "e567a343.4ffb6",
            "name": "",
            "mode": "polyline",
            "filter": "inside",
            "points": [
              {"latitude":0,"longitude":0},
              {"latitude":1,"longitude":0},
              {"latitude":1,"longitude":1},
              {"latitude":0,"longitude":1}
            ],
            "x": 734,
            "y": 396.08331298828125,
            "wires": [
                []
            ]
        }

          objects[node.id] = node;

          request = {
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
              "type": "",
              "template": "", "mirror": false,
              "parameters": {}
            },
            "inputDevice": {
              "type": "",
              "id": "",
              "attributes": []
            }
          };

          expected = {
            request : {
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
                "type": "",
                "template": "", "mirror": false,
                "parameters": {}
              },
              "inputDevice": {
                "type": "",
                "id": "",
                "attributes": []
              }
            }
          };
          result = {};
        }

        reset();
        result = translator.extractDataFromNode(objects, node, request);
        expect(result.requestList.length).equal(1);

        expected.request.pattern.fixedEventConditions = [{
          'georel' : 'coveredBy',
          'geometry' : 'polygon',
          'coords' : '0,0;1,0;1,1;0,1;0,0'
        }];
        expect(result.requestList[0]).to.deep.equal(expected.request);


        reset();
        node.filter = 'outside';
        result = translator.extractDataFromNode(objects, node, request);
        expect(result.requestList.length).equal(1);

        expected.request.pattern.fixedEventConditions = [{
          'georel' : 'disjoint',
          'geometry' : 'polygon',
          'coords' : '0,0;1,0;1,1;0,1;0,0'
        }];
        expect(result.requestList[0]).to.deep.equal(expected.request);

        reset();
        node.filter = 'enters';
        result = translator.extractDataFromNode(objects, node, request);
        expect(result.requestList.length).equal(1);

        expected.request.pattern.firstEventConditions = [{
          'georel' : 'disjoint',
          'geometry' : 'polygon',
          'coords' : '0,0;1,0;1,1;0,1;0,0'
        }];
        expected.request.pattern.secondEventConditions = [{
          'georel' : 'coveredBy',
          'geometry' : 'polygon',
          'coords' : '0,0;1,0;1,1;0,1;0,0'
        }];
        expect(result.requestList[0]).to.deep.equal(expected.request);

        reset();
        node.filter = 'exits';
        result = translator.extractDataFromNode(objects, node, request);
        expect(result.requestList.length).equal(1);

        expected.request.pattern.firstEventConditions = [{
          'georel' : 'coveredBy',
          'geometry' : 'polygon',
          'coords' : '0,0;1,0;1,1;0,1;0,0'
        }];
        expected.request.pattern.secondEventConditions = [{
          'georel' : 'disjoint',
          'geometry' : 'polygon',
          'coords' : '0,0;1,0;1,1;0,1;0,0'
        }];
        expect(result.requestList[0]).to.deep.equal(expected.request);

        done();
      });
    });


    describe('Add change node', function() {
      it('should update the prototype properly', function(done) {
        let node = {};
        let objects = [];
        let request = {};
        let expected = {};
        let result = [];

        function reset() {
          node = {
            "id": "f40edb76.f55be",
            "type": "change",
            "z": "e567a343.4ffb6",
            "name": "",
            "rules": [
                {
                    "t": "set",
                    "p": "output.attr1",
                    "pt": "msg",
                    "to": "value-1",
                    "tot": "str"
                },
                {
                    "t": "set",
                    "p": "output.attr2",
                    "pt": "msg",
                    "to": "payload.var1",
                    "tot": "msg"
                }
            ],
            "action": "",
            "property": "",
            "from": "",
            "to": "",
            "reg": false,
            "x": 774,
            "y": 325.8500061035156,
            "wires": [
                []
            ]
          }

          objects[node.id] = node;

          request = {
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
              "type": "",
              "template": "", "mirror": false,
              "parameters": {}
            },
            "inputDevice": {
              "type": "",
              "id": "",
              "attributes": []
            }
          };

          expected = {
            request : {
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
                "type": "",
                "template": "", "mirror": false,
                "parameters": {}
              },
              "inputDevice": {
                "type": "",
                "id": "",
                "attributes": []
              }
            }
          };
          result = [];
        }

        reset();
        result = translator.extractDataFromNode(objects, node, request);
        expect(result.requestList.length).equal(1);
        expected.request.internalVariables = {
          'output' : {
            'attr1' : 'value-1',
            'attr2' : '{{payload.var1}}'
          }
        }
        expect(result.requestList[0]).to.deep.equal(expected.request);
        done();
      });
    });

    describe('Add template node', function() {
      it('should update the prototype properly', function(done) {
        let node = {};
        let objects = [];
        let request = {};
        let expected = {};
        let result = [];

        function reset() {
          node = {
            "id": "47b5c35.8413f3c",
            "type": "template",
            "z": "e567a343.4ffb6",
            "name": "",
            "field": "output.attr1",
            "fieldType": "msg",
            "format": "handlebars",
            "syntax": "mustache",
            "template": "This is the payload: {{payload.attr2}} !",
            "output": "str",
            "x": 637,
            "y": 392.8500061035156,
            "wires": [
                []
            ]
          }

          objects[node.id] = node;

          request = {
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
              "type": "",
              "template": "", "mirror": false,
              "parameters": {}
            },
            "inputDevice": {
              "type": "",
              "id": "",
              "attributes": []
            }
          };

          expected = {
            request : {
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
                "type": "",
                "template": "", "mirror": false,
                "parameters": {}
              },
              "inputDevice": {
                "type": "",
                "id": "",
                "attributes": []
              }
            }
          };
          result = [];
        }

        reset();
        result = translator.extractDataFromNode(objects, node, request);
        expect(result.requestList.length).equal(1);

        // It is expected that request.inputDevice.attributes is updated
        // with attr2 after variable substitution phase.

        expected.request.internalVariables = {
          'output' : {
            'attr1' : 'This is the payload: {{payload.attr2}} !'
          }
        }
        expect(result.requestList[0]).to.deep.equal(expected.request);
        done();
      });
    });


    describe('Add output device node', function() {
      it('should update the prototype properly', function(done) {
        let node = {};
        let objects = [];
        let request = {};
        let expected = {};
        let result = [];

        function reset() {
          node = {
            "id": "5e0c0c3d.7cf5c4",
            "type": "device in",
            "z": "fa20a5db.742d8",
            "name": "",
            "device": "{\"id\":\"80a6\",\"type\":\"virtual\"}",
            "attrs": "output",
            "_device_id": "80a6",
            "_device_label": "device-input",
            "_device_type": "virtual",
            "x": 869.25,
            "y": 318.25,
            "wires": []
          }

          objects[node.id] = node;

          request = {
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
              "type": "",
              "template": "", "mirror": false,
              "parameters": {}
            },
            "inputDevice": {
              "type": "",
              "id": "",
              "attributes": []
            }
          };

          expected = {
            request : {
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
                "type": "",
                "template": "", "mirror": false,
                "parameters": {}
              },
              "inputDevice": {
                "type": "",
                "id": "",
                "attributes": []
              }
            }
          };
          result = [];
        }

        reset();
        result = translator.extractDataFromNode(objects, node, request);
        expect(result.requestList.length).equal(1);

        expected.request.action.notificationEndpoint = "http://perseo-fe:9090/noticesv2";
        expected.request.action.parameters = {
          'attributes' : 'output',
          'id' : '80a6',
          'isPattern' : false,
          'type' : 'virtual'
        }
        expected.request.action.type = 'update';

        expect(result.requestList[0]).to.deep.equal(expected.request);
        done();
      });
    });



    describe('Add email node', function() {
      it('should update the prototype properly', function(done) {
        let node = {};
        let objects = [];
        let request = {};
        let expected = {};
        let result = [];

        function reset() {
          node = {
            "id": "834d2506.6dd188",
            "type": "e-mail",
            "z": "e567a343.4ffb6",
            "server": "email-server.com",
            "port": "465",
            "secure": true,
            "name": "",
            "dname": "",
            "to": "to@email.com",
            "from": "from@email.com",
            "subject": "Message title",
            "body": "emailBody",
            "x": 620,
            "y": 373.7166748046875,
            "wires": []
          }

          objects[node.id] = node;

          request = {
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
              "notificationEndpoint": "http://perseo-fe:9090/noticesv2",
              "type": "",
              "template": "", "mirror": false,
              "parameters": {}
            },
            "inputDevice": {
              "type": "",
              "id": "",
              "attributes": []
            }
          };

          expected = {
            request : {
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
                "notificationEndpoint": "http://perseo-fe:9090/noticesv2",
                "type": "",
                "template": "", "mirror": false,
                "parameters": {}
              },
              "inputDevice": {
                "type": "",
                "id": "",
                "attributes": []
              }
            }
          };
          result = [];
        }

        reset();
        result = translator.extractDataFromNode(objects, node, request);
        expect(result.requestList.length).equal(1);

        expected.request.action.parameters = {
          'to' : 'to@email.com',
          'from' : 'from@email.com',
          'subject' : 'Message title',
          'smtp' : 'email-server.com'
        }
        expected.request.action.template = 'emailBody';
        expected.request.action.type = 'email';

        expect(result.requestList[0]).to.deep.equal(expected.request);
        done();
      });
    });
  });
}

exports.execute = execute;