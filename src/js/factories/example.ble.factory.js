angular
    .module('Example')
    .factory('ExampleBle', [
        ExampleBleFactory
    ]);

function ExampleBleFactory() {
        var _device = null;
        var _peripheral = null;
        var _connected = false;
        var _onConnectedHandlers = [];
        var _onDisconnectedHandlers = [];
        var _reconnect = true;
        var _bootloaderMode = false;

        var ExampleService = {
            uuid: '00001523-74B9-C1E2-1535-785FEABCD8AF',
            characteristics: {
                factoryCalib: {
                    uuid: '00001527-74B9-C1E2-1535-785FEABCD8AF'
                }
            }
        };

        function init(device, callback) {
            if (!device) return console.error('Device not specified.');

            if (typeof callback !== 'function') callback = function () {};

            var resetPeripherals = function () {
                _device = device;
                _peripheral = null;
                _connected = false;
            };

            if (_device) {
                ble.disconnect(_device.id, function (res) {
                    resetPeripherals();
                    callback(null, true);
                }, function (err) {
                    console.error(err);
                    callback(err, null);
                });
            } else {
                resetPeripherals();
                callback(null, true);
            }
        }

        function isInitialised() {
            return !!_device;
        }

        function isConnected() {
            return !!_peripheral;
        }

        function checkIfDeviceIsAdvertising(callback) {
            var found = false;
            ble.startScan([], function (peripheral) {
                if (peripheral.id === _device.id) {
                    console.log(`Found device advertising: ${JSON.stringify(peripheral)}`);
                    found = true;
                }
            }, function () {
                console.error('Scan error.');
            });

            setTimeout(function () {
                ble.stopScan();
                if (found) {
                    callback(null, true);
                } else {
                    callback('Error', null);
                }
            }, 500);
        }

        const reconnectTimeout = 5000;
        const reconnectMaxTries = 10;
        var reconnectCounter = 0;
        function reconnectHandler() {
            if (!_device.id) return;

            function tryConnect() {
                console.log('Reconnect counter=' + reconnectCounter);
                if (_reconnect) {
                    if (reconnectCounter === reconnectMaxTries) return reconnectCounter = 0;
                    reconnectCounter++;

                    console.log(`==> Attempting to reconnect to ${_device.id}!`);
                    checkIfDeviceIsAdvertising(function (err, res) {
                        if (err) {
                            setTimeout(function () {
                                tryConnect();
                            }, reconnectTimeout);
                            return console.error(err);
                        }

                        connect(function (err, res) {
                            if (err) {
                                return setTimeout(function () {
                                    tryConnect();
                                }, reconnectTimeout);
                            }

                            reconnectCounter = 0;
                        });
                    });
                }
            }

            tryConnect();
        }

        function onConnected(callback) {
            if (typeof callback === 'function') _onConnectedHandlers.push(callback);
        }

        function onDisconnected(callback) {
            if (typeof callback === 'function') _onDisconnectedHandlers.push(callback);
        }

        function connect(callback) {
            if (!isInitialised()) {
                return callback('Not initialised', null);
            }

            ble.connect(_device.id,
                function (peripheral) {
                    _peripheral = peripheral;
                    _connected = true;

                    console.log(`==> Successfully connected to ${peripheral.id}!`); // debug

                    // fire onConnected user event handlers
                    _onConnectedHandlers.forEach(function (handler) {
                        handler();
                    });

                    callback(null, true);
                },
                function (peripheral) {
                    _peripheral = null;
                    _connected = false;

                    console.log(`==> Lost connection to ${_device.id}: ${JSON.stringify(peripheral)}`); // debug

                    // fire onDisconnected event handlers
                    _onDisconnectedHandlers.forEach(function (handler) {
                        handler();
                    });

                    // attempt to reconnect
                    if (_reconnect) reconnectHandler();

                    callback(peripheral, null);
                }
            );
        }

        function disconnect(callback) {
            if (!isInitialised()) {
                return callback('Not initialised', null);
            }

            _reconnect = false;

            ble.disconnect(_device.id,
                function () {
                    _peripheral = null;
                    _connected = false;

                    stopAllNotifications();

                    _onDisconnectedHandlers.forEach(function (handler) {
                        handler();
                    });

                    callback(null, true);
                },
                function (reason) {
                    callback(reason, null);
                }
            );
        }

        function getDevice() {
            return _device;
        }

        var Example = {
            ExampleService: ExampleService,
            init: init,
            isInitialised: isInitialised,
            isConnected: isConnected,
            onConnected: onConnected,
            onDisconnected: onDisconnected,
            connect: connect,
            disconnect: disconnect,
            getDevice: getDevice
        };

        return Example;
    }

module.exports = angular;
