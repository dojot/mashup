"use strict";

var express = require('express'),
    MongoClient = require('mongodb').MongoClient,
    bodyParser = require('body-parser'),
    assert = require('assert');

var db;
var col;

function sid() {
  const UINT32_MAX = 4294967295;
  return (1 + Math.random()*UINT32_MAX).toString(16);
}

var app = express();
app.use(bodyParser.json());

app.get('/v1/flow', function (req, res) {
  col.find({}, {_id: 0}).toArray(function (err, flows) {
    if (err) {
      // TODO handle error
      res.status(500).send({msg: 'failed to retrieve data'});
      throw err;
    }

    res.status(200).send(flows);
  })
})

app.post('/v1/flow', function (req, res) {
  let flowData = req.body;
  if (!flowData) {
    res.status(400).send({msg: "missing flow data"});
  }

  if ((!('id' in flowData)) || (flowData.id.length == 0)) {
    flowData.id = sid();
  }

  if (!('enabled' in flowData)) {
    flowData.enabled = true;
  }

  flowData.created = Date.now();
  flowData.updated = flowData.created;
  col.insertOne(flowData, function(err, result) {
    if (err) {
      // TODO handle error
      res.status(500).send({msg: 'failed to retrieve data'});
      throw err;
    }

    res.status(200).send({msg: 'flow created'});
  })
})

app.delete('/v1/flow', function (req, res) {
  col.remove();
  res.status(200).send({msg: 'all flows removed'})
})

app.get('/v1/flow/:flowid', function (req, res) {
  col.findOne({id: req.params.flowid}, function(err, flow) {
    if (err) {
      res.status(500).send({msg: 'failed to retrieve data'});
      throw err;
    }

    res.status(200).send({msg: 'ok', flow: flow});
  })
})

app.put('/v1/flow/:flowid', function (req, res) {
  res.status(500).send({msg: 'not yet implemented'});
})

app.delete('/v1/flow/:flowid', function (req, res) {
  col.remove({id: req.params.flowid}, function(err, nRemoved) {
    if (err) {
      res.status(500).send({msg: 'failed to remove flow'});
      throw err;
    }

    if (nRemoved === 0) {
      res.status(404).send({msg: 'given flow is unknown'});
    }

    res.status(200).send({msg: 'flow removed', id: req.params.flowid});
  })
})

// TODO read this from configuration file, environment variables
var url = "mongodb://mongodb:27017/orchestrator";
var opt = {
  connectTimeoutMS: 2500,
  reconnectTries: 100,
  reconnectInterval: 2500,
  autoReconnect: true
}

MongoClient.connect(url, opt, function (err, database) {
  if (err) throw err;

  db = database;
  col = db.collection('flows');
  col.ensureIndex({id: 1}, {unique: true});
  app.listen(3000, function () {
    console.log('Flow service started');
  })
})
