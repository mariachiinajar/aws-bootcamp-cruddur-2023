# Week 8 — Serverless Image Processing

As of July 31, I am currently working through the Week 8. As this day is the closing date of the bootcamp, I have finalised the week 8's submission. However, this journal will be evolving, as I will continue to push the cruddur project forward and update the documentations until I hit my personal finish line. 

![Week 8 Avatar processing architecture](https://miro.medium.com/v2/resize:fit:1100/format:webp/1*Pr8O8BT4CmRcSoZyM5uuPQ.png)

## Weekly Stats 📊
- Github: [2 branches, 5 commits and 2 merges through July 16 - 31](https://github.com/CloudWest2023/aws-bootcamp-cruddur-2023/compare/main...mariachiinajar:aws-bootcamp-cruddur-2023:submissions)
- Medium: 2 technical documentation articles and counting
- Discord: contributed 1 question

## Notes for consideration
- I brought the [SysOps Administrator badge](https://www.credly.com/earner/earned/badge/1242104f-6c3c-4224-bbe3-45b9011cc9b1) home on Monday, 24th of July. Although initially scheduled for end June, I had to push it towards the end July as my June melted whole in the [family farm](https://www.youtube.com/@mariachiinajar/shorts). So a significant amount of July went to SysOps. 

<br>

## Weekly Implementation  

### Live Stream Serverless Image Processing  

[Original documentation](https://medium.com/@gwenleigh/week-8-summary-live-stream-serverless-image-processing-f69c58b068f4)

**Project setup**
```
    > mkdir serverless-cdk
    > cd serverless-cdk
    > npm install aws-cdk -g 

    > cdk --version
    2.87.0 (build 9fca790)
```
```
    cdk init app --language typescript
```

**serverless-cdk-stack.ts + createBucket**
```
    # serverless-cdk-stack.ts

    import * as cdk from 'aws-cdk-lib';
    + import * as s3 from 'aws-cdk-lib/aws-s3';
    import { Construct } from 'constructs';

    export class ServerlessCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // The code that defines your stack goes here
    +   const bucketName: string = process.env.SERVERLESS_BUCKET_NAME as string;
    }
```

**Bootstrap your account**
```
    cdk bootstrap "aws://AWS_ACCOUNT_ID/us-east-1"
```

**CDK Deploy**
```
    cdk deploy
```

**serverless-cdk-stack.ts + createLambda**
In the stack definition file (serverless-cdk-stack.ts), create a function that will create a lambda function when called.   
```
  createLambda(functionPath: string): lambda.IFunction {
    const lambdaFunction = new lambda.Function(this, 'Thumblambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(functionPath)
    });
    return lambdaFunction;
  }
```

### Serverless Image Process CDK  
[Original documentation](https://medium.com/@gwenleigh/week-8-summary-serverless-image-process-cdk-6b8033559e2d#5312)

![CloudFormation Stack](https://miro.medium.com/v2/resize:fit:2000/format:webp/1*cDrLpdlGg8nHoUP8iTqO1Q.png)


**Project setup**
```
    # gitpod.yml
    tasks:
    ...
    - name: cdk
       before: |
         npm install aws-cdk -g
         cd serverless-cdk
         npm i
```

**Create an event notification**  

This step is done on AWS Console. See [here](https://medium.com/@gwenleigh/week-8-summary-serverless-image-process-cdk-6b8033559e2d/#5312).  

- In Amazon S3 > Buckets > cruddur-elb-access-logs, go to the Properties tab and click on create event notification.

**Get s3-image-proecssing code ready**  
- Update `// index.js`

```
    const process = require('process');
    // Andrew abstracted the components into classes.
    const { getClient, getOriginalImage, processImage, uploadProcessedImage } = require('./s3-image-processing.js')
    const bucketName = process.env.DEST_BUCKET_NAME
    const folderInput = process.env.FOLDER_INPUT
    const folderOutput = process.env.FOLDER_OUTPUT
    const width = parseInt(process.env.PROCESS_WIDTH)
    const height = parseInt(process.env.PROCESS_HEIGHT)
    client = getClient();
    exports.handler = async (event) => {
        console.log('event',event)
        const srcBucket = event.Records[0].s3.bucket.name;
        const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        console.log('srcBucket',srcBucket)
        console.log('srcKey',srcKey)
        const dstBucket = bucketName;
        const dstKey = srcKey.replace(folderInput,folderOutput)
        console.log('dstBucket',dstBucket)
        console.log('dstKey',dstKey)
        const originalImage = await getOriginalImage(client,srcBucket,srcKey)
        const processedImage = await processImage(originalImage,width,height)
        await uploadProcessedImage(dstBucket,dstKey,processedImage)
    };
```

- Update `s3-image-processing.js`
```
    const sharp = require('sharp');
    const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
```
```
    function getClient(){
    const client = new S3Client();
    return client;
    }
    async function getOriginalImage(client,srcBucket,srcKey){
    console.log('get==')
    const params = {
        Bucket: srcBucket,
        Key: srcKey
    };
    console.log('params',params)
    const command = new GetObjectCommand(params);
    const response = await client.send(command);
    const chunks = [];
    for await (const chunk of response.Body) {
        chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return buffer;
    }
    async function processImage(image,width,height){
    const processedImage = await sharp(image)
        .resize(width, height)
        .png()
        .toBuffer();
    return processedImage;
    }
    async function uploadProcessedImage(dstBucket,dstKey,image){
    console.log('upload==')
    const params = {
        Bucket: dstBucket,
        Key: dstKey,
        Body: image,
        ContentType: 'image/png'
    };
    console.log('params',params)
    const command = new PutObjectCommand(params);
    const response = await client.send(command);
    console.log('repsonse',response);
    return response;
    }
    module.exports = {
    getClient: getClient,
    getOriginalImage: getOriginalImage,
    processImage: processImage,
    uploadProcessedImage: uploadProcessedImage
    }
```

**Initialise lambda/process-images**  
```
    npm init -y
```
```
    {
        "name": "process-images",
        "version": "1.0.0",
        "main": "function.js",
        "scripts": {
            "test": "node ./test.js"
    },
        "keywords": [],
        "author": "",
        "license": "ISC",
        "dependencies": {
            "@aws-sdk/client-s3": "^3.305.0",
            "sharp": "^0.32.0"
    },
        "description": ""   
    }
```

**Synth and deploy the project**  
- `cdk synth` then `cdk deploy`.

**Create S3 Event Notification to Lambda**  
- Define `createS3NotifyToLambda()`
```
    import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

    export class ServerlessCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        ...
        this.createS3NotifyToLambda(folderInput, lambda, bucket)
    }
    ...
    createS3NotifyToLambda(prefix: string, lambda: lambda.IFunction, bucket: s3.IBucket): void {
        const destination = new s3n.LambdaDestination(lambda);
        bucket.addEventNotification(s3.EventType.OBJECT_CREATED_PUT,
        destination,
        {prefix: prefix} // folder to contain the original images
        )
    }
    }
```

**Test your lambda with event data**  
![Avatar Image processing lambda function in action](https://miro.medium.com/v2/resize:fit:2000/format:webp/1*BuaArIklvXV3TxtlT7SDuA.png)

- Upload images to S3 bucket and see if the lambda function works correctly. 