import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'

export function CTASection() {
  const { currentUser } = useAuth()

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 sm:p-12 lg:p-16 overflow-hidden"
        >
          {/* Background Pattern */}
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:32px_32px]" />


          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm text-white mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Start tracking today</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Ready to Take Control?
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Join thousands of users who have transformed their financial
              habits. Set up your first workspace in under 2 minutes.
            </p>

            {currentUser ? (
              <Link to="/budgets">
                <Button size="lg" variant="secondary" className="gap-2 px-8">
                  Go to Budgets
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/sign-in">
                <Button size="lg" variant="secondary" className="gap-2 px-8">
                  Get Started for Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <p className="mt-4 text-sm text-white/60">
              No credit card required • Free forever for personal use
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
