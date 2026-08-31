import { useState, useEffect } from 'react';
import api from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search, Plus, Tag, TrendingUp, Edit2, Trash2,
  FolderOpen, X, Save, Loader2, AlertCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuperAdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products?limit=500').catch(() => ({ data: { data: [] } })),
      ]);
      const cats = catRes.data.data || [];
      setCategories(cats);

      const counts: Record<string, number> = {};
      (prodRes.data.data || []).forEach((p: any) => {
        if (!p.category) return;
        const key = p.category.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
      setProductCounts(counts);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryProductCount = (catName: string) => {
    return productCounts[String(catName).toLowerCase()] ?? 0;
  };

  const filtered = categories.filter((c: any) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()));

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c: any) => c.active !== false).length;

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, { name: formName, icon: formIcon });
      } else {
        await api.post('/categories', { name: formName, icon: formIcon });
      }
      await fetchData();
      setShowModal(false);
      setEditingCategory(null);
      setFormName('');
      setFormIcon('');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: any) => {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/categories/${cat._id}`);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete category');
    }
  };

  const openEdit = (cat: any) => {
    setEditingCategory(cat);
    setFormName(cat.name || '');
    setFormIcon(cat.icon || '');
    setShowModal(true);
  };

  const openNew = () => { setEditingCategory(null); setFormName(''); setFormIcon(''); setShowModal(true); };

  const categoryIcons: Record<string, string> = {
    'electronics': '📱', 'fashion': '👗', 'home & kitchen': '🏠', 'beauty': '✨',
    'sports': '🏋️', 'books': '📚', 'furniture': '🪑', 'kids & baby': '👶',
    'pet supplies': '🐾', 'auto': '🚗',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500">Manage product categories</p>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus size={16} /> Add Category
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <FolderOpen size={22} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">{totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Tag size={22} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Categories</p>
                <p className="text-2xl font-bold text-gray-900">{activeCategories}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                  <TrendingUp size={12} /> {activeCategories} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Icon</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Products</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-400">
                    <FolderOpen size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-gray-500">No categories found</p>
                    <p className="text-xs mt-1">Try a different search or add a new category</p>
                  </td></tr>
                ) : filtered.map((cat: any) => {
                  const name = cat.name || '';
                  const count = getCategoryProductCount(name);
                  return (
                    <tr key={cat._id || name} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                          {categoryIcons[name.toLowerCase()] || cat.icon || '📁'}
                        </div>
                      </td>
                      <td className="py-3 font-medium text-gray-900">{name}</td>
                      <td className="py-3 text-gray-500">{count} products</td>
                      <td className="py-3">
                        <Badge variant="outline" className={cat.active !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}>
                          {cat.active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)} disabled={!cat._id}>
                            <Edit2 size={15} className="text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(cat)} disabled={!cat._id}>
                            <Trash2 size={15} className="text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <Card className="w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X size={18} /></Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Electronics"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Icon (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 📱 or URL"
                    value={formIcon}
                    onChange={e => setFormIcon(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving || !formName.trim()} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    <Save size={14} /> {editingCategory ? 'Save Changes' : 'Add Category'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
