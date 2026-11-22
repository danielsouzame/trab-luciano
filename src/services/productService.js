const API_URL = 'http://localhost:3001'

// Serviço responsável pela comunicação com a API mockada.
export async function getProducts() {
  const response = await fetch(`${API_URL}/products`)
  if (!response.ok) throw new Error('Não foi possível carregar os produtos.')
  return response.json()
}

export async function getProductById(id) {
  const response = await fetch(`${API_URL}/products/${id}`)
  if (!response.ok) throw new Error('Produto não encontrado.')
  return response.json()
}

export async function createProduct(product) {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  })
  if (!response.ok) throw new Error('Não foi possível cadastrar o produto.')
  return response.json()
}

export async function updateProduct(id, product) {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...product, id }),
  })
  if (!response.ok) throw new Error('Não foi possível atualizar o produto.')
  return response.json()
}

export async function deleteProduct(id) {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Não foi possível excluir o produto.')
  return true
}