// ===============================================
// 🌐 ENVIRONMENT.PROD.TS CORRETO COM DADOS REAIS
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\src\environments\environment.prod.ts

export const environment = {
  production: true,
  apiUrl: "https://sowlfy-backend-new.onrender.com",
  stripePublicKey: "pk_test_51SSO1CPeMRCkgPBhhTGAFm950miNFGoiM3lmHquSOEtUj9vWK68NB2fbPMRqzS4PxHTThtnaUWrrUeDecYfV18ai00lpSDQElH",
  mercadoPagoPublicKey: "TEST-2ece481c-0c45-4eba-a1dc-e7fba382df05",
  appName: "SOWLFY",
  version: "1.0.0",
  firebase: {
    apiKey: "AIzaSyA_NLiMUJVRv_jRN0JWBNQ4M4YY9LvKiQM", // ✅ USAR CONFIG angular-buzz-developer
    authDomain: "angular-buzz-developer.firebaseapp.com",
    projectId: "angular-buzz-developer",
    storageBucket: "angular-buzz-developer.firebasestorage.app",
    messagingSenderId: "991526111359",
    appId: "1:991526111359:web:307165b8942ca621bc574a"
  }
};