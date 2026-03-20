import { Layout } from "@/components/layout/Layout";
import {ReelUploadForm} from "@/components/reels/ReelUploadForm";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ReelUploadPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      console.log("USER:", data);

      if (error || !data?.user) {
        navigate("/auth");
        return;
      }

      setUser(data.user);
      setLoading(false);
    };

    checkUser();
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="py-20 text-center">Loading...</div>
      </Layout>
    );
  }

  return (
  <Layout>
    <section className="py-20">
      <div className="container mx-auto max-w-xl">
        <h1 className="font-display text-3xl mb-6">Upload Reel</h1>

        <ReelUploadForm
          onSuccess={() => navigate("/reels")}
        />
      </div>
    </section>
  </Layout>
);
}