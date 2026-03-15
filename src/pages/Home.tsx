import React from 'react';
import { Network, Users, Share2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../index.css';

function App() {
  return (
    <div className="app-container">
      {/* Background Shapes */}
      <div className="blob-1"></div>
      <div className="blob-2"></div>

      {/* Navigation */}
      <nav className="navbar">
        <a href="/" className="nav-brand">
          <div className="nav-icon">
            <Network size={24} />
          </div>
          GraphConnect
        </a>
        <div className="nav-links">
          <Link to="/" className="nav-link">Sobre</Link>
          <Link to="/" className="nav-link">Comunidade</Link>
          <Link to="/login" className="nav-link">Entrar</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">
          ✨ A Primeira Rede Social Baseada em Grafos Locais
        </div>
        
        <h1 className="hero-title">
          Descubra o Poder das <br />
          <span className="hero-title-highlight">Suas Conexões</span>
        </h1>
        
        <p className="hero-subtitle">
          Mapeie seus interesses, descubra graus de separação e visualize 
          como você está conectado ao mundo em uma rede inovadora.
        </p>
        
        <div className="hero-actions">
          <Link to="/register" className="btn-primary">
            Começar Agora <ArrowRight size={20} />
          </Link>
          <a href="#features" className="btn-secondary">
            Saber Mais
          </a>
        </div>

        {/* Interactive Interactive Graph Demo */}
        <div className="demo-graph">
          <div className="edge edge-1"></div>
          <div className="edge edge-2"></div>
          <div className="edge edge-3"></div>
          <div className="edge edge-4"></div>
          
          <div className="interactive-node node-1">Você</div>
          <div className="interactive-node node-2">A</div>
          <div className="interactive-node node-3">B</div>
          <div className="interactive-node node-4">C</div>
          <div className="interactive-node node-5">D</div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="features-header">
          <h2 className="features-title">Por que usar grafos?</h2>
          <p className="features-subtitle">
            Diferente de redes sociais tradicionais, o GraphConnect foca no formato 
            natural das relações humanas: vértices (pessoas) e arestas (conexões).
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Network size={32} />
            </div>
            <h3>Vértices e Arestas</h3>
            <p>
              Você é um vértice central na sua rede. Cada amizade ou interesse 
              compartilhado é uma aresta que te aproxima de novas pessoas.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Share2 size={32} />
            </div>
            <h3>Graus de Separação</h3>
            <p>
              Descubra a distância exata entre você e qualquer outra pessoa na rede
              usando nossos algoritmos de busca (BFS e DFS) em tempo real.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Users size={32} />
            </div>
            <h3>Interesses Cruzados</h3>
            <p>
              Encontre novos ciclos sociais baseados em afinidade mútua mapeada 
              pelo banco de dados local unificado pelo SQLite e React.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
