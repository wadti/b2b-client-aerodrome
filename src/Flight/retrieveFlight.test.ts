import { inspect } from 'util';
import { makeFlightClient } from '..';
import moment from 'moment';
// @ts-ignore
import b2bOptions from '../../tests/options';
import { flightPlanToFlightKeys, flightToFlightKeys } from './utils';
import { FlightService } from '.';
jest.setTimeout(20000);

const conditionalTest = (global as any).__DISABLE_B2B_CONNECTIONS__
  ? test.skip
  : test;

let Flight: FlightService;
beforeAll(async () => {
  Flight = await makeFlightClient(b2bOptions);
});

describe('retrieveFlight', () => {
  let knownFlight: {
    ifplId: string;
    keys: ReturnType<typeof flightToFlightKeys>;
  };

  beforeAll(async () => {
    const res = await Flight.queryFlightsByAirspace({
      dataset: { type: 'OPERATIONAL' },
      includeProposalFlights: false,
      includeForecastFlights: false,
      trafficType: 'LOAD',
      trafficWindow: {
        wef: moment.utc().subtract(30, 'minutes').toDate(),
        unt: moment.utc().add(30, 'minutes').toDate(),
      },
      airspace: 'LFEERMS',
    });

    const flights = res.data.flights.filter((f) => {
      if ('flightPlan' in f) {
        return false;
      }

      return true;
    });

    // Second condition is here because TS won't infer that the array contains
    // only Flight and not FlightPlan anymore
    const flight = flights[0];
    if (!flight || !('flight' in flight)) {
      console.error('Could not fetch a known flight, test aborted');
      return;
    }

    if (!flight.flight.flightId.id) {
      console.error('Flight has no ifplId, test aborted');
      return;
    }

    knownFlight = {
      ifplId: flight.flight.flightId.id,
      keys: flightToFlightKeys(flight.flight),
    };
  });

  conditionalTest('query flightPlan by ifplId', async () => {
    if (!knownFlight.ifplId || !knownFlight.keys) {
      return;
    }

    try {
      const res = await Flight.retrieveFlight({
        dataset: {
          type: 'OPERATIONAL',
        },
        includeProposalFlights: false,
        flightId: {
          keys: knownFlight.keys,
        },
        requestedFlightDatasets: ['flight'],
        requestedFlightFields: ['ftfmPointProfile'],
        requestedDataFormat: 'NM_B2B',
      });

      !process.env.CI && console.log(inspect(res, { depth: null }));

      expect(res.data.flight?.ftfmPointProfile).toBeDefined();
      res.data.flight?.ftfmPointProfile?.forEach((item) => {
        expect(item).toEqual(
          expect.objectContaining({
            timeOver: expect.any(Date),
            coveredDistance: expect.any(Number),
          }),
        );
      });
    } catch (err) {
      console.error(inspect(err, { depth: null }));
      throw err;
    }
  });

  conditionalTest('query flight by flight keys', async () => {
    if (!knownFlight.keys) {
      return;
    }

    try {
      const res = await Flight.retrieveFlight({
        dataset: {
          type: 'OPERATIONAL',
        },
        includeProposalFlights: false,
        flightId: {
          keys: knownFlight.keys,
        },
        requestedFlightDatasets: ['flight'],
        requestedFlightFields: ['aircraftType', 'delay'],
        requestedDataFormat: 'NM_B2B',
      });

      !process.env.CI && console.log(inspect(res, { depth: null }));
    } catch (err) {
      console.error(inspect(err, { depth: null }));
      throw err;
    }
  });
});
