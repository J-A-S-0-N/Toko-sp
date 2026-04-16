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
  GCP — Enabled reCAPTCHA Enterprise API, created an iOS key with your bundle ID, got the site key
  Firebase Console — Enabled reCAPTCHA under Authentication → Settings → reCAPTCHA (Fraud prevention)
  Re-downloaded GoogleService-Info.plist and replaced the old one
  Xcode — Added REVERSED_CLIENT_ID from GoogleService-Info.plist as a URL Scheme under Target → Info → URL Types
  Podfile — Added pod 'RecaptchaEnterprise' and ran pod install
  AppDelegate.swift — Added import RecaptchaEnterprise and called Recaptcha.fetchClient(withSiteKey:) inside a Task right after FirebaseApp.configure()
  ```
  
