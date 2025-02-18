import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { 
  EnvelopeIcon, 
  LockClosedIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const SignupModalContent = ({ onClose }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/signup`, {
        firstName,
        lastName,
        email,
        password
      });

      if (response.data.token) {
        login(response.data.token, response.data.user);
        onClose();
        navigate('/dashboard');
      } else {
        toast.error('Inscription échouée: Token manquant');
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || 'Erreur lors de l\'inscription');
      } else if (error.request) {
        toast.error('Aucune réponse du serveur');
      } else {
        toast.error('Une erreur s\'est produite');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Inscription</h2>
      <form onSubmit={handleSignup} className="space-y-6">
        {/* Prénom */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/90">Prénom</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-white/50" />
            </div>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="block w-full pl-10 bg-white/10 border border-white/20 rounded-lg
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        placeholder:text-white/30 text-white"
              placeholder="John"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Nom */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/90">Nom</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-white/50" />
            </div>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="block w-full pl-10 bg-white/10 border border-white/20 rounded-lg
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        placeholder:text-white/30 text-white"
              placeholder="Doe"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/90">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-white/50" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 bg-white/10 border border-white/20 rounded-lg
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        placeholder:text-white/30 text-white"
              placeholder="john.doe@example.com"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/90">Mot de passe</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-white/50" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 bg-white/10 border border-white/20 rounded-lg
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        placeholder:text-white/30 text-white"
              placeholder="••••••••"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all
                     ${isSubmitting 
                       ? 'bg-white/20 cursor-not-allowed' 
                       : 'bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600'
                     }
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Inscription...' : 'S\'inscrire'}
        </button>
      </form>
    </div>
  );
};

export default SignupModalContent;



