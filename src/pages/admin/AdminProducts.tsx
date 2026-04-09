import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Pencil, 
  Trash2, 
  LogOut, 
  Images, 
  AlertTriangle, 
  Search,
  ChevronLeft,
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  Film,
  Headphones,
  BarChart3,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUBCATEGORIES, ProductGender } from '@/hooks/useProducts';
import ImageUpload from '@/components/admin/ImageUpload';
import MultiImageUpload from '@/components/admin/MultiImageUpload';
import { LowStockAlert } from '@/components/admin/LowStockAlert';
import { cn } from '@/lib/utils';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image: string;
  category: string;
  gender: ProductGender;
  subcategory: string | null;
  in_stock: boolean;
  is_new: boolean;
  description: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
}

interface GalleryImage {
  id?: string;
  url: string;
  order: number;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [selectedProductForGallery, setSelectedProductForGallery] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    price: '',
    original_price: '',
    image: '',
    category: 'silver' as 'silver' | 'gold' | 'artificial',
    gender: 'unisex' as ProductGender,
    subcategory: '',
    description: '',
    in_stock: true,
    is_new: false,
    stock_quantity: '100',
    low_stock_threshold: '10',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const getSubcategories = () => {
    if (form.gender === 'unisex') {
      const menSubs = SUBCATEGORIES[form.category]?.men || [];
      const womenSubs = SUBCATEGORIES[form.category]?.women || [];
      return [...new Set([...menSubs, ...womenSubs])];
    }
    return SUBCATEGORIES[form.category]?.[form.gender] || [];
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) { navigate('/'); return; }
      
      setIsAdmin(true);
      fetchProducts();
    };

    checkAdmin();
  }, [navigate]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      ...form,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      stock_quantity: parseInt(form.stock_quantity),
      low_stock_threshold: parseInt(form.low_stock_threshold),
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) {
        toast({ title: 'Error updating product', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Product updated successfully' });
        setDialogOpen(false);
        setEditingProduct(null);
        fetchProducts();
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) {
        toast({ title: 'Error creating product', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Product created successfully' });
        setDialogOpen(false);
        resetForm();
        fetchProducts();
      }
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      price: '',
      original_price: '',
      image: '',
      category: 'silver',
      gender: 'unisex',
      subcategory: '',
      description: '',
      in_stock: true,
      is_new: false,
      stock_quantity: '100',
      low_stock_threshold: '10',
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      image: product.image,
      category: product.category as any,
      gender: product.gender,
      subcategory: product.subcategory || '',
      description: product.description || '',
      in_stock: product.in_stock,
      is_new: product.is_new,
      stock_quantity: product.stock_quantity.toString(),
      low_stock_threshold: product.low_stock_threshold.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this masterpiece from the collection?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting product', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Product removed' });
      fetchProducts();
    }
  };

  const openGalleryManager = async (product: Product) => {
      setSelectedProductForGallery(product);
      setGalleryDialogOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-slate-400 hover:text-charcoal transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <h1 className="font-display text-xl font-bold text-charcoal">Inventory Management</h1>
        </div>
        <div className="flex items-center gap-6">
          <LowStockAlert products={products} />
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if(!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gold hover:bg-gold/90 text-white rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-widest gap-2 shadow-sm">
                <Plus className="w-4 h-4" /> Add New Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white rounded-[2rem] p-0 overflow-hidden shadow-2xl border-none">
              <div className="bg-charcoal p-8 text-white relative">
                 <div className="absolute inset-0 bg-gold/5" />
                 <DialogTitle className="font-display text-2xl font-bold relative z-10 italic">
                    {editingProduct ? 'Refine Masterpiece' : 'Commission New Piece'}
                 </DialogTitle>
              </div>
              <form onSubmit={handleCreateOrUpdate} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Asset Name</label>
                    <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium" placeholder="E.g. Royal Gold Necklace" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Commission Price ($)</label>
                    <Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium" placeholder="Price" required />
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Master Representation (Main Image)</label>
                    <ImageUpload value={form.image} onChange={url => setForm({...form, image: url})} />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Collection</label>
                    <Select value={form.category} onValueChange={val => setForm({...form, category: val as any})}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="silver">Pure Silver</SelectItem>
                        <SelectItem value="gold">Solid Gold</SelectItem>
                        <SelectItem value="artificial">Fashion Jewelry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Clientele</label>
                    <Select value={form.gender} onValueChange={val => setForm({...form, gender: val as any})}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="men">Gentlemen</SelectItem>
                        <SelectItem value="women">Ladies</SelectItem>
                        <SelectItem value="unisex">Universal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Artisan Genre</label>
                    <Select value={form.subcategory} onValueChange={val => setForm({...form, subcategory: val})}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100">
                        <SelectValue placeholder="Genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSubcategories().map(sub => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Vault Stock</label>
                    <Input type="number" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Scarcity Threshold</label>
                    <Input type="number" value={form.low_stock_threshold} onChange={e => setForm({...form, low_stock_threshold: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-slate-100" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Asset Narrative (Description)</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:border-gold/30 transition-all font-body" placeholder="Describe the craftsmanship..." />
                </div>

                <Button type="submit" className="w-full h-14 bg-charcoal text-gold hover:bg-charcoal/90 font-black uppercase tracking-widest rounded-2xl shadow-lg">
                  {editingProduct ? 'Authorize Restoration' : 'Append to Master Vault'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col">
          <nav className="space-y-1 flex-1">
            <SidebarItem to="/admin" icon={<LayoutDashboard />} label="Dashboard" />
            <SidebarItem to="/admin/products" icon={<Package />} label="Products" active />
            <SidebarItem to="/admin/orders" icon={<ShoppingBag />} label="Orders" />
            <SidebarItem to="/admin/inquiries" icon={<MessageSquare />} label="Inquiries" />
            <SidebarItem to="/admin/reels" icon={<Film />} label="Reels" />
            <SidebarItem to="/admin/chat" icon={<Headphones />} label="Live Chat" />
            <SidebarItem to="/admin/analytics" icon={<BarChart3 />} label="Analytics" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
               <div className="relative w-full md:w-96">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                 <Input 
                   placeholder="Search Master Vault..." 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="pl-12 h-12 bg-white border-none rounded-2xl shadow-sm focus:ring-1 focus:ring-gold/30 transition-all"
                 />
               </div>
               <div className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Showing {filteredProducts.length} Authenticated Assets</div>
            </div>

            {/* Product List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Asset</th>
                    <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Collection</th>
                    <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Commission</th>
                    <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory</th>
                    <th className="text-right p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <img src={product.image} className="w-12 h-12 rounded-xl object-cover shadow-sm border border-white" alt="" />
                          <div>
                            <p className="font-bold text-charcoal">{product.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{product.subcategory || 'Artisanal'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border", product.category === 'gold' ? 'bg-amber-500/10 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200')}>
                           {product.category}
                        </span>
                      </td>
                      <td className="p-6">
                        <p className="font-display font-bold text-charcoal tabular-nums">${product.price.toLocaleString()}</p>
                      </td>
                      <td className="p-6">
                         <div className="flex items-center gap-2">
                            <span className={cn("w-1.5 h-1.5 rounded-full", product.stock_quantity > product.low_stock_threshold ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
                            <p className="text-xs font-bold text-charcoal">{product.stock_quantity} units</p>
                         </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-gold hover:bg-gold/10" onClick={() => handleEdit(product)}>
                              <Pencil className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50" onClick={() => openGalleryManager(product)}>
                              <Images className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="p-20 text-center">
                   <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                   <p className="text-slate-400 font-body text-sm italic">No matching authenticated assets found in the vault.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Gallery Dialog */}
      <Dialog open={galleryDialogOpen} onOpenChange={setGalleryDialogOpen}>
         <DialogContent className="max-w-4xl bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader className="mb-8">
               <DialogTitle className="font-display text-4xl font-bold text-charcoal italic tracking-tight">Gallery Curation: {selectedProductForGallery?.name}</DialogTitle>
               <p className="text-xs text-slate-400 font-body mt-2 uppercase tracking-widest">Manage supporting visual assets for this masterpiece</p>
            </DialogHeader>
            <MultiImageUpload productId={selectedProductForGallery?.id || ''} />
         </DialogContent>
      </Dialog>
    </div>
  );
};

const SidebarItem = ({ to, icon, label, active = false }: { to: string, icon: any, label: string, active?: boolean }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group",
      active 
        ? "bg-gold/10 text-gold shadow-sm font-bold" 
        : "text-slate-500 hover:bg-slate-50 hover:text-charcoal"
    )}
  >
    {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
    <span className="font-body text-sm">{label}</span>
  </Link>
);

export default AdminProducts;
