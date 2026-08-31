import { useState, useEffect } from 'react';
import api from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search, Plus, Tag, TrendingUp, Edit2, Trash2,
  Building2, X, Save, Loader2, AlertCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuperAdminBrands() {
  const [brands, setBrands] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formLogo, setFormLogo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [brandRes, prodRes] = await Promise.all([
        api.get('/brands'),
        api.get('/products?limit=500').catch(() => ({ data: { data: [] } })),
      ]);
      const bnds = brandRes.data.data || [];
      setBrands(bnds);

      const counts: Record<string, number> = {};
      (prodRes.data.data || []).forEach((p: any) => {
        if (!p.brand) return;
        const key = p.brand.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
      setProductCounts(counts);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const getBrandProductCount = (brandName: string) => {
    return productCounts[String(brandName).toLowerCase()] ?? 0;
  };

  const filtered = brands.filter((b: any) =>
    (b.name || '').toLowerCase().includes(search.toLowerCase()));

  const totalBrands = brands.length;
  const activeBrands = brands.filter((b: any) => b.active !== false).length;

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editingBrand) {
        await api.put(`/brands/${editingBrand._id}`, { name: formName, logo: formLogo });
      } else {
        await api.post('/brands', { name: formName, logo: formLogo });
      }
      await fetchData();
      setShowModal(false);
      setEditingBrand(null);
      setFormName('');
      setFormLogo('');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand: any) => {
    if (!confirm(`Delete "${brand.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/brands/${brand._id}`);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete brand');
    }
  };

  const openEdit = (brand: any) => { setEditingBrand(brand); setFormName(brand.name || ''); setFormLogo(brand.logo || ''); setShowModal(true); };
  const openNew = () => { setEditingBrand(null); setFormName(''); setFormLogo(''); setShowModal(true); };

  const brandColors = ['bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-orange-100 text-orange-600', 'bg-pink-100 text-pink-600', 'bg-teal-100 text-teal-600'];

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Brands</h1>
          <p className="text-sm text-gray-500">Manage product brands</p>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus size={16} /> Add Brand
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
                <Building2 size={22} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Brands</p>
                <p className="text-2xl font-bold text-gray-900">{totalBrands}</p>
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
                <p className="text-sm text-gray-500">Active Brands</p>
                <p className="text-2xl font-bold text-gray-900">{activeBrands}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                  <TrendingUp size={12} /> {activeBrands} active
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
                placeholder="Search brands..."
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
                  <th className="pb-3 font-medium">Logo</th>
                  <th className="pb-3 font-medium">Brand</th>
                  <th className="pb-3 font-medium">Products</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-400">
                    <Building2 size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-gray-500">No brands found</p>
                    <p className="text-xs mt-1">Try a different search or add a new brand</p>
                  </td></tr>
                ) : filtered.map((brand: any, idx: number) => {
                  const name = brand.name || '';
                  const count = getBrandProductCount(name);
                  const colorClass = brandColors[idx % brandColors.length];
                  return (
                    <tr key={brand._id || name} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm ${colorClass}`}>
                          {brand.logo ? <img src={brand.logo} alt={name} className="h-10 w-10 rounded-lg object-contain" /> : name.charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td className="py-3 font-medium text-gray-900">{name}</td>
                      <td className="py-3 text-gray-500">{count} products</td>
                      <td className="py-3">
                        <Badge variant="outline" className={brand.active !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}>
                          {brand.active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(brand)} disabled={!brand._id}>
                            <Edit2 size={15} className="text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(brand)} disabled={!brand._id}>
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
                <h2 className="text-lg font-bold">{editingBrand ? 'Edit Brand' : 'Add Brand'}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X size={18} /></Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Nike"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Logo URL (optional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formLogo}
                    onChange={e => setFormLogo(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving || !formName.trim()} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    <Save size={14} /> {editingBrand ? 'Save Changes' : 'Add Brand'}
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
