import { connectDataConnectEmulator, getDataConnect } from "@firebase/data-connect";
import { getApp, getApps, initializeApp } from "firebase/app";
import { connectorConfig } from "#/dataconnect-generated";

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = !getApps().length
	? initializeApp(firebaseConfig)
	: getApp();

export const dataConnect = getDataConnect(firebaseApp, connectorConfig);

if (import.meta.env.DEV) {
	connectDataConnectEmulator(dataConnect, "localhost", 9399);
}