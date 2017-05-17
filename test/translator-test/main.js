var fs = require('fs');
var filename = process.argv[2];
var util = require('util');
var objects = {};
var translator = require('../../translator.js');

var mashup = fs.readFile(process.argv[2], 'utf8', function(err, data) {
  var ret = translator.translateMashup(JSON.parse(data));
  console.log('Results: ');
  console.log(util.inspect(ret, {showHidden: false, depth: null}));
  process.exit();
});

