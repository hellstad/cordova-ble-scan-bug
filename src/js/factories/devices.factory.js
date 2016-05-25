angular
    .module('Example')
    .factory('Devices', ['ExampleBle', '$rootScope', Devices]);

function Devices(ExampleBle, $rootScope) {
    var savedDevices = [];
    loadDevicesFromLocalStorage();

    /**
     *  Saves current connected device to the savedDevices list, stored in localStorage.
     *  @param {standardCallback} callback
     */
    function saveConnectedDevice(callback) {
        var device = ExampleBle.getDevice();
        if (!(device && device.id)) return callback('BLE device must be defined!', null);

        var deviceExists = savedDevices.filter(d => d.id === device.id).length;
        if (!deviceExists) {
            savedDevices.push(device);
        } else {
            // find => replace => break
            for (var i = 0; i < savedDevices.length; i++) {
                if (savedDevices[i].id === device.id) {
                    savedDevices[i] = device;
                    break;
                }
            }
        }

        // save
        saveDevicesToLocalStorage();

        return callback(null, true);
    }

    /**
     *  Updates the saved device name corresponding to the given device ID.
     *  @param {object} device - BLE device object containing the property 'id'
     *  @param {String} newName - the new name to update the saved device with.
     *  @param {standardCallback} callback - optional
     */
    function updateSavedDeviceName(device, newName, callback) {
        if (!(device && device.id)) return callback('BLE device must be defined!', null);
        if (!newName) return callback('A new name must be defined!', null);

        // Overwrite the device name to ensure it is updated. (iOS caches GAP name)
        device.name = newName;

        // find => replace => break
        for (var i = 0; i < savedDevices.length; i++) {
            if (savedDevices[i].id === device.id) {
                savedDevices[i] = device;
                break;
            }
        }

        // save
        saveDevicesToLocalStorage();
    }

    /**
     *  Save device list (savedDevices) into localStorage.
     */
    function saveDevicesToLocalStorage() {
        window.localStorage.setItem('savedDevices', JSON.stringify(savedDevices));
    }

    /**
     *  Load device list from localStorage into savedDevices.
     */
    function loadDevicesFromLocalStorage() {
        var devicesInStorage = JSON.parse(window.localStorage.getItem('savedDevices'));
        savedDevices = Array.isArray(devicesInStorage) ? devicesInStorage : [];
    }

    /**
     *  Clear saved devices list.
     */
    function clearSavedDevices() {
        savedDevices = [];
        saveDevicesToLocalStorage();
    }

    return {
        savedDevices: savedDevices,
        saveConnectedDevice: saveConnectedDevice,
        updateSavedDeviceName: updateSavedDeviceName,
        clearSavedDevices: clearSavedDevices
    };
}
