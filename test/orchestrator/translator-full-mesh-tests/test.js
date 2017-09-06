/* jshint node: true */
"use strict";
var fs = require('fs'),
    util = require('util'),
    translator = require('../../../orchestrator/translator.js'),
    chai = require('chai');

var expect = chai.expect;


function execute() {
  describe('Full tests', function() {
    describe('Basic switch-change flow', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/1-switch-change-flow.json', 'utf8', function(err, data) {
          try {
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            let expected = {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "condition": {
                    "attrs": [
                      "attr1"
                    ],
                    "expression": {
                      "q": "attr1 == 100"
                    }
                  },
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "attributes": [
                      {
                        "name": "result",
                        "value": "yes"
                      }
                    ],
                    "id": "output-device-id",
                    "isPattern": false,
                    "type": "virtual"
                  },
                  "template": "", "mirror": false,
                  "type": "update"
                },
                "name": "rule_6a666fff_bfb128_1",
                "text": "select *, \"rule_6a666fff_bfb128_1\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
              }
            };
            expect(result.length).equal(1);
            expect(result[0].subscription).to.deep.equal(expected.subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 0, result[0].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected.perseoRequest);

            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });


    describe('Double switch-change flow', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/2-switch-change-flow.json', 'utf8', function(err, data) {
          try {
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            let expected = [
            {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "condition": {
                    "attrs": [
                      "attr1"
                    ],
                    "expression": {
                      "q": "attr1 == 100"
                    }
                  },
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "attributes": [
                      {
                        "name": "result",
                        "value": "yes"
                      }
                    ],
                    "id": "output-device-id",
                    "isPattern": false,
                    "type": "virtual"
                  },
                  "template": "", "mirror": false,
                  "type": "update"
                },
                "name": "rule_6a666fff_bfb128_1",
                "text": "select *, \"rule_6a666fff_bfb128_1\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
              }
            },
            {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "condition": {
                    "attrs": [
                      "attr1"
                    ],
                    "expression": {
                      "q": "attr1 == 200"
                    }
                  },
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "attributes": [
                      {
                        "name": "result",
                        "value": "no"
                      }
                    ],
                    "id": "output-device-id",
                    "isPattern": false,
                    "type": "virtual"
                  },
                  "template": "", "mirror": false,
                  "type": "update"
                },
                "name": "rule_6a666fff_bfb128_2",
                "text": "select *, \"rule_6a666fff_bfb128_2\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"123456\")]"
              }
            },
            ];
            expect(result.length).equal(2);
            expect(result[0].subscription).to.deep.equal(expected[0].subscription);
            expect(result[1].subscription).to.deep.equal(expected[1].subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 0, result[0].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected[0].perseoRequest);

            perseoRequest = translator.generatePerseoRequest(123456, 0, result[1].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected[1].perseoRequest);
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });

    describe('Basic change flow', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/1-change-flow.json', 'utf8', function(err, data) {
          try {
            let expected = {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "attributes": [
                      {
                        "name": "result",
                        "value": "yes"
                      }
                    ],
                    "id": "output-device-id",
                    "isPattern": false,
                    "type": "virtual"
                  },
                  "template": "", "mirror": false,
                  "type": "update"
                },
                "name": "rule_6a666fff_bfb128_1",
                "text": "select *, \"rule_6a666fff_bfb128_1\" as ruleName from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
              }
            };
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            expect(result.length).equal(1);
            expect(result[0].subscription).to.deep.equal(expected.subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 0, result[0].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected.perseoRequest);

            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });


    describe('Basic edgedetection flow', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/1-edgedetection-flow.json', 'utf8', function(err, data) {
          try {
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            let expected =[
            {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "condition": {
                    "attrs": [
                      "attr1"
                    ],
                    "expression": {
                      "q": "attr1 < 100"
                    }
                  },
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              }
            },
            {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "condition": {
                    "attrs": [
                      "attr1"
                    ],
                    "expression": {
                      "q": "attr1 >= 100"
                    }
                  },
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "attributes": [
                      {
                        "name": "result",
                        "value": "yes"
                      }
                    ],
                    "id": "output-device-id",
                    "isPattern": false,
                    "type": "virtual"
                  },
                  "template": "", "mirror": false,
                  "type": "update"
                },
                "name": "rule_6a666fff_bfb128_1",
                "text": "select *, \"rule_6a666fff_bfb128_1\" as ruleName, ev2.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\") -> ev2 = iotEvent(cast(subscriptionId?, String) = \"123456\")]"
              }
            },
            ];
            expect(result.length).equal(2);
            expect(result[0].subscription).to.deep.equal(expected[0].subscription);
            expect(result[1].subscription).to.deep.equal(expected[1].subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 1, result[0].originalRequest);
            expect(perseoRequest).equal(undefined);

            perseoRequest = translator.generatePerseoRequest(123456, 2, result[1].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected[1].perseoRequest);

            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });


    describe('Edgedetection combined with a switch flow', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/1-edgedetection-switch-flow.json', 'utf8', function(err, data) {
          try {
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            let expected =[
            {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "condition": {
                    "attrs": [
                      "attr1", "attr2"
                    ],
                    "expression": {
                      "q": "attr2 == 1000; attr1 < 100"
                    }
                  },
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              }
            },
            {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "condition": {
                    "attrs": [
                      "attr1", "attr2"
                    ],
                    "expression": {
                      "q": "attr2 == 1000; attr1 >= 100"
                    }
                  },
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "attributes": [
                      {
                        "name": "result",
                        "value": "yes"
                      }
                    ],
                    "id": "output-device-id",
                    "isPattern": false,
                    "type": "virtual"
                  },
                  "template": "", "mirror": false,
                  "type": "update"
                },
                "name": "rule_6a666fff_bfb128_1",
                "text": "select *, \"rule_6a666fff_bfb128_1\" as ruleName, ev2.attr1? as attr1, ev2.attr2? as attr2 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\") -> ev2 = iotEvent(cast(subscriptionId?, String) = \"123456\")]"
              }
            },
            ];
            expect(result.length).equal(2);
            expect(result[0].subscription).to.deep.equal(expected[0].subscription);
            expect(result[1].subscription).to.deep.equal(expected[1].subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 1, result[0].originalRequest);
            expect(perseoRequest).equal(undefined);

            perseoRequest = translator.generatePerseoRequest(123456, 2, result[1].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected[1].perseoRequest);

            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });


    describe('Basic template flow', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/1-template-flow.json', 'utf8', function(err, data) {
          try {
            let expected = {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "attributes": [
                      {
                        "name": "result",
                        "value": "${attr1}"
                      },
                      {
                        "name": "result2",
                        "value": "${attr2}"
                      }
                    ],
                    "id": "output-device-id",
                    "isPattern": false,
                    "type": "virtual"
                  },
                  "template": "", "mirror": false,
                  "type": "update"
                },
                "name": "rule_6a666fff_bfb128_1",
                "text": "select *, \"rule_6a666fff_bfb128_1\" as ruleName, ev.attr1? as attr1, ev.attr2? as attr2 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
              }
            };
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            expect(result.length).equal(1);
            expect(result[0].subscription).to.deep.equal(expected.subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 0, result[0].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected.perseoRequest);

            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });


    describe('Basic email flow with change node', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/1-email-flow.json', 'utf8', function(err, data) {
          try {
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            let expected = {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "from": "from@user.com",
                    "smtp": "gmail-smtp-in.l.google.com",
                    "subject": "You've got e-mail",
                    "to": "to@user.com"
                  },
                  "template": "yes", "mirror": false,
                  "type": "email"
                },
                "name": "rule_6a666fff_bfb128_1",
                "text": "select *, \"rule_6a666fff_bfb128_1\" as ruleName from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
              }
            };
            expect(result.length).equal(1);
            expect(result[0].subscription).to.deep.equal(expected.subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 0, result[0].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected.perseoRequest);

            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });

    describe('Basic email flow with template node', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/2-email-flow.json', 'utf8', function(err, data) {
          try {
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            let expected = {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "from": "from@user.com",
                    "smtp": "gmail-smtp-in.l.google.com",
                    "subject": "You've got e-mail",
                    "to": "to@user.com"
                  },
                  "template": "This is an email body with ${attr1} and ${attr2}\n", "mirror": false,
                  "type": "email"
                },
                "name": "rule_6a666fff_bfb128_1",
                "text": "select *, \"rule_6a666fff_bfb128_1\" as ruleName, ev.attr1? as attr1, ev.attr2? as attr2 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
              }
            };
            expect(result.length).equal(1);
            expect(result[0].subscription).to.deep.equal(expected.subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 0, result[0].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected.perseoRequest);

            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });

    describe('Basic post flow with template node', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/1-post-flow.json', 'utf8', function(err, data) {
          try {
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            let expected = {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "headers": {
                      "h1": "header-1-value-template",
                      "h2": "header-2-value-template"
                    },
                    "method": "POST",
                    "url": "http://endpoint/device/attrs"
                  },
                  "template": "yes",
                  "mirror": false,
                  "type" : "post"
                },
                "name": "rule_456c7496_ac5c64_1",
                "text": "select *, \"rule_456c7496_ac5c64_1\" as ruleName from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
              }
            };
            expect(result.length).equal(1);
            expect(result[0].subscription).to.deep.equal(expected.subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 0, result[0].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected.perseoRequest);

            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });

    describe('Basic post flow with change node', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/2-post-flow.json', 'utf8', function(err, data) {
          try {
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            let expected = {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "headers": {
                      "h1": "h1-value-change",
                      "h2": "h2-value-change"
                    },
                    "method": "POST",
                    "url": "http://endpoint/device/attrs"
                  },
                  "template": "yes",
                  "mirror": false,
                  "type" : "post"
                },
                "name": "rule_456c7496_ac5c64_1",
                "text": "select *, \"rule_456c7496_ac5c64_1\" as ruleName from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
              }
            };
            expect(result.length).equal(1);
            expect(result[0].subscription).to.deep.equal(expected.subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 0, result[0].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected.perseoRequest);

            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });

    describe('Basic post flow with change node setting url externally', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/3-post-flow.json', 'utf8', function(err, data) {
          try {
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            let expected = {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "headers": {
                      "h1": "h1-value-change",
                      "h2": "h2-value-change"
                    },
                    "method": "POST",
                    "url": "http://endpoint/device/${attr1}"
                  },
                  "template": "yes",
                  "mirror": false,
                  "type" : "post"
                },
                "name": "rule_456c7496_ac5c64_1",
                "text": "select *, \"rule_456c7496_ac5c64_1\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
              }
            };
            expect(result.length).equal(1);
            expect(result[0].subscription).to.deep.equal(expected.subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 0, result[0].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected.perseoRequest);

            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });


    describe('Basic post flow with change node setting url externally in a change node', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/4-post-flow.json', 'utf8', function(err, data) {
          try {
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            let expected = {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "headers": {
                      "h1": "h1-value-change",
                      "h2": "h2-value-change"
                    },
                    "method": "POST",
                    "url": "http://endpoint/device/${attr1}"
                  },
                  "template": "yes",
                  "mirror": false,
                  "type" : "post"
                },
                "name": "rule_456c7496_ac5c64_1",
                "text": "select *, \"rule_456c7496_ac5c64_1\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
              }
            };
            expect(result.length).equal(1);
            expect(result[0].subscription).to.deep.equal(expected.subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 0, result[0].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected.perseoRequest);

            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });


    describe('Basic post flow with change node setting url and HTTP method externally in a change node', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/5-post-flow.json', 'utf8', function(err, data) {
          try {
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            let expected = {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "headers": {
                      "h1": "h1-value-change",
                      "h2": "h2-value-change"
                    },
                    "method": "PUT",
                    "url": "http://endpoint/device/${attr1}"
                  },
                  "template": "yes",
                  "mirror": false,
                  "type" : "post"
                },
                "name": "rule_456c7496_ac5c64_1",
                "text": "select *, \"rule_456c7496_ac5c64_1\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
              }
            };
            expect(result.length).equal(1);
            expect(result[0].subscription).to.deep.equal(expected.subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 0, result[0].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected.perseoRequest);

            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });


    describe('Basic post flow with change node setting url and HTTP method externally in a change node', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/6-post-flow.json', 'utf8', function(err, data) {
          try {
            let flow = JSON.parse(data);
            let result = translator.translateMashup(flow);
            let expected = {
              "subscription": {
                "description": "Subscription for input-device-id",
                "notification": {
                  "http": {
                    "url": "http://perseo-fe:9090/noticesv2"
                  }
                },
                "subject": {
                  "entities": [
                    {
                      "id": "input-device-id",
                      "type": "device"
                    }
                  ]
                }
              },
              "perseoRequest": {
                "action": {
                  "parameters": {
                    "headers": {
                      "h1": "h1-value-change",
                      "h2": "h2-value-change"
                    },
                    "method": "PUT",
                    "url": "http://endpoint/device/${attr1}"
                  },
                  "template": "dummy-template",
                  "mirror": true,
                  "type" : "post"
                },
                "name": "rule_456c7496_ac5c64_1",
                "text": "select *, \"rule_456c7496_ac5c64_1\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
              }
            };
            expect(result.length).equal(1);
            expect(result[0].subscription).to.deep.equal(expected.subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 0, result[0].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected.perseoRequest);

            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });





  });
}

exports.execute = execute;