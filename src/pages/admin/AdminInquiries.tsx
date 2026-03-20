import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, MessageSquare, Users, LogOut, Mail, MailOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      fetchInquiries();
    };

    checkAdmin();
  }, [navigate]);

  const fetchInquiries = async () => {
    const { data } = await supabase
      .from('contact_inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setInquiries(data);
    setLoading(false);
  };

  const markAsRead = async (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    
    if (!inquiry.is_read) {
      await supabase
        .from('contact_inquiries')
        .update({ is_read: true })
        .eq('id', inquiry.id);
      
      fetchInquiries();
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
            <LogOut className="w-4 h-4" />Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 min-h-[calc(100vh-64px)] bg-card border-r border-border p-6">
          <nav className="space-y-2">
            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors">
              <Users className="w-4 h-4" />Dashboard
            </Link>
            <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors">
              <Package className="w-4 h-4" />Products
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors">
              <ShoppingBag className="w-4 h-4" />Orders
            </Link>
            <Link to="/admin/inquiries" className="flex items-center gap-3 px-4 py-3 rounded-sm bg-gold/10 text-gold font-body text-sm">
              <MessageSquare className="w-4 h-4" />Inquiries
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <h2 className="font-display text-3xl mb-8">Contact Inquiries</h2>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-body text-sm font-medium w-8"></th>
                  <th className="text-left p-4 font-body text-sm font-medium">Name</th>
                  <th className="text-left p-4 font-body text-sm font-medium">Subject</th>
                  <th className="text-left p-4 font-body text-sm font-medium">Email</th>
                  <th className="text-left p-4 font-body text-sm font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <tr 
                    key={inquiry.id} 
                    className={`border-t border-border cursor-pointer hover:bg-muted/50 transition-colors ${!inquiry.is_read ? 'bg-gold/5' : ''}`}
                    onClick={() => markAsRead(inquiry)}
                  >
                    <td className="p-4">
                      {inquiry.is_read ? (
                        <MailOpen className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Mail className="w-4 h-4 text-gold" />
                      )}
                    </td>
                    <td className="p-4 font-body text-sm font-medium">{inquiry.name}</td>
                    <td className="p-4 font-body text-sm">{inquiry.subject}</td>
                    <td className="p-4 font-body text-sm text-muted-foreground">{inquiry.email}</td>
                    <td className="p-4 font-body text-sm text-muted-foreground">
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {inquiries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center font-body text-muted-foreground">
                      No inquiries yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedInquiry?.subject}</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm font-body">
                <div>
                  <p className="text-muted-foreground">From</p>
                  <p>{selectedInquiry.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{new Date(selectedInquiry.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <a href={`mailto:${selectedInquiry.email}`} className="text-gold hover:underline">
                    {selectedInquiry.email}
                  </a>
                </div>
                {selectedInquiry.phone && (
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <a href={`tel:${selectedInquiry.phone}`} className="text-gold hover:underline">
                      {selectedInquiry.phone}
                    </a>
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-body text-sm font-medium mb-2">Message</p>
                <p className="font-body text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedInquiry.message}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <a href={`mailto:${selectedInquiry.email}?subject=Re: ${selectedInquiry.subject}`}>
                    Reply via Email
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInquiries;
