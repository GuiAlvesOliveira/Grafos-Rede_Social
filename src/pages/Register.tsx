import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Network, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import '../index.css';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem!');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar');
      }

      toast.success('Conta criada com sucesso!');
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
          <h2 className="auth-title">Crie sua conta</h2>
          <p className="auth-subtitle">Junte-se à primeira rede social em grafos.</p>
          
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required 
                placeholder="Seu nome verdadeiro"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input 
                type="email" 
                className="form-input" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required 
                placeholder="voce@exemplo.com"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input 
                type="password" 
                className="form-input" 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required 
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Confirmar Senha</label>
              <input 
                type="password" 
                className="form-input" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required 
                placeholder="Repita a senha"
              />
            </div>
            
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? 'Criando conta...' : 'Cadastrar'} <ArrowRight size={20} />
            </button>
          </form>
          
          <div className="auth-footer">
            Já possui uma conta? <Link to="/login" className="auth-link">Faça Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
