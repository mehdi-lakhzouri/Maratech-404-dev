/**
 * Landing Page
 * ------------
 * Public home page with accessibility-first messaging.
 * Redirects authenticated users to dashboard.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, Users } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Sécurisé',
    description: 'Authentification JWT avec refresh tokens sécurisés',
  },
  {
    icon: Zap,
    title: 'Performant',
    description: 'Application optimisée pour une expérience fluide',
  },
  {
    icon: Users,
    title: 'Collaboratif',
    description: 'Gestion des rôles et permissions avancée',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b" role="banner">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            TILI
          </Link>
          <nav aria-label="Navigation principale" className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-2 py-1"
            >
              Connexion
            </Link>
            <Button asChild>
              <Link href="/register">Commencer</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main role="main">
        <section
          className="container mx-auto px-4 py-24 text-center"
          aria-labelledby="hero-heading"
        >
          <h1
            id="hero-heading"
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Bienvenue sur{' '}
            <span className="text-primary">TILI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            La plateforme interne accessible conçue pour simplifier la gestion de vos projets
            et la collaboration au sein de votre équipe.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Créer un compte
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section
          className="bg-muted/50 py-24"
          aria-labelledby="features-heading"
        >
          <div className="container mx-auto px-4">
            <h2
              id="features-heading"
              className="text-3xl font-bold text-center mb-12"
            >
              Pourquoi choisir TILI ?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="bg-card p-6 rounded-lg shadow-sm"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon
                      className="h-6 w-6 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className="container mx-auto px-4 py-24 text-center"
          aria-labelledby="cta-heading"
        >
          <h2 id="cta-heading" className="text-3xl font-bold mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Rejoignez TILI dès maintenant et découvrez une nouvelle façon de
            gérer vos projets en équipe.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">
              S&apos;inscrire gratuitement
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8" role="contentinfo">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TILI. Tous droits réservés.</p>
          <p className="mt-2">
            Une plateforme conçue avec l&apos;accessibilité au cœur.
          </p>
        </div>
      </footer>
    </div>
  );
}
