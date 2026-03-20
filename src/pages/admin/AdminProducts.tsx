import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, MessageSquare, Users, Plus, Pencil, Trash2, LogOut, Images, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUBCATEGORIES, ProductGender } from '@/hooks/useProducts';
import ImageUpload from '@/components/admin/ImageUpload';
import MultiImageUpload from '@/components/admin/MultiImageUpload';
import { LowStockAlert } from '@/components/admin/LowStockAlert';
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
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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

  // Get subcategories based on selected category and gender
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
      if (!session) {
        navigate('/auth');
        return;
      }
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      const hasAdminRole = roles?.some(r => r.role === 'admin');
      if (!hasAdminRole) {
        navigate('/');
        return;
      }
      
      setIsAdmin(true);
      fetchProducts();
    };

    checkAdmin();
  }, [navigate]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setProducts(data as Product[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: form.name,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      image: form.image,
      category: form.category,
      gender: form.gender,
      subcategory: form.subcategory || null,
      description: form.description || null,
      in_stock: form.in_stock,
      is_new: form.is_new,
      stock_quantity: parseInt(form.stock_quantity) || 100,
      low_stock_threshold: parseInt(form.low_stock_threshold) || 10,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Product updated successfully" });
        fetchProducts();
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert(productData);
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Product created successfully" });
        fetchProducts();
        setDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Product deleted" });
      fetchProducts();
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

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      image: product.image,
      category: product.category as 'silver' | 'gold' | 'artificial',
      gender: product.gender || 'unisex',
      subcategory: product.subcategory || '',
      description: product.description || '',
      in_stock: product.in_stock,
      is_new: product.is_new,
      stock_quantity: product.stock_quantity?.toString() || '100',
      low_stock_threshold: product.low_stock_threshold?.toString() || '10',
    });
    setDialogOpen(true);
  };

  const openGallery = async (product: Product) => {
    setSelectedProductForGallery(product);
    
    // Fetch existing gallery images
    const { data } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('display_order', { ascending: true });
    
    if (data) {
      setGalleryImages(data.map(img => ({
        id: img.id,
        url: img.image_url,
        order: img.display_order || 0,
      })));
    } else {
      setGalleryImages([]);
    }
    
    setGalleryDialogOpen(true);
  };

  const saveGalleryImages = async () => {
    if (!selectedProductForGallery) return;

    try {
      // Delete existing images for this product
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', selectedProductForGallery.id);

      // Insert new images
      if (galleryImages.length > 0) {
        const insertData = galleryImages.map((img, index) => ({
          product_id: selectedProductForGallery.id,
          image_url: img.url,
          display_order: index,
        }));

        const { error } = await supabase
          .from('product_images')
          .insert(insertData);

        if (error) throw error;
      }

      toast({ title: "Success", description: "Gallery images saved" });
      setGalleryDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-charcoal text-primary-foreground py-4 px-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link to="/" className="font-body text-sm hover:text-gold transition-colors">View Store</Link>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut().then(() => navigate('/'))}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 min-h-[calc(100vh-64px)] bg-card border-r border-border p-6">
          <nav className="space-y-2">
            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors">
              <Users className="w-4 h-4" />Dashboard
            </Link>
            <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-sm bg-gold/10 text-gold font-body text-sm">
              <Package className="w-4 h-4" />Products
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors">
              <ShoppingBag className="w-4 h-4" />Orders
            </Link>
            <Link to="/admin/inquiries" className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors">
              <MessageSquare className="w-4 h-4" />Inquiries
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {/* Low Stock Alert */}
          <LowStockAlert 
            products={products.filter(p => p.stock_quantity <= p.low_stock_threshold)} 
          />

          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl">Products</h2>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4" />Add Product</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                    <Input type="number" placeholder="Original Price (optional)" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} />
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-2 block">Product Image</label>
                    <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
                    <Input 
                      placeholder="Or paste Image URL" 
                      value={form.image} 
                      onChange={(e) => setForm({ ...form, image: e.target.value })} 
                      className="mt-2"
                    />
                  </div>
                  
                  {/* Category Select */}
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-1 block">Category</label>
                    <Select value={form.category} onValueChange={(v: 'silver' | 'gold' | 'artificial') => setForm({ ...form, category: v, subcategory: '' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="artificial">Artificial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Gender Select */}
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-1 block">Gender</label>
                    <Select value={form.gender} onValueChange={(v: ProductGender) => setForm({ ...form, gender: v, subcategory: '' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="men">Men</SelectItem>
                        <SelectItem value="women">Women</SelectItem>
                        <SelectItem value="unisex">Unisex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subcategory Select */}
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-1 block">Subcategory</label>
                    <Select value={form.subcategory} onValueChange={(v) => setForm({ ...form, subcategory: v })}>
                      <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                      <SelectContent>
                        {getSubcategories().map((sub) => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <textarea 
                    className="w-full p-3 border border-border rounded-sm bg-background font-body text-sm resize-none"
                    rows={3}
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />

                  {/* Inventory Management */}
                  <div className="border-t border-border pt-4">
                    <label className="font-body text-sm text-muted-foreground mb-2 block font-medium">Inventory Management</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-body text-xs text-muted-foreground mb-1 block">Stock Quantity</label>
                        <Input 
                          type="number" 
                          placeholder="Stock Quantity" 
                          value={form.stock_quantity} 
                          onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} 
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="font-body text-xs text-muted-foreground mb-1 block">Low Stock Threshold</label>
                        <Input 
                          type="number" 
                          placeholder="Alert Threshold" 
                          value={form.low_stock_threshold} 
                          onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} 
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 font-body text-sm">
                      <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} />
                      In Stock
                    </label>
                    <label className="flex items-center gap-2 font-body text-sm">
                      <input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} />
                      Mark as New
                    </label>
                  </div>
                  <Button type="submit" className="w-full">{editingProduct ? 'Update' : 'Create'} Product</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-body text-sm font-medium">Product</th>
                  <th className="text-left p-4 font-body text-sm font-medium">Category</th>
                  <th className="text-left p-4 font-body text-sm font-medium">Price</th>
                  <th className="text-left p-4 font-body text-sm font-medium">Stock</th>
                  <th className="text-left p-4 font-body text-sm font-medium">Status</th>
                  <th className="text-right p-4 font-body text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isLowStock = product.stock_quantity <= product.low_stock_threshold;
                  return (
                  <tr key={product.id} className="border-t border-border">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        <div>
                          <span className="font-body text-sm block">{product.name}</span>
                          <span className="font-body text-xs text-muted-foreground capitalize">{product.gender || 'unisex'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-body text-sm capitalize">{product.category}</td>
                    <td className="p-4 font-body text-sm">₹{product.price.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-body text-sm ${isLowStock ? 'text-destructive font-medium' : ''}`}>
                          {product.stock_quantity}
                        </span>
                        {isLowStock && (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-body ${product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openGallery(product)} title="Manage Gallery">
                          <Images className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(product)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Gallery Management Dialog */}
      <Dialog open={galleryDialogOpen} onOpenChange={setGalleryDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Gallery - {selectedProductForGallery?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <MultiImageUpload
              productId={selectedProductForGallery?.id}
              images={galleryImages}
              onChange={setGalleryImages}
            />
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button onClick={saveGalleryImages} className="flex-1">
                Save Gallery
              </Button>
              <Button variant="outline" onClick={() => setGalleryDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;