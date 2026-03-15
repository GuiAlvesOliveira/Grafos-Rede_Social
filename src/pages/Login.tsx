import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Network, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import '../index.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Autenticação falhou');
      }

      toast.success('Bem-vindo de volta!');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="app-container auth-page">
      <div className="blob-1"></div>
      <div className="blob-2"></div>
      
      <div className="auth-container">
        <Link to="/" className="nav-brand auth-brand">
          <div className="nav-icon"><Network size={24} /></div>
          GraphConnect
        </Link>
        
        <div className="auth-card">
          <h2 className="auth-title">Bem-vindo de volta</h2>
          <p className="auth-subtitle">Acesse sua rede social baseada em grafos.</p>
          
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input 
                type="email" 
                className="form-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder="voce@exemplo.com"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input 
                type="password" 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                placeholder="Insira sua senha"
              />
            </div>
            
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar na Conta'} <ArrowRight size={20} />
            </button>
          </form>
          
          <div className="auth-footer">
            Ainda não tem conta? <Link to="/register" className="auth-link">Cadastre-se</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
