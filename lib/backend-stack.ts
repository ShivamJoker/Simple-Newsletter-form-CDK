import {
  Stack,
  StackProps,
  CfnOutput,
  RemovalPolicy,
  Duration,
} from "aws-cdk-lib";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import {
  HttpApi,
  HttpMethod,
  CorsHttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { Construct } from "constructs";
import { Function, Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { join } from "path";

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const db = new Table(this, "user-db-table", {
      tableName: "learnaws-newsletter",
      partitionKey: { name: "email", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const subscribeFn = new Function(this, "subscribeHanlderFn", {
      functionName: "handle-form-req",
      code: Code.fromAsset(join(__dirname, "../lambda/dist")),
      handler: "handleFormReq.main",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        TABLE_NAME: db.tableName,
      },
    });

    // allow out lambda to write to the DB
    db.grantWriteData(subscribeFn);

    // create integration for APIGW v2
    const subscribeFnIntegration = new HttpLambdaIntegration(
      "handleFormReqIntegration",
      subscribeFn
    );

    const httpApi = new HttpApi(this, "subscribe-endpoint", {
      corsPreflight: {
        allowHeaders: ["*"],
        allowMethods: [CorsHttpMethod.POST],
        allowOrigins: ["http://localhost:3000", "https://learnaws.io"],
        maxAge: Duration.days(10),
      },
    });

    if (!httpApi.url) {
      throw Error("Failed to get http api url");
    }

    // Add routes in HTTP API
    httpApi.addRoutes({
      path: "/subscribe",
      methods: [HttpMethod.POST],
      integration: subscribeFnIntegration,
    });

    new CfnOutput(this, "endpoint", {
      value: httpApi.url!,
    });
  }
}
