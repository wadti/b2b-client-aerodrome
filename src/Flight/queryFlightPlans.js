/* @flow */
import type { FlightClient } from './';
import { injectSendTime, responseStatusHandler } from '../utils';
import type { SoapOptions } from '../soap';
import { prepareSerializer } from '../utils/transformers';

import type { FlightPlanListRequest, FlightPlanListReply } from './types';

type Values = FlightPlanListRequest;
type Result = FlightPlanListReply;

export type Resolver = (
  values?: Values,
  options?: SoapOptions,
) => Promise<Result>;

export default function prepareQueryFlightPlans(
  client: FlightClient,
): Resolver {
  const schema = client.describe().FlightManagementService.FlightManagementPort
    .queryFlightPlans.input;
  const serializer = prepareSerializer(schema);

  return (values, options) =>
    new Promise((resolve, reject) => {
      client.queryFlightPlans(
        serializer(injectSendTime(values)),
        options,
        responseStatusHandler(resolve, reject),
      );
    });
}