const octokit     = require('@octokit/rest')();
const Configstore = require('configstore');
const CLI         = require('clui');
const repoUrl 	  = require('get-repository-url');
const Spinner     = CLI.Spinner;
const pkg         = require('../package.json');
const chalk       = require('chalk');
const inquirer    = require('./inquirer');
const conf 		  = new Configstore(pkg.name);
const note     	  = pkg.description;
const authOpt	  = { scopes: ['repo'], note };

const gitAuth = async () =>
	await octokit.authorization.createAuthorization(authOpt);

const gitAuthWithToken = async (twoFactorCode) =>
	await octokit.authorization.createAuthorization({
		...authOpt,
		headers: { "x-github-otp": twoFactorCode }
	});

module.exports = {
	flattenDeps: async () => {
		const keys = obj => Object.keys(obj);
		const { path } = await inquirer.askPackageJSONPath();
		console.log(path);
		// const {
		// 	dependencies = [],
		// 	devDependencies = [],
		// 	peerDependencies = []
		// } = pkg;
		// return [
		// 	...keys(dependencies),
		// 	...keys(devDependencies),
		// 	...keys(peerDependencies)
		// ];
	},
	getStoredGithubToken: () => conf.get('github.token'),
	setGithubCredentials: async () => {
		const { username, password } = await inquirer.askGithubCredentials();
		conf.set('github.username', username);
		conf.set('github.password', password);
		octokit.authenticate({ type: 'basic', username, password });
	},
	registerNewToken: async () => {
		const status = new Spinner('Authenticating, please wait...');
		status.start();
		await gitAuth().catch(async error => {
			status.stop();
			if (error.status === 401) {
				const otp = error.headers['x-github-otp'];
				const type = otp ? otp.split('; ')[1] : false;

				if (type) {
					const { twoFactorCode } = await inquirer.askGithubToken(type);
					const response = await gitAuthWithToken(twoFactorCode).catch(error => {
						console.log(chalk.red('Unable to create access token, verify your tokens @ https://github.com/settings/tokens'));
					});
					conf.set('github.token', response.data.token);
				} else {
					console.log(chalk.red(error.header.status));
				}
			} else {
				console.log(chalk.red(error.header.status));
			}
		});
		status.stop();
		return conf.get('github.token');
	},
	starRepos: async (dependencies) => {
		const repoStatus = new Spinner('Finding repositories, please wait...');
		const starStatus = new Spinner('Starring repositories, please wait...');
		const token = conf.get('github.token');
		const repositories = [];

		octokit.authenticate({ type: 'token', token });

		repoStatus.start();

		for await (dependency of dependencies) {
			await repoUrl(dependency).then(url => {
				repositories.push(url);
			});
		}

		repoStatus.stop();
		const ownerAndRepoList = repositories
			.map(it => it.split('https://github.com/')[1])
			.map(it => it.split('/'))
			.map(it => ({ owner: it[0], repo: it[1] }));

		starStatus.start();
		for await (repository of ownerAndRepoList) {
			const { owner, repo } = repository;
			await octokit.activity.starRepo({ owner, repo }).catch(error => {
				console.log(error);
			});
		}
		starStatus.stop();
		return;
	},

};

