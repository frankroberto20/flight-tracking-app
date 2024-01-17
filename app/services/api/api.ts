/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://github.com/infinitered/ignite/blob/master/docs/Backend-API-Integration.md)
 * documentation for more details.
 */
import { ApiResponse, ApisauceInstance, create } from "apisauce"
import Config from "../../config"
import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"
import type { ApiConfig, ApiFeedResponse, Coordinates } from "./api.types"
import type { EpisodeSnapshotIn } from "../../models/Episode"
import type { FlightSnapshotIn } from "../../models/Flight"

/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  apiKey: Config.API_KEY,
  timeout: 10000,
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      params: {
        api_key: this.config.apiKey,
      },
      headers: {
        Accept: "application/json",
      },
    })
  }

  /**
   * Gets a list of active flights
   */
  async getActiveFlights(coords: Coordinates, query: string): Promise<{ kind: "ok"; flights: FlightSnapshotIn[] } | GeneralApiProblem> {
    // make the api call
    const params: any = {}
    if (query) {
      console.log(query)
      params.flight_iata = query
      // params.flight_icao = query
    }
    else {
      params.bbox = `${(coords.latitude - coords.latitudeDelta).toFixed(4)}, ${(coords.longitude - coords.longitudeDelta).toFixed(4)}, ${(coords.latitude + coords.latitudeDelta).toFixed(4)}, ${(coords.longitude + coords.longitudeDelta).toFixed(4)}`
    }
    console.log(`${(coords.latitude - coords.latitudeDelta).toFixed(4)}, ${(coords.longitude - coords.longitudeDelta).toFixed(4)}, ${(coords.latitude + coords.latitudeDelta).toFixed(4)}, ${(coords.longitude + coords.longitudeDelta).toFixed(4)}`)
    const response: ApiResponse<any> = await this.apisauce.get("/flights", params)
    console.log(response.data.request.params)
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const rawData = response.data

      // This is where we transform the data into the shape we expect for our MST model.
      const flights: any[] = rawData?.response ?? []
      // console.log(flights)

      return { kind: "ok", flights }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  /**
   * Get flight details from flight number
   */
  async getFlightDetails(flightIcao: string | undefined, flightIata: string | undefined): Promise<{ kind: "ok"; flight: FlightSnapshotIn } | GeneralApiProblem> {
    if (!flightIcao && !flightIata) return { kind: "bad-data" }

    // make the api call
    const response: ApiResponse<any> = await this.apisauce.get('/flights/', {params: {flight_icao: flightIcao, flight_iata: flightIata}})

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const rawData = response.data

      // This is where we transform the data into the shape we expect for our MST model.
      const flight: any = rawData?.flight ?? {}

      return { kind: "ok", flight }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  /**
   * Gets a list of recent React Native Radio episodes.
   */
  async getEpisodes(): Promise<{ kind: "ok"; episodes: EpisodeSnapshotIn[] } | GeneralApiProblem> {
    // make the api call
    const response: ApiResponse<ApiFeedResponse> = await this.apisauce.get(
      `api.json?rss_url=https%3A%2F%2Ffeeds.simplecast.com%2FhEI_f9Dx`,
    )

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const rawData = response.data

      // This is where we transform the data into the shape we expect for our MST model.
      const episodes: EpisodeSnapshotIn[] =
        rawData?.items.map((raw) => ({
          ...raw,
        })) ?? []

      return { kind: "ok", episodes }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
