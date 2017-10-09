/* jshint node: true */
"use strict";
var fs = require('fs'),
    util = require('util'),
    translator = require('../../../orchestrator/translator.js'),
    orchtypes = require('..//../../orchestrator/orchestrator-types'),
    chai = require('chai'),
    sinon = require('sinon');

var expect = chai.expect;


function execute() {
  describe('translator', function() {
    describe('#isValidGeoOperator()', function() {
      let ret;
      it('should return true for supported operators', function(done) {
        ret = translator.isValidGeoOperator(orchtypes.OrionTypes.GeoFenceOperator.NEAR);
        expect(ret).equal(true);
        ret = translator.isValidGeoOperator(orchtypes.OrionTypes.GeoFenceOperator.COVEREDBY);
        expect(ret).equal(true);
        ret = translator.isValidGeoOperator(orchtypes.OrionTypes.GeoFenceOperator.INTERSECTS);
        expect(ret).equal(true);
        ret = translator.isValidGeoOperator(orchtypes.OrionTypes.GeoFenceOperator.EQUALS);
        expect(ret).equal(true);
        ret = translator.isValidGeoOperator(orchtypes.OrionTypes.GeoFenceOperator.DISJOINT);
        expect(ret).equal(true);
        done();
      });

      it('should return false for unsupported operators', function(done) {
        ret = translator.isValidGeoOperator('xyz');
        expect(ret).equal(false);
        done();
      });

      it('should return false for invalid parameters', function(done) {
        ret = translator.isValidGeoOperator();
        expect(ret).equal(false);
        ret = translator.isValidGeoOperator(null);
        expect(ret).equal(false);
        done();
      });
    });

    describe('#addEventCondition()', function() {
      let eventConditionArray;
      let node;
      let ruleValue;
      let ruleType;
      let request;
      let expected;
      let ret;

      describe('using logic conditions', function() {
        beforeEach(function() {
          eventConditionArray = [];
          node = {
            'property' : 'payload.InputVariable',
            'id' : '12345'
          };
          ruleValue = 'test';
          ruleType = 'string';
          request = {
            'variables' : [],
            'inputDevice' : {
              'attributes' : []
            }
          };
          expected = {
            eventConditionArray : [''],
            request : {
              'variables': [ 'InputVariable'],
              'inputDevice' : {
                'attributes' : ['InputVariable']
              }
            },
            ret : {
              'retCode' : 0,
              'msg' :{
                'error' : '',
                'nodeid' : ''
              }
            }
          };
        });

        it('should process "eq" operator with no errors', function(done) {
          expected.eventConditionArray[0] = {'q': 'InputVariable == test'};
          translator.addEventCondition(node, 'eq', ruleValue, ruleType, request, eventConditionArray);
          expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it('should process "neq" operator with no errors', function(done) {
          expected.eventConditionArray[0] = {'q': 'InputVariable != test'};
          translator.addEventCondition(node, 'neq', ruleValue, ruleType, request, eventConditionArray);
          expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it('should process "lt" operator with no errors', function(done) {
          expected.eventConditionArray[0] = {'q': 'InputVariable < test'};
          translator.addEventCondition(node, 'lt', ruleValue, ruleType, request, eventConditionArray);
          expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it('should process "lte" operator with no errors', function(done) {
          expected.eventConditionArray[0] = {'q': 'InputVariable <= test'};
          translator.addEventCondition(node, 'lte', ruleValue, ruleType, request, eventConditionArray);
          expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it('should process "gt" operator with no errors', function(done) {
          expected.eventConditionArray[0] = {'q': 'InputVariable > test'};
          translator.addEventCondition(node, 'gt', ruleValue, ruleType, request, eventConditionArray);
          expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it('should process "gte" operator with no errors', function(done) {
          expected.eventConditionArray[0] = {'q': 'InputVariable >= test'};
          translator.addEventCondition(node, 'gte', ruleValue, ruleType, request, eventConditionArray);
          expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it('should process "cont" operator with no errors', function(done) {
          expected.eventConditionArray[0] = {'q': 'InputVariable ~= test'};
          translator.addEventCondition(node, 'cont', ruleValue, ruleType, request, eventConditionArray);
          expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it ('should return an error if an invalid operator is used', function(done) {
          expected.ret.retCode = 400;
          expected.ret.msg = {
            error: 'invalid operator',
            nodeid: '12345'
          }
          try {
            translator.addEventCondition(node, 'xyz', ruleValue, ruleType, request, eventConditionArray);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }
          done();
        });

        it ('should return an error if any input parameter is null', function(done) {
          expected.ret.retCode = 400;
          expected.ret.msg = {
            error: 'invalid parameter'
          }
          try {
            translator.addEventCondition(null, 'eq', ruleValue, ruleType, request, eventConditionArray);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          expected.ret.msg = {
            error: 'invalid parameter',
            nodeid: '12345'
          }
          try {
            translator.addEventCondition(node, null, ruleValue, ruleType, request, eventConditionArray);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          try {
            translator.addEventCondition(node, 'eq', null, ruleType, request, eventConditionArray);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          try {
            translator.addEventCondition(node, 'eq', ruleValue, null, request, eventConditionArray);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          try {
            translator.addEventCondition(node, 'eq', ruleValue, ruleType, null, eventConditionArray);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          try {
            translator.addEventCondition(node, 'eq', ruleValue, ruleType, request, null);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          done();
        });

        it ('should return an error if any input parameter is undefined', function(done) {
          expected.ret.retCode = 400;
          expected.ret.msg = {
            error: 'invalid parameter'
          }
          try {
            translator.addEventCondition(undefined, 'eq', ruleValue, ruleType, request, eventConditionArray);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }


          expected.ret.msg = {
            error: 'invalid parameter',
            nodeid: '12345'
          }
          try {
            translator.addEventCondition(node, undefined, ruleValue, ruleType, request, eventConditionArray);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          try {
            translator.addEventCondition(node, 'eq', undefined, ruleType, request, eventConditionArray);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          try {
            translator.addEventCondition(node, 'eq', ruleValue, undefined, request, eventConditionArray);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          try {
            translator.addEventCondition(node, 'eq', ruleValue, ruleType, undefined, eventConditionArray);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          try {
            translator.addEventCondition(node, 'eq', ruleValue, ruleType, request, undefined);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          done();
        });
      });

      describe('using georeferenced conditions', function() {
        beforeEach(function() {
          eventConditionArray = [];
          node = {
            'property' : 'payload.InputVariable',
            'id' : '12345'
          };
          ruleValue = [
            { 'latitude' : 0, 'longitude' : 0},
            { 'latitude' : 0, 'longitude' : 1},
            { 'latitude' : 1, 'longitude' : 1}
          ];
          ruleType = 'polyline';
          request = {
            'variables': [],
            'inputDevice': {
              'attributes': []
            }
          }
          expected = {
            eventConditionArray: [
              {
                'coords': '0,0;0,1;1,1;0,0',
                'geometry': 'polygon',
                'georel': ''
              }
            ],
            ret : {
              'retCode' : 0,
              'msg' : 'ok'
            }
          }
        });

        it('should process the "coveredBy" operator properly', function(done) {
          expected.eventConditionArray[0].georel = 'coveredBy'
          translator.addEventCondition(node, 'coveredBy', ruleValue, ruleType, request, eventConditionArray);
          expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
          done();
        });

        it('should process the "disjoint" operator properly', function(done) {
          expected.eventConditionArray[0].georel = 'disjoint'
          translator.addEventCondition(node, 'disjoint', ruleValue, ruleType, request, eventConditionArray);
          expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
          done();
        });

        it('should return an error if this node has no data', function(done) {
          expected.ret.retCode = 400;
          expected.ret.msg = {
            error: 'empty georeference node',
            nodeid: '12345'
          }

          try {
            translator.addEventCondition(node, 'coveredBy', [], ruleType, request, eventConditionArray);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          done();
        });

        it('should return an error if rule type is not supported', function(done) {
          expected.ret.retCode = 400;
          expected.ret.msg = {
            error: 'invalid geofence mode',
            nodeid: '12345'
          }
          try {
            translator.addEventCondition(node, 'coveredBy', ruleValue, 'strange-geofence-mode', request, eventConditionArray);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          done();
        });
      });
    });

    describe('#addNegatedFixedEventCondition()', function() {
      let node;
      let ruleValue;
      let ruleType;
      let request;
      let expected;
      let ret;
      describe('using logic conditions', function() {
        beforeEach(function() {
          node = {
            'property' : 'payload.InputVariable',
            'rules' : [ { 't' : '', 'v': 'test', 'vt' : 'string', 'v2' : 'test', 'v2t' : 'string'}],
            'id' : '12345'
          };
          ruleValue = 'test';
          ruleType = 'string';
          request = {
            'variables' : [],
            'pattern' : {
              'fixedEventConditions' : []
            },
            'inputDevice' : {
              'attributes' : []
            }
          }
          expected = {
            request : {
              'variables': [ 'InputVariable'],
              'pattern' : {
                'fixedEventConditions' : []
              },
              'inputDevice' : {
                'attributes' : ['InputVariable']
              }
            },
            ret : {
              'retCode' : 0,
              'msg' : 'ok'
            }
          }
        });

        it('should process the "eq" with no errors', function(done) {
          expected.request.pattern.fixedEventConditions[0] = {'q': 'InputVariable != test'};
          node.rules[0].t = 'eq';
          translator.addNegatedFixedEventCondition(node, request);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it('should process the "neq" with no errors', function(done) {
          expected.request.pattern.fixedEventConditions[0] = {'q': 'InputVariable == test'};
          node.rules[0].t = 'neq';
          translator.addNegatedFixedEventCondition(node, request);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it('should process the "lt" with no errors', function(done) {
          expected.request.pattern.fixedEventConditions[0] = {'q': 'InputVariable >= test'};
          node.rules[0].t = 'lt';
          translator.addNegatedFixedEventCondition(node, request);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it('should process the "lte" with no errors', function(done) {
          expected.request.pattern.fixedEventConditions[0] = {'q': 'InputVariable > test'};
          node.rules[0].t = 'lte';
          translator.addNegatedFixedEventCondition(node, request);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it('should process the "gt" with no errors', function(done) {
          expected.request.pattern.fixedEventConditions[0] = {'q': 'InputVariable <= test'};
          node.rules[0].t = 'gt';
          translator.addNegatedFixedEventCondition(node, request);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it('should process the "gte" with no errors', function(done) {
          expected.request.pattern.fixedEventConditions[0] = {'q': 'InputVariable < test'};
          node.rules[0].t = 'gte';
          translator.addNegatedFixedEventCondition(node, request);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it('should process the "btwn" with no errors', function(done) {
          expected.request.pattern.fixedEventConditions[0] = {'q': 'InputVariable < test'};
          expected.request.pattern.fixedEventConditions[1] = {'q': 'InputVariable >= test'};
          node.rules[0].t = 'btwn';
          node.rules[0].v2 = ruleValue;
          node.rules[0].v2t = ruleType;
          translator.addNegatedFixedEventCondition(node, request);
          expect(request).to.deep.equal(expected.request);
          done();
        });

        it('should process the "else" with no errors', function(done) {
          node.rules[0].t = 'else';
          expected.ret.status = 'operator has no negated form';
          expected.request.inputDevice.attributes = [];
          expected.request.variables = [];
          translator.addNegatedFixedEventCondition(node, request);
          expect(request).to.deep.equal(expected.request);
          done();
        });
        // There is no negated operator to ~=
        // BETWEEN operator is not supported in this function - it is broken down into gte and lt

        it ('should do nothing if a logic operator with no negated form is used', function(done) {
          expected.ret.retCode = 0;
          expected.ret.status = 'operator has no negated form';
          node.rules[0].t = 'cont';
          translator.addNegatedFixedEventCondition(node, request);
          done();
        });

        it ('should return an error if an invalid operator is used', function(done) {
          expected.ret.retCode = 400;
          expected.ret.msg = {
            error: "invalid operator",
            nodeid: '12345'
          }
          node.rules[0].t = 'xyz';
          try {
            translator.addNegatedFixedEventCondition(node, request);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }
          done();
        });

        it ('should return an error if any input parameter is null', function(done) {
          expected.ret.retCode = 400;
          expected.ret.msg = {
            error: "invalid parameter"
          }
          try {
            translator.addNegatedFixedEventCondition(null, request);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          expected.ret.msg = {
            error: "invalid parameter",
            nodeid: '12345'
          }
          try {
            translator.addNegatedFixedEventCondition(node, null);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }
          done();
        });

        it ('should return an error if any input parameter is undefined', function(done) {
          expected.ret.retCode = 400;
          expected.ret.msg = {
            error: "invalid parameter"
          }
          try {
            translator.addNegatedFixedEventCondition(undefined, request);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }

          expected.ret.msg = {
            error: "invalid parameter",
            nodeid: '12345'
          }
          try {
            translator.addNegatedFixedEventCondition(node, undefined);
          } catch (ret) {
            expect(ret).to.deep.equal(expected.ret);
          }
          done();
        });
      });
    });

    describe('#extractFurtherNodes()', function() {

      let objects;
      let node;
      let outputIx;
      let request;
      let requestList;
      let ret;
      let expected, expectedError;
      let extractDataFromNodeFn = translator.extractDataFromNode;

      beforeEach(function() {
        objects = {
          "obj1" : {},
          "obj2" : {},
          "obj3" : {},
          "obj4" : {}
        };
        node = { "wires" : [], 'id': '12345'};
        outputIx = 0;
        request = { };
        requestList = [];

        expected = {
          'ret' : {
            'retCode': 0,
            'msg' : 'ok',
            'requestList': []
          }
        };
        extractDataFromNodeFn = sinon.stub();
      });

      it ('should process a single output connected to a single node without errors', function(done) {
        // TODO
        node.wires.push(["obj1"]);
        extractDataFromNodeFn.returns({requestList:[{}]});

        // Only one request prototype is expected
        expected.ret.requestList.push({});
        translator.extractFurtherNodes(objects, node, outputIx, request, extractDataFromNodeFn);
        expect(extractDataFromNodeFn.calledOnce);
        done();
      });

      it ('should process a single output connected to multiple nodes without errors', function(done) {
        // TODO
        node.wires.push(["obj1", "obj2"]);
        extractDataFromNodeFn.returns({requestList:[{}]});

        // Two request prototype is expected
        expected.ret.requestList.push({});
        expected.ret.requestList.push({});
        translator.extractFurtherNodes(objects, node, outputIx, request, extractDataFromNodeFn);
        done();
      });

      it ('should process multiple outputs connected to single nodes without errors', function(done) {
        // TODO
        node.wires.push(["obj1"]);
        node.wires.push(["obj2"]);
        extractDataFromNodeFn.returns({requestList:[{}]});

        // One request prototype is expected per output port
        expected.ret.requestList.push({});
        outputIx = 0;
        translator.extractFurtherNodes(objects, node, outputIx, request, extractDataFromNodeFn);

        outputIx = 1;
        translator.extractFurtherNodes(objects, node, outputIx, request, extractDataFromNodeFn);
        done();
      });

      it ('should process multiple outputs connected to multiple nodes without errors', function(done) {
        // TODO
        node.wires.push(["obj1", "obj2"]);
        node.wires.push(["obj3", "obj4"]);
        extractDataFromNodeFn.returns({requestList:[{}]});

        // Two request prototype are expected per output port
        expected.ret.requestList.push({});
        expected.ret.requestList.push({});
        outputIx = 0;
        translator.extractFurtherNodes(objects, node, outputIx, request, extractDataFromNodeFn);

        outputIx = 1;
        translator.extractFurtherNodes(objects, node, outputIx, request, extractDataFromNodeFn);
        done();
      });

      it ('should raise a warning regarding a disconnected output', function(done) {
        // TODO
        node.wires.push([]);
        node.wires.push(["obj3", "obj4"]);
        extractDataFromNodeFn.returns({requestList:[{}]});
        expected.ret.requestList.push({});

        // Two request prototype are expected for the second output port
        outputIx = 0;
        ret = translator.extractFurtherNodes(objects, node, outputIx, request, extractDataFromNodeFn);
        expect(ret).to.deep.equal(expected.ret);

        // Only one more is needed.
        expected.ret.requestList.push({});

        outputIx = 1;
        ret = translator.extractFurtherNodes(objects, node, outputIx, request, extractDataFromNodeFn);
        expect(ret).to.deep.equal(expected.ret);
        done();
      });

      it('should return an error if any input parameter is null', function(done) {
        node.wires.push(["obj1"]);
        extractDataFromNodeFn.returns({requestList:[{}]});

        expected.ret = {
          'retCode': 400,
          'msg' : {
            'error': 'invalid parameter',
            'nodeid': '12345'
          }
        }

        try {
          translator.extractFurtherNodes(null, node, outputIx, request, extractDataFromNodeFn);
        } catch (ret) {
          expect(ret).to.deep.equal(expected.ret);
        }

        delete expected.ret.msg.nodeid;
        try {
          translator.extractFurtherNodes(objects, null, outputIx, request, extractDataFromNodeFn);
        } catch (ret) {
          expect(ret).to.deep.equal(expected.ret);
        }

        expected.ret.msg.nodeid = '12345';
        try {
          translator.extractFurtherNodes(objects, node, null, request, extractDataFromNodeFn);
        } catch (ret) {
          expect(ret).to.deep.equal(expected.ret);
        }

        try {
          translator.extractFurtherNodes(objects, node, outputIx, null, extractDataFromNodeFn);
        } catch (ret) {
          expect(ret).to.deep.equal(expected.ret);
        }

        done();
      });


      it('should return an error if any input parameter is undefined', function(done) {
        node.wires.push(["obj1"]);
        extractDataFromNodeFn.returns({requestList:[{}]});

        expected.ret = {
          'retCode': 400,
          'msg' : {
            'error': 'invalid parameter',
            'nodeid': '12345'
          }
        }

        try {
          translator.extractFurtherNodes(undefined, node, outputIx, request, extractDataFromNodeFn);
        } catch (ret) {
          expect(ret).to.deep.equal(expected.ret);
        }

        delete expected.ret.msg.nodeid;
        try {
          translator.extractFurtherNodes(objects, undefined, outputIx, request, extractDataFromNodeFn);
        } catch (ret) {
          expect(ret).to.deep.equal(expected.ret);
        }

        expected.ret.msg.nodeid = '12345';
        try {
          translator.extractFurtherNodes(objects, node, undefined, request, extractDataFromNodeFn);
        } catch (ret) {
          expect(ret).to.deep.equal(expected.ret);
        }

        try {
          translator.extractFurtherNodes(objects, node, outputIx, undefined, extractDataFromNodeFn);
        } catch (ret) {
          expect(ret).to.deep.equal(expected.ret);
        }

        done();
      });
    });
  });
}

exports.execute = execute;