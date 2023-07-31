# Week 6 — Deploying Containers

![One of Week 6 challenges](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*mSbyeNDvvtrFa3PriCWw9Q.png)

## Weekly Stats 📊
- Github: [16 commits through May 21 - June 2](https://github.com/CloudWest2023/aws-bootcamp-cruddur-2023/compare/main...mariachiinajar:aws-bootcamp-cruddur-2023:submissions)
- Medium: [10 technical documentation articles](https://medium.com/@gwenleigh/week-6-ecs-fargate-f2caafd8c02c)
- Discord: Weeks 6 & 7 combined, contributed 8 questions total, 5 of them resolved, helped +1 questions
  - Contributed
    - Authentication fails
    - RDS connection keeps failing.
    - There is no `frontend-react-js` folder when ssh into the running container.
    - [RESOLVED] The Fargate backend container deregisters upon launch. Possible cause of this?
    - [RESOLVED] HTTP Error 404: Not Found - from inside the backend container health-check
    - [RESOLVED] 503 Service Temporarily Unavailable (Health check using personal domain)
    - [RESOLVED] NPM error - static/css/main.8f2eb6b6.css from Css Minimizer plugin
    - [RESOLVED] Health check fail - ECS Container Health status is Unhealthy.
  - Helped 
    - An error occurred (InvalidGroupId.Malformed)

## Notes for consideration
- I had to help my family farm and care for my fragile grams so my entire June melted under the scorching June sun in a remote countryside in Korea. You can find the supporting documentation [here](https://www.youtube.com/@mariachiinajar/shorts).

## Notes on Documentation

I jumped into technical documentation and writing for the first time through this bootcamp. My documentaion method evolved over the course of the camp, and so it has not been done in a very consistent manner.  

I took notes of all my work and troubleshooting on Notion up until Week 4. The markdown features were great but, I wasn't able to publicly share my works. I tried Hashnode but found it challenging for the lack of markdown support. From about Week 5 onwards, I started using [Medium](https://medium.com/@gwenleigh) to blog (document) my learning so my entire documentation is there. I also started actively using visualisation tools including Lucid chart and figma.   

For the bootcamp's journaling purses, I will leave the links to all my external assets here and document the highlights here on this github markdown journal which are essentially copies from such external assets.   

<br>

## Essential AWS CLI commands
The following are a list of commands used to migrate the backend & frontend containres to ECS and run them as Fargate containers. Find he detailed implementation examples [here](https://medium.com/@gwenleigh/week-6-fargate-essential-aws-cli-commands-82112a95159c). 


### IAM
``` 
    aws iam create-role
    aws iam create-role CruddurServiceExecutionRole
    aws iam create-role CruddurTaskRole
```

### ECR  
``` 
    aws ecr get-login-password
    aws ecr create-repository "backend-flask"
    aws ecr create-repository "frontend-react-js"
    docker push AWS_ECR_URL/IMAGE_NAME
```

### ECS  
``` 
    aws ecs create-cluster
    aws ecs create-service
    aws ecs register-task-definition
    aws execute-command
    aws ecs list-tasks
    aws ecs delete-service
    aws ecs create-service --generate-cli-skeleton
```

### EC2  
``` 
    aws ec2 create-security-group CRUD_CLUSTER_SG
    aws ec2 create-security-group CRUD_SERVICE_SG
    aws ec2 authorize-security-group-ingress
    aws ec2 describe-vpc
```

### ssm  
``` 
    aws ssm put-parameter
```

<br>

## Troubleshooting - Fargate Health check failure  

### Troubleshooting Backend Health check 1 (local)
[Original article](https://medium.com/@gwenleigh/week-6-fargate-troubleshooting-health-check-1-local-4898d0962b49)  

**Problem**  

- Every time I run the health-check, the error is thrown from the try-except statement.
- I keep getting the health check failure on ECS.
- The error message is coming form the except statement. It is impossible to check whether the health check status is OK or BAD.

**Solution** 
The cause of the problem was that the health check route was missing in the `flask app.py`.  

```
    # add the route for health check in app.py
    @app.route('api/health-check')
    def health_check():
    return {'success': True}, 200
```

<br>

### Troubleshooting Backend Health check 2 (AWS)   
[Original article](https://medium.com/@gwenleigh/week-6-fargate-troubleshooting-health-check-2-aws-45eac7db8a04)   

**Problem**    
The health check results are different depending on the check method.  
- Manual ssh into container: "[OK] Flask server is running"
- Health state on ECS console: Unhealthy. Soon, everything drains once the service hits the circuit breaker limit.

**Solution**   

- 1) `Dockerfile``: from the logs, I found that a crucial env variable was not provided in the iamge so the container broke and exited immediately every time. → Added the variable in the Dockerfile.
- 2) `ECS`: after updating the image, I pushed the latest image.
- 3) `task-definition.json`: Check the healthCheck attribute’s value for the health check path → the path was wrong, so I fixed it from ./backend-flask/bin/health-check to ./backend-flask/bin/**flask**/health-check

**Tips**
- 1) **Locally** — test running your Docker image locally; shh into the container run the health check; check logs and fix all bugs.
- 2) **Remotely** — Manually — given that the image is free of bugs, run the health check inside the container.
- 3) **Remotely** — AWS —ensure the health state is Healthy.

<br>

### Troubleshooting Frontend Health check (AWS)   
[Original article](https://medium.com/@gwenleigh/week-6-fargate-troubleshooting-frontend-health-check-aws-1328ca469c51)   

**Problem**   
The health check fails on the ECS side. The task is in the infinite loop of draining the broken container and creating a new one.

**Solution**  
Update your env variables everywhere!
- `Dockerfile`, `docker image build script`, `.env`, and your local machine.