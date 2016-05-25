angular
    .module('Example')
    .factory('ExampleBleHelper', [
        'ExampleBle',
        '$rootScope',
        ExampleBleHelper
    ]);

function ExampleBleHelper(logger, ExampleBle, $rootScope) {
    var _bleStatus = 'initialising';
    var _onPeripheralDiscoveryHandlers = [];

    var discoveredPeripherals = [];

    function onPeripheralDiscovery(handler) {
        if (typeof handler === 'function') _onPeripheralDiscoveryHandlers.push(handler);
    }

    function triggerPeripheralDiscovery(device) {
        _onPeripheralDiscoveryHandlers.forEach(function (handler) {
            handler(device);
        });
    }

    function startDiscovery(timeout, callback) {
        // Assume scan is successful unless an error is thrown.
        var success = true;

        if (!timeout) timeout = 60000;

        if (typeof callback !== 'function') callback = function () {};

        if (window.cordova && window.cordova.plugins && ble) {
            // We use a setTimeout here so we can get a more accurate interval
            setTimeout(function () {
                ble.isEnabled(function () {
                    // reset discovered peripherals list
                    discoveredPeripherals = [];

                    ble.startScan([], function (device) {
                        discoveredPeripherals.push(device);
                        triggerPeripheralDiscovery(device);
                    }, function (error) {
                        console.error(error);
                        success = false;
                    });
                });
            }, 0);

            setTimeout(function () {
                ble.stopScan();
                if (success) {
                    callback(null, true);
                } else {
                    callback(true, null);
                }
            }, timeout);
        }
    }

    function stopDiscovery() {
        ble.stopScan();
    }

    function connectToDevice(device) {
        if (!device) return console.error('No device specified.');

        ExampleBle.init(device, function (err, res) {
            if (err) return console.error(err);

            console.log('Successfully initialised BLE device.');

            ExampleBle.connect(function (err, res) {
                if (err) return console.error(err);

                console.log('Successfully connected to BLE device.');
            });
        });
    }

    function getBleStatus() {
        return _bleStatus;
    }

    return {
        startDiscovery: startDiscovery,
        stopDiscovery: stopDiscovery,
        connectToDevice: connectToDevice,
        discoveredPeripherals: discoveredPeripherals,
        getBleStatus: getBleStatus,
        onPeripheralDiscovery: onPeripheralDiscovery,
    };
}
