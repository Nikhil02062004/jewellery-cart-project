import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ruler } from 'lucide-react';

const SizeGuidePage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Ruler className="w-16 h-16 mx-auto mb-4 text-gold" />
            <h1 className="font-display text-4xl mb-4">Size Guide</h1>
            <p className="text-muted-foreground">
              Find your perfect fit with our comprehensive sizing charts
            </p>
          </div>

          <Tabs defaultValue="rings" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="rings">Rings</TabsTrigger>
              <TabsTrigger value="bangles">Bangles</TabsTrigger>
              <TabsTrigger value="necklaces">Necklaces</TabsTrigger>
              <TabsTrigger value="bracelets">Bracelets</TabsTrigger>
            </TabsList>

            <TabsContent value="rings">
              <Card>
                <CardHeader>
                  <CardTitle>Ring Size Chart (Indian Standard)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left">Indian Size</th>
                          <th className="py-3 px-4 text-left">US Size</th>
                          <th className="py-3 px-4 text-left">Diameter (mm)</th>
                          <th className="py-3 px-4 text-left">Circumference (mm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { indian: 6, us: 3, dia: 14.0, circ: 44.0 },
                          { indian: 8, us: 4, dia: 14.8, circ: 46.5 },
                          { indian: 10, us: 5, dia: 15.6, circ: 49.0 },
                          { indian: 12, us: 6, dia: 16.5, circ: 51.8 },
                          { indian: 14, us: 7, dia: 17.3, circ: 54.4 },
                          { indian: 16, us: 8, dia: 18.2, circ: 57.0 },
                          { indian: 18, us: 9, dia: 19.0, circ: 59.5 },
                          { indian: 20, us: 10, dia: 19.8, circ: 62.1 },
                        ].map((row) => (
                          <tr key={row.indian} className="border-b">
                            <td className="py-3 px-4">{row.indian}</td>
                            <td className="py-3 px-4">{row.us}</td>
                            <td className="py-3 px-4">{row.dia}</td>
                            <td className="py-3 px-4">{row.circ}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    <strong>Tip:</strong> Wrap a string around your finger, mark where it meets, and measure the length in mm.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bangles">
              <Card>
                <CardHeader>
                  <CardTitle>Bangle Size Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left">Size</th>
                          <th className="py-3 px-4 text-left">Inner Diameter (inches)</th>
                          <th className="py-3 px-4 text-left">Inner Diameter (mm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { size: '2-2', dia: '2.125', mm: 54 },
                          { size: '2-4', dia: '2.25', mm: 57 },
                          { size: '2-6', dia: '2.375', mm: 60 },
                          { size: '2-8', dia: '2.5', mm: 64 },
                          { size: '2-10', dia: '2.625', mm: 67 },
                          { size: '2-12', dia: '2.75', mm: 70 },
                        ].map((row) => (
                          <tr key={row.size} className="border-b">
                            <td className="py-3 px-4">{row.size}</td>
                            <td className="py-3 px-4">{row.dia}</td>
                            <td className="py-3 px-4">{row.mm}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    <strong>Tip:</strong> Measure the inner diameter of a bangle you currently wear.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="necklaces">
              <Card>
                <CardHeader>
                  <CardTitle>Necklace Length Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left">Length</th>
                          <th className="py-3 px-4 text-left">Inches</th>
                          <th className="py-3 px-4 text-left">Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Choker', inches: '14-16"', pos: 'Sits at base of throat' },
                          { name: 'Princess', inches: '17-19"', pos: 'Falls at collarbone' },
                          { name: 'Matinee', inches: '20-24"', pos: 'Falls between collarbone and bust' },
                          { name: 'Opera', inches: '28-34"', pos: 'Falls at bust or below' },
                          { name: 'Rope', inches: '36"+', pos: 'Can be worn doubled' },
                        ].map((row) => (
                          <tr key={row.name} className="border-b">
                            <td className="py-3 px-4 font-medium">{row.name}</td>
                            <td className="py-3 px-4">{row.inches}</td>
                            <td className="py-3 px-4">{row.pos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bracelets">
              <Card>
                <CardHeader>
                  <CardTitle>Bracelet Size Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left">Wrist Size</th>
                          <th className="py-3 px-4 text-left">Bracelet Size</th>
                          <th className="py-3 px-4 text-left">Fit Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { wrist: '5.5-6"', bracelet: '6.5"', fit: 'Small' },
                          { wrist: '6-6.5"', bracelet: '7"', fit: 'Medium' },
                          { wrist: '6.5-7"', bracelet: '7.5"', fit: 'Large' },
                          { wrist: '7-7.5"', bracelet: '8"', fit: 'X-Large' },
                        ].map((row) => (
                          <tr key={row.wrist} className="border-b">
                            <td className="py-3 px-4">{row.wrist}</td>
                            <td className="py-3 px-4">{row.bracelet}</td>
                            <td className="py-3 px-4">{row.fit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    <strong>Tip:</strong> Measure your wrist and add 0.5-1" for a comfortable fit.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default SizeGuidePage;
