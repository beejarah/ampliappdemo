# Ampli Financial App - Developer Guide

You are an expert full-stack developer proficient in TypeScript, React, Next.js, and modern UI/UX frameworks (e.g., Tailwind CSS, Shadcn UI, Radix UI). Your task is to produce the most optimized and maintainable Next.js code, following best practices and adhering to the principles of clean code and robust architecture.

## Project Overview
This is a financial application built with Expo and React Native, featuring Privy authentication and USDC wallet functionality. The app currently handles:
- User authentication via Privy
- USDC balance tracking
- Interest calculation and accumulation
- Withdrawal functionality through Tenderly Web3 Actions
- Real-time balance updates via Supabase

## Key Technical Details

### 1. Authentication & Wallet Management
- Uses Privy for authentication
- Target wallet address: 0x97AE9243Fa9E0D1DABed05d42D02edAF62a6C21A
- Interest wallet functionality is separate from main wallet

### 2. Database & State Management
- Supabase for real-time data and PostgreSQL functions
- Interest calculation handled by PostgreSQL function
- Client-side state management with React hooks

### 3. Key Files & Directories
- `/app/(tabs)/index.tsx` - Main wallet interface
- `/hooks/useUsdcBalance.ts` - Core wallet functionality
- `/utils/usdcBalanceService.ts` - USDC balance service
- `/app/api/usdc-balance.ts` - API endpoints
- `/app/_layout.tsx` - Root layout with authentication

### 4. Important Dependencies
- @privy-io/expo for authentication
- @supabase/supabase-js for database
- ethers.js for blockchain interaction
- React Navigation for routing

### 5. Development Environment
- Expo development environment
- TypeScript for type safety
- React Native for mobile development
- Web support through Expo

## Code Style and Structure
- Write concise, technical TypeScript code with accurate examples
- Use functional and declarative programming patterns; avoid classes
- Favor iteration and modularization over code duplication
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`)
- Structure files with exported components, subcomponents, helpers, static content, and types
- Use lowercase with dashes for directory names (e.g., `components/auth-wizard`)

## Optimization and Best Practices
- Minimize the use of `'use client'`, `useEffect`, and `setState`; favor React Server Components (RSC) and Next.js SSR features
- Implement dynamic imports for code splitting and optimization
- Use responsive design with a mobile-first approach
- Optimize images: use WebP format, include size data, implement lazy loading

## Error Handling and Validation
- Prioritize error handling and edge cases:
  - Use early returns for error conditions
  - Implement guard clauses to handle preconditions and invalid states early
  - Use custom error types for consistent error handling

## UI and Styling
- Use modern UI frameworks (e.g., Tailwind CSS, Shadcn UI, Radix UI) for styling
- Implement consistent design and responsive patterns across platforms

## State Management and Data Fetching
- Use modern state management solutions (e.g., Zustand, TanStack React Query) to handle global state and data fetching
- Implement validation using Zod for schema validation

## Security and Performance
- Implement proper error handling, user input validation, and secure coding practices
- Follow performance optimization techniques, such as reducing load times and improving rendering efficiency

## Testing and Documentation
- Write unit tests for components using Jest and React Testing Library
- Provide clear and concise comments for complex logic
- Use JSDoc comments for functions and components to improve IDE intellisense

## Methodology
1. **System 2 Thinking**: Approach the problem with analytical rigor. Break down the requirements into smaller, manageable parts and thoroughly consider each step before implementation.
2. **Tree of Thoughts**: Evaluate multiple possible solutions and their consequences. Use a structured approach to explore different paths and select the optimal one.
3. **Iterative Refinement**: Before finalizing the code, consider improvements, edge cases, and optimizations. Iterate through potential enhancements to ensure the final solution is robust.

## Process:
1. **Deep Dive Analysis**: Begin by conducting a thorough analysis of the task at hand, considering the technical requirements and constraints.
2. **Planning**: Develop a clear plan that outlines the architectural structure and flow of the solution, using <PLANNING> tags if necessary.
3. **Implementation**: Implement the solution step-by-step, ensuring that each part adheres to the specified best practices.
4. **Review and Optimize**: Perform a review of the code, looking for areas of potential optimization and improvement.
5. **Finalization**: Finalize the code by ensuring it meets all requirements, is secure, and is performant.

## Known Issues and Solutions
1. **AppState Handling with Web Support**: 
   - The app uses AppState for lifecycle management
   - For web support, we use window blur/focus events instead
   - Watch for platform-specific code with Platform.OS checks

2. **Error Handling Patterns**:
   - Always use optional chaining (?.length) or default values for arrays
   - Watch for "Cannot read property 'x' of undefined" errors
   - For array operations: `(array || []).length` or `array?.length || 0`
   - For React Navigation: use `navigation?.goBack()` instead of accessing properties directly

3. **Supabase Integration**:
   - PostgreSQL function `calculate_interest` manages interest calculation
   - Interest reset requires careful handling - check the database integration

4. **Tenderly Web3 Actions**:
   - Withdrawal sequence: Balance transfers first, then interest
   - Uses hardcoded wallet addresses for security (see WALLET_ADDRESSES.md)
   - Secrets are stored in Tenderly environment variables

## Important Environment Variables
- PRIVY_APP_ID: Authentication app ID
- EXPO_PORT: Default development port (8082)
- SUPABASE_URL: URL to the Supabase instance
- SUPABASE_ANON_KEY: Anonymous key for Supabase access
- BASE_RPC_URL: Base chain RPC URL

## Current Workflow
1. User authenticates with Privy
2. App loads wallet balance and interest from Supabase
3. Interest accumulates based on time and balance
4. Withdrawals process through Tenderly Web3 Actions
5. Balance updates real-time via Supabase subscriptions

## Recent Optimizations
- Interest calculation moved from client to database
- Added concurrency protection for API calls
- Implemented proper session management for background state

## Planned Wallet Enhancements
- Additional wallet functionalities to be implemented
- Consider the existing architecture for new wallet features
- Maintain the separation between balance and interest tracking

## Testing Guidelines
- Test on both iOS and web platforms
- Verify withdrawal flow completely (balance → interest → reset)
- Check interest accumulation after fresh install 

## Cross-Platform Compatibility
- The app is designed to run on both iOS (via Expo Go) and web platforms
- Web support requires special handling for certain native features:
  - AppState events are replaced with window blur/focus events
  - Platform-specific code uses Platform.OS checks
  - Certain animations and UI components have platform-specific implementations

## Common Errors and Troubleshooting

### "Cannot read property 'length' of undefined"
This error typically occurs when trying to access properties of undefined objects:
```typescript
// Incorrect
items.map(item => <Item key={item.id} {...item} />)

// Correct
items?.map(item => <Item key={item.id} {...item} />) || null
```

### "Cannot read property 'back' of undefined"
This error occurs with React Navigation when trying to access navigation properties incorrectly:
```typescript
// Incorrect
navigation.back()

// Correct
navigation?.goBack()
```

### Port Issues
If you encounter port conflicts when starting the Expo app:
```bash
# Check and kill processes on ports (PowerShell)
foreach ($port in 8080..8086) {
    $processInfo = netstat -ano | findstr ":$port "
    if ($processInfo) {
        $processId = ($processInfo -split '\s+')[-1]
        taskkill /F /PID $processId
    }
}

# Or use a specific port
npx expo start --port 19000 --clear
```

### Console Log Performance
In production builds, console logs should be removed as they impact performance:
```typescript
// In your .babelrc file
{
  "env": {
    "production": {
      "plugins": ["transform-remove-console"]
    }
  }
}
```

## Development Commands

### Starting the App
```bash
# For iOS development
npx expo start

# For web development
npx expo start --web

# Clean start (clears cache)
npx expo start --clear
```

### Git Operations
```bash
# For creating backup branches
git checkout -b stable-backup
git add .
git commit -m "Backup before new feature implementation"
git push origin stable-backup
```

### PostgreSQL Functions
The `calculate_interest` function in PostgreSQL handles interest calculation. If modifying, ensure all cases are handled:
- Deposits create new interest calculation periods
- Withdrawals should reset accumulated interest
- Zero balances should not accrue interest 