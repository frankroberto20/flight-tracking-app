import React, { useEffect, useState, useMemo, useCallback, RefObject } from "react"
import _ from "lodash"
import { observer } from "mobx-react-lite"
import MapView, { Marker } from "react-native-maps"
import { useStores } from "../models"
import { spacing } from "../theme"
import {
  ActivityIndicator,
  ImageStyle,
  View,
  ViewStyle,
} from "react-native"
import { Card, EmptyState, Icon, ListView, Screen, Text, TextField } from "../components"
import { Flight } from "app/models/Flight"
import { delay } from "../utils/delay"
import { isRTL } from "../i18n"
import * as Location from "expo-location"
import { Coordinates } from "app/services/api"

const ICON_SIZE = 24
const MARKER_SIZE = 45

export function FlightsScreen() {
  const { flightStore } = useStores()

  const [refreshing, setRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState({
    latitude: 7.78825,
    longitude: -222.4324,
    latitudeDelta: 10,
    longitudeDelta: 10,
  })

  const mapView = React.useRef<MapView>(null)

  // initially, kick off a background refresh without the refreshing UI
  useEffect(() => {
    ;(async function load() {
      setIsLoading(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === "granted") {
        console.log(status)
        const userLocation = await Location.getCurrentPositionAsync({})
        console.log(userLocation)
        setLocation({
          ...location,
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        })
        console.log(location)
      }
      console.log(location)
      await flightStore.fetchFlights(location)
      setIsLoading(false)
    })()
  }, [flightStore])

  async function manualRefresh() {
    console.log(location)
    setQuery("")
    setRefreshing(true)
    await Promise.all([flightStore.fetchFlights(location), delay(750)])
    setRefreshing(false)
  }

  async function handleQueryChange(value: string) {
    setQuery(value)
    setRefreshing(true)
    console.log(value)
    console.log(query)
    await Promise.all([flightStore.fetchFlights(location, value), delay(750)])
    console.log(flightStore.flights)
    setRefreshing(false)
  }

  async function handleRegionChange(region: Coordinates) {
    if (query === "") {
      console.log(location)
      setLocation(region)
      setIsLoading(true)
      await Promise.all([flightStore.fetchFlights(region), delay(750)])
      console.log(flightStore.flights)
      setIsLoading(false)
    }
  }

  const deboucedRegionChange = useCallback(_.debounce(handleRegionChange, 5000), [])

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$screenContentContainer}>
      <MapView
        ref={mapView}
        style={$map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onRegionChangeComplete={deboucedRegionChange}
      >
        {flightStore.flights.map((flight) => (
          <Marker
            key={flight.hex}
            coordinate={{
              latitude: flight.lat ? flight.lat : 0,
              longitude: flight.lng ? flight.lng : 0,
            }}
            title={`${flight.flight_iata}`}
            description={`${flight.dep_iata} → ${flight.arr_iata}
                            ${flight.v_speed} ft/min
                            ${flight.alt} ft
                            ${flight.status}
                        `}
          >
            <Icon icon="airplane" size={MARKER_SIZE} style={$marker(flight.dir)} />
          </Marker>
        ))}
      </MapView>
      <TextField
        value={query}
        onChangeText={handleQueryChange}
        label="Search"
        placeholder="ex. AA456"
        helper="Search for flights"
        LeftAccessory={() => <Icon icon="search" size={ICON_SIZE} style={$searchIcon} />}
      />
      <ListView<Flight>
        data={flightStore.flights.slice()}
        refreshing={refreshing}
        estimatedItemSize={177}
        onRefresh={manualRefresh}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator />
          ) : (
            <EmptyState
              preset="generic"
              style={$emptyState}
              headingTx="demoPodcastListScreen.noFavoritesEmptyState.heading"
              buttonOnPress={manualRefresh}
              imageStyle={$emptyStateImage}
              ImageProps={{ resizeMode: "contain" }}
            />
          )
        }
        ListHeaderComponent={
          <View style={$heading}>
            <Text preset="heading" text="Flights" />
          </View>
        }
        renderItem={({ item }) => <FlightCard flight={item} map={mapView} />}
      />
    </Screen>
  )
}

const FlightCard = observer(function FlightCard({
  flight,
  map,
}: {
  flight: Flight
  map: RefObject<MapView>
}) {
  const handlePressCard = () => {
    console.log(map)
    map.current?.animateToRegion(
      {
        latitude: flight.lat ?? 0,
        longitude: flight.lng ?? 0,
        latitudeDelta: 2,
        longitudeDelta: 2,
      },
      1000,
    )
  }

  return (
    <Card
      style={$item}
      verticalAlignment="force-footer-bottom"
      onPress={handlePressCard}
      HeadingComponent={
        <View>
          <Text size="xxs" accessibilityLabel={"flight_number"}>
            IATA: {flight?.flight_iata}
          </Text>
          <Text size="xxs" accessibilityLabel={"airline_iata"}>
            ICAO: {flight?.flight_icao}
          </Text>
        </View>
      }
      content={`${flight?.dep_iata} → ${flight?.arr_iata}`}
    />
  )
})

// #region Styles
const $screenContentContainer: ViewStyle = {
  flex: 1,
}

const $heading: ViewStyle = {
  marginBottom: spacing.md,
}

const $item: ViewStyle = {
  padding: spacing.md,
  marginTop: spacing.md,
  minHeight: 120,
}

const $emptyState: ViewStyle = {
  marginTop: spacing.xxl,
}

const $emptyStateImage: ImageStyle = {
  transform: [{ scaleX: isRTL ? -1 : 1 }],
}

const $map: ViewStyle = {
  height: "40%",
}

const $searchIcon: ImageStyle = {
  margin: spacing.xs,
}

const $marker = (rotation: number | null) => ({
  transform: [{ rotate: `${rotation ?? 0}deg` }],
})
// #endregion
