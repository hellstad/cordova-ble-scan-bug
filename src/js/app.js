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

angular
    .module('Example', ['ionic'])
    .run([
        '$ionicPlatform',
        '$timeout',
        function ($ionicPlatform, $timeout) {
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
        }])
    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: 'templates/home.html'
            });

        $urlRouterProvider.otherwise('/home');
    });

angular
    .module('ionic')
    .config(['$provide', '$ionicConfigProvider', function ($provide, $ionicConfigProvider) {
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
