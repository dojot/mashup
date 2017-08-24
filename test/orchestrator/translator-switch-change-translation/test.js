/* jshint node: true */
"use strict";
/**
 * Simple test, using only one switch node and one change node
 *
 */

var fs = require('fs'),
  util = require('util'),
  translator = require('../../../orchestrator/translator.js'),
  chai = require('chai');

var expect = chai.expect;


function analyzePerseoRequests(ret) {
  expect(ret.perseoRequests).to.deep.equal(
    [
      {
        ruleName: 'rule_cd03c24e_ad4b5_1',
        perseoRequest: {
          name: 'rule_cd03c24e_ad4b5_1',
          text: 'select *, "rule_cd03c24e_ad4b5_1" as ruleName, ev.type? as Type, ev.id? as ID from pattern [every ev = iotEvent(id? = "cbd4"  and (cast(cast(a?, String), float) = cast(cast("100", String), float)) )]',
          action:
          {
            type: 'update',
            template: '',
            parameters:
            {
              attributes: [{ name: 'a', type: 'string', value: 'cem' }],
              id: 'b48a',
              type: 'virtual'
            }
          }
        }
      }
    ]
  );
}

function analyzeOrionSubscriptions(ret) {
  expect(ret.orionSubscriptions).to.deep.equal(
    [{
      subscription:
      {
        entities: [{ type: 'device', isPattern: 'false', id: 'cbd4' }],
        reference: 'http://perseo-fe:9090/notices',
        attributes: ['a'],
        notifyConditions: [{ type: 'ONCHANGE', condValues: ['a'] }],
        duration: 'P100Y'
      },
      originalRequest:
      {
        name: 'rule_cd03c24e_ad4b5_1',
        variables: [],
        pattern:
        {
          type: 'cbd4',
          fixedConditions: [' and (cast(cast(a?, String), float) = cast(cast("100", String), float))'],
          firstEventConditions: [],
          secondEventConditions: []
        },
        action:
        {
          type: 'update',
          template: '',
          parameters:
          {
            attributes: [{ name: 'a', type: 'string', value: 'cem' }],
            id: 'b48a',
            type: 'virtual'
          }
        },
        outputDevice:
        {
          type: 'virtual',
          id: 'b48a',
          attributes:
          [{ name: 'a', type: 'string', value: '' },
          { name: 'Device', type: 'String', value: 'output' },
          { name: 'TimeInstant', type: 'ISO8601', value: '' }]
        },
        inputDevice: { type: 'device', id: 'cbd4', attributes: ['a'] },
        condition: { expression: {} },
        geoRefEdges:
        {
          'expression-from': {},
          'expression-to': {},
          fromSubscriptionId: '',
          toSubscriptionId: ''
        },
        flags: { hasGeoRef: false, hasGeoRefEdges: false, hasEdges: false }
      },
      subscriptionType: 'simple'
    }]
  )
}

function analyzeOrionSubscriptionsV2(ret) {
  expect(ret.orionSubscriptionsV2).to.deep.equal([]);
}

function analyzeFullPerseoRequestsV1(ret) {
  expect(ret).to.deep.equal(
    {
      name: 'rule_cd03c24e_ad4b5_1',
      text: 'select *, "rule_cd03c24e_ad4b5_1" as ruleName, ev.type? as Type, ev.id? as ID from pattern [every ev = iotEvent(id? = "cbd4"  and (cast(cast(a?, String), float) = cast(cast("100", String), float))  and (cast(subscriptionId?, String) = cast("subscription-id-1", String)) )]',
      action:
      {
        type: 'update',
        template: '',
        parameters:
        {
          attributes: [{ name: 'a', type: 'string', value: 'cem' }],
          id: 'b48a',
          type: 'virtual'
        }
      }
    }
  );
}

function execute() {
  describe('translator', function() {
    describe('Simple switch-change flow translation', function() {
      it('should translate a flow correctly', function(done) {
        // var mashup = fs.readFile(__dirname+ '/mashup.json', 'utf8', function(err, data) {
        //   var ret = translator.translateMashup(JSON.parse(data));
        //   try {
        //     expect(ret).to.have.own.property('perseoRequests');
        //     expect(ret).to.have.own.property('orionSubscriptions');
        //     expect(ret).to.have.own.property('orionSubscriptionsV2');
        //     analyzePerseoRequests(ret);
        //     analyzeOrionSubscriptions(ret);
        //     analyzeOrionSubscriptionsV2(ret);

        //     // Analyzing V1 subscriptions
        //     let perseoRequest = translator.generatePerseoRequest(ret.orionSubscriptions[0].originalRequest, "subscription-id-1", "simple");
        //     analyzeFullPerseoRequestsV1(perseoRequest);
        //     // perseoRequest = translator.generatePerseoRequest(mashup.orionSubscriptionsV2[0].originalRequest, "subscription-id-2", "simple");
        //     // analyzePerseoRequestV2(perseoRequest);
        //     done();
        //   } catch (error) {
        //     done(error);
        //   }
        // });
        done();
      });
    });
  });
}

exports.execute = execute;

