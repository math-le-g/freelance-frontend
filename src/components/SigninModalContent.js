import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

function SigninModalContent({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const credentials = { email, password };
      await login(credentials);
      onClose();
      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      if (error.response) {
        toast.error(error.response.data.message || 'Erreur lors de la connexion');
      } else if (error.request) {
        toast.error('Impossible de contacter le serveur');
      } else {
        toast.error('Une erreur est survenue');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
      <form onSubmit={handleSignin} className="space-y-6">
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
              placeholder="votre@email.com"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

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
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}

export default SigninModalContent;
