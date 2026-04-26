
const firebaseConfig = {

  apiKey: "AIzaSyD4H_pdAZSLrixwH-1NDRpEd537X-Gnvik",

  authDomain: "brainrot-tcg-6d0ae.firebaseapp.com",

  projectId: "brainrot-tcg-6d0ae",

  storageBucket: "brainrot-tcg-6d0ae.firebasestorage.app",

  messagingSenderId: "622979343428",

  appId: "1:622979343428:web:b8499811ce8379b0f84811",

  measurementId: "G-6GE923T5CK"

};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();