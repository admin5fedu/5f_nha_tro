import * as React from "react"
import { cn } from "../../lib/utils"

const Label = React.forwardRef(({ className, required, children, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "block text-sm font-medium text-gray-700 mb-1",
      className
    )}
    {...props}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
))
Label.displayName = "Label"

export { Label }

