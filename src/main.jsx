// src/main.jsx (or your app entry point)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Your main App component
import './index.css'; // Your global styles

// 1. Import Amplify and outputs
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json'; // Adjust path if needed

// 2. Configure Amplify
Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);