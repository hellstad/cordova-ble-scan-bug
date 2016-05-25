angular
    .module('Example')
    .directive('swSelectBleDevice', [
        'ExampleBle',
        'Devices',
        '$ionicModal',
        'ExampleBleHelper',
        swSelectBleDeviceDirective
    ]);

function swSelectBleDeviceDirective(ExampleBle, Devices, $ionicModal, ExampleBleHelper) {
    function swSelectBleDeviceCtrl($scope, $element, $attrs) {
        $scope.savedDevices = Devices.savedDevices;
        $scope.discoveredPeripherals = [];
        $scope.discoveredSavedPeripherals = [];
        $scope.selectedDeviceName = '-';

        ExampleBleHelper.onPeripheralDiscovery(function (device) {
            // Sort into saved or unknown devices
            var savedDevice = Devices.savedDevices.find(d => d.id === device.id);
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
