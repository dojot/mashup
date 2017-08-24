/* jshint node: true */
"use strict";
var fs = require('fs'),
    util = require('util'),
    translator = require('../../../orchestrator/translator.js'),
    chai = require('chai');

var expect = chai.expect;


function execute() {
  describe('Conditions', function() {
    describe('Add a logic condition to a request prototype', function() {
      it('should add the condition properly', function(done) {
        let eventConditionArray = [];
        let node = {
          'property' : 'payload.InputVariable'
        };
        let ruleValue = 'test';
        let ruleType = 'string';
        let request = {
          'variables' : [],
          'inputDevice' : {
            'attributes' : []
          }
        }
        let expected = {
          eventConditionArray : [''],
          request : {
            'variables': [ 'InputVariable'],
            'inputDevice' : {
              'attributes' : ['InputVariable']
            }
          }
        }

        function reset() {
          eventConditionArray = [];
          request = {
            'variables' : [],
            'inputDevice' : {
              'attributes' : []
            }
          }
          expected = {
            eventConditionArray : [''],
            request : {
              'variables': [ 'InputVariable'],
              'inputDevice' : {
                'attributes' : ['InputVariable']
              }
            }
          }
        }

        expected.eventConditionArray[0] = {'q': 'InputVariable == test'};
        translator.addEventCondition(node, 'eq', ruleValue, ruleType, request, eventConditionArray);
        expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
        expect(request).to.deep.equal(expected.request);

        reset();
        expected.eventConditionArray[0] = {'q': 'InputVariable != test'};
        translator.addEventCondition(node, 'neq', ruleValue, ruleType, request, eventConditionArray);
        expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
        expect(request).to.deep.equal(expected.request);

        reset();
        expected.eventConditionArray[0] = {'q': 'InputVariable < test'};
        translator.addEventCondition(node, 'lt', ruleValue, ruleType, request, eventConditionArray);
        expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
        expect(request).to.deep.equal(expected.request);

        reset();
        expected.eventConditionArray[0] = {'q': 'InputVariable <= test'};
        translator.addEventCondition(node, 'lte', ruleValue, ruleType, request, eventConditionArray);
        expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
        expect(request).to.deep.equal(expected.request);

        reset();
        expected.eventConditionArray[0] = {'q': 'InputVariable > test'};
        translator.addEventCondition(node, 'gt', ruleValue, ruleType, request, eventConditionArray);
        expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
        expect(request).to.deep.equal(expected.request);

        reset();
        expected.eventConditionArray[0] = {'q': 'InputVariable >= test'};
        translator.addEventCondition(node, 'gte', ruleValue, ruleType, request, eventConditionArray);
        expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
        expect(request).to.deep.equal(expected.request);

        reset();
        expected.eventConditionArray[0] = {'q': 'InputVariable ~= test'};
        translator.addEventCondition(node, 'cont', ruleValue, ruleType, request, eventConditionArray);
        expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);
        expect(request).to.deep.equal(expected.request);

        // BETWEEN operator is not supported in this function - it is broken down into gte and lt

        done();
      });
    });

    describe('Add a negated logic condition to a request prototype', function() {
      it('should add the condition properly', function(done) {
        let node = {
          'property' : 'payload.InputVariable',
          'rules' : [ { 't' : '', 'v': '', 'vt' : ''}]
        };
        let ruleValue = 'test';
        let ruleType = 'string';
        let request = {
          'variables' : [],
          'pattern' : {
            'fixedEventConditions' : []
          },
          'inputDevice' : {
            'attributes' : []
          }
        }
        let expected = {
          request : {
            'variables': [ 'InputVariable'],
            'pattern' : {
              'fixedEventConditions' : []
            },
            'inputDevice' : {
              'attributes' : ['InputVariable']
            }
          }
        }

        function reset() {
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
            }
          }
        }


        expected.request.pattern.fixedEventConditions[0] = {'q': 'InputVariable != test'};
        node.rules[0].t = 'eq';
        node.rules[0].v = 'test';
        node.rules[0].vt = 'string';
        translator.addNegatedFixedEventCondition(node, request);
        expect(request).to.deep.equal(expected.request);

        reset();
        expected.request.pattern.fixedEventConditions[0] = {'q': 'InputVariable == test'};
        node.rules[0].t = 'neq';
        node.rules[0].v = 'test';
        node.rules[0].vt = 'string';
        translator.addNegatedFixedEventCondition(node, request);
        expect(request).to.deep.equal(expected.request);

        reset();
        expected.request.pattern.fixedEventConditions[0] = {'q': 'InputVariable >= test'};
        node.rules[0].t = 'lt';
        translator.addNegatedFixedEventCondition(node, request);
        expect(request).to.deep.equal(expected.request);

        reset();
        expected.request.pattern.fixedEventConditions[0] = {'q': 'InputVariable > test'};
        node.rules[0].t = 'lte';
        translator.addNegatedFixedEventCondition(node, request);
        expect(request).to.deep.equal(expected.request);

        reset();
        expected.request.pattern.fixedEventConditions[0] = {'q': 'InputVariable <= test'};
        node.rules[0].t = 'gt';
        translator.addNegatedFixedEventCondition(node, request);
        expect(request).to.deep.equal(expected.request);

        reset();
        expected.request.pattern.fixedEventConditions[0] = {'q': 'InputVariable < test'};
        node.rules[0].t = 'gte';
        translator.addNegatedFixedEventCondition(node, request);
        expect(request).to.deep.equal(expected.request);

        // There is no negated operator to ~=
        // BETWEEN operator is not supported in this function - it is broken down into gte and lt

        done();
      });
    });

    describe('Add an georeferenced condition to a request prototype', function() {
      it('should add the condition properly', function(done) {
        let eventConditionArray = [];
        let node = {
          'property' : 'payload.InputVariable'
        };
        let ruleValue = [
          { 'latitude' : 0, 'longitude' : 0},
          { 'latitude' : 0, 'longitude' : 1},
          { 'latitude' : 1, 'longitude' : 1}
        ];
        let ruleType = 'polyline';
        let request = { }
        let expected = { }

        function reset() {
          eventConditionArray = [];
          request = {
            'variables' : [],
            'inputDevice' : {
              'attributes' : []
            }
          }
          expected = {
            eventConditionArray : [
              {
                'coords': '0,0;0,1;1,1;0,0',
                'geometry': 'polygon',
                'georel': ''
              }
            ]
          }
        }

        reset();
        expected.eventConditionArray[0].georel = 'coveredBy'
        translator.addEventCondition(node, 'coveredBy', ruleValue, ruleType, request, eventConditionArray);
        expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);

        reset();
        expected.eventConditionArray[0].georel = 'disjoint'
        translator.addEventCondition(node, 'disjoint', ruleValue, ruleType, request, eventConditionArray);
        expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);

        done();
      });
    });



    describe('Add an georeferenced condition to a request prototype', function() {
      it('should add the condition properly', function(done) {
        let eventConditionArray = [];
        let node = {
          'property' : 'payload.InputVariable'
        };
        let ruleValue = [
          { 'latitude' : 0, 'longitude' : 0},
          { 'latitude' : 0, 'longitude' : 1},
          { 'latitude' : 1, 'longitude' : 1}
        ];
        let ruleType = 'polyline';
        let request = { }
        let expected = { }

        function reset() {
          eventConditionArray = [];
          request = {
            'variables' : [],
            'inputDevice' : {
              'attributes' : []
            }
          }
          expected = {
            eventConditionArray : [
              {
                'coords': '0,0;0,1;1,1;0,0',
                'geometry': 'polygon',
                'georel': ''
              }
            ]
          }
        }

        reset();
        expected.eventConditionArray[0].georel = 'coveredBy'
        translator.addEventCondition(node, 'coveredBy', ruleValue, ruleType, request, eventConditionArray);
        expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);

        reset();
        expected.eventConditionArray[0].georel = 'disjoint'
        translator.addEventCondition(node, 'disjoint', ruleValue, ruleType, request, eventConditionArray);
        expect(eventConditionArray).to.deep.equal(expected.eventConditionArray);

        done();
      });
    });
  });
}

exports.execute = execute;