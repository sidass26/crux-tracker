import React from "react"
import { twMerge } from "tailwind-merge"

interface CardProps extends React.ComponentProps<"div"> {}

const CardRoot = ({ className, children, ...props }: CardProps) => (
  <div
    className={twMerge(
      "rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm",
      className,
    )}
    {...props}
  >
    {children}
  </div>
)

interface CardHeaderProps extends React.ComponentProps<"div"> {
  title?: React.ReactNode
  description?: React.ReactNode
}

const CardHeader = ({ className, title, description, children, ...props }: CardHeaderProps) => (
  <div className={twMerge("flex flex-col space-y-1.5 p-6", className)} {...props}>
    {title && <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>}
    {description && <p className="text-sm text-gray-500">{description}</p>}
    {children}
  </div>
)

const CardContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={twMerge("p-6 pt-0", className)} {...props} />
)

const CardFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={twMerge("flex items-center p-6 pt-0", className)} {...props} />
)

const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
})

export { Card }
export type { CardProps }
