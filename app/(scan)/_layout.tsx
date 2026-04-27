import { Stack } from "expo-router";

export default function ScanFlowLayout() {
	return (
		<Stack>
			<Stack.Screen name="capture" options={{ headerShown: false }} />
			<Stack.Screen name="preview" options={{
				headerShown: false,
				presentation: 'modal',
				animation: 'fade',
				title: 'Activity',
			}} />
			<Stack.Screen name="roundInfo" options={{ headerShown: false }} />
			<Stack.Screen name="loading" options={{ headerShown: false }} />
			<Stack.Screen name="resultPreview" options={{ headerShown: false }} />
		</Stack>
	);
}