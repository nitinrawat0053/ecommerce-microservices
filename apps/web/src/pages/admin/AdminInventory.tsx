import { useState, useEffect } from 'react';
import api from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, PackageX, Search, PackageCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminInventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');

  useEffect(() => {
    api.get('/products?limit=200')
      .then(res => setProducts(res.data.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const totalProducts = products.length;
  const inStock = products.filter((p: any) => p.stock > 10).length;
  const lowStock = products.filter((p: any) => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = products.filter((p: any) => p.stock === 0).length;

  const filtered = products
    .filter((p: any) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.name?.toLowerCase().includes(q) && !p.category?.toLowerCase().includes(q)) return false;
      }
      if (filter === 'low') return p.stock > 0 && p.stock <= 10;
      if (filter === 'out') return p.stock === 0;
      if (filter === 'in') return p.stock > 10;
      return true;
    })
    .sort((a: any, b: any) => (a.stock || 0) - (b.stock || 0));

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Out of Stock</Badge>;
    if (stock <= 10) return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Low Stock ({stock})</Badge>;
    return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">In Stock ({stock})</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor and manage product stock levels</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Products</p>
                <p className="text-lg font-bold text-gray-900">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <PackageCheck size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">In Stock</p>
                <p className="text-lg font-bold text-green-600">{inStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Low Stock</p>
                <p className="text-lg font-bold text-amber-600">{lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                <PackageX size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Out of Stock</p>
                <p className="text-lg font-bold text-red-600">{outOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'low', 'out', 'in'] as const).map(f => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={filter === f ? 'bg-blue-600 text-white' : ''}
                >
                  {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : f === 'out' ? 'Out of Stock' : 'In Stock'}
                </Button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium text-center">Stock</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any) => (
                    <tr key={p._id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Package size={16} className="text-gray-400" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 truncate max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-600">{p.category || 'N/A'}</td>
                      <td className="py-3 text-center font-semibold text-gray-900">{p.stock || 0}</td>
                      <td className="py-3">{getStockBadge(p.stock || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
