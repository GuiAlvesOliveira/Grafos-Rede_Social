import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Network, LogOut, UserPlus, Heart, Share2, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import '../index.css';

interface User {
  id: number;
  name: string;
  email: string;
  interests?: string;
  max_dist?: number;     // BFS Dist
  affinityScore?: number; // Dijkstra
}

export default function NetworkView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [communities, setCommunities] = useState<User[][]>([]);
  const [affinity, setAffinity] = useState<User[]>([]);
  
  const [following, setFollowing] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchAllGraphData(parsedUser.id);
      fetchFollows(parsedUser.id);
    }
  }, [navigate]);

  const fetchFollows = async (userId: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/follows/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following ? data.following.map((f: any) => f.id) : []);
      }
    } catch (err) {
      console.error('Failed to fetch follows');
    }
  };

  const handleToggleFollow = async (targetId: number) => {
    if (!user) return;
    try {
      const res = await fetch('http://localhost:3001/api/follows/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: user.id, followedId: targetId })
      });
      if (res.ok) {
        const { following: isFollowing } = await res.json();
        if (isFollowing) {
          toast.success('Começou a seguir!');
        } else {
          toast('Deixou de seguir.');
        }
        fetchFollows(user.id);
      }
    } catch (err) {
      toast.error('Erro ao seguir.');
    }
  };

  const fetchAllGraphData = async (userId: number) => {
    try {
      setLoading(true);
      const [resBFS, resDFS, resDijkstra] = await Promise.all([
        fetch(`http://localhost:3001/api/graph/suggestions/${userId}`),
        fetch(`http://localhost:3001/api/graph/communities`),
        fetch(`http://localhost:3001/api/graph/affinity/${userId}`)
      ]);

      if (resBFS.ok) setSuggestions(await resBFS.json());
      if (resDFS.ok) setCommunities(await resDFS.json());
      if (resDijkstra.ok) setAffinity(await resDijkstra.json());
      
    } catch (err) {
      toast.error('Erro ao carregar os dados matemáticos do grafo.');
    } finally {
      setLoading(false);
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
        // Ideally we refetch the graph data to update suggestions, let's just trigger a re-fetch
        fetchAllGraphData(user.id);
      } else {
        toast.error('Não foi possível conectar.');
      }
    } catch (err) {
      toast.error('Erro ao comunicar com o servidor.');
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
          <Link to="/dashboard" className="nav-link" style={{ fontWeight: 600 }}>Início</Link>
          <Link to="/network" className="nav-link" style={{ fontWeight: 800, color: 'var(--primary)'}}>Minha Rede</Link>
          <Link to="/grafo-visual" className="nav-link" style={{ fontWeight: 600 }}>Grafo Interativo</Link>
          <Link to="/grafo-follows" className="nav-link" style={{ fontWeight: 600 }}>Grafo Seguidores</Link>
          <span className="nav-link" style={{ cursor: 'default' }}>Olá, {user.name}</span>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px', gap: '8px' }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </nav>
      
      <main className="dashboard-content" style={{ position: 'relative', zIndex: 10, padding: '120px 5% 60px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="hero-title" style={{ fontSize: '2.5rem', textAlign: 'left', marginBottom: '0.5rem' }}>
          O Coração da <span className="hero-title-highlight">Sua Rede</span>
        </h1>
        <p className="hero-subtitle" style={{ textAlign: 'left', marginLeft: 0, marginBottom: '2rem' }}>
          Visualização matemática dos algoritmos BFS, Kosaraju e Dijkstra.
        </p>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>Processando Vértices e Arestas...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            
            {/* BFS SECTION */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="nav-icon"><Share2 size={24} /></div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Sugestões de Amizade (BFS)</h2>
              </div>
              <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Pessoas a 2 ou 3 graus de separação de você através de conexões em comum.</p>
              
              {suggestions.length === 0 ? (
                <div style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px dashed var(--border)', borderRadius: '16px', textAlign: 'center' }}>
                  A rede precisa de mais arestas para achar sugestões de amigos (adquira mais amigos no Início).
                </div>
              ) : (
                <div className="users-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {suggestions.map(s => (
                    <div key={s.id} className="feature-card" style={{ padding: '1.5rem', borderTop: '4px solid var(--primary)' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{s.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                        Distância: <strong>{s.max_dist} graus</strong>
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleAddConnection(s.id)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.9rem' }}>
                          <UserPlus size={16} /> Conectar
                        </button>
                        <button 
                          onClick={() => handleToggleFollow(s.id)} 
                          className={following.includes(s.id) ? "btn-secondary" : "btn-primary"} 
                          style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.9rem', backgroundColor: following.includes(s.id) ? 'transparent' : undefined }}
                        >
                          {following.includes(s.id) ? 'Deixar de Seguir' : 'Seguir'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* DIJKSTRA SECTION */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="nav-icon" style={{ background: 'linear-gradient(135deg, #e11d48, #fb7185)' }}><Heart size={24} /></div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Melhores Conexões por Afinidade (Dijkstra)</h2>
              </div>
              <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Os caminhos de menor custo calculados a partir da similaridade dos seus interesses.</p>
              
              {affinity.length === 0 ? (
                <div style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px dashed var(--border)', borderRadius: '16px', textAlign: 'center' }}>
                  Não foi possível calcular afinidades. Edite seus interesses ou se conecte com mais pessoas.
                </div>
              ) : (
                <div className="users-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {affinity.map(a => (
                    <div key={a.id} className="feature-card" style={{ padding: '1.5rem', borderTop: '4px solid #e11d48' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{a.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                        Interesses: {a.interests || 'Nenhum'}<br/>
                        Custo do Caminho: <strong>{a.affinityScore}</strong>
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleAddConnection(a.id)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.9rem' }}>
                          <UserPlus size={16} /> Conectar
                        </button>
                        <button 
                          onClick={() => handleToggleFollow(a.id)} 
                          className={following.includes(a.id) ? "btn-secondary" : "btn-primary"} 
                          style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.9rem', backgroundColor: following.includes(a.id) ? 'transparent' : undefined, color: following.includes(a.id) ? 'var(--foreground)' : 'white', borderColor: '#e11d48' }}
                        >
                          {following.includes(a.id) ? 'Deixar de Seguir' : 'Seguir'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* KOSARAJU SECTION */}
            <section style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="nav-icon" style={{ background: 'linear-gradient(135deg, #059669, #34d399)' }}><Layers size={24} /></div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Suas Comunidades (Kosaraju SCC)</h2>
              </div>
              <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Grupos fortemente conexos. Todos os vértices nestes grupos se alcançam mutuamente.</p>
              
              {communities.length === 0 ? (
                <div style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px dashed var(--border)', borderRadius: '16px', textAlign: 'center' }}>
                  Nenhuma bolha/comunidade detectada. As pessoas precisam seguir umas às outras mutuamente ou em ciclos fechados.
                </div>
              ) : (
                <div className="communities-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {communities.map((comm, idx) => (
                    <div key={idx} style={{ padding: '1.5rem', background: 'white', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
                      <h4 style={{ fontWeight: 800, color: '#059669', marginBottom: '1rem' }}>Bolha #{idx + 1}</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {comm.map(u => (
                          <span key={u.id} style={{ padding: '6px 14px', background: 'var(--secondary)', color: 'var(--foreground)', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 600 }}>
                            {u.id === user.id ? 'Você' : u.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            
          </div>
        )}
      </main>
    </div>
  );
}
