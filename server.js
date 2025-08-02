const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CUBS Technical Backend Server Running',
    timestamp: new Date().toISOString(),
    supabase: supabaseUrl ? 'Connected' : 'Not Configured'
  });
});

// Get all employees
app.get('/api/employees', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, company, trade, nationality, status, search } = req.query;
    
    let query = supabase.from('employee_table').select('*');
    
    // Apply filters
    if (company) query = query.eq('company_name', company);
    if (trade) query = query.eq('trade', trade);
    if (nationality) query = query.eq('nationality', nationality);
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`name.ilike.%${search}%,employee_id.ilike.%${search}%,trade.ilike.%${search}%`);
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data: employees, error } = await query;
    
    if (error) throw error;
    
    res.json({
      employees,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: employees.length
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all documents
app.get('/api/documents', async (req, res) => {
  try {
    const { company, employee, documentType } = req.query;
    
    let query = supabase.from('employee_documents').select('*');
    
    // Apply filters
    if (company) query = query.ilike('file_path', `${company}/%`);
    if (employee) query = query.ilike('file_path', `%/${employee}/%`);
    if (documentType) query = query.eq('document_type', documentType);
    
    const { data: documents, error } = await query;
    
    if (error) throw error;
    
    res.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get document statistics
app.get('/api/documents/stats', async (req, res) => {
  try {
    const { data: documents, error } = await supabase
      .from('employee_documents')
      .select('*');
    
    if (error) throw error;
    
    // Calculate statistics
    const totalDocuments = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
    const fileTypes = {};
    const companies = {};
    
    documents.forEach(doc => {
      // Count file types
      const type = doc.file_type || 'unknown';
      fileTypes[type] = (fileTypes[type] || 0) + 1;
      
      // Count companies
      if (doc.file_path) {
        const company = doc.file_path.split('/')[0];
        companies[company] = (companies[company] || 0) + 1;
      }
    });
    
    res.json({
      totalDocuments,
      totalSize,
      fileTypes,
      companies,
      topCompanies: Object.entries(companies)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([company, count]) => ({ company, count }))
    });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get employee statistics
app.get('/api/employees/stats', async (req, res) => {
  try {
    const { data: employees, error } = await supabase
      .from('employee_table')
      .select('*');
    
    if (error) throw error;
    
    // Calculate statistics
    const totalEmployees = employees.length;
    const companies = {};
    const trades = {};
    const nationalities = {};
    const statuses = {};
    
    employees.forEach(emp => {
      // Count companies
      if (emp.company_name) {
        companies[emp.company_name] = (companies[emp.company_name] || 0) + 1;
      }
      
      // Count trades
      if (emp.trade) {
        trades[emp.trade] = (trades[emp.trade] || 0) + 1;
      }
      
      // Count nationalities
      if (emp.nationality) {
        nationalities[emp.nationality] = (nationalities[emp.nationality] || 0) + 1;
      }
      
      // Count statuses
      if (emp.status) {
        statuses[emp.status] = (statuses[emp.status] || 0) + 1;
      }
    });
    
    res.json({
      totalEmployees,
      companies,
      trades,
      nationalities,
      statuses,
      topCompanies: Object.entries(companies)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([company, count]) => ({ company, count }))
    });
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CUBS Technical Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Employees API: http://localhost:${PORT}/api/employees`);
  console.log(`📁 Documents API: http://localhost:${PORT}/api/documents`);
  console.log(`📈 Stats API: http://localhost:${PORT}/api/employees/stats`);
  console.log(`📊 Doc Stats API: http://localhost:${PORT}/api/documents/stats`);
}); 