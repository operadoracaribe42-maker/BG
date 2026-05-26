/*
========================================================================
   BG CARIBE - FIREBASE CONFIGURATION
   Shared by admin.html and consulta.html
   
   INSTRUCCIONES:
   1. Ir a https://console.firebase.google.com
   2. Crear un proyecto nuevo (ej. "bg-caribe-reservas")
   3. En la consola, ir a Configuracion del Proyecto > General
   4. En "Tus apps", agregar una app web
   5. Copiar los valores de firebaseConfig aqui abajo
   6. En Firestore Database, crear la base de datos en modo de prueba
========================================================================
*/

// Firebase configuration - REEMPLAZAR con tus credenciales reales
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "123456789",
  appId: "TU_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firestore reference
const db = firebase.firestore();
const reservasRef = db.collection('reservas');
