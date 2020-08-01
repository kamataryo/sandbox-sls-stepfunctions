type Event = {
  teamIds: string[];
  batchSize?: number;
  startAt: number;
  finishAt: number;
};

export const handler = async (
  event: Event,
  _1: any,
  callback: AWSLambda.Callback
) => {
  const { teamIds, batchSize = 50, startAt, finishAt } = event;

  const batchCount = Math.ceil(teamIds.length / batchSize);

  const teamIdBatches = new Array(batchCount).fill(0).map((_, batchIndex) => {
    return {
      teamIds: teamIds.slice(
        batchIndex * batchSize,
        (batchIndex + 1) * batchSize
      ),
      startAt,
      finishAt,
    };
  });

  return callback(null, { teamIdBatches: teamIdBatches });
};
