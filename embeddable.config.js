import { defineConfig } from '@embeddable.com/sdk-core';
import react from '@embeddable.com/sdk-react';

export default defineConfig({
  plugins: [react],
  region: 'EU',

  // 
  // Uncomment for US deployments
  //
  // previewBaseUrl: 'https://app.us.embeddable.com',
  // pushBaseUrl: 'https://api.us.embeddable.com',

  //
  // Uncomment for EU deployments
  //
  // previewBaseUrl: 'https://app.eu.embeddable.com',
  // pushBaseUrl: 'https://api.eu.embeddable.com',
  // audienceUrl: 'https://auth.eu.embeddable.com',
  // authDomain: 'auth.eu.embeddable.com',
  // authClientId: '6OGPwIQsVmtrBKhNrwAaXhz4ePb0kBGV',
});
