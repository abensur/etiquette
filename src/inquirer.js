import inquirer from 'inquirer';
import fuzzypath from 'inquirer-fuzzy-path';

inquirer.registerPrompt('fuzzypath', fuzzypath);

export default {
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
			message: `Ops, seems like 2FA is enabled, please enter your 2FA code from your ${type}:`,
			validate: function(value) {
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
				return (
					!isDirectory &&
					nodePath.indexOf('.git') === -1 &&
					nodePath.indexOf('node_modules') === -1 &&
					nodePath.indexOf('public') === -1 &&
					nodePath.indexOf('dist') === -1
				);
			},
			message: 'Select your package.json:',
			default: 'package.json'
		}];
		return inquirer.prompt(questions);
  }
};