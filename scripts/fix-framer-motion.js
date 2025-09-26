#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Framer Motion components...');

// Files that need framer-motion fixes
const filesToFix = [
  'app/employees/components/BulkActions.tsx',
  'app/employees/components/EmployeeCard.tsx', 
  'app/employees/components/EnhancedFilters.tsx',
  'app/employees/components/EnhancedPagination.tsx',
  'app/employees/components/EnhancedSearch.tsx',
  'app/employees/page-enhanced.tsx'
];

// Replace framer-motion components with regular divs
function fixFramerMotion(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace motion components with regular divs
  content = content.replace(/<motion\.div/g, '<div');
  content = content.replace(/<motion\.button/g, '<button');
  content = content.replace(/<motion\.span/g, '<span');
  content = content.replace(/<motion\.section/g, '<section');
  content = content.replace(/<motion\.article/g, '<article');
  content = content.replace(/<motion\.header/g, '<header');
  content = content.replace(/<motion\.main/g, '<main');
  content = content.replace(/<motion\.aside/g, '<aside');
  content = content.replace(/<motion\.footer/g, '<footer');
  content = content.replace(/<motion\.nav/g, '<nav');
  
  // Replace closing motion components
  content = content.replace(/<\/motion\.div>/g, '</div>');
  content = content.replace(/<\/motion\.button>/g, '</button>');
  content = content.replace(/<\/motion\.span>/g, '</span>');
  content = content.replace(/<\/motion\.section>/g, '</section>');
  content = content.replace(/<\/motion\.article>/g, '</article>');
  content = content.replace(/<\/motion\.header>/g, '</header>');
  content = content.replace(/<\/motion\.main>/g, '</main>');
  content = content.replace(/<\/motion\.aside>/g, '</aside>');
  content = content.replace(/<\/motion\.footer>/g, '</footer>');
  content = content.replace(/<\/motion\.nav>/g, '</nav>');
  
  // Remove AnimatePresence
  content = content.replace(/<AnimatePresence[^>]*>/g, '');
  content = content.replace(/<\/AnimatePresence>/g, '');
  
  // Remove motion props
  content = content.replace(/\s+initial={[^}]*}/g, '');
  content = content.replace(/\s+animate={[^}]*}/g, '');
  content = content.replace(/\s+exit={[^}]*}/g, '');
  content = content.replace(/\s+transition={[^}]*}/g, '');
  content = content.replace(/\s+whileHover={[^}]*}/g, '');
  content = content.replace(/\s+whileTap={[^}]*}/g, '');
  content = content.replace(/\s+whileFocus={[^}]*}/g, '');
  content = content.replace(/\s+whileInView={[^}]*}/g, '');
  content = content.replace(/\s+layout={[^}]*}/g, '');
  content = content.replace(/\s+layoutId={[^}]*}/g, '');
  content = content.replace(/\s+key={[^}]*}/g, '');
  content = content.replace(/\s+variants={[^}]*}/g, '');
  content = content.replace(/\s+style={[^}]*}/g, '');
  
  // Remove motion imports
  content = content.replace(/\/\/ import.*framer-motion.*\n/g, '');
  content = content.replace(/import.*framer-motion.*\n/g, '');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed: ${filePath}`);
}

// Fix all files
filesToFix.forEach(fixFramerMotion);

console.log('🎉 Framer Motion components fixed!');
console.log('📝 Note: Animations are disabled but components will work normally.');
