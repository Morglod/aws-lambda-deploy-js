import * as fs from 'fs';
import archiver from 'archiver';
import { join as pathJoin } from 'path';
import * as child_process from 'child_process';

export type LambdaConfig = {
    functionName: string,
    role?: string,
    handler?: string,
    description?: string,
    timeout?: string,
    memorySize?: string,
    vpcConfig?: string,
    environment?: string,
    runtime?:
        'nodejs' |
        'nodejs4.3' |
        'nodejs6.10' |
        'java8' |
        'python2.7' |
        'python3.6' |
        'dotnetcore1.0' |
        'dotnetcore2.0' |
        'nodejs4.3-edge' |
        'go1.x',
    deadLetterConfig?: string,
    kmsArnKey?: string,
    tracingConfig?: string,
    revisionId?: string,
    dependencies?: { [depName: string]: string }
};

const lambdaConfigMapping: {
    [configEntryKey in keyof LambdaConfig]: string
} = {
    functionName: 'function-name',
    memorySize: 'memory-size',
    vpcConfig: 'vpc-config',
    deadLetterConfig: 'dead-letter-config',
    kmsArnKey: 'kms-arn-key',
    tracingConfig: 'tracing-config',
    revisionId: 'revision-id'
};

export function validateLabmdaPackage(lambdaPackagePath: string): boolean {
    const dirs = [ 'src', 'build' ];
    const files = [ 'src/lambda.json' ];

    return dirs.concat(files).every(path => {
        if (!fs.existsSync(pathJoin(lambdaPackagePath, path))) {
            console.log(`lambda package should contain '${path}' path`);
            return false;
        }
        return true;
    });
}

export async function bundle(lambdaPackagePath: string, outputZip: string = './build.zip'): Promise<boolean> {
    if (!validateLabmdaPackage(lambdaPackagePath)) {
        console.log('invalid lambda directory structure');
        return false;
    }

    // Copy config from source
    const lambdaConfigPathSrc = pathJoin(lambdaPackagePath, './src/lambda.json');
    const lambdaConfigPathDst = pathJoin(lambdaPackagePath, './build/lambda.json');
    console.log(`copy config from '${lambdaConfigPathSrc}' to '${lambdaConfigPathDst}'`);
    fs.copyFileSync(lambdaConfigPathSrc, lambdaConfigPathDst);
    const lambdaConfig: LambdaConfig = require(lambdaConfigPathSrc);
    const buildPath = pathJoin(lambdaPackagePath, './build');

    // Install lambda dependencies
    console.log('install dependencies from lambdaConfig.dependencies');
    Object.keys(lambdaConfig.dependencies || []).forEach(dep => {
        console.log(`install ${dep}`);
        const installOut = child_process.execSync(`npm install ${dep} -g --prefix="${buildPath}"`);
        console.log(installOut.toString());
    });

    // Pack to zip archive
    return new Promise<boolean>(resolve => {
        const zipPathDst = outputZip.startsWith('.') ? pathJoin(lambdaPackagePath, outputZip) : outputZip;
        console.log(`pack to zip as '${zipPathDst}'`);
        var output = fs.createWriteStream(zipPathDst);
        var archive = archiver('zip');
    
        output.on('close', function () {
            console.log(`${archive.pointer()} total bytes`);
            console.log('archiver has been finalized and the output file descriptor has closed.');
    
            // Upload to AWS
            console.log('uploading to aws');
            const params = Object.entries(lambdaConfig).filter(([ entryName ]) =>
                ![ 'dependencies' ].includes(entryName)
            ).map(([ entryName, entryValue ]) =>
                `--${(entryName in lambdaConfigMapping) ? (lambdaConfigMapping as any)[entryName] : entryName} ${entryValue}`
            ).join(' ');

            const execCmd = `aws lambda update-function-code --zip-file fileb://${zipPathDst.replace(/\\/g, '/')} ${params}`;
            console.log(`exec: ${execCmd}`);

            const uploadAwsOut = child_process.execSync(execCmd);
            console.log(uploadAwsOut.toString());

            resolve(true);
        });
    
        archive.on('error', function(err){
            console.error(err);
            resolve(false);
        });
    
        archive.directory(pathJoin(lambdaPackagePath, './build'), false);
        archive.pipe(output);
        archive.finalize();
    });
}