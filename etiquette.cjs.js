#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var inquirer = _interopDefault(require('inquirer'));
var fuzzypath = _interopDefault(require('inquirer-fuzzy-path'));
var fs = require('fs');
var CLI = _interopDefault(require('clui'));
var chalk = _interopDefault(require('chalk'));
var repoUrl = _interopDefault(require('get-repository-url'));
var getOctokit = _interopDefault(require('@octokit/rest'));
var Configstore = _interopDefault(require('configstore'));

function _asyncIterator(iterable) {
  var method;

  if (typeof Symbol === "function") {
    if (Symbol.asyncIterator) {
      method = iterable[Symbol.asyncIterator];
      if (method != null) return method.call(iterable);
    }

    if (Symbol.iterator) {
      method = iterable[Symbol.iterator];
      if (method != null) return method.call(iterable);
    }
  }

  throw new TypeError("Object is not async iterable");
}

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

var name = "etiquette";
var version = "2.1.0";
var description = "etiquette is the command-line tool that stars your dependencies";

inquirer.registerPrompt('fuzzypath', fuzzypath);
var inquirer$1 = {
  askGithubCredentials: () => {
    const questions = [{
      name: 'username',
      type: 'input',
      message: 'Enter your GitHub username or e-mail address:',
      validate: function validate(value) {
        return !!value.length || 'Please enter your username or e-mail address.';
      }
    }, {
      name: 'password',
      type: 'password',
      message: 'Enter your password:',
      validate: function validate(value) {
        return !!value.length || 'Please enter your password.';
      }
    }];
    return inquirer.prompt(questions);
  },
  askGithubToken: type => {
    const questions = [{
      name: 'twoFactorCode',
      type: 'input',
      message: `Ops, seems like 2FA is enabled, please enter your 2FA code from your ${type}:`,
      validate: function validate(value) {
        return !!value || 'Please enter your 2FA code.';
      }
    }];
    return inquirer.prompt(questions);
  },
  askPackageJSONPath: () => {
    const questions = [{
      type: 'fuzzypath',
      name: 'path',
      pathFilter: (isDirectory, nodePath) => {
        return !isDirectory && nodePath.indexOf('.git') === -1 && nodePath.indexOf('node_modules') === -1 && nodePath.indexOf('public') === -1 && nodePath.indexOf('dist') === -1;
      },
      message: 'Select your package.json:',
      default: 'package.json'
    }];
    return inquirer.prompt(questions);
  }
};

const Spinner = CLI.Spinner;
const conf = new Configstore(`${name}-${version}`);
const note = description;
const authOpt = {
  scopes: ['repo'],
  note
};
const octokit = getOctokit();

const gitAuth =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* () {
    return yield octokit.authorization.createAuthorization(authOpt);
  });

  return function gitAuth() {
    return _ref.apply(this, arguments);
  };
}();

const gitAuthWithToken =
/*#__PURE__*/
function () {
  var _ref2 = _asyncToGenerator(function* (twoFactorCode) {
    return yield octokit.authorization.createAuthorization(_objectSpread({}, authOpt, {
      headers: {
        "x-github-otp": twoFactorCode
      }
    }));
  });

  return function gitAuthWithToken(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var github = {
  flattenDeps: function () {
    var _flattenDeps = _asyncToGenerator(function* () {
      const keys = obj => Object.keys(obj);

      const _ref3 = yield inquirer$1.askPackageJSONPath(),
            path = _ref3.path;

      const content = yield fs.readFileSync(path, 'utf8');

      const _JSON$parse = JSON.parse(content),
            _JSON$parse$dependenc = _JSON$parse.dependencies,
            dependencies$$1 = _JSON$parse$dependenc === void 0 ? [] : _JSON$parse$dependenc,
            _JSON$parse$devDepend = _JSON$parse.devDependencies,
            devDependencies$$1 = _JSON$parse$devDepend === void 0 ? [] : _JSON$parse$devDepend,
            _JSON$parse$peerDepen = _JSON$parse.peerDependencies,
            peerDependencies = _JSON$parse$peerDepen === void 0 ? [] : _JSON$parse$peerDepen;

      return [...keys(dependencies$$1), ...keys(devDependencies$$1), ...keys(peerDependencies)];
    });

    function flattenDeps() {
      return _flattenDeps.apply(this, arguments);
    }

    return flattenDeps;
  }(),
  getStoredGithubToken: () => conf.get('github.token'),
  setGithubCredentials: function () {
    var _setGithubCredentials = _asyncToGenerator(function* () {
      const _ref4 = yield inquirer$1.askGithubCredentials(),
            username = _ref4.username,
            password = _ref4.password;

      conf.set('github.username', username);
      conf.set('github.password', password);
      octokit.authenticate({
        type: 'basic',
        username,
        password
      });
    });

    function setGithubCredentials() {
      return _setGithubCredentials.apply(this, arguments);
    }

    return setGithubCredentials;
  }(),
  registerNewToken: function () {
    var _registerNewToken = _asyncToGenerator(function* () {
      const status = new Spinner('Authenticating, please wait...');
      status.start();
      yield gitAuth().catch(
      /*#__PURE__*/
      function () {
        var _ref5 = _asyncToGenerator(function* (error) {
          status.stop();

          if (error.status === 401) {
            const otp = error.headers['x-github-otp'];
            const type = otp ? otp.split('; ')[1] : false;

            if (type) {
              const _ref6 = yield inquirer$1.askGithubToken(type),
                    twoFactorCode = _ref6.twoFactorCode;

              const response = yield gitAuthWithToken(twoFactorCode).catch(error => {
                console.log(chalk.red('Unable to create access token, verify your tokens @ https://github.com/settings/tokens'));
              });
              conf.set('github.token', response.data.token);
            } else {
              console.log(error);
            }
          } else {
            console.log(error);
          }
        });

        return function (_x2) {
          return _ref5.apply(this, arguments);
        };
      }()).then(response => {
        conf.set('github.token', response.data.token);
      });
      status.stop();
      return conf.get('github.token');
    });

    function registerNewToken() {
      return _registerNewToken.apply(this, arguments);
    }

    return registerNewToken;
  }(),
  starRepos: function () {
    var _starRepos = _asyncToGenerator(function* (dependencies$$1) {
      const repoStatus = new Spinner('Finding repositories, please wait...');
      const starStatus = new Spinner('Starring repositories, please wait...');
      const token = conf.get('github.token');
      const repositories = [];
      octokit.authenticate({
        type: 'token',
        token
      });
      repoStatus.start();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;

      var _iteratorError;

      try {
        for (var _iterator = _asyncIterator(dependencies$$1), _step, _value; _step = yield _iterator.next(), _iteratorNormalCompletion = _step.done, _value = yield _step.value, !_iteratorNormalCompletion; _iteratorNormalCompletion = true) {
          let dependency = _value;
          yield repoUrl(dependency).then(url => {
            if (url) repositories.push(url);
          });
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            yield _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      repoStatus.stop();
      const ownerAndRepoList = repositories.map(it => it.split('https://github.com/')[1]).map(it => it.split('/')).map(it => ({
        owner: it[0],
        repo: it[1]
      }));
      starStatus.start();
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;

      var _iteratorError2;

      try {
        for (var _iterator2 = _asyncIterator(ownerAndRepoList), _step2, _value2; _step2 = yield _iterator2.next(), _iteratorNormalCompletion2 = _step2.done, _value2 = yield _step2.value, !_iteratorNormalCompletion2; _iteratorNormalCompletion2 = true) {
          let repository$$1 = _value2;
          const owner = repository$$1.owner,
                repo = repository$$1.repo;
          yield octokit.activity.starRepo({
            owner,
            repo
          }).catch(error => {
            throw error;
          });
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            yield _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      starStatus.stop();
      return;
    });

    function starRepos(_x3) {
      return _starRepos.apply(this, arguments);
    }

    return starRepos;
  }()
};

const init = () => {
  console.log(chalk.green("etiquette"));
};

const success = () => {
  console.log(chalk.white.bgGreen.bold(`Done!`));
};

const run =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* () {
    init();

    if (!github.getStoredGithubToken()) {
      yield github.setGithubCredentials();
      yield github.registerNewToken();
    }

    const deps = yield github.flattenDeps();

    if (!deps.length) {
      return console.log(chalk.red('No dependencies found'));
    }

    yield github.starRepos(deps);
    success();
  });

  return function run() {
    return _ref.apply(this, arguments);
  };
}();

run();
