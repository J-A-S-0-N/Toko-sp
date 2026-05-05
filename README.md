SETUP

1. Install dependencies
   ```
   npm install
   ```

2. prebuild the project
   ```
   npx expo prebuild
   ```

3. configure pod file
   ```
   post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => ccache_enabled?(podfile_properties),
    )
      # Fix non-modular header errors for Firebase modules
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB')   # RNFBApp, RNFBAuth, RNFBUtils, etc.
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end
    end
   end   
  ```

4. setup for firestore
  ```
  GCP — Enabled reCAPTCHA Enterprise API, created an iOS key with your bundle ID, get the site key
  Firebase Console — Enabled reCAPTCHA under Authentication → Settings → reCAPTCHA (Fraud prevention)
  Re-downloaded GoogleService-Info.plist and replaced the old one
  Xcode — Added REVERSED_CLIENT_ID from GoogleService-Info.plist as a URL Scheme under Target → Info → URL Types
  Podfile — Added pod 'RecaptchaEnterprise' and ran pod install
  AppDelegate.swift — Added import RecaptchaEnterprise and called Recaptcha.fetchClient(withSiteKey:) inside a Task right after FirebaseApp.configure()
  ```
  
POD file

```
require File.join(File.dirname(`node --print "require.resolve('expo/package.json')"`), "scripts/autolinking")
require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")

require 'json'
podfile_properties = JSON.parse(File.read(File.join(__dir__, 'Podfile.properties.json'))) rescue {}

def ccache_enabled?(podfile_properties)
  # Environment variable takes precedence
  return ENV['USE_CCACHE'] == '1' if ENV['USE_CCACHE']
  
  # Fall back to Podfile properties
  podfile_properties['apple.ccacheEnabled'] == 'true'
end

ENV['RCT_NEW_ARCH_ENABLED'] ||= '0' if podfile_properties['newArchEnabled'] == 'false'
ENV['EX_DEV_CLIENT_NETWORK_INSPECTOR'] ||= podfile_properties['EX_DEV_CLIENT_NETWORK_INSPECTOR']
ENV['RCT_USE_RN_DEP'] ||= '1' if podfile_properties['ios.buildReactNativeFromSource'] != 'true' && podfile_properties['newArchEnabled'] != 'false'
ENV['RCT_USE_PREBUILT_RNCORE'] ||= '1' if podfile_properties['ios.buildReactNativeFromSource'] != 'true' && podfile_properties['newArchEnabled'] != 'false'
platform :ios, podfile_properties['ios.deploymentTarget'] || '15.1'

prepare_react_native_project!

target 'tokosp' do
  use_expo_modules!

  if ENV['EXPO_USE_COMMUNITY_AUTOLINKING'] == '1'
    config_command = ['node', '-e', "process.argv=['', '', 'config'];require('@react-native-community/cli').run()"];
  else
    config_command = [
      'node',
      '--no-warnings',
      '--eval',
      'require(\'expo/bin/autolinking\')',
      'expo-modules-autolinking',
      'react-native-config',
      '--json',
      '--platform',
      'ios'
    ]
  end

  config = use_native_modules!(config_command)

  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
  use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => podfile_properties['expo.jsEngine'] == nil || podfile_properties['expo.jsEngine'] == 'hermes',
    # An absolute path to your application root.
    :app_path => "#{Pod::Config.instance.installation_root}/..",
    :privacy_file_aggregation_enabled => podfile_properties['apple.privacyManifestAggregationEnabled'] != 'false',
  )

  pod 'RecaptchaEnterprise'

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => ccache_enabled?(podfile_properties),
    )
      # Fix non-modular header errors for Firebase modules
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB')   # RNFBApp, RNFBAuth, RNFBUtils, etc.
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end
    end
  end
end
```

App Delegate

```

import Expo
import FirebaseCore
import React
import ReactAppDependencyProvider
import RecaptchaEnterprise

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
// @generated begin @react-native-firebase/app-didFinishLaunchingWithOptions - expo prebuild (DO NOT MODIFY) sync-10e8520570672fd76b2403b7e1e27f5198a6349a
FirebaseApp.configure()
Task {
  try? await Recaptcha.fetchClient(withSiteKey: "6LcE27ksAAAAAELyxAtjWUzS6q10YBsb60V9jyIe")
}
// @generated end @react-native-firebase/app-didFinishLaunchingWithOptions
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
// @generated begin @react-native-firebase/auth-openURL - expo prebuild (DO NOT MODIFY)
    if url.host?.lowercased() == "firebaseauth" {
      // invocations for Firebase Auth are handled elsewhere and should not be forwarded to Expo Router
      return false
    }
// @generated end @react-native-firebase/auth-openURL
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

```
