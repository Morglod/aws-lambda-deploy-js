export declare type LambdaConfig = {
    functionName: string;
    role?: string;
    handler?: string;
    description?: string;
    timeout?: string;
    memorySize?: string;
    vpcConfig?: string;
    environment?: string;
    runtime?: 'nodejs' | 'nodejs4.3' | 'nodejs6.10' | 'java8' | 'python2.7' | 'python3.6' | 'dotnetcore1.0' | 'dotnetcore2.0' | 'nodejs4.3-edge' | 'go1.x';
    deadLetterConfig?: string;
    kmsArnKey?: string;
    tracingConfig?: string;
    revisionId?: string;
    dependencies?: {
        [depName: string]: string;
    };
};
export declare function validateLabmdaPackage(lambdaPackagePath: string): boolean;
export declare function bundle(lambdaPackagePath: string, outputZip?: string): Promise<boolean>;
