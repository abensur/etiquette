#!/usr/bin/env node
import chalk from 'chalk';
import github from './github';

const init = () => {
	console.log(chalk.green("etiquette"));
};

const success = () => {
	console.log(chalk.white.bgGreen.bold(`Done!`));
};

const run = async () => {
	init();

	if (!github.getStoredGithubToken()) {
		await github.setGithubCredentials();
		await github.registerNewToken();
	}

	const deps = await github.flattenDeps();

	if (!deps.length) {
		return console.log(chalk.red('No dependencies found'));
	}

	await github.starRepos(deps);

	success();
};

run();