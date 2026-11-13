const variants = {
  primary: 'gradient-btn',
  secondary: 'bg-gray-100 dark:bg-dark-700 text-dark-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-dark-600 font-semibold transition-colors duration-150',
  outline: 'border-2 border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-semibold transition-colors duration-150',
  ghost: 'text-dark-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors duration-150',
  danger: 'bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors duration-150',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export default function Button({ children, variant = 'primary', size = 'md', loading, disabled, className = '', onClick, type = 'button', ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variants[variant] || variants.primary} ${sizes[size] || sizes.md} inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-transform duration-100 ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
