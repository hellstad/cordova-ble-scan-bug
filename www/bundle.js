(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 *  Example BLE Scan App
 *  To demonstrate BLE scanning inconsistencies with older Android phones.
 *
 *  @author Kevin Tjiam <kevin@tjiam.com>
 */

/**
 *  Standard js style callback
 *  @callback standardCallback
 *  @param {object} err - An error object. Can be any object; null if there **is no** error.
 *  @param {object} res - A response object. Can be any object; null if there **is an** error.
 */

angular.module('Example', ['ionic']).run(['$ionicPlatform', '$timeout', function ($ionicPlatform, $timeout) {
    $ionicPlatform.ready(function () {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }

        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
    });
}]).config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('home', {
        url: '/home',
        templateUrl: 'templates/home.html'
    });

    $urlRouterProvider.otherwise('/home');
});

angular.module('ionic').config(['$provide', '$ionicConfigProvider', function ($provide, $ionicConfigProvider) {
    // Fix tab glitch iOS ~9.2
    $provide.decorator('ionTabNavDirective', ['$delegate', function ($delegate) {
        var directive = $delegate[0];

        // jscs:disable maximumLineLength
        directive.template = '<a ng-class="{\'tab-item-active\': isTabActive(), \'has-badge\':badge, \'tab-hidden\':isHidden()}" ng-disabled="disabled()" class="tab-item"> <span class="badge {{badgeStyle}}" ng-if="badge">{{badge}}</span> <i class="icon {{getIconOn()}}"></i> <span class="tab-title" ng-bind-html="title"></span></a>';

        // jscs:enable maximumLineLength
        return $delegate;
    }]);

    // Force tab bottom position for Android
    $ionicConfigProvider.platform.android.tabs.position('bottom');
}]);

module.exports = angular;

},{}],2:[function(require,module,exports){
'use strict';

angular.module('Example').directive('swSelectBleDevice', ['ExampleBle', 'Devices', '$ionicModal', 'ExampleBleHelper', swSelectBleDeviceDirective]);

function swSelectBleDeviceDirective(ExampleBle, Devices, $ionicModal, ExampleBleHelper) {
    function swSelectBleDeviceCtrl($scope, $element, $attrs) {
        $scope.savedDevices = Devices.savedDevices;
        $scope.discoveredPeripherals = [];
        $scope.discoveredSavedPeripherals = [];
        $scope.selectedDeviceName = '-';

        ExampleBleHelper.onPeripheralDiscovery(function (device) {
            // Sort into saved or unknown devices
            var savedDevice = Devices.savedDevices.find(function (d) {
                return d.id === device.id;
            });
            if (savedDevice) {
                $scope.discoveredSavedPeripherals.push(savedDevice);
            } else {
                $scope.discoveredPeripherals.push(device);
            }

            $scope.$apply();
        });

        // Modal
        $ionicModal.fromTemplateUrl('templates/modals/devices.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;
        });

        $scope.openModal = function () {
            $scope.discoveredPeripherals = [];
            $scope.discoveredSavedPeripherals = [];
            ExampleBleHelper.startDiscovery();
            $scope.modal.show();
        };

        $scope.closeModal = function () {
            $scope.discoveredPeripherals = [];
            $scope.discoveredSavedPeripherals = [];
            ExampleBleHelper.stopDiscovery();
            $scope.modal.hide();
        };

        $scope.selectDevice = function (device) {
            ExampleBleHelper.stopDiscovery();
            ExampleBleHelper.connectToDevice(device);
            $scope.closeModal();
        };

        ExampleBle.onDisconnected(function () {
            $scope.selectedDeviceName = '-';
            $scope.$apply();
        });
    }

    return {
        restrict: 'E',
        scope: {},
        controller: swSelectBleDeviceCtrl,
        templateUrl: 'templates/directives/sw-select-ble-device.html'
    };
}

module.exports = angular;

},{}],3:[function(require,module,exports){
'use strict';

require('./app');
;
;
require('./directives/sw-select-ble-device.directive.js');
;
require('./factories/devices.factory.js');require('./factories/example.ble.factory.js');require('./factories/example.ble.helper.factory.js');

},{"./app":1,"./directives/sw-select-ble-device.directive.js":2,"./factories/devices.factory.js":4,"./factories/example.ble.factory.js":5,"./factories/example.ble.helper.factory.js":6}],4:[function(require,module,exports){
'use strict';

angular.module('Example').factory('Devices', ['ExampleBle', '$rootScope', Devices]);

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

        var deviceExists = savedDevices.filter(function (d) {
            return d.id === device.id;
        }).length;
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

},{}],5:[function(require,module,exports){
'use strict';

angular.module('Example').factory('ExampleBle', [ExampleBleFactory]);

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

        if (typeof callback !== 'function') callback = function callback() {};

        var resetPeripherals = function resetPeripherals() {
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
                console.log('Found device advertising: ' + JSON.stringify(peripheral));
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

    var reconnectTimeout = 5000;
    var reconnectMaxTries = 10;
    var reconnectCounter = 0;
    function reconnectHandler() {
        if (!_device.id) return;

        function tryConnect() {
            console.log('Reconnect counter=' + reconnectCounter);
            if (_reconnect) {
                if (reconnectCounter === reconnectMaxTries) return reconnectCounter = 0;
                reconnectCounter++;

                console.log('==> Attempting to reconnect to ' + _device.id + '!');
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

        ble.connect(_device.id, function (peripheral) {
            _peripheral = peripheral;
            _connected = true;

            console.log('==> Successfully connected to ' + peripheral.id + '!'); // debug

            // fire onConnected user event handlers
            _onConnectedHandlers.forEach(function (handler) {
                handler();
            });

            callback(null, true);
        }, function (peripheral) {
            _peripheral = null;
            _connected = false;

            console.log('==> Lost connection to ' + _device.id + ': ' + JSON.stringify(peripheral)); // debug

            // fire onDisconnected event handlers
            _onDisconnectedHandlers.forEach(function (handler) {
                handler();
            });

            // attempt to reconnect
            if (_reconnect) reconnectHandler();

            callback(peripheral, null);
        });
    }

    function disconnect(callback) {
        if (!isInitialised()) {
            return callback('Not initialised', null);
        }

        _reconnect = false;

        ble.disconnect(_device.id, function () {
            _peripheral = null;
            _connected = false;

            stopAllNotifications();

            _onDisconnectedHandlers.forEach(function (handler) {
                handler();
            });

            callback(null, true);
        }, function (reason) {
            callback(reason, null);
        });
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

},{}],6:[function(require,module,exports){
'use strict';

angular.module('Example').factory('ExampleBleHelper', ['ExampleBle', '$rootScope', ExampleBleHelper]);

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

        if (typeof callback !== 'function') callback = function callback() {};

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
        onPeripheralDiscovery: onPeripheralDiscovery
    };
}

},{}]},{},[3])


//# sourceMappingURL=bundle.js.map
