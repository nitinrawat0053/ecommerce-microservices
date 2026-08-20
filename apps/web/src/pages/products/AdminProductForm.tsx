import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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
      if (isEdit) { await api.put(`/products/${id}`, body); toast.success('Product updated'); }
      else { await api.post('/products', body); toast.success('Product created'); }
      navigate('/admin/products');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{isEdit ? 'Edit' : 'New'}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Edit Product' : 'Create Product'}</h1>
        <p className="text-sm text-muted-foreground mt-1">{isEdit ? 'Update product details' : 'Add a new product to your store'}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Name</Label>
              <Input required minLength={2} maxLength={100} value={form.name} onChange={update('name')} placeholder="Product name" />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea required minLength={10} value={form.description} onChange={update('description')} rows={3} placeholder="Describe your product" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input type="number" required min={0} value={form.price} onChange={update('price')} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" required min={0} value={form.stock} onChange={update('stock')} placeholder="0" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Clothing">Clothing</SelectItem>
                  <SelectItem value="Footwear">Footwear</SelectItem>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Books">Books</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Image URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="url" value={form.imageUrl} onChange={update('imageUrl')} placeholder="https://example.com/image.jpg" />
            </div>

            <div className="flex gap-3 pt-2">
              <Link to="/products" className="flex-1">
                <Button type="button" variant="outline" className="w-full">Cancel</Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    {isEdit ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
