import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteProduct, getProducts } from '../services/productService'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadProducts() {
    try {
      setError('')
      const data = await getProducts()
      setProducts(data)
    } catch (err) {
      setError(err.message || 'Erro inesperado ao carregar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  async function handleDelete(id) {
    const confirmed = window.confirm('Deseja realmente excluir este produto?')
    if (!confirmed) return

    try {
      await deleteProduct(id)
      setProducts((current) => current.filter((product) => product.id !== id))
    } catch (err) {
      setError(err.message || 'Erro ao excluir produto.')
    }
  }

  if (loading) return <p className="feedback">Carregando produtos...</p>

  return (
    <section>
      <div className="section-heading">
        <div>
          <span className="eyebrow">CATÁLOGO</span>
          <h2>Produtos cadastrados</h2>
          <p>Consulte, edite ou remova os itens do estoque.</p>
        </div>
        <Link className="button primary" to="/products/new">+ Novo produto</Link>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Quantidade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="5" className="empty">Nenhum produto encontrado.</td></tr>
            ) : products.map((product) => (
              <tr key={product.id}>
                <td className="product-name">{product.name}</td>
                <td>{product.category}</td>
                <td>{currency.format(Number(product.price))}</td>
                <td><span className={product.quantity <= 5 ? 'stock low' : 'stock'}>{product.quantity} un.</span></td>
                <td className="actions">
                  <Link className="text-link" to={`/products/${product.id}/edit`}>Editar</Link>
                  <button className="text-link danger" onClick={() => handleDelete(product.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="table-note">{products.length} produto(s) no catálogo</p>
    </section>
  )
}