import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ibrahim.motiva',
  appName: 'Motiva',
  webDir: 'build',
  backgroundColor: '#020817',
  plugins: {
  SplashScreen: {
    launchShowDuration: 3000,
    launchAutoHide: true,
    backgroundColor: "#020817",
    androidSplashResourceName: "splash",
    iosSpinnerStyle: "small",
    showSpinner: false
  }
}
};



export default config;
