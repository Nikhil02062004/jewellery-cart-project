import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  ShoppingBag, 
  MessageSquare, 
  Users, 
  LogOut, 
  Film, 
  BarChart3, 
  Headphones, 
  XCircle,
  Mail,
  Clock,
  ChevronLeft,
  LayoutDashboard,
  ChevronRight,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

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
      fetchInquiries();
    };

    checkAdmin();
  }, [navigate]);

  const fetchInquiries = async () => {
    const { data, error } = await supabase
      .from('contact_inquiries')
      .select('id, name, email, subject, message, created_at, phone, is_read')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setInquiries(data || []);
    }
    setLoading(false);
  };

  const filteredInquiries = inquiries.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.subject.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="font-display text-xl font-bold text-charcoal">Client Correspondence</h1>
        </div>
        <div className="relative w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
           <Input 
             placeholder="Search dossiers..." 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className="pl-10 h-10 bg-slate-50 border-none rounded-xl text-xs focus:ring-1 focus:ring-gold/30"
           />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col">
          <nav className="space-y-1 flex-1">
            <SidebarItem to="/admin" icon={<LayoutDashboard />} label="Dashboard" />
            <SidebarItem to="/admin/products" icon={<Package />} label="Products" />
            <SidebarItem to="/admin/orders" icon={<ShoppingBag />} label="Orders" />
            <SidebarItem to="/admin/inquiries" icon={<MessageSquare />} label="Inquiries" active />
            <SidebarItem to="/admin/reels" icon={<Film />} label="Reels" />
            <SidebarItem to="/admin/chat" icon={<Headphones />} label="Live Chat" />
            <SidebarItem to="/admin/analytics" icon={<BarChart3 />} label="Analytics" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12 overflow-y-auto bg-slate-50">
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700">
            
            <div className="grid gap-4">
              {filteredInquiries.map((inquiry) => (
                <div key={inquiry.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6 cursor-pointer group" onClick={() => setSelectedInquiry(inquiry)}>
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                     <Mail className="w-5 h-5" />
                  </div>

                  <div className="flex-1 grid md:grid-cols-3 gap-6 w-full">
                    <div className="space-y-0.5">
                      <p className="text-[8px] uppercase tracking-widest font-black text-slate-300">Originator</p>
                      <p className="font-bold text-charcoal">{inquiry.name}</p>
                      <p className="text-[10px] text-slate-400 lowercase">{inquiry.email}</p>
                    </div>

                    <div className="space-y-0.5 flex-1">
                      <p className="text-[8px] uppercase tracking-widest font-black text-slate-300">Subject Matter</p>
                      <p className="text-sm text-slate-600 font-medium truncate group-hover:text-charcoal transition-colors">{inquiry.subject}</p>
                    </div>

                    <div className="space-y-0.5 text-right md:text-left">
                      <p className="text-[8px] uppercase tracking-widest font-black text-slate-300">Transmission</p>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-medium">
                        <Clock className="w-3 h-3 text-gold/60" />
                        {new Date(inquiry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-gold transition-colors" />
                  </div>
                </div>
              ))}

              {filteredInquiries.length === 0 && (
                <div className="bg-white rounded-[3rem] p-24 text-center border border-dashed border-slate-200">
                  <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-body text-sm italic">No relevant correspondence found in the archives.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-[2.5rem] p-0 shadow-2xl overflow-hidden border-none text-charcoal">
          <div className="bg-charcoal p-8 text-white relative flex items-center justify-between">
             <div className="absolute inset-0 bg-gold/5" />
             <div className="relative z-10">
                <DialogTitle className="font-display text-2xl font-bold italic tracking-tight">Communication Transcript</DialogTitle>
                <p className="text-[10px] uppercase font-bold text-gold/60 tracking-widest mt-1">Ref ID #{selectedInquiry?.id.slice(0, 8)}</p>
             </div>
             <Mail className="w-10 h-10 text-gold/20 relative z-10" />
          </div>
          {selectedInquiry && (
            <div className="p-10 space-y-10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-charcoal font-display text-xl group shadow-sm italic font-bold">
                       {selectedInquiry.name[0]}
                    </div>
                    <div>
                       <p className="text-[8px] uppercase font-black tracking-widest text-slate-300 mb-0.5">Author</p>
                       <p className="font-display text-xl font-bold text-charcoal">{selectedInquiry.name}</p>
                       <p className="text-xs text-gold font-medium">{selectedInquiry.email}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] uppercase tracking-widest text-slate-300 mb-1 font-black">Received</p>
                    <p className="text-sm font-medium text-slate-400">{new Date(selectedInquiry.created_at).toLocaleString()}</p>
                 </div>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-100" />
                    <p className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-300 whitespace-nowrap">Message Narrative</p>
                    <div className="h-px flex-1 bg-slate-100" />
                 </div>
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                    <p className="italic text-slate-700 leading-relaxed font-body text-lg">"{selectedInquiry.message}"</p>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                 <Button variant="ghost" className="h-12 px-8 rounded-xl border border-slate-100 text-slate-400 hover:text-charcoal hover:bg-slate-50 uppercase text-[10px] font-black tracking-widest" onClick={() => setSelectedInquiry(null)}>
                    Archive Dossier
                 </Button>
                 <Button className="h-12 px-8 rounded-xl bg-gold text-white hover:bg-gold/90 uppercase text-[10px] font-black tracking-widest shadow-lg shadow-gold/10" onClick={() => window.location.href = `mailto:${selectedInquiry.email}`}>
                    Establish Contact
                 </Button>
              </div>
            </div>
          )}
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
    {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4 flex-shrink-0" })}
    <span className="font-body text-sm font-medium">{label}</span>
  </Link>
);

export default AdminInquiries;
