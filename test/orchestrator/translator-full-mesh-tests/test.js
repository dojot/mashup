/* jshint node: true */
"use strict";
var fs = require('fs'),
    util = require('util'),
    translator = require('../../../orchestrator/translator.js'),
    chai = require('chai');

var expect = chai.expect;


function execute() {
  describe('Full tests', function() {
    describe('Switch-change flow', function() {
      it('should give no errors for simple switch-change', function(done) {
        var mashup = fs.readFile(__dirname+ '/switch-change-flow-1.json', 'utf8', function(err, data) {
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
                "name": "rule_ad42e337_a4e128_1",
                "text": "select *, \"rule_ad42e337_a4e128_1\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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


      it('should give no errors with switch node with multiple rules', function(done) {
        var mashup = fs.readFile(__dirname+ '/switch-change-flow-2.json', 'utf8', function(err, data) {
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
                "name": "rule_ad42e337_a4e128_1",
                "text": "select *, \"rule_ad42e337_a4e128_1\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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
                "name": "rule_ad42e337_a4e128_2",
                "text": "select *, \"rule_ad42e337_a4e128_2\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"123456\")]"
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
                        "name": "result2",
                        "value": "not-so-much"
                      }
                    ],
                    "id": "output-device-id",
                    "isPattern": false,
                    "type": "virtual"
                  },
                  "template": "", "mirror": false,
                  "type": "update"
                },
                "name": "rule_ad42e337_a4e128_3",
                "text": "select *, \"rule_ad42e337_a4e128_3\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"123457\")]"
              }
            },
            ];
            expect(result.length).equal(3);
            expect(result[0].subscription).to.deep.equal(expected[0].subscription);
            expect(result[1].subscription).to.deep.equal(expected[1].subscription);
            expect(result[2].subscription).to.deep.equal(expected[2].subscription);

            let perseoRequest = translator.generatePerseoRequest(12345, 0, result[0].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected[0].perseoRequest);

            perseoRequest = translator.generatePerseoRequest(123456, 0, result[1].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected[1].perseoRequest);

            perseoRequest = translator.generatePerseoRequest(123457, 0, result[2].originalRequest);
            expect(perseoRequest).not.equal(undefined);
            expect(perseoRequest).to.deep.equal(expected[2].perseoRequest);
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });

    describe('Basic change flow', function() {
      it('should generate all request correctly', function(done) {
        var mashup = fs.readFile(__dirname+ '/change-flow-1.json', 'utf8', function(err, data) {
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
                "name": "rule_ad42e337_a4e128_1",
                "text": "select *, \"rule_ad42e337_a4e128_1\" as ruleName from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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
        var mashup = fs.readFile(__dirname+ '/edgedetection-flow-1.json', 'utf8', function(err, data) {
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
                "name": "rule_947704f7_a87f4_1",
                "text": "select *, \"rule_947704f7_a87f4_1\" as ruleName, ev2.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\") -> ev2 = iotEvent(cast(subscriptionId?, String) = \"123456\")]"
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
        var mashup = fs.readFile(__dirname+ '/edgedetection-switch-flow-1.json', 'utf8', function(err, data) {
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
                "name": "rule_947704f7_a87f4_1",
                "text": "select *, \"rule_947704f7_a87f4_1\" as ruleName, ev2.attr1? as attr1, ev2.attr2? as attr2 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\") -> ev2 = iotEvent(cast(subscriptionId?, String) = \"123456\")]"
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
        var mashup = fs.readFile(__dirname+ '/template-flow-1.json', 'utf8', function(err, data) {
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
                "name": "rule_947704f7_a87f4_1",
                "text": "select *, \"rule_947704f7_a87f4_1\" as ruleName, ev.attr1? as attr1, ev.attr2? as attr2 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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


      it('should generate all request correctly with self-created variable references', function(done) {
        var mashup = fs.readFile(__dirname+ '/template-flow-2.json', 'utf8', function(err, data) {
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
                    "headers" : "",
                    "method" : "POST",
                    "url": "http://172.18.0.1:8081/device/attrs"
                  },
                  "template": "Value went up to ${a}", "mirror": false,
                  "type": "post"
                },
                "name": "rule_af3b0202_96d708_1",
                "text": "select *, \"rule_af3b0202_96d708_1\" as ruleName, ev.a? as a from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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


      it('should generate an email request with self-created variable references', function(done) {
        var mashup = fs.readFile(__dirname+ '/template-flow-3.json', 'utf8', function(err, data) {
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
                    "from": "from-mail@mail.com",
                    "smtp": "smtp-server",
                    "subject": "Value update",
                    "to": "to-mail@mail.com"
                  },
                  "template" : "Value went up to ${a}", "mirror": false,
                  "type": "email"
                },
                "name": "rule_af3b0202_96d708_1",
                "text": "select *, \"rule_af3b0202_96d708_1\" as ruleName, ev.a? as a from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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
        var mashup = fs.readFile(__dirname+ '/email-flow-1.json', 'utf8', function(err, data) {
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
                "name": "rule_ad42e337_a4e128_1",
                "text": "select *, \"rule_ad42e337_a4e128_1\" as ruleName from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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
        var mashup = fs.readFile(__dirname+ '/email-flow-2.json', 'utf8', function(err, data) {
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
                  "template": "{\"emailBody\":\"This is an email body with ${attr1} and ${attr2}\\n\"}", "mirror": false,
                  "type": "email"
                },
                "name": "rule_ad42e337_a4e128_1",
                "text": "select *, \"rule_ad42e337_a4e128_1\" as ruleName, ev.attr1? as attr1, ev.attr2? as attr2 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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
        var mashup = fs.readFile(__dirname+ '/post-flow-1.json', 'utf8', function(err, data) {
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
                "name": "rule_2219ef6d_fba688_1",
                "text": "select *, \"rule_2219ef6d_fba688_1\" as ruleName from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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
        var mashup = fs.readFile(__dirname+ '/post-flow-2.json', 'utf8', function(err, data) {
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
                "name": "rule_2219ef6d_fba688_1",
                "text": "select *, \"rule_2219ef6d_fba688_1\" as ruleName from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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
        var mashup = fs.readFile(__dirname+ '/post-flow-3.json', 'utf8', function(err, data) {
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
                "name": "rule_2219ef6d_fba688_1",
                "text": "select *, \"rule_2219ef6d_fba688_1\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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
        var mashup = fs.readFile(__dirname+ '/post-flow-4.json', 'utf8', function(err, data) {
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
                "name": "rule_2219ef6d_fba688_1",
                "text": "select *, \"rule_2219ef6d_fba688_1\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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
        var mashup = fs.readFile(__dirname+ '/post-flow-5.json', 'utf8', function(err, data) {
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
                "name": "rule_2219ef6d_fba688_1",
                "text": "select *, \"rule_2219ef6d_fba688_1\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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
        var mashup = fs.readFile(__dirname+ '/post-flow-6.json', 'utf8', function(err, data) {
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
                "name": "rule_2219ef6d_fba688_1",
                "text": "select *, \"rule_2219ef6d_fba688_1\" as ruleName, ev.attr1? as attr1 from pattern [every ev = iotEvent(cast(subscriptionId?, String) = \"12345\")]"
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