import {
  Building2,
  CheckCircle,
  Home,
  MapPin,
  Pencil,
  Store,
  Trash2,
} from 'lucide-react'
import type { Address } from '@/db/schema'

interface AddressCardProps {
  address: Address
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

export function AddressCard({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: AddressCardProps) {
  const getIcon = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes('home')) return <Home size={18} />
    if (l.includes('office')) return <Building2 size={18} />
    return <Store size={18} />
  }

  return (
    <div
      className={`
        relative border rounded-xl p-5 cursor-pointer transition-all duration-200 group
        ${
          isSelected
            ? 'border-orange-500 bg-orange-50/30 dark:bg-orange-950/20 ring-1 ring-orange-500 shadow-sm'
            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-gray-300 hover:shadow-sm'
        }
      `}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`p-1.5 rounded-lg ${isSelected ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'}`}
          >
            {getIcon(address.name)}
          </span>
          <span className="font-bold text-gray-900 dark:text-white">{address.name}</span>
          {address.isDefault && (
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Default
            </span>
          )}
        </div>
        <div
          className={`
          w-5 h-5 rounded-full border flex items-center justify-center transition-colors
          ${isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800'}
        `}
        >
          {isSelected && <div className="w-2 h-2 bg-white dark:bg-white rounded-full" />}
        </div>
      </div>

      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4 ml-1">
        <p className="line-clamp-2 min-h-[40px]">{address.address}</p>
        <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
          {address.city && <span>{address.city} - </span>}
          <span>{address.postcode}</span>
        </p>
        <p className="flex items-center gap-2 pt-1">
          <span className="font-medium text-gray-900 dark:text-white">{address.phone}</span>
        </p>
      </div>

      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
        >
          <Pencil size={14} />
          Edit
        </button>
        <div className="w-px h-4 bg-gray-200 dark:bg-slate-700" />
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  )
}
