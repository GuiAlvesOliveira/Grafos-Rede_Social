import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Network, LogOut, Navigation, User, Info, Crosshair } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import toast from 'react-hot-toast';
import '../index.css';

interface NodeInfo {
  id: number;
  name: string;
  email: string;
  interests?: string;
  val: number; // Degree
}

interface LinkInfo {
  source: NodeInfo | string | number;
  target: NodeInfo | string | number;
}

interface GraphData {
  nodes: NodeInfo[];
  links: LinkInfo[];
}

export default function GraphVisualizer() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  
  const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(null);
  const [selectedLink, setSelectedLink] = useState<LinkInfo | null>(null);
  
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  
  const [pathNodes, setPathNodes] = useState<Set<number>>(new Set<number>());
  const [pathLinks, setPathLinks] = useState<Set<string>>(new Set<string>());
  const [distance, setDistance] = useState<number | null>(null);
  const fgRef = useRef<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
    } else {
      setUser(JSON.parse(userData));
      fetchGraphData();
    }
  }, [navigate]);

  const fetchGraphData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/graph/all');
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
    } catch (err) {
      toast.error('Erro ao carregar grafo visual');
    }
  };

  const handleCalculatePath = async () => {
    if (!sourceId || !targetId) {
      toast.error('Selecione os dois vértices');
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/api/graph/path?source=${sourceId}&target=${targetId}`);
      if (res.ok) {
        const data = await res.json();
        const pNodes = new Set<number>(data.path);
        const pLinks = new Set<string>();
        for (let i = 0; i < data.path.length - 1; i++) {
          pLinks.add(`${data.path[i]}-${data.path[i+1]}`);
          pLinks.add(`${data.path[i+1]}-${data.path[i]}`); // Undirected visual match
        }
        setPathNodes(pNodes);
        setPathLinks(pLinks);
        setDistance(data.distance);
        
        if (data.path.length === 0) {
          toast.error('Não existe caminho entre eles no grafo.');
        } else {
          toast.success(`Caminho de ${data.distance} grau(s) encontrado!`);
        }
      }
    } catch (err) {
      toast.error('Erro ao calcular rota');
    }
  };

  const handleClearPath = () => {
    setPathNodes(new Set<number>());
    setPathLinks(new Set<string>());
    setDistance(null);
    setSourceId('');
    setTargetId('');
  };

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    setSelectedLink(null);
    // Center the camera on node
    fgRef.current?.centerAt(node.x, node.y, 1000);
    fgRef.current?.zoom(4, 1000);
  }, []);

  const handleLinkClick = useCallback((link: any) => {
    setSelectedLink(link);
    setSelectedNode(null);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      <nav className="navbar" style={{ position: 'relative', zIndex: 10, borderBottom: '1px solid var(--border)' }}>
        <Link to="/dashboard" className="nav-brand">
          <div className="nav-icon"><Network size={24} /></div>
          GraphConnect
        </Link>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link" style={{ fontWeight: 600 }}>Início</Link>
          <Link to="/network" className="nav-link" style={{ fontWeight: 600 }}>Minha Rede</Link>
          <Link to="/grafo-visual" className="nav-link" style={{ fontWeight: 800, color: 'var(--primary)'}}>Grafo Interativo</Link>
          <span className="nav-link" style={{ cursor: 'default' }}>Olá, {user?.name}</span>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px', gap: '8px' }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* SIDE BAR / Admin Controls */}
        <div style={{ width: '320px', backgroundColor: 'white', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 5, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <Navigation size={20} color="var(--primary)" /> Calculador de Rotas
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
              Simule cálculos BFS/Dijkstra vendo a menor distância mapeada na tela Canvas.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Onde começar? (Vértice: Origem)</label>
                <select className="input-field" value={sourceId} onChange={e => setSourceId(e.target.value)} style={{ padding: '8px', fontSize: '0.9rem' }}>
                  <option value="">Selecione o usuário</option>
                  {graphData.nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Onde chegar? (Vértice: Alvo)</label>
                <select className="input-field" value={targetId} onChange={e => setTargetId(e.target.value)} style={{ padding: '8px', fontSize: '0.9rem' }}>
                  <option value="">Selecione o usuário</option>
                  {graphData.nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                <button onClick={handleCalculatePath} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '0.9rem' }}>Calcular Rota</button>
                <button onClick={handleClearPath} className="btn-secondary" style={{ padding: '10px', fontSize: '0.9rem' }}>X</button>
              </div>
            </div>

            {distance !== null && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(37, 99, 235, 0.1)', border: '1px dashed var(--primary)', borderRadius: '8px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Resultado da Busca:</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '0' }}>Distância: <strong>{distance} graus</strong></p>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Caminho visualmente destacado em vermelho na tela plana.</p>
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: '#fafafa' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--muted)' }}>
              <Crosshair size={18} /> Inspeção do Grafo
            </h3>

            {!selectedNode && !selectedLink && (
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center', marginTop: '2rem' }}>
                Clique em um <strong>Vértice</strong> (círculo) ou uma <strong>Aresta</strong> (linha) no lado direito para detalhar o elemento matemático.
              </p>
            )}

            {selectedNode && (
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <User size={24} color="var(--primary)" />
                  <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedNode.name}</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <p><strong>ID:</strong> {selectedNode.id}</p>
                  <p><strong>E-mail:</strong> {selectedNode.email}</p>
                  <p><strong>Interesses:</strong> {selectedNode.interests || 'Nenhum'}</p>
                  <p style={{ color: '#059669', fontWeight: 600, marginTop: '0.5rem' }}>Grau Espacial: {selectedNode.val}</p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>O Grau refere-se ao número de conexões mapeadas a esse vértice (links saindo/entrando).</p>
                </div>
              </div>
            )}

            {selectedLink && (
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <Info size={24} color="#e11d48" />
                  <h4 style={{ fontWeight: 800, fontSize: '1rem' }}>Aresta Inspecionada</h4>
                </div>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                  <strong>{String((selectedLink.source as NodeInfo).name || selectedLink.source)}</strong> se conectou matematicamente a <strong>{String((selectedLink.target as NodeInfo).name || selectedLink.target)}</strong>.
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.5rem' }}>Estrutura Interna de Relacionamento.</p>
              </div>
            )}
          </div>
        </div>

        {/* CANVAS FULLSCREEN */}
        <div style={{ flex: 1, backgroundColor: '#fcfcfc', position: 'relative' }}>
          {graphData.nodes.length > 0 && (
            <ForceGraph2D
              ref={fgRef}
              graphData={graphData}
              nodeId="id"
              nodeLabel="name"
              nodeVal="val"
              
              nodeColor={node => {
                const id = node.id as number;
                if (pathNodes.has(id)) return '#e11d48'; // Active Path highlight
                if (selectedNode?.id === id) return 'var(--primary)'; // Selected highlight
                if (node.val === 0) return '#94a3b8'; // Isolated points
                return '#3b82f6'; // Standard blue
              }}
              
              linkColor={link => {
                const srcId = typeof link.source === 'object' ? (link.source as NodeInfo).id : link.source;
                const tgtId = typeof link.target === 'object' ? (link.target as NodeInfo).id : link.target;
                
                if (pathLinks.has(`${srcId}-${tgtId}`)) return '#e11d48';
                return 'rgba(148, 163, 184, 0.4)';
              }}
              linkWidth={link => {
                const srcId = typeof link.source === 'object' ? (link.source as NodeInfo).id : link.source;
                const tgtId = typeof link.target === 'object' ? (link.target as NodeInfo).id : link.target;
                return pathLinks.has(`${srcId}-${tgtId}`) ? 3 : 1;
              }}
              
              onNodeClick={handleNodeClick}
              onLinkClick={handleLinkClick}
              
              linkDirectionalParticles={1}
              linkDirectionalParticleSpeed={0.005}
              linkDirectionalParticleColor={() => 'rgba(59, 130, 246, 0.5)'}
              
              // To make physics slightly bouncy and spaced
              d3VelocityDecay={0.4}
            />
          )}

          {/* Floater Hint */}
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(255, 255, 255, 0.8)', padding: '10px 16px', borderRadius: '999px', fontSize: '0.85rem', color: 'var(--muted)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            Navegue usando Scroll + Click & Drag
          </div>
        </div>
      </div>
    </div>
  );
}
