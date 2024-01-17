import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { api, Coordinates } from "../services/api"
import { FlightModel } from "./Flight"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const FlightStoreModel = types
  .model("FlightStore")
  .props({
    flights: types.array(FlightModel),
  })
  .actions(withSetPropAction)
  .actions((store) => ({
    async fetchFlights(coords: Coordinates, query = "") {
      const response = await api.getActiveFlights(coords, query)
      if (response.kind === "ok") {
        store.setProp("flights", response.flights)
      } else {
        console.error(`Error fetching episodes: ${JSON.stringify(response)}`)
      }
    },
  }))

export interface FlightStore extends Instance<typeof FlightStoreModel> {}
export interface FlightStoreSnapshot extends SnapshotOut<typeof FlightStoreModel> {}
