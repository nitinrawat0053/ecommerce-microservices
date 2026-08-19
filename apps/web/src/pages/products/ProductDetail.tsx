import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { ShoppingCart, ArrowLeft, Package } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cartMsg, setCartMsg] = useState('');

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => setProduct(r.data.data)).catch(() => navigate('/products')).finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    try {
      await api.post('/cart', { productId: id, quantity });
      setCartMsg(`Added ${quantity} item(s) to cart!`);
      setTimeout(() => setCartMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!product) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"><ArrowLeft size={16} /> Back</button>
      {cartMsg && <div className="p-3 bg-green-50 text-success text-sm rounded-lg">{cartMsg}</div>}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 h-72 md:h-auto bg-surface-alt flex items-center justify-center">
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <Package size={64} className="text-text-light" />}
          </div>
          <div className="md:w-1/2 p-8 space-y-5">
            <div>
              <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-1">{product.category}</p>
              <h1 className="text-2xl font-bold">{product.name}</h1>
            </div>
            <p className="text-text-muted text-sm leading-relaxed">{product.description}</p>
            <div className="text-3xl font-bold">₹{product.price.toLocaleString()}</div>
            <span className={`inline-block text-xs px-3 py-1 rounded-full ${product.stock > 0 ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Qty:</label>
              <div className="flex items-center border border-border rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-surface-alt rounded-l-lg">−</button>
                <span className="px-4 py-2 text-sm font-medium border-x border-border">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="px-3 py-2 hover:bg-surface-alt rounded-r-lg">+</button>
              </div>
            </div>
            <button onClick={addToCart} disabled={product.stock === 0} className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              <ShoppingCart size={18} /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
