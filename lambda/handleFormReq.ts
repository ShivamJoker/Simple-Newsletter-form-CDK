import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PutItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { isEmailValid } from "@sideway/address";
import { isEmailDomainValid } from "node-email-domain-check";
const { TABLE_NAME } = process.env;

const dbClient = new DynamoDBClient({ region: "ap-southeast-1" });

const makeMsg = (msg: string) => {
  return JSON.stringify({ message: msg });
};

interface FormData {
  name: string;
  email: string;
}
const invalid_body_res = {
  statusCode: 406,
  body: makeMsg("invalid form data"),
};

const invalid_email_res = {
  statusCode: 406,
  body: makeMsg("invalid email"),
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

  if (!isEmailValid(email)) {
    return invalid_email_res;
  }

  try {
    // check for spam or invalid emails
    await isEmailDomainValid(email);
  } catch (error) {
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
    return { body: makeMsg("Subscribed successfully!"), statusCode: 200 };
  } catch (error) {
    return {
      statusCode: 409,
      body: makeMsg("Email already exists in the DB"),
    };
  }
};
