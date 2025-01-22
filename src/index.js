// frontend/src/index.js
import React from 'react';
import './utils/axios-config';
import { createRoot } from 'react-dom/client';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrestationProvider } from './contexts/PrestationContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';
import 'react-datepicker/dist/react-datepicker.css';
import './index.css';

const queryClient = new QueryClient();

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <PrestationProvider>
            <InvoiceProvider>
              <Router>
                <App />
              </Router>
            </InvoiceProvider>
          </PrestationProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
