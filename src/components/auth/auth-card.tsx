import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Logo from '@/logo.svg?url'

interface AuthCardProps {
  title: string
  description: string
  children: React.ReactNode
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-6">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md shadow-xl border-border/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          {/* Logo */}
          <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <img
              src={Logo}
              alt="BudgetFlow"
              className="w-8 h-8"
            />
          </div>

          <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight">
            {title}
          </CardTitle>

          <CardDescription className="text-sm md:text-base text-muted-foreground mt-2">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
