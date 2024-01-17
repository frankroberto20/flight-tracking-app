import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const FlightModel = types
  .model("Flight")
  .props({
    hex: "",
    reg_number: "",
    flag: "",
    lat: types.maybeNull(types.number),
    lng: types.maybeNull(types.number),
    alt: types.maybeNull(types.number),
    dir: types.maybeNull(types.number),
    speed: types.maybeNull(types.number),
    v_speed: types.maybeNull(types.number),
    squawk: "",
    airline_icao: types.maybeNull(types.string),
    airline_iata: types.maybeNull(types.string),
    flight_icao: types.maybeNull(types.string),
    flight_iata: types.maybeNull(types.string),
    flight_number: "",
    dep_icao: types.maybeNull(types.string),
    dep_iata: types.maybeNull(types.string),
    arr_icao: types.maybeNull(types.string),
    arr_iata: types.maybeNull(types.string),
    updated: types.Date,
    status: "",
  })
  .actions(withSetPropAction)
  .views((flight) => ({
    updatedTime() {
      return flight.updated.toLocaleTimeString()
    },
  }))

export interface Flight extends Instance<typeof FlightModel> {}
export interface FlightSnapshotOut extends SnapshotOut<typeof FlightModel> {}
export interface FlightSnapshotIn extends SnapshotIn<typeof FlightModel> {}
