import { PiggyBank } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">BudgetFlow</span>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BudgetFlow. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>English</span>
            <span>•</span>
            <span>O'zbek</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
