"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var archiver_1 = __importDefault(require("archiver"));
var path_1 = require("path");
var child_process = __importStar(require("child_process"));
var lambdaConfigMapping = {
    functionName: 'function-name',
    memorySize: 'memory-size',
    vpcConfig: 'vpc-config',
    deadLetterConfig: 'dead-letter-config',
    kmsArnKey: 'kms-arn-key',
    tracingConfig: 'tracing-config',
    revisionId: 'revision-id'
};
function validateLabmdaPackage(lambdaPackagePath) {
    var dirs = ['src', 'build'];
    var files = ['src/lambda.json'];
    return dirs.concat(files).every(function (path) {
        if (!fs.existsSync(path_1.join(lambdaPackagePath, path))) {
            console.log("lambda package should contain '" + path + "' path");
            return false;
        }
        return true;
    });
}
exports.validateLabmdaPackage = validateLabmdaPackage;
/**
 * bundle lambda project to zip
 * @param lambdaPackagePath path to project with `build` & `src` directories.
 * @param outputZip output zip file path. ('./build.zip' by default)
 * @param opts additional config
 */
function bundle(lambdaPackagePath, outputZip, opts) {
    if (outputZip === void 0) { outputZip = './build.zip'; }
    return __awaiter(this, void 0, void 0, function () {
        var lambdaConfigPathSrc, lambdaConfigPathDst, lambdaConfig, buildPath;
        return __generator(this, function (_a) {
            if (!validateLabmdaPackage(lambdaPackagePath)) {
                console.log('invalid lambda directory structure');
                return [2 /*return*/, false];
            }
            lambdaConfigPathSrc = path_1.join(lambdaPackagePath, './src/lambda.json');
            lambdaConfigPathDst = path_1.join(lambdaPackagePath, './build/lambda.json');
            console.log("copy config from '" + lambdaConfigPathSrc + "' to '" + lambdaConfigPathDst + "'");
            fs.copyFileSync(lambdaConfigPathSrc, lambdaConfigPathDst);
            lambdaConfig = require(lambdaConfigPathSrc);
            buildPath = path_1.join(lambdaPackagePath, './build');
            // Install lambda dependencies
            console.log('install dependencies from lambdaConfig.dependencies');
            Object.keys(lambdaConfig.dependencies || []).forEach(function (dep) {
                console.log("install " + dep);
                var installOut = child_process.execSync("npm install " + dep + " -g --prefix=\"" + buildPath + "\"");
                console.log(installOut.toString());
            });
            // Pack to zip archive
            return [2 /*return*/, new Promise(function (resolve) {
                    var zipPathDst = outputZip.startsWith('.') ? path_1.join(lambdaPackagePath, outputZip) : outputZip;
                    console.log("pack to zip as '" + zipPathDst + "'");
                    var output = fs.createWriteStream(zipPathDst);
                    var archive = archiver_1.default('zip');
                    output.on('close', function () {
                        console.log(archive.pointer() + " total bytes");
                        console.log('archiver has been finalized and the output file descriptor has closed.');
                        // Upload to AWS
                        console.log('uploading to aws');
                        var superConfig = Object.entries(__assign({}, lambdaConfig, opts)).filter(function (_a) {
                            var entryName = _a[0];
                            return !['dependencies', 'fileName'].includes(entryName);
                        });
                        // filter from 'configure-function' params
                        var updateFunctionConfig = superConfig.filter(function (_a) {
                            var entryName = _a[0];
                            return ['functionName', 'revisionId'].includes(entryName);
                        });
                        var updateFunctionParams = updateFunctionConfig.map(function (_a) {
                            var entryName = _a[0], entryValue = _a[1];
                            return "--" + ((entryName in lambdaConfigMapping) ? lambdaConfigMapping[entryName] : entryName) + " " + entryValue;
                        }).join(' ');
                        var execCmd = "aws lambda update-function-code --zip-file fileb://" + zipPathDst.replace(/\\/g, '/') + " " + updateFunctionParams;
                        console.log("exec: " + execCmd);
                        var uploadAwsOut = child_process.execSync(execCmd);
                        console.log(uploadAwsOut.toString());
                        // if super config has smth other than [ 'functionName', 'revisionId' ], it is also configure-function
                        if (superConfig.length > 2) {
                            console.log('configure lambda function');
                            var configureFunctionParams = superConfig.map(function (_a) {
                                var entryName = _a[0], entryValue = _a[1];
                                return "--" + ((entryName in lambdaConfigMapping) ? lambdaConfigMapping[entryName] : entryName) + " " + entryValue;
                            }).join(' ');
                            var execCmd_1 = "aws lambda update-function-configuration " + configureFunctionParams;
                            console.log("exec: " + execCmd_1);
                            var uploadAwsOut_1 = child_process.execSync(execCmd_1);
                            console.log(uploadAwsOut_1.toString());
                        }
                        resolve(true);
                    });
                    archive.on('error', function (err) {
                        console.error(err);
                        resolve(false);
                    });
                    archive.directory(path_1.join(lambdaPackagePath, './build'), false);
                    archive.pipe(output);
                    archive.finalize();
                })];
        });
    });
}
exports.bundle = bundle;
//# sourceMappingURL=index.js.map