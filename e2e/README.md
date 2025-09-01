# CUBS Visa Management - E2E Testing Suite

This directory contains comprehensive end-to-end (E2E) tests for the CUBS Visa Management application using Playwright.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Application running on `http://localhost:3002`

### Running Tests

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:install

# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug

# View test report
npm run test:report
```

## 📁 Test Structure

```
e2e/
├── definitive/
│   ├── global.setup.ts          # Authentication setup
│   ├── test-setup.ts            # Test configuration
│   ├── dashboard.spec.ts        # Dashboard tests
│   ├── employees.spec.ts        # Employee management tests
│   ├── documents.spec.ts        # Document management tests
│   └── auth-navigation.spec.ts  # Authentication & navigation tests
├── .auth/
│   └── user.json               # Saved authentication state
└── README.md                   # This file
```

## 🔐 Authentication

The test suite uses a global setup to authenticate once and reuse the session across all tests:

- **Test User**: `info@cubstechnical.com`
- **Password**: `Admin@123456`
- **Session Storage**: `e2e/.auth/user.json`

## 📋 Test Coverage

### Dashboard Tests (`dashboard.spec.ts`)
- ✅ Dashboard loading and stats display
- ✅ Visa expiry alerts
- ✅ Navigation menu functionality
- ✅ Consolidated endpoint verification
- ✅ Charts and visualizations
- ✅ Responsive design
- ✅ Loading and error states

### Employee Management Tests (`employees.spec.ts`)
- ✅ Employee list display
- ✅ Search functionality
- ✅ Filter options
- ✅ Pagination handling
- ✅ Employee details display
- ✅ CRUD operations (view, edit, delete)
- ✅ Bulk operations
- ✅ Responsive design
- ✅ Loading and error states

### Document Management Tests (`documents.spec.ts`)
- ✅ Document explorer interface
- ✅ Company folder navigation
- ✅ Employee folder navigation
- ✅ Document list display
- ✅ Search functionality
- ✅ Document upload
- ✅ Document actions (view, download, delete)
- ✅ Breadcrumb navigation
- ✅ Responsive design
- ✅ Loading and error states

### Authentication & Navigation Tests (`auth-navigation.spec.ts`)
- ✅ Authentication state persistence
- ✅ Navigation menu functionality
- ✅ Logout functionality
- ✅ Protected routes handling
- ✅ Page refresh handling
- ✅ Browser navigation (back/forward)
- ✅ Mobile navigation
- ✅ Loading states during navigation
- ✅ Error state handling
- ✅ Multi-tab session management

## 🛠️ Configuration

### Playwright Configuration (`playwright.config.ts`)
- **Timeout**: 30 seconds per test
- **Browser**: Chromium (Desktop Chrome)
- **Viewport**: 1280x720
- **Base URL**: `http://localhost:3002`
- **Retries**: 2 in CI, 0 locally
- **Screenshots**: On failure only
- **Videos**: Retained on failure

### Environment Variables
The tests use the following environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `GMAIL_FROM_NAME`
- `B2_APPLICATION_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET_NAME`
- `B2_ENDPOINT`
- `B2_BUCKET_ID`

## 🔄 CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/playwright.yml`)
- Runs on push to `main` and `develop` branches
- Runs on pull requests to `main` and `develop` branches
- Installs dependencies and Playwright browsers
- Builds the application
- Runs all tests
- Uploads test reports and artifacts
- Includes separate mobile testing job

### Test Artifacts
- **Playwright Report**: HTML report with test results
- **Test Results**: Screenshots and videos of failed tests
- **Retention**: 30 days

## 🐛 Debugging

### Running Individual Tests
```bash
# Run specific test file
npx playwright test dashboard.spec.ts

# Run specific test
npx playwright test dashboard.spec.ts -g "should load dashboard"

# Run tests matching pattern
npx playwright test -g "mobile"
```

### Debug Mode
```bash
# Run in debug mode (opens browser dev tools)
npm run test:debug

# Run with UI (interactive mode)
npm run test:ui
```

### Common Issues

1. **Authentication Failures**
   - Check if test user credentials are correct
   - Verify Supabase connection
   - Check if `.auth/user.json` exists

2. **Timeout Issues**
   - Increase timeout in `playwright.config.ts`
   - Check if application is running on correct port
   - Verify network connectivity

3. **Element Not Found**
   - Check if selectors are correct
   - Verify page has loaded completely
   - Check for dynamic content loading

## 📊 Test Reports

After running tests, view the report:
```bash
npm run test:report
```

The report includes:
- Test results and status
- Screenshots of failures
- Videos of test execution
- Performance metrics
- Network requests

## 🔧 Maintenance

### Adding New Tests
1. Create new test file in `e2e/definitive/`
2. Follow existing naming convention (`feature.spec.ts`)
3. Use the custom `test` and `expect` from `test-setup.ts`
4. Include proper error handling and timeouts

### Updating Selectors
- Use data-testid attributes when possible
- Prefer semantic selectors (role, text, placeholder)
- Avoid brittle CSS selectors
- Test selectors in different viewports

### Performance Optimization
- Use `waitForLoadState('networkidle')` for page loads
- Implement proper waiting strategies
- Avoid hard-coded timeouts
- Use parallel execution where possible

## 📈 Best Practices

1. **Test Independence**: Each test should be able to run independently
2. **Clear Assertions**: Use descriptive test names and clear assertions
3. **Error Handling**: Include proper error handling and fallbacks
4. **Responsive Testing**: Test on multiple viewport sizes
5. **Accessibility**: Include accessibility checks where relevant
6. **Performance**: Monitor test execution time and optimize slow tests

## 🤝 Contributing

When adding new tests:
1. Follow the existing test structure
2. Include comprehensive error handling
3. Add appropriate timeouts and waits
4. Test on multiple viewport sizes
5. Update this documentation if needed

## 📞 Support

For issues with the test suite:
1. Check the test logs and reports
2. Verify environment variables are set
3. Ensure the application is running correctly
4. Check Playwright documentation for specific issues
