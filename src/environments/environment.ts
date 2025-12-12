// ===============================================
// 🔧 ENVIRONMENT - DEVELOPMENT
// ===============================================

export const environment = {
  production: false,
  
  // API URLs
  apiUrl: 'http://localhost:3000',
  
  // Stripe
  stripePublicKey: "pk_test_51SSO1CPeMRCkgPBhhTGAFm950miNFGoiM3lmHquSOEtUj9vWK68NB2fbPMRqzS4PxHTThtnaUWrrUeDecYfV18ai00lpSDQElH",
  
  // Mercado Pago (PRODUÇÃO)
  mercadoPagoPublicKey: "APP_USR-d11ca329-064b-4623-af41-1b56a4f75eb0",
  
  // Firebase
  firebase: {
    apiKey: "AIzaSyA_NLiMUJVRv_jRN0JWBNQ4M4YY9LvKiQM",
    authDomain: "angular-buzz-developer.firebaseapp.com",
    projectId: "angular-buzz-developer",
    storageBucket: "angular-buzz-developer.firebasestorage.app",
    messagingSenderId: "991526111359",
    appId: "1:991526111359:web:307165b8942ca621bc574a"
  }
};
