// Helper functions for sticky headers and footers

export const stickyTableClasses = {
  container: "overflow-x-auto max-h-[calc(100vh-300px)]",
  thead: "bg-gray-50 sticky top-0 z-10",
  th: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50",
  thAction: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky right-0",
  tdAction: "px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 bg-white sticky right-0"
};

export const stickyDetailHeaderClasses = "sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6";
export const stickyFormFooterClasses = "sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6";

