import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Clock, MapPin, Shield } from 'lucide-react';

const ShippingInfoPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Truck className="w-16 h-16 mx-auto mb-4 text-gold" />
            <h1 className="font-display text-4xl mb-4">Shipping Information</h1>
            <p className="text-muted-foreground">
              Everything you need to know about our shipping policies
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold" />
                  Delivery Times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Metro Cities</span>
                  <span className="font-medium">3-5 business days</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Cities</span>
                  <span className="font-medium">5-7 business days</span>
                </div>
                <div className="flex justify-between">
                  <span>Remote Areas</span>
                  <span className="font-medium">7-10 business days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gold" />
                  Shipping Zones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>We deliver across India to all pin codes.</p>
                <p>International shipping available to select countries.</p>
                <p>Contact support for international orders.</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gold" />
                Shipping Policies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Free Shipping</h4>
                <p className="text-sm text-muted-foreground">
                  Enjoy free shipping on all orders above ₹2,000. Orders below this amount incur a flat shipping fee of ₹99.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Secure Packaging</h4>
                <p className="text-sm text-muted-foreground">
                  All jewelry items are carefully packaged in premium boxes with tamper-proof seals to ensure safe delivery.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Insurance</h4>
                <p className="text-sm text-muted-foreground">
                  All shipments are fully insured against loss or damage during transit at no extra cost.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Order Processing</h4>
                <p className="text-sm text-muted-foreground">
                  Orders placed before 2 PM IST are processed the same day. Weekend orders are processed on Monday.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ShippingInfoPage;
