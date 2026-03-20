import { Layout } from "@/components/layout/Layout";
import { Users, Heart, Gem, Award, Target, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const teamMembers = [
  {
    name: "NikhiL Soni",
    role: "Founder & CEO",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
    bio: "With 15 years in jewelry design, Priya founded our brand with a vision to make luxury accessible."
  },
  {
    name: "Shyam Sundar Soni",
    role: "Head Designer",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop",
    bio: "Award-winning designer known for blending traditional Indian aesthetics with modern elegance."
  },
];

const values = [
  {
    icon: Gem,
    title: "Quality Craftsmanship",
    description: "Every piece is crafted with precision and care, using only the finest materials and techniques passed down through generations."
  },
  {
    icon: Heart,
    title: "Customer First",
    description: "Your satisfaction is our priority. We go above and beyond to ensure every purchase brings joy and confidence."
  },
  {
    icon: Award,
    title: "Authentic Design",
    description: "Our designs blend timeless tradition with contemporary style, creating unique pieces that tell your story."
  },
  {
    icon: Target,
    title: "Sustainability",
    description: "We're committed to ethical sourcing and sustainable practices, ensuring our beauty doesn't cost the earth."
  }
];

const AboutPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Our Story
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Crafting timeless elegance since 2010, we've been on a journey to bring 
            exquisite jewelry to those who appreciate beauty and quality.
          </p>
        </section>

        {/* Company Story */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                The Beginning
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  What started as a small family workshop in Jaipur has blossomed into 
                  a beloved jewelry brand trusted by thousands across India. Our founder, 
                  Priya Sharma, grew up watching her grandmother create beautiful pieces 
                  that became cherished family heirlooms.
                </p>
                <p>
                  Inspired by this legacy, she established our brand with a simple mission: 
                  to create jewelry that captures life's precious moments and becomes part 
                  of your family's story.
                </p>
                <p>
                  Today, we combine age-old craftsmanship techniques with modern design 
                  sensibilities. Each piece in our collection is carefully curated to 
                  ensure it meets our exacting standards of quality and beauty.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="src\assets\about-page.png"
                alt="Jewelry craftsmanship"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">
            Meet Our Team
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            The passionate individuals behind every beautiful piece we create
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
            {teamMembers.map((member, index) => (
              <Card key={index} className="border-none shadow-lg overflow-hidden group">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="pt-4 text-center">
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <p className="text-primary text-sm mb-2">{member.role}</p>
                  <p className="text-muted-foreground text-xs">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-primary/5 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary">50,000+</p>
              <p className="text-muted-foreground">Happy Customers</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">5,000+</p>
              <p className="text-muted-foreground">Unique Designs</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">100+</p>
              <p className="text-muted-foreground">Master Craftsmen</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">4.9★</p>
              <p className="text-muted-foreground">Customer Rating</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AboutPage;