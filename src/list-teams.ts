import * as AWS from "aws-sdk";

const TableName = process.env.TEAM_TABLE_NAME as string;

type Event = {
  startAt: number;
  finishAt: number;
};

export const handler = async (
  event: Event,
  _1: any,
  callback: AWSLambda.Callback<{ teamIds: string[] } & Event>
) => {
  const docclient = new AWS.DynamoDB.DocumentClient();

  const scanInput: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: TableName,
    ProjectionExpression: "teamId",
  };
  let scanOutput: AWS.DynamoDB.DocumentClient.ScanOutput;
  try {
    scanOutput = await docclient.scan(scanInput).promise();
  } catch (error) {
    console.error(
      "[FATAL] チームの取得に失敗しました。DynamoDB の接続エラーのようです。"
    );
    throw error;
  }

  const teamIds = (scanOutput.Items || []).map((item) => item.teamId as string);

  return callback(null, { ...event, teamIds });
};
