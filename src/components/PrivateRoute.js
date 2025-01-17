// frontend/src/components/PrivateRoute.js

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext} from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isLoggedIn, isInitialized } = useContext(AuthContext);

  if (!isInitialized) {
    return <div>Chargement...</div>; // Afficher un indicateur de chargement pendant la vérification du token
  }

  return isLoggedIn ? children : <Navigate to="/login" replace />;;
};

export default PrivateRoute;

