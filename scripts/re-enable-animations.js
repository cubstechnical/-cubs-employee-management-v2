#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 Re-enabling framer-motion animations...');

// Files that need animation restoration
const filesToRestore = [
  'app/employees/components/BulkActions.tsx',
  'app/employees/components/EmployeeCard.tsx',
  'app/employees/components/EnhancedFilters.tsx',
  'app/employees/components/EnhancedPagination.tsx',
  'app/employees/components/EnhancedSearch.tsx',
  'app/employees/page-enhanced.tsx'
];

function restoreAnimations(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Restore framer-motion imports
  if (content.includes('// import { motion, AnimatePresence } from \'framer-motion\'; // Temporarily disabled')) {
    content = content.replace(
      '// import { motion, AnimatePresence } from \'framer-motion\'; // Temporarily disabled',
      'import { motion, AnimatePresence } from \'framer-motion\';'
    );
  }
  
  if (content.includes('// import { motion } from \'framer-motion\'; // Temporarily disabled')) {
    content = content.replace(
      '// import { motion } from \'framer-motion\'; // Temporarily disabled',
      'import { motion } from \'framer-motion\';'
    );
  }

  // Restore motion components
  content = content.replace(/<div/g, '<motion.div');
  content = content.replace(/<button/g, '<motion.button');
  content = content.replace(/<span/g, '<motion.span');
  content = content.replace(/<section/g, '<motion.section');
  content = content.replace(/<article/g, '<motion.article');
  content = content.replace(/<header/g, '<motion.header');
  content = content.replace(/<main/g, '<motion.main');
  content = content.replace(/<aside/g, '<motion.aside');
  content = content.replace(/<footer/g, '<motion.footer');
  content = content.replace(/<nav/g, '<motion.nav');
  
  // Restore closing motion components
  content = content.replace(/<\/div>/g, '</motion.div>');
  content = content.replace(/<\/button>/g, '</motion.button>');
  content = content.replace(/<\/span>/g, '</motion.span>');
  content = content.replace(/<\/section>/g, '</motion.section>');
  content = content.replace(/<\/article>/g, '</motion.article>');
  content = content.replace(/<\/header>/g, '</motion.header>');
  content = content.replace(/<\/main>/g, '</motion.main>');
  content = content.replace(/<\/aside>/g, '</motion.aside>');
  content = content.replace(/<\/footer>/g, '</motion.footer>');
  content = content.replace(/<\/nav>/g, '</motion.nav>');
  
  // Add AnimatePresence where needed
  if (content.includes('{bulkState.showBulkActions &&') && !content.includes('<AnimatePresence>')) {
    content = content.replace(
      '{bulkState.showBulkActions && (',
      '<AnimatePresence>\n      {bulkState.showBulkActions && ('
    );
    content = content.replace(
      ')}',
      ')}\n    </AnimatePresence>'
    );
  }

  // Add motion props for animations
  content = content.replace(
    '<motion.div\n          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"',
    '<motion.div\n          initial={{ opacity: 0, y: 20 }}\n          animate={{ opacity: 1, y: 0 }}\n          exit={{ opacity: 0, y: 20 }}\n          transition={{ duration: 0.3 }}\n          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"'
  );

  // Add hover animations
  content = content.replace(
    '<motion.button\n            onClick={onDeselectAll}',
    '<motion.button\n            whileHover={{ scale: 1.05 }}\n            whileTap={{ scale: 0.95 }}\n            onClick={onDeselectAll}'
  );

  fs.writeFileSync(filePath, content);
  console.log(`✅ Restored animations: ${filePath}`);
}

// Restore animations in all files
filesToRestore.forEach(restoreAnimations);

console.log('🎉 Animations restored!');
console.log('📝 Note: Framer Motion animations are now active for better UX.');
