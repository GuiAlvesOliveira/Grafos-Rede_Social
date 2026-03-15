import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Network, LogOut, Search, UserPlus, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import '../index.css';

interface User {
  id: number;
  name: string;
  email: string;
  interests?: string;
  type?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchConnections(parsedUser.id);
    }
  }, [navigate]);

  const fetchConnections = async (userId: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/connections/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch (err) {
      console.error('Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const res = await fetch(`http://localhost:3001/api/users/search/${user.id}?q=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        if (data.length === 0) {
          toast('Nenhum usuário encontrado.', { icon: '🔍' });
        }
      }
    } catch (err) {
      toast.error('Erro ao buscar pessoas.');
    }
  };

  const handleAddConnection = async (targetId: number) => {
    if (!user) return;
    try {
      const res = await fetch('http://localhost:3001/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: user.id, targetUserId: targetId })
      });

      if (res.ok) {
        toast.success('Conexão adicionada com sucesso!');
        setSearchResults(searchResults.filter(u => u.id !== targetId));
        fetchConnections(user.id); // refresh list
      } else {
        toast.error('Não foi possível adicionar a conexão.');
      }
    } catch (err) {
      toast.error('Erro de servidor ao adicionar.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="app-container dashboard-page">
      <div className="blob-1"></div>
      <div className="blob-2"></div>
      
      <nav className="navbar">
        <Link to="/dashboard" className="nav-brand">
          <div className="nav-icon"><Network size={24} /></div>
          GraphConnect
        </Link>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link" style={{ fontWeight: 800, color: 'var(--primary)'}}>Início</Link>
          <Link to="/network" className="nav-link" style={{ fontWeight: 600 }}>Minha Rede</Link>
          <Link to="/grafo-visual" className="nav-link" style={{ fontWeight: 600 }}>Grafo Interativo</Link>
          <span className="nav-link" style={{ cursor: 'default' }}>Olá, {user.name}</span>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px', gap: '8px' }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </nav>
      
      <main className="dashboard-content" style={{ position: 'relative', zIndex: 10, padding: '120px 5% 60px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="hero-title" style={{ fontSize: '2.5rem', textAlign: 'left', marginBottom: '0.5rem' }}>
          Bem-vindo ao seu <span className="hero-title-highlight">Grafo Social</span>
        </h1>
        <p className="hero-subtitle" style={{ textAlign: 'left', marginLeft: 0, marginBottom: '3rem' }}>
          Explore sua rede, encontre amigos e descubra novos interesses.
        </p>

        <section className="dashboard-section" style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--foreground)' }}>Suas Conexões</h2>
            
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '400px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Buscar novas pessoas..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: '12px' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                <Search size={18} /> Buscar
              </button>
            </form>
          </div>

          {searchResults.length > 0 && (
            <div className="search-results-container" style={{ marginBottom: '3rem', padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '24px', border: '1px solid var(--primary)', boxShadow: 'var(--shadow-glow)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', fontWeight: 600 }}>Resultados da Busca</h3>
              <div className="users-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {searchResults.map(result => (
                  <div key={result.id} className="feature-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="feature-icon-wrapper" style={{ width: '48px', height: '48px', marginBottom: 0 }}><UserPlus size={24} /></div>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{result.name}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{result.email}</span>
                      </div>
                    </div>
                    <button onClick={() => handleAddConnection(result.id)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '0.9rem' }}>
                      Adicionar Conexão
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '3rem' }}>Carregando grafo...</p>
          ) : connections.length > 0 ? (
            <div className="connections-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              {connections.map(conn => (
                <div key={conn.id} className="feature-card user-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="feature-icon-wrapper" style={{ width: '56px', height: '56px', marginBottom: 0 }}>
                      <UsersIcon size={28} />
                    </div>
                    <div>
                      <h3 style={{ marginBottom: '0.2rem', fontSize: '1.25rem' }}>{conn.name}</h3>
                      <span style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--secondary)', color: 'var(--primary)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                        Amigo Direto
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.5)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
              <div className="feature-icon-wrapper" style={{ margin: '0 auto 1.5rem', width: '80px', height: '80px', background: 'var(--secondary)', color: 'var(--primary)' }}>
                <Network size={40} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Grafo Vazio</h3>
              <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                Você ainda não possui conexões. Que tal buscar e adicionar novas pessoas para começar a expandir a sua rede social?
              </p>
              <button 
                className="btn-primary" 
                onClick={() => document.querySelector('input')?.focus()}
                style={{ borderRadius: '999px', padding: '12px 28px', fontSize: '1rem' }}
              >
                Buscar e Adicionar Pessoas
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
