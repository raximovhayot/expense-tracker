import { motion } from 'motion/react'
import {
  Building2,
  PiggyBank,
  RefreshCw,
  Users,
  Globe,
  Languages,
} from 'lucide-react'

const features = [
  {
    icon: Building2,
    title: 'Multi-Workspace',
    description:
      'Separate personal and business finances with dedicated workspaces. Each workspace has its own budgets, transactions, and team.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: PiggyBank,
    title: 'Smart Budgets',
    description:
      'Plan monthly budgets by category and track spending in real-time. Get alerts when approaching limits.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: RefreshCw,
    title: 'Recurring Automation',
    description:
      'Automate monthly, quarterly, and annual expense tracking. Never miss a bill or subscription payment.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Invite family or team members with role-based access. Owners, editors, and viewers each have appropriate permissions.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: Globe,
    title: 'Multi-Currency',
    description:
      'Full support for USD and UZS with real-time conversion. Track finances in your preferred currency.',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
  {
    icon: Languages,
    title: 'Bilingual Support',
    description:
      "Complete interface in English and O'zbek. Switch languages per workspace to match your preference.",
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold">
            Everything You Need to
            <span className="text-primary"> Manage Money</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to give you complete control over your
            finances, whether personal or business.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
