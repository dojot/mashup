/* jshint node: true */
"use strict";


/**
 * Clone a simple object (without any functions)
 * @param {Simple JS object} obj The object to be cloned
 * @return The clone.
 */
function cloneSimpleObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}



/**
 * Add an object to an array.
 * If the object is already in the array, nothing is changed.
 * @param {Array} array The array to be changed.
 * @param {*} obj The object to be added
 */
function addUniqueToArray(array, obj) {
  let found = false;
  for (let i in array) {
    if (array[i] === obj) {
      found = true;
    }
  }
  if (found == false) {
    array.push(obj);
  }
}



/**
 * Tokenizes a string
 * @param {string} text The text to be tokenized
 * @param {string} token The token to be used
 * @return {Array} The tokenized string.
 */
function tokenize(text, token) {
  let ret = [];
  let remainder = text;

  let beginIndex = remainder.indexOf(token);
  while (beginIndex >= 0) {
    let begin = remainder.slice(0, beginIndex);
    remainder = remainder.slice(beginIndex + token.length);
    ret.push(begin);
    beginIndex = remainder.indexOf(token);
  }
  ret.push(remainder);
  return ret;
}


/**
 * Adds a particular parameter described by a 'path' into an object.
 *
 * For instance, suppose the following object:
 * obj = {
 *   descr : {
 *     owner : {
 *       name : 'user'
 *     }
 *   }
 * }
 *
 * Calling objectify(obj, 'descr.owner.resource.id', 12345) will generate:
 * {
 *   descr : {
 *     owner : {
 *       name : 'user',
 *       resource: {
 *         id: 12345
 *       }
 *     }
 *   }
 * }
 *
 * @param {Object} obj The object to be changed
 * @param {string} path The path to be added
 * @param {*} value The value to be associated to this path
 */
function objectify(obj, path, value) {
  if (path.length == 1) {
    obj[path[0]] = value;
  } else {
    let currAttr = path[0];
    path.shift();
    if (obj[currAttr] == undefined) {
      obj[currAttr] = {};
    }
    obj[currAttr] = objectify(obj[currAttr], path, value);
  }
  return obj;
}



/**
 * Remove a prefix from a string.
 * This is useful to get rid of a "payload." in strings such as "payload.output.a".
 * In this case, the string "output.a" is returned.
 * @param {string} property The property string to be trimmed.
 * @param {string} keyword The keyword which will mark the beginning of the remaining string.
 * @return The remainder of the string, without the keywork.
 */
function trimProperty(property, keyword) {
  var payloadLength = keyword.length;
  return property.slice(property.indexOf(keyword) + payloadLength);
}

exports.cloneSimpleObject = cloneSimpleObject;
exports.trimProperty = trimProperty;
exports.objectify = objectify;
exports.tokenize = tokenize;
exports.addUniqueToArray = addUniqueToArray;
exports.cloneSimpleObject = cloneSimpleObject;
