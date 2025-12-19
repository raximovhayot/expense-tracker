import {
    Home,
    Utensils,
    Car,
    Zap,
    Heart,
    Film,
    ShoppingBag,
    Book,
    User,
    MoreHorizontal,
    Briefcase,
    Gift,
    Coffee,
    Smartphone,
    Wifi,
    Music,
    Plane,
    Baby,
    PawPrint,
    Dumbbell,
    Shield,
    Landmark,
    Receipt,
    Wrench
} from 'lucide-react'

export const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    home: Home,
    utensils: Utensils,
    car: Car,
    zap: Zap,
    heart: Heart,
    film: Film,
    'shopping-bag': ShoppingBag,
    book: Book,
    user: User,
    'more-horizontal': MoreHorizontal,
    briefcase: Briefcase,
    gift: Gift,
    coffee: Coffee,
    smartphone: Smartphone,
    wifi: Wifi,
    music: Music,
    plane: Plane,
    baby: Baby,
    'paw-print': PawPrint,
    dumbbell: Dumbbell,
    shield: Shield,
    landmark: Landmark,
    receipt: Receipt,
    wrench: Wrench
}

interface CategoryIconProps {
    name: string | null | undefined
    className?: string
}

export function CategoryIcon({ name, className }: CategoryIconProps) {
    const Icon = categoryIconMap[name || 'more-horizontal'] || MoreHorizontal
    return <Icon className={className} />
}

export const iconOptions = [
    { value: 'home', label: 'Home' },
    { value: 'utensils', label: 'Food' },
    { value: 'car', label: 'Transport' },
    { value: 'zap', label: 'Utilities' },
    { value: 'heart', label: 'Health' },
    { value: 'film', label: 'Entertainment' },
    { value: 'shopping-bag', label: 'Shopping' },
    { value: 'book', label: 'Education' },
    { value: 'user', label: 'Personal' },
    { value: 'more-horizontal', label: 'Other' },
    { value: 'briefcase', label: 'Work' },
    { value: 'gift', label: 'Gifts' },
    { value: 'coffee', label: 'Coffee' },
    { value: 'smartphone', label: 'Phone' },
    { value: 'wifi', label: 'Internet' },
    { value: 'music', label: 'Music' },
    { value: 'plane', label: 'Travel' },
    { value: 'baby', label: 'Baby' },
    { value: 'paw-print', label: 'Pets' },
    { value: 'dumbbell', label: 'Fitness' },
    { value: 'shield', label: 'Insurance' },
    { value: 'landmark', label: 'Bank' },
    { value: 'receipt', label: 'Bills' },
    { value: 'wrench', label: 'Maintenance' },
]
