const inquirer 	= require('inquirer');
const fuzzy 	= require('inquirer-fuzzy-path');

inquirer.registerPrompt('fuzzypath', fuzzy)

module.exports = {
  askGithubCredentials: () => {
    const questions = [{
		name: 'username',
		type: 'input',
		message: 'Enter your GitHub username or e-mail address:',
		validate: function(value) {
			return !!value.length || 'Please enter your username or e-mail address.';
		}
	}, {
		name: 'password',
		type: 'password',
		message: 'Enter your password:',
		validate: function(value) {
			return !!value.length || 'Please enter your password.';
		}
	}];
	return inquirer.prompt(questions);
  },
  askGithubToken: (type) => {
	const questions = [{
		name: 'twoFactorCode',
		type: 'input',
		message: `Ops, seems like 2FA is enabled, please enter your 2FA code from your ${type}`,
		validate: function(value) {
			return !!value || 'Please enter your 2FA code.';
		}
	}];
	return inquirer.prompt(questions);
  },
  askPackageJSONPath: (type) => {
	const questions = [{
		default: 'package.json',
		pathFilter: (isDirectory, nodePath) => {
			if (nodePath.indexOf('public') >= 0 ||
				nodePath.indexOf('src') >= 0 ||
				nodePath.indexOf('dist') >= 0 ||
				nodePath.indexOf('.git') >= 0 ||
				nodePath.indexOf('node_modules') >= 0 ) {
				return false;
			}
			return true;
		},
		name: 'path',
		rootPath: '',
		type: 'fuzzypath',
		message: `Where is your package.json?`
	}];
	return inquirer.prompt(questions);
  }
};