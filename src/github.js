import * as fs from 'fs';
import * as pkg from '../package.json';
import CLI from 'clui';
import chalk from 'chalk';
import repoUrl from 'get-repository-url';
import inquirer from './inquirer';
import getOctokit from '@octokit/rest';
import Configstore from 'configstore';

const Spinner = CLI.Spinner;
const conf = new Configstore(`${pkg.name}-${pkg.version}`);
const note = pkg.description;
const authOpt = { scopes: ['repo'], note };

const octokit = getOctokit();

const gitAuth = async () =>
	await octokit.authorization.createAuthorization(authOpt);

const gitAuthWithToken = async (twoFactorCode) =>
	await octokit.authorization.createAuthorization({
		...authOpt,
		headers: { "x-github-otp": twoFactorCode }
	});

export default {
	flattenDeps: async () => {
		const keys = obj => Object.keys(obj);
		const { path } = await inquirer.askPackageJSONPath();
		const content = await fs.readFileSync(path, 'utf8');
		const {
			dependencies = [],
			devDependencies = [],
			peerDependencies = []
		} = JSON.parse(content);
		return [
			...keys(dependencies),
			...keys(devDependencies),
			...keys(peerDependencies)
		];
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
					console.log(error);
				}
			} else {
				console.log(error);
			}
		}).then(response => {
			conf.set('github.token', response.data.token);
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

		for await (let dependency of dependencies) {
			await repoUrl(dependency).then(url => {
				if (url) repositories.push(url);
			});
		}

		repoStatus.stop();

		const ownerAndRepoList = repositories
			.map(it => it.split('https://github.com/')[1])
			.map(it => it.split('/'))
			.map(it => ({ owner: it[0], repo: it[1] }));

		starStatus.start();
		for await (let repository of ownerAndRepoList) {
			const { owner, repo } = repository;
			await octokit.activity.starRepo({ owner, repo }).catch(error => {
				throw error;
			});
		}
		starStatus.stop();
		return;
	},
};

