# Simple Newsletter form in CDK

Newsletter backend in CDK using AWS Lambda, DynamoDB & API Gateway

## How to deploy

- Configure and install AWS CLI & CDK
- `pnpm install` Install the packages
- `./bundle-lambda.sh` Bundle lambda into JS
- `cdk bootstrap` Bootstrap your app (only once)
- `cdk deploy` Deploy this stack to your default AWS account/region

## How to test

### Submit a request

#### Using HTTP pie

```sh
https post https://your-endpoint/subscribe name="shivam" email="hi@baby.com"
```

#### Using curl

```sh
curl https://your-endpoint/subscribe \
--header "Content-Type: application/json" \
--request POST \
--data '{"name": "shivam","email": "hi@bye.com"}'
```

### Scan the table

```sh
aws dynamodb scan --table-name learnaws-newsletter --region ap-southeast-1
```
