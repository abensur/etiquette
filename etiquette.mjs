#! /usr/bin/env -S zx --install

import { $, fs, echo, spinner, chalk } from 'zx'

import repoUrl from 'get-repository-url';

$.verbose = false;

let repositories = [];
let failed = []

try {
  await checkGHAuth();
  
  const flatdeps = await getDependencies();

  await fetchRepositories(flatdeps);
  
  const uniqueRepos = getUniqueRepos(repositories);

  echoRepoCount(uniqueRepos);
  
  for await (let repo of uniqueRepos) {
    await starRepo(repo);
  }

  echoFailedRepos(failed);
  
} catch (p) {
  handleError(p);
}

async function checkGHAuth() {
  await $`gh && gh auth status`;
}

async function getDependencies() {
  let {
    dependencies = {},
    devDependencies = {},
    peerDependencies = {}
  } = await fs.readJson('./package.json')

  return [
    ...Object.keys(dependencies),
    ...Object.keys(devDependencies),
    ...Object.keys(peerDependencies)
  ];
}

async function fetchRepositories(flatdeps) {
  await spinner(
    `Getting the url for ${flatdeps.length} repositor${ flatdeps.length > 1 ? 'ies' : 'y' }.`,
    async () => {
      repositories = await Promise.all(flatdeps.map(async (dep) => {
        const resp = await repoUrl(dep)
        if (resp !== 'https://github.com/null') {
          return resp
        }
        failed.push(dep)
        return null
      }))
    }
  );
}

function getUniqueRepos(repositories) {
  return [...new Set(repositories)].filter(Boolean).map((it) => it.split('/').slice(-2))
}

function echoRepoCount(uniqueRepos) {
  if (uniqueRepos.length) {
    echo`Found ${uniqueRepos.length} unique repositor${ uniqueRepos.length > 1 ? 'ies' : 'y' }.`
  } else {
    echo`No unique repositories found.`
  }
}

async function starRepo(repo) {
  let [owner, name] = repo;
  try {
    await spinner(
      `Starring ${chalk.bold(owner)}/${chalk.bold(name)}...`,
      async () => $`gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        /user/starred/${owner}/${name}`
    )
    echo`${chalk.green('✓')} - ${chalk.bold(owner)}/${chalk.bold(name)}`
    await new Promise(resolve => setTimeout(resolve, 1000)); 
  } catch (e) {
    echo`${chalk.red('✗')} - ${chalk.bold(owner)}/${chalk.bold(name)}`
  }
}

function echoFailedRepos(failed) {
  if (failed.length) {
    failed.forEach(it => echo`${chalk.red('✗')} - ${chalk.bold(it)}`)
  }
}

function handleError(p) {
  if (p.message.includes('command not found')) {
    echo`Are you sure ${chalk.bold('gh')} is installed? Download at ${chalk.underline('https://cli.github.com/')}.`
  } else if (p.message.includes('package.json')) {
    echo`Are you sure you're in the root of a ${chalk.bold('Node project')}? (package.json not found)`
  } else {
    echo(p.stderr || p);
  }
}