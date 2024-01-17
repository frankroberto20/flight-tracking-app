import React from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { FlightsScreen } from "../screens/FlightsScreen"

const Stack = createStackNavigator()

export function FlightsNavigator () {
    return (
        <Stack.Navigator
        screenOptions={{
            headerShown: false,
        }}
        >
        <Stack.Screen name="FlightsScreen" component={FlightsScreen} />
        </Stack.Navigator>
    )
}
