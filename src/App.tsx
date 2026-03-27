import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NetworkView from './pages/NetworkView';
import GraphVisualizer from './pages/GraphVisualizer';
import FollowVisualizer from './pages/FollowVisualizer';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/network" element={<NetworkView />} />
        <Route path="/grafo-visual" element={<GraphVisualizer />} />
        <Route path="/grafo-follows" element={<FollowVisualizer />} />
      </Routes>
    </Router>
  );
}

export default App;
