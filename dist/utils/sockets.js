"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceSockets = exports.userSockets = void 0;
// A Map to store user WebSocket connections.
// Outer Map: homeId -> Inner Map
// Inner Map: userId -> Array of ExtWebSocket instances (for multiple connections from one user)
const users = new Map();
// A Map to store device WebSocket connections.
// Outer Map: homeId -> Inner Map
// Inner Map: deviceId -> Array of ExtWebSocket instances (for multiple connections from one device)
const devices = new Map();
/**
 * Manages WebSocket connections for users.
 */
exports.userSockets = {
    /**
     * Adds a user's WebSocket connection.
     * If the homeId or userId doesn't exist, new Maps/arrays are created.
     * Multiple connections for the same userId will be stored in an array.
     * @param homeId The ID of the home the user belongs to.
     * @param userId The ID of the user.
     * @param ws The ExtWebSocket instance for the user.
     */
    add: (homeId, userId, ws) => {
        // Ensure a Map exists for the given homeId.
        if (!users.has(homeId)) {
            users.set(homeId, new Map());
        }
        const userMap = users.get(homeId); // This is now Map<number, ExtWebSocket[]>
        if (userMap) {
            // Ensure an array of WebSockets exists for the given userId within this home's map.
            if (!userMap.has(userId)) {
                userMap.set(userId, []);
            }
            // Add the new WebSocket connection to the array for this userId.
            userMap.get(userId)?.push(ws);
        }
    },
    /**
     * Removes a specific user's WebSocket connection.
     * It will remove the exact WebSocket instance from the array for that user.
     * If the user has no more connections, the user entry is removed.
     * If the home has no more users, the home entry is removed.
     * @param homeId The ID of the home the user belongs to.
     * @param userId The ID of the user whose connection is to be removed.
     * @param ws The specific WebSocket instance to remove.
     */
    remove: (homeId, userId, ws) => {
        const userMap = users.get(homeId);
        if (userMap) {
            const socketsArray = userMap.get(userId);
            if (socketsArray) {
                // Find and remove the specific WebSocket instance from the array.
                const index = socketsArray.indexOf(ws);
                if (index > -1) {
                    socketsArray.splice(index, 1);
                }
                // If no more connections for this user, remove the user entry.
                if (socketsArray.length === 0) {
                    userMap.delete(userId);
                }
            }
            // If no more users in this home, remove the home entry.
            if (userMap.size === 0) {
                users.delete(homeId);
            }
        }
    },
    /**
     * Retrieves all WebSocket connections for a specific user within a home.
     * @param homeId The ID of the home.
     * @param userId The ID of the user.
     * @returns An array of ExtWebSocket instances for the specified user, or undefined if not found.
     */
    get: (homeId, userId) => {
        return users.get(homeId)?.get(userId);
    },
    /**
     * Retrieves all user WebSocket connections for a given home.
     * @param homeId The ID of the home.
     * @returns A Map of user IDs to arrays of ExtWebSocket instances for the specified home, or undefined if the home doesn't exist.
     */
    getHomeUsers: (homeId) => {
        return users.get(homeId);
    }
};
/**
 * Manages WebSocket connections for devices.
 */
exports.deviceSockets = {
    /**
     * Adds a device's WebSocket connection.
     * If the homeId or deviceId doesn't exist, new Maps/arrays are created.
     * Multiple connections for the same deviceId will be stored in an array.
     * @param homeId The ID of the home the device belongs to.
     * @param deviceId The ID of the device.
     * @param ws The ExtWebSocket instance for the device.
     */
    add: (homeId, deviceId, ws) => {
        // Ensure a Map exists for the given homeId.
        if (!devices.has(homeId)) {
            devices.set(homeId, new Map());
        }
        const deviceMap = devices.get(homeId); // This is now Map<number, ExtWebSocket[]>
        if (deviceMap) {
            // Ensure an array of WebSockets exists for the given deviceId within this home's map.
            if (!deviceMap.has(deviceId)) {
                deviceMap.set(deviceId, []);
            }
            // Add the new WebSocket connection to the array for this deviceId.
            deviceMap.get(deviceId)?.push(ws);
        }
    },
    /**
     * Removes a specific device's WebSocket connection.
     * It will remove the exact WebSocket instance from the array for that device.
     * If the device has no more connections, the device entry is removed.
     * If the home has no more devices, the home entry is removed.
     * @param homeId The ID of the home the device belongs to.
     * @param deviceId The ID of the device whose connection is to be removed.
     * @param ws The specific WebSocket instance to remove.
     */
    remove: (homeId, deviceId, ws) => {
        const deviceMap = devices.get(homeId);
        if (deviceMap) {
            const socketsArray = deviceMap.get(deviceId);
            if (socketsArray) {
                // Find and remove the specific WebSocket instance from the array.
                const index = socketsArray.indexOf(ws);
                if (index > -1) {
                    socketsArray.splice(index, 1);
                }
                // If no more connections for this device, remove the device entry.
                if (socketsArray.length === 0) {
                    deviceMap.delete(deviceId);
                }
            }
            // If no more devices in this home, remove the home entry.
            if (deviceMap.size === 0) {
                devices.delete(homeId);
            }
        }
    },
    /**
     * Retrieves all WebSocket connections for a specific device within a home.
     * @param homeId The ID of the home.
     * @param deviceId The ID of the device.
     * @returns An array of ExtWebSocket instances for the specified device, or undefined if not found.
     */
    get: (homeId, deviceId) => {
        return devices.get(homeId)?.get(deviceId);
    },
    /**
     * Retrieves all device WebSocket connections for a given home.
     * @param homeId The ID of the home.
     * @returns A Map of device IDs to arrays of ExtWebSocket instances for the specified home, or undefined if the home doesn't exist.
     */
    getHomeDevices: (homeId) => {
        return devices.get(homeId);
    },
    /**
     * Retrieves all device WebSocket connections across all homes.
     * @returns The entire Map of home IDs to their respective device WebSocket Maps (mapping to arrays of ExtWebSocket).
     */
    getAll: () => {
        return devices;
    }
};
