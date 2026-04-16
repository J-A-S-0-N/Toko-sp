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

  and

  ```
  pod 'RecaptchaEnterprise'
  ```
  
