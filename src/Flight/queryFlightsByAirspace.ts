import { FlightClient } from './';
import { injectSendTime, responseStatusHandler } from '../utils';
import { SoapOptions } from '../soap';
import { prepareSerializer } from '../utils/transformers';
import { instrument } from '../utils/instrumentation';

import {
  FlightListByAirspaceRequest,
  FlightListByAirspaceReply,
} from './types';

export {
  FlightListByAirspaceRequest,
  FlightListByAirspaceReply,
} from './types';

type Values = FlightListByAirspaceRequest;
type Result = FlightListByAirspaceReply;

export type Resolver = (
  values?: Values,
  options?: SoapOptions,
) => Promise<Result>;

export default function prepareQueryFlightsByAerodrome(
  client: FlightClient,
): Resolver {
  // console.log(Object.keys(client));
  const schema = client.describe().FlightManagementService.FlightManagementPort
    .queryFlightsByAerodrome.input;
  const serializer = prepareSerializer(schema);

  return instrument<Values, Result>({
    service: 'Flight',
    query: 'queryFlightsByAirspace',
  })(
    (values, options) =>
      new Promise((resolve, reject) => {
        client.queryFlightsByAerodrome(
          serializer(injectSendTime(values)),
          options,
          responseStatusHandler(resolve, reject),
        );
      }),
  );
}
