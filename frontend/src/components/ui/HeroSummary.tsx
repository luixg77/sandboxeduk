import React from 'react';

interface HeroSummaryProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  /** Pass a distinctive color for the module, using tailwind classes like 'bg-indigo-600' or default to Kodar Primary */
  themeClass?: string;
  children?: React.ReactNode; // For placing an Action Button on the right
}

export function HeroSummary({ 
  title, 
  description, 
  icon,
  themeClass = 'bg-kodar-600',
  children 
}: HeroSummaryProps) {
  
  return (
    <div className={`relative w-full overflow-hidden rounded-3xl ${themeClass} px-10 py-10 shadow-lg text-white mb-8`}>
      
      {/* Background Organic Shapes */}
      <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 pointer-events-none">
         <svg className="absolute w-[400px] h-[400px] -right-20 -top-40" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFFFFF" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-17.9,94.9,-3.3C92.9,11.3,83,24.8,72.4,36C61.8,47.2,50.4,56.1,38.1,64.2C25.8,72.3,12.9,79.5,-0.5,80.4C-13.9,81.3,-27.8,75.8,-40,67.7C-52.2,59.6,-62.8,48.9,-71.8,36.5C-80.8,24.1,-88.2,10.1,-87.9,-3.9C-87.6,-17.9,-79.6,-31.8,-70.5,-44.5C-61.4,-57.2,-51.2,-68.6,-38.3,-76.4C-25.4,-84.2,-9.7,-88.4,4.2,-85.4C18.1,-82.4,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100) scale(1.1)" />
         </svg>
         <svg className="absolute w-[300px] h-[300px] right-20 -bottom-20 opacity-50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFFFFF" d="M45.7,-76.7C59.9,-69.3,72.9,-58.5,82.2,-44.9C91.5,-31.3,97.1,-14.9,96.3,1.3C95.5,17.5,88.4,33.5,78,46.1C67.6,58.7,53.8,67.9,39.3,73.8C24.8,79.7,9.6,82.3,-5.7,82.5C-21,82.7,-36.5,80.5,-49.8,72.8C-63.1,65.1,-74.2,51.9,-81.4,36.9C-88.6,21.9,-91.9,5.2,-88.9,-10.3C-85.9,-25.8,-76.6,-40.1,-64.7,-51.6C-52.8,-63.1,-38.4,-71.8,-23.7,-76.8C-9,-81.8,6,-83.1,21.6,-81C37.2,-78.9,31.5,-84.1,45.7,-76.7Z" transform="translate(100 100) scale(0.9)" />
         </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Texts */}
        <div className="flex flex-col max-w-2xl">
           <div className="flex items-center gap-3 mb-2">
             {icon && <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">{icon}</div>}
             <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
           </div>
           <p className="text-white/80 font-medium text-[15px] leading-relaxed max-w-xl">
             {description}
           </p>
        </div>

        {/* Global Action / Button Container */}
        {children && (
          <div className="shrink-0 flex items-center">
            {children}
          </div>
        )}
      </div>

    </div>
  );
}
