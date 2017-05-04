var config = {};

config.perseo_fe = {
  url: 'http://172.22.0.10:9090'
}

config.orion = {
  url: 'http://172.22.0.7:1026/v1'
}

config.mongo = {
  url: "mongodb://172.22.0.2:27017/orchestrator"
}

module.exports = config;