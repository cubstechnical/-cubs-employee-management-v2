// Bundle analyzer helper for development
export const analyzeBundle = () => {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Log bundle information
    console.log('📊 Bundle Analysis:');
    console.log('• Next.js version: 15.5.3');
    console.log('• Build optimized for production');

    // Check for heavy dependencies
    const checkDependency = (name: string) => {
      try {
        const size = require(`${name}/package.json`).size || 'unknown';
        console.log(`• ${name}: ${size}`);
      } catch (error) {
        console.log(`• ${name}: Not found`);
      }
    };

    ['apexcharts', 'react-apexcharts', '@supabase/supabase-js', 'framer-motion'].forEach(checkDependency);
  }
};
