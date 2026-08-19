import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Save, ArrowLeft } from 'lucide-react';

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: 'Electronics', imageUrl: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`).then((r) => {
        const p = r.data.data;
        setForm({ name: p.name, description: p.description, price: String(p.price), stock: String(p.stock), category: p.category, imageUrl: p.imageUrl || '' });
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (isEdit) await api.put(`/products/${id}`, body);
      else await api.post('/products', body);
      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-muted hover:text-text"><ArrowLeft size={16} /> Back</button>
      <h1 className="text-2xl font-bold">{isEdit ? 'Edit Product' : 'New Product'}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-8 space-y-5">
        {error && <div className="p-3 bg-red-50 text-danger text-sm rounded-lg">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input required minLength={2} maxLength={100} value={form.name} onChange={update('name')} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea required minLength={10} value={form.description} onChange={update('description')} rows={3} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Price (₹)</label>
            <input type="number" required min={0} value={form.price} onChange={update('price')} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Stock</label>
            <input type="number" required min={0} value={form.stock} onChange={update('stock')} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Category</label>
          <select value={form.category} onChange={update('category')} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option>Electronics</option><option>Clothing</option><option>Footwear</option><option>Home</option><option>Sports</option><option>Books</option><option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Image URL (optional)</label>
          <input type="url" value={form.imageUrl} onChange={update('imageUrl')} placeholder="https://..." className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          <Save size={16} /> {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
