import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const ReturnsPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gold" />
            <h1 className="font-display text-4xl mb-4">Returns & Exchange</h1>
            <p className="text-muted-foreground">
              Hassle-free returns and exchanges for your peace of mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Eligible for Return
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Unused items with original tags</li>
                  <li>• Items in original packaging</li>
                  <li>• Returned within 15 days of delivery</li>
                  <li>• Manufacturing defects</li>
                  <li>• Wrong item received</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  Not Eligible
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Customized or personalized items</li>
                  <li>• Items with broken seals</li>
                  <li>• Items showing signs of wear</li>
                  <li>• Sale or discounted items</li>
                  <li>• Items returned after 15 days</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>How to Return</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold">1</span>
                  <div>
                    <h4 className="font-medium">Initiate Return</h4>
                    <p className="text-sm text-muted-foreground">Go to your orders page and select "Return" for the item.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold">2</span>
                  <div>
                    <h4 className="font-medium">Pack the Item</h4>
                    <p className="text-sm text-muted-foreground">Place the item in original packaging with all tags intact.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold">3</span>
                  <div>
                    <h4 className="font-medium">Schedule Pickup</h4>
                    <p className="text-sm text-muted-foreground">Our courier partner will pick up the item from your address.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold">4</span>
                  <div>
                    <h4 className="font-medium">Refund Processed</h4>
                    <p className="text-sm text-muted-foreground">Refund will be credited within 5-7 business days after quality check.</p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Exchange is subject to product availability.</p>
              <p>• Refunds are processed to the original payment method.</p>
              <p>• For COD orders, refund will be via bank transfer.</p>
              <p>• Shipping charges are non-refundable except for defective items.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ReturnsPage;
