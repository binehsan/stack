// The backend won't be reachable at "localhost" from a phone running Expo Go —
// your phone and computer are separate devices on the network. Point this at
// your computer's LAN IP instead (same Wi-Fi network as your phone).
//
// Find your LAN IP:
//   Windows:      ipconfig            -> look for "IPv4 Address"
//   macOS/Linux:  ifconfig | ipconfig -> look for "inet" under your Wi-Fi adapter
//
// - Physical device (Expo Go): use your computer's LAN IP, e.g. 192.168.1.42
// - Android emulator:          use 10.0.2.2 (maps to your computer's localhost)
// - iOS simulator:             localhost works fine
const HOST = '10.0.0.171';
const PORT = 8000;

export const API_BASE_URL = `http://${HOST}:${PORT}/api`;
