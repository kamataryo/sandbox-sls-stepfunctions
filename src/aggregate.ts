import * as AWS from "aws-sdk";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const TableName = process.env.AGGREGATION_TABLE_NAME as string;

type AggregationEvent = {
  teamId: string;
  startAt: number;
  finishAt: number;
};

export const handler = async (
  event: AggregationEvent,
  _1: any,
  callback: AWSLambda.Callback
) => {
  const { teamId, startAt, finishAt } = event;
  const docclient = new AWS.DynamoDB.DocumentClient();

  let lastEvaluatedKey: AWS.DynamoDB.DocumentClient.Key | undefined = undefined;
  const summary: { [unit: string]: number } = {};
  do {
    const queryInput: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: TableName,
      IndexName: "identity-timestamp-index",
      ExpressionAttributeNames: {
        "#id": "identity",
        "#type": "identityType",
        "#t": "timestamp",
        "#a": "amount",
        "#u": "unit",
      },
      ExpressionAttributeValues: {
        ":id": teamId,
        ":type": "teamid",
        ":start": startAt,
        ":finish": finishAt,
      },
      KeyConditionExpression: "(#id = :id) AND (#t BETWEEN :start AND :finish)",
      FilterExpression: "#type = :type",
      ProjectionExpression: "#a, #u",
      ExclusiveStartKey: lastEvaluatedKey,
    };
    const result = await docclient.query(queryInput).promise();
    const { Items: items = [] } = result;
    lastEvaluatedKey = result.LastEvaluatedKey;

    items.forEach((item) => {
      const unit = item.unit as string;
      const amount = item.amount as number;
      if (summary[unit]) {
        summary[unit] += amount;
      } else {
        summary[unit] = amount;
      }
    });
  } while (lastEvaluatedKey);

  return callback(null, { summary, teamId });
};
