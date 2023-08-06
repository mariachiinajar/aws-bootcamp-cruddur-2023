# Week 7 — Solving CORS with a Load Balancer and Custom Domain

![Week 7 visual summary](https://miro.medium.com/v2/resize:fit:1100/format:webp/1*PS5GT8pKzeOpRycbGjJxWg.png)

![]()

## Weekly Stats 📊
- Github: [20 commits through June 3 - July 15](https://github.com/CloudWest2023/aws-bootcamp-cruddur-2023/compare/main...mariachiinajar:aws-bootcamp-cruddur-2023:submissions)
- Medium: [7 technical documentation articled, one per video tutorial](https://medium.com/@gwenleigh/week-7-learning-journal-fc348325d457)
- Discord: Weeks 6 & 7 combined, contributed 8 questions total, 5 of them resolved, helped +1 questions

## Notes for consideration
I followed all the steps and implemented almost all features covered in the video tutorials except for the conversation with DynamoDB. It was taking me too long time to troubleshoot so I decided to move on to Week 8 and troubleshoot along the way.  

## Weekly Highlights ✨
- **Micro-commit and commit logs**: the [Ultra-man Tony](https://github.com/ultraman-labs) advised me to keep the commit size as small as possible. So I started micro-committing smallest units of changes and developed a commit message syntax that can be intuitively understood by other members.  
- **Branching for tracking**: in addition, I also realised that creating branches can make it easier to track the evolution of the project so from week 7 onwards, I started creating branches based on our implementation objectives. 

<br>

## Weekly Implementation

### Deploying Containers
[Original documentation]()

- Lamdba
- App Runner
- Elastic Beanstalk
- ECS EC2: the user needs to manage the underlying compute.
- ECS Fargate: is a good migration path as Fargate can run on both EKS and Kubernetes
- ECS Service Connect: makes it easier to deploy Cloud Map and AppMesh together.
- Kubernetes

### Securing Flask 1 (Backend)   
[Original documentation](https://medium.com/@gwenleigh/week-7-summary-securing-flask-1-b78a6097831c)  

- Create produciton Docker images
```
    "--no-debug", "--no-debugger", "--no-reload"
```
```
    // Backend Dockerfile.prod
    FROM AWS_ACCOUNT_ID.dkr.ecr.AWS_REGION.amazonaws.com/cruddur-python:3.10-slim-buster
    WORKDIR /backend-flask

    COPY requirements.txt requirements.txt
    RUN pip3 install -r requirements.txt
    COPY . .

    ENV PYTHONUNBUFFERED=1  // <------ Instead of this, use flask's debug tag
    EXPOSE ${PORT}

    CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0", "--port=4567", 
        "--no-debug", "--no-debugger", "--no-reload"] // <--- add this
```

```
    docker build -f Dockerfile.prod -t backend-flask-prod .
```

- Login to ECR  
```
    mkdir ecr
    touch login
    chmod u+x login

    # login script - backend-flask/bin/ecr/login
    #! /usr/bin/bash

    aws ecr get-login-password --region $AWS_DEFAULT_REGION \
        | docker login --username AWS \
        --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"
```

- Run docker production image
```
    # basic structure
    docker run --rm -p HOST_PORT:DOCEKR_PORT \
    -e ENV_VAR="VALUE" \
    -it IMAGE_NAME 

    # docker run script
    docker run --rm -p 4567:4567 \ 
    -e FRONTEND_URL="https://3000-${GITPOD_WORKSPACE_ID}.${GITPOD_WORKSPACE_CLUSTER_HOST}" \ 
    -e BACKEND_URL="https://4567-${GITPOD_WORKSPACE_ID}.${GITPOD_WORKSPACE_CLUSTER_HOST}" \ 
    -e AWS_ENDPOINT_URL="https://dynamodb-local:8000" \ 
    ...
    -e AWS_COGNITO_USER_POOL_ID="${AWS_COGNITO_USER_POOL_ID}" \ 
    -e AWS_COGNITO_USER_POOL_CLIENT_ID="${AWS_COGNITO_USER_POOL_CLIENT_ID}" \ 
    -e AWS_DYNAMODB_TABLE="${AWS_DYNAMODB_TABLE}" \ 
    -it backend-flask-prod 
```



### Securing Flask 2 (Frontend)
[Original documentation]()https://medium.com/@gwenleigh/week-7-summary-securing-flask-2-frontend-3d2d78a70cad  

- Crreate `task-definition` and `service-definition` 
```
    {
        "family": "backend-flask-prod",
        ...
        {
            "name": "backend-flask-prod",
            "image": "AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/backend-flask-prod:latest",
            ...
            "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": "/week7/ECS/prodction-mode",
                "awslogs-region": "AWS_REGION",
                "awslogs-stream-prefix": "backend-flask-prod" 
        }
            }
            },
            "environment": [
            ...
            ],
            "secrets": [
            {"name": "FRONTEND_URL_PROD", "valueFrom": "arn:aws:ssm:us-east-1:AWS_ACCOUNT_ID:parameter/cruddur/backend-flask/FRONTEND_URL_PROD"},
            {"name": "BACKEND_URL_PROD", "valueFrom": "arn:aws:ssm:us-east-1:AWS_ACCOUNT_ID:parameter/cruddur/backend-flask/BACKEND_URL_PROD"},
            {"name": "URL_PROD", "valueFrom": "arn:aws:ssm:us-east-1:AWS_ACCOUNT_ID:parameter/cruddur/backend-flask/URL_PROD"},
            {"name": "AWS_XRAY_URL", "valueFrom": "arn:aws:ssm:us-east-1:AWS_ACCOUNT_ID:parameter/cruddur/backend-flask/AWS_XRAY_URL"},
            {"name": "AWS_XRAY_DAEMON_ADDRESS", "valueFrom": "arn:aws:ssm:us-east-1:AWS_ACCOUNT_ID:parameter/cruddur/backend-flask/AWS_XRAY_DAEMON_ADDRESS"},
            {"name": "HONEYCOMB_SERVICE_NAME", "valueFrom": "arn:aws:ssm:us-east-1:AWS_ACCOUNT_ID:parameter/cruddur/backend-flask/HONEYCOMB_SERVICE_NAME"},
            {"name": "AWS_DYNAMODB_TABLE", "valueFrom": "arn:aws:ssm:us-east-1:AWS_ACCOUNT_ID:parameter/cruddur/backend-flask/AWS_DYNAMODB_TABLE"}
            ]
        }
        ]
    }
```

### Troubleshoot — Fargate containers keep deregistering
![Troubleshooting](https://miro.medium.com/v2/resize:fit:1100/format:webp/1*oxPc_5UK5viXwV43uApYSA.png)

[Original documentation](https://medium.com/@gwenleigh/week-7-troubleshoot-fargate-containers-keep-deregistering-633ca1b34b03)  

**Problem**  
Unable to spin up both frontend & backend Fargate contianers. They register, then deregister, then spin up again, and repeat this in loop.

**To do**
- ✅ Frontend
  - REACT_APP_BACKEND_URL: was incorrect in .env
  - (if problem persists) all variables in .env file
- ✅ Backend
  - Security Group rule: IP from local and Gitpod was not updated.
  - Variables for Database URL was incorrect (password, port number format, database name)

**Solution**
- 1) Check your environmental variables. 
- 2) Be sure the information you put in both task-definition.json and service-definition.json are consistent.
- 3) Check if you can connect to the RDS database itself using the following options. Be sure that the RDS’ security group allows the IP addresses as source
- 4) Check all the relevant security groups. 


### Implement Refresh Token Cognito
[Original documentation](https://medium.com/@gwenleigh/week-7-summary-implement-refresh-token-cognito-b675df1d14b6)  

The session expires after some time. We would like the cognito token to auto-refresh so we don't need to log back in again every once in a while.  

- Update `src/lib/CheckAuth.js`  
```
    import { Auth } from 'aws-amplify';
    import { resolvePath } from 'react-router-dom';

    // Get and set the access token (refresh automatically)
    export async function getAccessToken() {
    Auth.currentSession()
        .then((cognito_user_session) => {
        const access_token = cognito_user_session.accessToken.jwtToken
        localStorage.setItem("access_token", access_token)
        })
        .catch((err) => console.log(err))
    return localStorage.getItem("access_token")
    }

    export async function checkAuth(setUser) {
    Auth.currentAuthenticatedUser({
        // Optional, false by default. 
        // If set to true, this call will
        // send a request to Cognito to get the latest user data
        bypassCache: false 
    })
    .then((cognito_user) => {
        console.log('cognito_user', cognito_user);
        setUser({
        display_name: cognito_user.attributes.name,
        handle: cognito_user.attributes.preferred_username
        })
        return Auth.currentSession()
    }).then((cognito_user_session) => {
        console.log('cognito_user_session', cognito_user_session);
        localStorage.setItem("access_token", cognito_user_session.accessToken.jwtToken)
    })
    .catch((err) => console.log(err));
    };

    export default checkAuth;
```

- Update the import statement in other files 
  - 🔲 HomeFeedPage.js
  - 🔲 MessageGroupNewPage.js
  - 🔲 MessageGroupsPage.js
  - 🔲 MessageGroupsPage.js
  - 🔲 MessageForm.js

```
    import {checkAuth, getAccessToken} from '../lib/CheckAuth';

    headers: {
        Authorization: `Bearer ${access_token}`
    }
```

### Fargate, Configuring for Container Insights
[Original documentation](https://medium.com/@gwenleigh/week-7-summary-fargate-configuring-for-container-insights-541f93274dd3)

With Container Insinghts on, CloudWatch automatically collects metrics for many resources including CPU, memory, disk, and network. The following are the set of permissions required for Contiainer Insights to run. See what services are involved, how they interact and how the data are collected. 

```
    # AWSCompromisedKeyQuarantineV2
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Deny",
                "Action": [
                    "cloudtrail:LookupEvents",
                    "ec2:RequestSpotInstances",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "iam:AddUserToGroup",
                    "iam:AttachGroupPolicy",
                    "iam:AttachRolePolicy",
                    "iam:AttachUserPolicy",
                    "iam:ChangePassword",
                    "iam:CreateAccessKey",
                    "iam:CreateInstanceProfile",
                    "iam:CreateLoginProfile",
                    "iam:CreatePolicyVersion",
                    "iam:CreateRole",
                    "iam:CreateUser",
                    "iam:DetachUserPolicy",
                    "iam:PassRole",
                    "iam:PutGroupPolicy",
                    "iam:PutRolePolicy",
                    "iam:PutUserPermissionsBoundary",
                    "iam:PutUserPolicy",
                    "iam:SetDefaultPolicyVersion",
                    "iam:UpdateAccessKey",
                    "iam:UpdateAccountPasswordPolicy",
                    "iam:UpdateAssumeRolePolicy",
                    "iam:UpdateLoginProfile",
                    "iam:UpdateUser",
                    "lambda:AddLayerVersionPermission",
                    "lambda:AddPermission",
                    "lambda:CreateFunction",
                    "lambda:GetPolicy",
                    "lambda:ListTags",
                    "lambda:PutProvisionedConcurrencyConfig",
                    "lambda:TagResource",
                    "lambda:UntagResource",
                    "lambda:UpdateFunctionCode",
                    "lightsail:Create*",
                    "lightsail:Delete*",
                    "lightsail:DownloadDefaultKeyPair",
                    "lightsail:GetInstanceAccessDetails",
                    "lightsail:Start*",
                    "lightsail:Update*",
                    "organizations:CreateAccount",
                    "organizations:CreateOrganization",
                    "organizations:InviteAccountToOrganization",
                    "s3:DeleteBucket",
                    "s3:DeleteObject",
                    "s3:DeleteObjectVersion",
                    "s3:PutLifecycleConfiguration",
                    "s3:PutBucketAcl",
                    "s3:PutBucketOwnershipControls",
                    "s3:DeleteBucketPolicy",
                    "s3:ObjectOwnerOverrideToBucketOwner",
                    "s3:PutAccountPublicAccessBlock",
                    "s3:PutBucketPolicy",
                    "s3:ListAllMyBuckets",
                    "ec2:PurchaseReservedInstancesOffering",
                    "ec2:AcceptReservedInstancesExchangeQuote",
                    "ec2:CreateReservedInstancesListing",
                    "savingsplans:CreateSavingsPlan"
                ],
                "Resource": [
                    "*"
                ]
            }
        ]
    }
```