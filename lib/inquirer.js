const inquirer = require('inquirer');

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
  }
};