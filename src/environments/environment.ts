// ===============================================
// 🔧 ENVIRONMENT - DEVELOPMENT
// ===============================================

export const environment = {
  production: false,
  
  // API URLs
  apiUrl: 'https://api.sowlfy.com.br',
  
  // Stripe
  stripePublicKey: "pk_test_51SSO1CPeMRCkgPBhhTGAFm950miNFGoiM3lmHquSOEtUj9vWK68NB2fbPMRqzS4PxHTThtnaUWrrUeDecYfV18ai00lpSDQElH",
  
  // Mercado Pago (PRODUÇÃO)
  mercadoPagoPublicKey: "APP_USR-d11ca329-064b-4623-af41-1b56a4f75eb0",
  
  // Firebase (se usar)
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  }
};
