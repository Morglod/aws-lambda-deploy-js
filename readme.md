# aws-lambda-deploy-tool

Tool for bundling and uploading your labmda code (nodejs based).

* Supports TypeScript

<details>
<summary>Integration</summary>


Project structure:

```
node_modules
build
    main.js
    utils.js
src
    main.ts
    utils.ts
package.json
```

### Configure AWS CLI
[en](https://aws.amazon.com/en/cli/) [ru](https://aws.amazon.com/ru/cli/) guide

### Install tool

```
npm i https://github.com/Morglod/aws-lambda-deploy-js
```

### Create config file for lambda

```
src
    lambda.json
```

with this content:

```json
{
    "functionName": "myFunctionName",
    "dependencies": {
        "myDependency": "version"
    }
}
```

### Create build script

```
build_tools
    deploy.js
```

with this content:

```js
var tool = require('aws-lambda-deploy-tool');
tool.bundle(require('path').join(__dirname, '..'));
```

### Add script

in

```
package.json
```

```json
{
    "scripts": {
        "deployLambda": "node build_tools/deploy.js"
    }
}
```

or update your build script, eg:

```json
{
    "scripts": {
        "build": "tsc && node build_tools/deploy.js"
    }
}
```

Now just run:
```
npm run deployLambda
```

`build_tools/deploy.js` will call `aws-lambda-deploy-js` to bundle your module.  
`src/lambda.json` will be copied to `build` and all dependencies from `lambda.json` will be installed as `build/node_modules`.  
Then `aws-lambda-deploy-js` bundle to zip file `build` directory and call `aws cli` to update lambda's code.

</details>

<details>
<summary>API</summary>

### Bundle

```js
bundle(lambdaPackagePath: string, outputZip: string = './build.zip', opts?: LambdaConfig): Promise<boolean>
```

* `lambdaPackagePath` - path to bundling module root directory.
* `outputZip` - path to output.
* `opts` - additional config.

If config will have smth other than `functionName` or `revisionId`, `aws update-function-configuration` will be called.

</details>

<details>
<summary>lambda.json</summary>

```ts
{
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
}
```

If config will have smth other than `functionName` or `revisionId`, `aws update-function-configuration` will be called.

[update function code reference](https://docs.aws.amazon.com/cli/latest/reference/lambda/update-function-code.html)

[update function configuration reference](https://docs.aws.amazon.com/cli/latest/reference/lambda/update-function-configuration.html)

</details>