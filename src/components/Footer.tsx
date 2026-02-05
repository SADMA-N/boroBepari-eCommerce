import { Link } from '@tanstack/react-router'
import {
  ChevronDown,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from 'lucide-react'
import { useState } from 'react'

export default function Footer() {
  const [language, setLanguage] = useState('English')
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  const companyLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
    { label: 'Contact Us', href: '/contact' },
  ]

  const marketplaceLinks = [
    { label: 'All Categories', href: '/categories' },
    { label: 'Featured Products', href: '/featured' },
    { label: 'New Arrivals', href: '/new-arrivals' },
    { label: 'Top Suppliers', href: '/suppliers' },
    { label: 'Sell on BoroBepari', href: '/sell' },
  ]

  const helpLinks = [
    { label: 'Help Center', href: '/help' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Shipping Info', href: '/shipping' },
    { label: 'Returns & Refunds', href: '/returns' },
    { label: 'Buyer Protection', href: '/buyer-protection' },
  ]

  const legalLinks = [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Cookie Policy', href: '/cookies' },
  ]

  const paymentMethods = [
    { name: 'bKash', icon: '/payments/bkash.svg', fallback: 'bK' },
    { name: 'Nagad', icon: '/payments/nagad.svg', fallback: 'Ng' },
    { name: 'Rocket', icon: '/payments/rocket.svg', fallback: 'Rk' },
    { name: 'Visa', icon: '/payments/visa.svg', fallback: 'Vi' },
    { name: 'Mastercard', icon: '/payments/mastercard.svg', fallback: 'MC' },
    { name: 'Bank Transfer', icon: '/payments/bank.svg', fallback: 'BT' },
  ]

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
    { name: 'YouTube', icon: Youtube, href: 'https://youtube.com' },
  ]

  return (
    <footer className="bg-gray-900 dark:bg-slate-950 text-gray-300 dark:text-gray-400 transition-colors">
      {/* Main Footer Content */}
      <div className="max-w-[1440px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <h2 className="text-2xl font-bold text-white dark:text-gray-100">
                Boro<span className="text-orange-500">Bepari</span>
              </h2>
            </Link>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4 transition-colors">
              Bangladesh's largest B2B wholesale marketplace connecting buyers
              and suppliers across the country.
            </p>
            <div className="space-y-2 transition-colors">
              <a
                href="mailto:support@borobepari.com"
                className="flex items-center gap-2 text-sm hover:text-orange-500 transition-colors"
              >
                <Mail size={16} />
                support@borobepari.com
              </a>
              <a
                href="tel:+8801700000000"
                className="flex items-center gap-2 text-sm hover:text-orange-500 transition-colors"
              >
                <Phone size={16} />
                +880 1700-000000
              </a>
              <p className="flex items-start gap-2 text-sm">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                Gulshan-2, Dhaka 1212, Bangladesh
              </p>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white dark:text-gray-100 font-semibold mb-4 transition-colors">
              Company
            </h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-orange-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketplace Links */}
          <div>
            <h3 className="text-white dark:text-gray-100 font-semibold mb-4 transition-colors">
              Marketplace
            </h3>
            <ul className="space-y-2">
              {marketplaceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-orange-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="text-white dark:text-gray-100 font-semibold mb-4 transition-colors">
              Help & Support
            </h3>
            <ul className="space-y-2">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-orange-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment & Social */}
          <div>
            <h3 className="text-white dark:text-gray-100 font-semibold mb-4 transition-colors">
              Payment Methods
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {paymentMethods.map((method) => (
                <div
                  key={method.name}
                  className="bg-white dark:bg-slate-800 rounded px-2 py-1 flex items-center justify-center min-w-[40px] h-8 transition-colors"
                  title={method.name}
                >
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {method.fallback}
                  </span>
                </div>
              ))}
            </div>

            <h3 className="text-white dark:text-gray-100 font-semibold mb-4 transition-colors">
              Follow Us
            </h3>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 dark:bg-slate-800 p-2 rounded-full hover:bg-orange-500 transition-colors"
                    aria-label={social.name}
                  >
                    <Icon size={18} className="text-white dark:text-gray-200" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 dark:border-slate-800 transition-colors">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-500 dark:text-gray-600 transition-colors">
              &copy; {new Date().getFullYear()} BoroBepari. All rights reserved.
            </p>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center gap-4">
              {legalLinks.map((link, index) => (
                <span key={link.href} className="flex items-center">
                  <Link
                    to={link.href}
                    className="text-sm text-gray-500 dark:text-gray-600 hover:text-orange-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                  {index < legalLinks.length - 1 && (
                    <span className="ml-4 text-gray-700 dark:text-gray-800">
                      |
                    </span>
                  )}
                </span>
              ))}
            </div>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-200 transition-colors"
              >
                <Globe size={16} />
                {language}
                <ChevronDown size={14} />
              </button>
              {showLanguageMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-800 dark:bg-slate-900 rounded-lg shadow-lg py-2 min-w-[120px] transition-colors border dark:border-slate-800">
                  {['English', 'বাংলা'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang)
                        setShowLanguageMenu(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 dark:hover:bg-slate-800 transition-colors ${
                        language === lang
                          ? 'text-orange-500'
                          : 'text-gray-300 dark:text-gray-400'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
