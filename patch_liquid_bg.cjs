const fs = require('fs');
let code = fs.readFileSync('src/components/LiquidGlass.tsx', 'utf8');

const regex = /export const LiquidBackground = \(\) => \{\s*return \([\s\S]*?\}\s*\);\s*\};/;

const replacement = `export const LiquidBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
      <div className="absolute inset-0 bg-[#0d120f] transition-colors duration-700" />
      {/* Replaced heavy animated blurs with simple static radial gradients for better performance */}
      <div className="absolute -top-[15%] -left-[10%] w-[65%] h-[65%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 to-transparent" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/15 to-transparent" />
      <div className="absolute top-[25%] right-[5%] w-[45%] h-[45%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-400/10 to-transparent" />
    </div>
  );
};`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/LiquidGlass.tsx', code);
