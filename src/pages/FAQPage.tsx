import { Layout } from '@/components/layout/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const FAQPage = () => {
  const faqs = [
    {
      category: 'Orders & Shipping',
      questions: [
        {
          q: 'How long does delivery take?',
          a: 'Delivery typically takes 3-5 business days for metro cities, 5-7 days for other cities, and 7-10 days for remote areas.'
        },
        {
          q: 'Is free shipping available?',
          a: 'Yes! We offer free shipping on all orders above ₹2,000. Orders below this amount have a flat shipping fee of ₹99.'
        },
        {
          q: 'Can I track my order?',
          a: 'Absolutely! Once your order is shipped, you\'ll receive a tracking link via email and SMS. You can also track from our Track Order page.'
        },
        {
          q: 'Do you ship internationally?',
          a: 'Yes, we ship to select countries. Please contact our support team for international shipping queries.'
        }
      ]
    },
    {
      category: 'Returns & Refunds',
      questions: [
        {
          q: 'What is your return policy?',
          a: 'We accept returns within 15 days of delivery for unused items with original tags and packaging intact.'
        },
        {
          q: 'How do I initiate a return?',
          a: 'Go to your orders page, select the item you wish to return, and click "Return". Our courier partner will pick up the item from your address.'
        },
        {
          q: 'How long does refund take?',
          a: 'Refunds are processed within 5-7 business days after we receive and verify the returned item.'
        },
        {
          q: 'Can I exchange an item?',
          a: 'Yes, exchanges are possible subject to product availability. Follow the same process as returns and select "Exchange" option.'
        }
      ]
    },
    {
      category: 'Products & Quality',
      questions: [
        {
          q: 'Are your products genuine?',
          a: 'Yes, all our jewelry is authentic. Gold and silver items come with purity certification, and we provide a certificate of authenticity.'
        },
        {
          q: 'Do you offer hallmarked jewelry?',
          a: 'All our gold jewelry is BIS hallmarked as per government regulations. Silver jewelry is 925 sterling silver certified.'
        },
        {
          q: 'How should I care for my jewelry?',
          a: 'Store jewelry in a dry place, avoid contact with perfumes and chemicals, and clean with a soft cloth. We provide care instructions with each piece.'
        }
      ]
    },
    {
      category: 'Payment & Security',
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit/debit cards, UPI, net banking, and Cash on Delivery (COD) for orders up to ₹50,000.'
        },
        {
          q: 'Is my payment information secure?',
          a: 'Absolutely. We use industry-standard SSL encryption and partner with trusted payment gateways to ensure your data is protected.'
        },
        {
          q: 'Can I pay in installments?',
          a: 'Yes, we offer EMI options through select credit cards. Check the payment page for available EMI plans.'
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gold" />
            <h1 className="font-display text-4xl mb-4">Frequently Asked Questions</h1>
            <p className="text-muted-foreground">
              Find answers to common questions about our products and services
            </p>
          </div>

          {faqs.map((section, index) => (
            <div key={index} className="mb-8">
              <h2 className="font-display text-xl mb-4 text-gold">{section.category}</h2>
              <Accordion type="single" collapsible className="w-full">
                {section.questions.map((faq, faqIndex) => (
                  <AccordionItem key={faqIndex} value={`${index}-${faqIndex}`}>
                    <AccordionTrigger className="text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          <div className="mt-12 p-6 bg-muted rounded-lg text-center">
            <p className="text-muted-foreground mb-2">Still have questions?</p>
            <a href="/contact" className="text-gold hover:underline font-medium">
              Contact our support team →
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQPage;
