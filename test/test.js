/* jshint node: true */
"use strict";

var tests = [
  require('./orchestrator/translator-switch-change-translation/test.js'),
  require('./orchestrator/translator-event-condition-functions/test.js'),
  require('./orchestrator/translator-mashup-single-node/internal-test.js'),
  require('./orchestrator/translator-mashup-single-node/test.js'),
  require('./orchestrator/translator-orion-perseo-requests/test.js'),
  require('./orchestrator/translator-full-mesh-tests/test.js')
];

for (let i = 0; i < tests.length; i++) {
  tests[i].execute();
}
