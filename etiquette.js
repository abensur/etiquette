var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import { $, fs, echo, spinner, chalk } from 'zx';
import repoUrl from 'get-repository-url';
$.verbose = false;
let repositories = [];
let failed = [];
void function () {
    var _a, e_1, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield checkGHAuth();
            const flatdeps = yield getDependencies();
            yield fetchRepositories(flatdeps);
            const uniqueRepos = getUniqueRepos(repositories);
            echoRepoCount(uniqueRepos);
            try {
                for (var _d = true, uniqueRepos_1 = __asyncValues(uniqueRepos), uniqueRepos_1_1; uniqueRepos_1_1 = yield uniqueRepos_1.next(), _a = uniqueRepos_1_1.done, !_a; _d = true) {
                    _c = uniqueRepos_1_1.value;
                    _d = false;
                    let repo = _c;
                    yield starRepo(repo);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = uniqueRepos_1.return)) yield _b.call(uniqueRepos_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            echoFailedRepos(failed);
        }
        catch (p) {
            handleError(p);
        }
        function checkGHAuth() {
            return __awaiter(this, void 0, void 0, function* () {
                yield $ `gh && gh auth status`;
            });
        }
        function getDependencies() {
            return __awaiter(this, void 0, void 0, function* () {
                let { dependencies = {}, devDependencies = {}, peerDependencies = {} } = yield fs.readJson('./package.json');
                return [
                    ...Object.keys(dependencies),
                    ...Object.keys(devDependencies),
                    ...Object.keys(peerDependencies)
                ];
            });
        }
        function fetchRepositories(flatdeps) {
            return __awaiter(this, void 0, void 0, function* () {
                yield spinner(`Getting the url for ${flatdeps.length} repositor${flatdeps.length > 1 ? 'ies' : 'y'}.`, () => __awaiter(this, void 0, void 0, function* () {
                    repositories = yield Promise.all(flatdeps.map((dep) => __awaiter(this, void 0, void 0, function* () {
                        const resp = yield repoUrl(dep);
                        if (resp !== 'https://github.com/null') {
                            return resp;
                        }
                        failed.push(dep);
                        return null;
                    })));
                }));
            });
        }
        function getUniqueRepos(repositories) {
            return [...new Set(repositories)].filter(Boolean).map((it) => it.split('/').slice(-2));
        }
        function echoRepoCount(uniqueRepos) {
            if (uniqueRepos.length) {
                echo `Found ${uniqueRepos.length} unique repositor${uniqueRepos.length > 1 ? 'ies' : 'y'}.`;
            }
            else {
                echo `No unique repositories found.`;
            }
        }
        function starRepo(repo) {
            return __awaiter(this, void 0, void 0, function* () {
                let [owner, name] = repo;
                try {
                    yield spinner(`Starring ${chalk.bold(owner)}/${chalk.bold(name)}...`, () => __awaiter(this, void 0, void 0, function* () {
                        return $ `gh api \
          --method PUT \
          -H "Accept: application/vnd.github+json" \
          -H "X-GitHub-Api-Version: 2022-11-28" \
          /user/starred/${owner}/${name}`;
                    }));
                    echo `${chalk.green('✓')} - ${chalk.bold(owner)}/${chalk.bold(name)}`;
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                }
                catch (e) {
                    echo `${chalk.red('✗')} - ${chalk.bold(owner)}/${chalk.bold(name)}`;
                }
            });
        }
        function echoFailedRepos(failed) {
            if (failed.length) {
                failed.forEach(it => echo `${chalk.red('✗')} - ${chalk.bold(it)}`);
            }
        }
        function handleError(p) {
            if (p.message.includes('command not found')) {
                echo `Are you sure ${chalk.bold('gh')} is installed? Download at ${chalk.underline('https://cli.github.com/')}.`;
            }
            else if (p.message.includes('package.json')) {
                echo `Are you sure you're in the root of a ${chalk.bold('Node project')}? (package.json not found)`;
            }
            else {
                echo(p.stderr || p);
            }
        }
    });
}();
