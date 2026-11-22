import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import ProductList from './pages/ProductList'
import ProductForm from './pages/ProductForm'
import './styles.css'

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">PAINEL ADMINISTRATIVO</span>
          <h1>Estoque Fácil</h1>
        </div>
        <nav>
          <NavLink to="/products">Produtos</NavLink>
          <NavLink to="/products/new">Cadastrar produto</NavLink>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id/edit" element={<ProductForm />} />
          <Route path="*" element={<p>Página não encontrada.</p>} />
        </Routes>
      </main>
      <footer>Atividade prática • React + Vite + React Router + JSON Server</footer>
    </div>
  )
}