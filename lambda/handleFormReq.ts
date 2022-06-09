import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PutItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { validate } from "isemail";

const { TABLE_NAME } = process.env;

const dbClient = new DynamoDBClient({ region: "ap-southeast-1" });

interface FormData {
  name: string;
  email: string;
}
const invalid_body_res = {
  statusCode: 406,
  body: '{"message":"invalid form data}"',
};

const invalid_email_res = {
  statusCode: 406,
  body: '{"message": "invalid email"}',
};

export const main = async (
  e: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  if (!e.body) {
    return invalid_body_res;
  }

  const { name, email }: FormData = JSON.parse(e.body);

  // validate for email and name field
  if (!name || !email) {
    return invalid_body_res;
  }

  if (!validate(email)) {
    return invalid_email_res;
  }

  const putItemCmd = new PutItemCommand({
    TableName: TABLE_NAME,
    Item: {
      email: { S: email },
      name: { S: name },
    },
    ConditionExpression: "attribute_not_exists(email)",
  });

  try {
    await dbClient.send(putItemCmd);
    return { body: "Subscribed successfully!" };
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify(error) };
  }
};
